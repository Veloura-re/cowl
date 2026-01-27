import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
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

    const fileName = `backup-${business.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
    const fileContent = JSON.stringify(backup, null, 2)

    // 6. Trigger Download
    if (Capacitor.isNativePlatform()) {
        try {
            // Write to cachedir
            const writeResult = await Filesystem.writeFile({
                path: fileName,
                data: fileContent,
                directory: Directory.Cache,
                encoding: Encoding.UTF8
            });

            // Share the file
            await Share.share({
                title: 'Backup Snapshot',
                text: `Backup for ${business.name}`,
                url: writeResult.uri,
                dialogTitle: 'Save Backup'
            });

        } catch (e) {
            console.error('Native export failed', e);
            throw new Error('Failed to export on device: ' + (e instanceof Error ? e.message : String(e)));
        }
    } else {
        // Standard Web Download
        const blob = new Blob([fileContent], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

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

    let remapToCurrent = false
    if (backup.business.id !== currentBusinessId) {
        const confirm = window.confirm(`Backup ID (${backup.business.id}) does not match active business ID (${currentBusinessId}).\n\nDo you want to remap this data to the active business? (Choose Cancel to try literal restore)`)
        if (confirm) {
            remapToCurrent = true
        } else {
            const proceed = window.confirm('Proceed with literal restore? This might fail RLS checks if you don\'t have ownership of the original business IDs.')
            if (!proceed) return false
        }
    }

    // [WIPE PHASE] Delete existing data to ensure a clean restore
    // We delete in reverse order of dependencies
    const tablesToWipe = [
        'transactions',
        'invoice_items',
        'invoices',
        'notifications',
        'notification_settings',
        'items',
        'parties',
        'payment_modes'
    ]

    for (const table of tablesToWipe) {
        // For invoice_items, we need a special join or subquery if we don't have business_id on them.
        // Usually invoice_items are joined via invoice_id.
        if (table === 'invoice_items') {
            // Get invoice IDs first
            const { data: invs } = await supabase.from('invoices').select('id').eq('business_id', currentBusinessId)
            if (invs && invs.length > 0) {
                const invIds = invs.map(i => i.id)
                await supabase.from('invoice_items').delete().in('invoice_id', invIds)
            }
        } else {
            const { error: wipeError } = await supabase.from(table).delete().eq('business_id', currentBusinessId)
            if (wipeError) {
                console.warn(`Non-critical wipe failure on ${table}: ${wipeError.message}`)
            }
        }
    }

    // [RESTORE PHASE] Insert data from backup
    // Order of operations matters for foreign keys.
    // 1. Parties
    // 2. Items
    // 3. Payment Modes
    // 4. Invoices
    // 5. Invoice Items
    // 6. Transactions

    // Helper to batch upsert with chunking and optional ID remapping
    const upsertTable = async (table: string, rows: any[]) => {
        if (!rows || rows.length === 0) return

        let processedRows = rows.map(row => {
            const newRow = { ...row }

            // Remap business ID if requested
            if (remapToCurrent && 'business_id' in newRow) {
                newRow.business_id = currentBusinessId
            }

            // [SECURITY FIX] For settings, we strip the 'id' (PK) to avoid collisions
            // and rely on the composite unique key (user_id, business_id) to match existing records.
            if (table === 'notification_settings') {
                delete (newRow as any).id
            }

            return newRow
        })

        const batches = chunk(processedRows, 100)
        for (const batch of batches) {
            // Special handling for tables with composite unique keys other than PK
            const options: any = {}
            if (table === 'notification_settings') {
                options.onConflict = 'user_id,business_id'
            }

            const { error } = await supabase.from(table).upsert(batch, options)
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
