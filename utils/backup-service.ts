import { SupabaseClient } from '@supabase/supabase-js'

export type BackupData = {
    version: number
    timestamp: string
    business: any
    data: {
        parties: any[]
        items: any[]
        invoices: any[]
        invoice_items: any[]
        transactions: any[]
        payment_modes: any[]
        notification_settings: any[]
        notifications: any[]
    }
}

/**
 * Helper to chunk arrays
 */
function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

/**
 * Exports all data related to a business as a JSON file.
 */
export async function exportBusinessData(supabase: SupabaseClient, businessId: string) {
    if (!businessId) throw new Error('No business ID provided')

    // 1. Fetch Business Details
    const { data: business, error: busError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single()

    if (busError) throw new Error('Failed to fetch business: ' + busError.message)

    // 2. Fetch Dependent Tables
    const tables = ['parties', 'items', 'invoices', 'transactions', 'payment_modes', 'notifications']
    const fetchedData: any = {}

    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('business_id', businessId)

        if (error) {
            console.warn(`Failed to fetch ${table}: ${error.message}, continuing...`)
            fetchedData[table] = []
        } else {
            fetchedData[table] = data || []
        }
    }

    // 3. Fetch Invoice Items (linked via invoices)
    const invoiceIds = fetchedData.invoices.map((inv: any) => inv.id)
    if (invoiceIds.length > 0) {
        // Chunk invoice IDs to potentially avoid URL length limits if many invoices
        const idChunks = chunk(invoiceIds, 100)
        let allItems: any[] = []

        for (const chunkIds of idChunks) {
            const { data: invItems, error: invItemsError } = await supabase
                .from('invoice_items')
                .select('*')
                .in('invoice_id', chunkIds)

            if (invItemsError) throw new Error(`Failed to fetch invoice items: ${invItemsError.message}`)
            if (invItems) allItems = [...allItems, ...invItems]
        }
        fetchedData['invoice_items'] = allItems
    } else {
        fetchedData['invoice_items'] = []
    }

    // 4. Fetch Notification Settings
    const { data: notifSettings, error: notifError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('business_id', businessId)

    if (notifError) throw new Error(`Failed to fetch notification settings: ${notifError.message}`)
    fetchedData['notification_settings'] = notifSettings || []

    // 5. Construct Backup Object
    const backup: BackupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        business: business,
        data: fetchedData
    }

    // 6. Trigger Download
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${business.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    return true
}

/**
 * Imports data from a backup JSON file.
 * Strategy: Upsert based on ID. Existing records are updated, new ones created.
 */
export async function importBusinessData(supabase: SupabaseClient, file: File, currentBusinessId: string) {
    if (!currentBusinessId) throw new Error('No active business to restore to.')

    const text = await file.text()
    let backup: BackupData
    try {
        backup = JSON.parse(text)
    } catch (e) {
        throw new Error('Invalid backup file format')
    }

    if (!backup.data || !backup.business) {
        throw new Error('Invalid backup structure')
    }

    // Security Check: Ideally we might want to allow restoring to a DIFFERENT business ID (cloning),
    // or strictly SAME business ID.
    // For this implementation, we will RESTORE content. 
    // If the backup business ID matches current, we upsert.
    // If they differ, we currently BLOCK to prevent accidental unrelated data merge, 
    // OR we could force overwrite IDs to new business ID (Migrate mode).
    // Let's go with: IDs must match for "Restore".
    // "Sync Back" implies same entity.

    if (backup.business.id !== currentBusinessId) {
        const confirm = window.confirm(`Backup ID (${backup.business.id}) does not match active business ID (${currentBusinessId}).\n\nDo you want to proceed? This implies merging data from another business context?`)
        if (!confirm) return false
    }

    // Order of operations matters for foreign keys.
    // 1. Parties
    // 2. Items
    // 3. Payment Modes
    // 4. Invoices
    // 5. Invoice Items
    // 6. Transactions

    // We use upsert. 

    // Helper to batch upsert with chunking
    const upsertTable = async (table: string, rows: any[]) => {
        if (!rows || rows.length === 0) return

        const batches = chunk(rows, 100)
        for (const batch of batches) {
            const { error } = await supabase.from(table).upsert(batch)
            if (error) throw new Error(`Failed to restore ${table}: ${error.message}`)
        }
    }

    await upsertTable('parties', backup.data.parties)
    await upsertTable('items', backup.data.items)
    await upsertTable('payment_modes', backup.data.payment_modes)
    await upsertTable('invoices', backup.data.invoices) // Dependent on Parties
    await upsertTable('invoice_items', backup.data.invoice_items) // Dependent on Invoices and Items
    await upsertTable('transactions', backup.data.transactions) // Dependent on Invoices and Parties
    await upsertTable('notification_settings', backup.data.notification_settings)
    await upsertTable('notifications', backup.data.notifications || [])

    return true
}
