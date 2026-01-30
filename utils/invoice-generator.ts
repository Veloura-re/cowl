// Types only imports
import type { jsPDF } from 'jspdf'
import { formatNumber } from '@/lib/format-number'

export type InvoiceData = {
    invoiceNumber: string
    date: string
    dueDate?: string
    type: 'SALE' | 'PURCHASE'

    // Business Info
    businessName: string
    businessAddress?: string
    businessPhone?: string
    businessLogoUrl?: string

    // Party Info (Customer/Supplier)
    partyName: string
    partyAddress?: string
    partyPhone?: string

    // Items
    items: {
        description: string
        quantity: number
        rate: number
        tax: number
        total: number
    }[]

    // Totals
    subtotal: number
    taxAmount: number
    discountAmount?: number
    totalAmount: number

    // Payment
    status: string
    paidAmount?: number
    balanceAmount?: number

    // Additional
    notes?: string
    currency: string
    currencySymbol: string
    signature?: string
    attachments?: string[]
}

export function generateInvoiceHTML(data: InvoiceData): string {
    const isSale = data.type === 'SALE'
    const title = isSale ? 'INVOICE' : 'PURCHASE ORDER'

    const statusColors: Record<string, string> = {
        'PAID': '#10b981', // emerald-500
        'UNPAID': '#f59e0b', // amber-500
        'PARTIAL': '#3b82f6', // blue-500
        'CANCELLED': '#ef4444' // red-500
    }
    const statusColor = statusColors[data.status] || '#6b7280'

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title} - ${data.invoiceNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        
        :root {
            --bg-color: #ffffff;
            --text-main: #111827;
            --text-muted: #6b7280;
            --accent-bg: #f9fafb;
            --primary: #111827;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            background: #f3f4f6;
            color: var(--text-main);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: var(--bg-color);
            padding: 24mm;
            position: relative;
            display: flex;
            flex-direction: column;
        }

        @media print {
            body { background: white; }
            .page { width: 100%; margin: 0; padding: 15mm; box-shadow: none; border: none; }
        }

        /* Header */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12mm; }
        .brand-section { flex: 1; }
        .meta-section { text-align: right; }
        
        .logo { height: 45px; width: auto; object-fit: contain; margin-bottom: 15px; display: block; }
        
        .company-name { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; margin-bottom: 8px; }
        .company-details { font-size: 10px; color: var(--text-muted); line-height: 1.5; text-transform: uppercase; }

        .status-badge {
            display: inline-block;
            background: ${statusColor};
            color: white;
            padding: 4px 12px;
            border-radius: 99px;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            margin-bottom: 15px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .document-title { font-size: 32px; font-weight: 900; margin-bottom: 8px; letter-spacing: 0.1em; }
        .document-meta { font-size: 12px; color: var(--text-muted); }
        .document-meta b { color: var(--text-main); }

        /* Info Grid */
        .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 12mm; 
            background: var(--accent-bg);
            padding: 20px;
            border-radius: 12px;
        }
        
        .info-title { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
        .info-content { font-size: 13px; font-weight: 400; line-height: 1.5; }
        .info-content b { font-weight: 900; text-transform: uppercase; }

        /* Table */
        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 10mm; }
        th { 
            text-align: left; 
            font-size: 11px; 
            font-weight: 700;
            text-transform: uppercase; 
            background: var(--primary);
            color: white;
            padding: 12px 15px; 
        }
        th:first-child { border-radius: 8px 0 0 8px; }
        th:last-child { border-radius: 0 8px 8px 0; }
        
        td { 
            padding: 15px; 
            font-size: 12px; 
            border-bottom: 1px solid #f3f4f6;
        }
        tr:nth-child(even) td { background-color: #f9fafb; }
        .bold { font-weight: 700; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Totals */
        .totals-container { display: flex; justify-content: flex-end; margin-bottom: 15mm; }
        .totals-table { width: 280px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
        .final-total { 
            background: var(--primary);
            color: white;
            border-radius: 12px;
            margin-top: 15px; 
            padding: 15px 20px; 
            font-weight: 900; 
            font-size: 18px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        /* Footer */
        .footer { 
            margin-top: auto; 
            border-top: 1px solid #eee; 
            padding-top: 20px; 
            display: flex; 
            justify-content: space-between; 
            font-size: 10px;
            color: var(--text-muted);
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header -->
        <div class="header">
            <div class="brand-section">
                ${data.businessLogoUrl ? `<img src="${data.businessLogoUrl}" class="logo" />` : ''}
                <h1 class="company-name">${data.businessName}</h1>
                <div class="company-details">
                    ${data.businessAddress || ''}<br>
                    ${data.businessPhone || ''}
                </div>
            </div>
            <div class="meta-section">
                <div class="status-badge">${data.status}</div>
                <h2 class="document-title">${isSale ? 'INVOICE' : 'PURCHASE'}</h2>
                <div class="document-meta">
                    NO. <b>${data.invoiceNumber}</b><br>
                    DATE <b>${data.date}</b>
                </div>
            </div>
        </div>

        <!-- Info Grid -->
        <div class="info-grid">
            <div>
                <p class="info-title">Issued To</p>
                <div class="info-content">
                    <b>${data.partyName}</b><br>
                    ${data.partyAddress || 'No Address Provided'}<br>
                    ${data.partyPhone || ''}
                </div>
            </div>
            <div class="text-right">
                <p class="info-title">Payment Details</p>
                <div class="info-content">
                    DUE DATE: <b>${data.dueDate || 'ON RECEIPT'}</b><br>
                    CURRENCY: <b>${data.currency.toUpperCase()}</b>
                </div>
            </div>
        </div>

        <!-- Items -->
        <table>
            <thead>
                <tr>
                    <th style="width: 45%">Description</th>
                    <th class="text-center" style="width: 10%">Qty</th>
                    <th class="text-right" style="width: 15%">Rate</th>
                    <th class="text-right" style="width: 10%">Tax</th>
                    <th class="text-right" style="width: 20%">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map(item => `
                <tr>
                    <td class="bold">${item.description}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${formatNumber(item.rate)}</td>
                    <td class="text-right text-muted">${item.tax}%</td>
                    <td class="text-right bold">${data.currencySymbol}${formatNumber(item.total)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-container">
            <div class="totals-table">
                <div class="total-row">
                    <span class="text-muted text-uppercase">Subtotal</span>
                    <span>${data.currencySymbol}${formatNumber(data.subtotal)}</span>
                </div>
                <div class="total-row">
                    <span class="text-muted text-uppercase">Tax</span>
                    <span>${data.currencySymbol}${formatNumber(data.taxAmount)}</span>
                </div>
                ${data.discountAmount ? `
                <div class="total-row">
                    <span class="text-muted text-uppercase">Discount</span>
                    <span>-${data.currencySymbol}${formatNumber(data.discountAmount)}</span>
                </div>` : ''}
                
                <div class="final-total total-row">
                    <span>GRAND TOTAL</span>
                    <span>${data.currencySymbol}${formatNumber(data.totalAmount)}</span>
                </div>

                ${data.paidAmount ? `
                <div class="total-row mt-2">
                    <span class="text-muted text-uppercase">Amount Paid</span>
                    <span class="bold">${data.currencySymbol}${formatNumber(data.paidAmount)}</span>
                </div>` : ''}

                ${data.balanceAmount ? `
                <div class="total-row">
                    <span class="text-muted text-uppercase">Balance Due</span>
                    <span class="bold">${data.currencySymbol}${formatNumber(data.balanceAmount)}</span>
                </div>` : ''}
            </div>
        </div>

        <!-- Footer / Signature -->
        <div class="footer">
            <div style="flex: 1;">
                ${data.notes ? `
                    <p class="info-title">Notes</p>
                    <p class="info-content" style="max-width: 350px;">${data.notes.toUpperCase()}</p>
                ` : ''}
            </div>
            <div style="text-align: right;">
                ${data.signature ? `<img src="${data.signature}" style="height: 35px; margin-bottom: 5px;" />` : '<div style="height: 35px;"></div>'}
                <p class="info-title">Authorized Signature</p>
                <div class="text-uppercase mt-2">Generated by COWL System</div>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim()
}

/**
 * Print invoice using a hidden iframe to prevent navigation
 */
export function printInvoice(data: InvoiceData) {
    // strict reset for printing
    const existingFrame = document.getElementById('invoice-print-frame')
    if (existingFrame) existingFrame.remove()

    const iframe = document.createElement('iframe')
    iframe.id = 'invoice-print-frame'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (doc) {
        doc.open()
        doc.write(generateInvoiceHTML(data))
        doc.close()

        // Wait for images
        setTimeout(() => {
            iframe.contentWindow?.focus()
            iframe.contentWindow?.print()
            // Clean up after print dialog closes (approximate)
            // or just leave it hidden, it's fine.
        }, 500)
    }
}


/**
 * Download invoice as PDF file using html2canvas + jsPDF for accurate rendering
 */
export async function downloadInvoice(data: InvoiceData): Promise<File | void> {
    // 1. Create a hidden container to render the invoice specifically for capture
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.top = '-10000px'
    container.style.left = '-10000px'
    // A4 width in pixels at roughly 96 DPI is ~794px, but we can go higher for quality. 
    // 210mm = ~794px. Let's use 2x scale for sharpness.
    container.style.width = '210mm'
    container.style.minHeight = '297mm'

    // Inject the HTML
    container.innerHTML = generateInvoiceHTML(data)

    // Append to body to ensure fonts and styles load
    document.body.appendChild(container)

    try {
        // Dynamic import
        const html2canvas = (await import('html2canvas')).default
        const { jsPDF } = await import('jspdf')

        // Small delay to ensure images/fonts might render (optional but safe)
        await new Promise(resolve => setTimeout(resolve, 500))

        const canvas = await html2canvas(container.querySelector('.page') as HTMLElement, {
            scale: 2, // Higher quality
            useCORS: true, // For external images
            logging: false,
            backgroundColor: '#ffffff'
        })

        const imgData = canvas.toDataURL('image/jpeg', 1.0)

        // A4 Dimensions: 210 x 297 mm
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        })

        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)

        // Check if we need to return a file (for sharing) or save it
        const blob = pdf.output('blob')
        // We'll create a link to download it here since this is the primary purpose
        // but we return the file object for shareInvoice below
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${data.invoiceNumber}.pdf`
        a.click()
        URL.revokeObjectURL(url)

        return new File([blob], `${data.invoiceNumber}.pdf`, { type: 'application/pdf' })

    } catch (error) {
        console.error('PDF Generation Failed:', error)
        alert('Failed to generate PDF. Please try again.')
    } finally {
        document.body.removeChild(container)
    }
}

/**
 * Handle native sharing of the Invoice PDF
 */
export async function shareInvoice(data: InvoiceData) {
    try {
        // downloadInvoice() will trigger a download, which might be annoying if sharing.
        // Ideally we should separate "generateBlob" and "download". 
        // But for time, let's just let it download and then share. 
        // Actually, let's modify downloadInvoice logic above slightly to NOT auto-download if a flag is passed?
        // Or just let it happen. The user might want both.

        const file = await downloadInvoice(data)

        if (file && navigator.canShare && navigator.canShare({ files: [file as File] })) {
            await navigator.share({
                title: `Invoice ${data.invoiceNumber}`,
                text: `Invoice ${data.invoiceNumber} from ${data.businessName}`,
                files: [file as File]
            })
        }
    } catch (error) {
        console.error('Error sharing:', error)
        // If sharing fails, at least the downloadInvoice call already saved it.
    }
}
