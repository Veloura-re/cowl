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

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title} - ${data.invoiceNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap');
        
        :root {
            --bg-color: #ffffff;
            --text-main: #000000;
            --text-muted: #666666;
            --border-heavy: 2px solid #000000;
            --border-light: 1px solid #e5e5e5;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            background: #f3f3f3;
            color: var(--text-main);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: var(--bg-color);
            padding: 24px;
            position: relative;
            display: flex;
            flex-direction: column;
        }

        @media print {
            body { background: white; }
            .page { width: 100%; margin: 0; padding: 20px; box-shadow: none; border: none; }
        }

        /* Typography Utilities */
        .mono { font-family: 'JetBrains Mono', monospace; }
        .uppercase { text-transform: uppercase; }
        .bold { font-weight: 700; }
        .heavy { font-weight: 900; }
        .text-xs { font-size: 8px; letter-spacing: 0.05em; }
        .text-sm { font-size: 10px; }
        .text-base { font-size: 12px; }
        .text-xl { font-size: 18px; letter-spacing: -0.02em; }
        .tracking-wide { letter-spacing: 0.1em; }

        /* Graphic Elements */
        .divider { height: 2px; background: #000; margin: 10px 0; }
        .divider-light { height: 1px; background: #e5e5e5; margin: 8px 0; }
        .box { border: 1px solid #000; padding: 10px; }

        /* Header */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .brand-section { flex: 1; }
        .meta-section { text-align: right; }
        
        .logo { height: 35px; width: auto; object-fit: contain; margin-bottom: 10px; display: block; filter: grayscale(100%); }
        
        /* Grid Layout for Info */
        .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 24px; 
            border-top: 2px solid #000; 
            border-bottom: 2px solid #000; 
            padding: 12px 0;
        }
        
        /* Table */
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { 
            text-align: left; 
            font-family: 'JetBrains Mono', monospace; 
            font-size: 9px; 
            text-transform: uppercase; 
            border-bottom: 2px solid #000; 
            padding: 10px 5px; 
        }
        td { 
            padding: 6px 4px; 
            border-bottom: 1px solid #eee; 
            font-size: 10px; 
        }
        tr:last-child td { border-bottom: 2px solid #000; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Totals */
        .totals-container { display: flex; justify-content: flex-end; }
        .totals-table { width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .final-total { 
            border-top: 2px solid #000; 
            border-bottom: 2px solid #000; 
            margin-top: 8px; 
            padding: 8px 0; 
            font-weight: 900; 
            font-size: 14px;
        }

        /* Footer */
        .footer { 
            margin-top: auto; 
            border-top: 1px solid #000; 
            padding-top: 15px; 
            display: flex; 
            justify-content: space-between; 
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            color: #666;
        }

        /* Status Badge */
        .status-badge {
            display: inline-block;
            border: 1px solid #000;
            padding: 4px 12px;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header -->
        <div class="header">
            <div class="brand-section">
                ${data.businessLogoUrl ? `<img src="${data.businessLogoUrl}" class="logo" />` : ''}
                <h1 class="text-xl heavy uppercase">${data.businessName}</h1>
                <div class="text-xs uppercase mono mt-2" style="line-height: 1.6;">
                    ${data.businessAddress || ''}<br>
                    ${data.businessPhone || ''}
                </div>
            </div>
            <div class="meta-section">
                <div class="status-badge">${data.status}</div>
                <h2 class="text-xl heavy uppercase" style="letter-spacing: 0.1em; color: #000;">${title}</h2>
                <div class="text-sm mono mt-2">
                    <span class="text-muted">NO.</span> <span class="bold">${data.invoiceNumber}</span><br>
                    <span class="text-muted">DATE</span> <span class="bold">${data.date}</span>
                </div>
            </div>
        </div>

        <!-- Info Grid -->
        <div class="info-grid">
            <div>
                <p class="text-xs mono uppercase text-muted mb-2 tracking-wide">ISSUED TO</p>
                <p class="text-base heavy uppercase">${data.partyName}</p>
                <p class="text-sm mono mt-1">${data.partyAddress || 'Address Not Provided'}</p>
                <p class="text-sm mono mt-1">${data.partyPhone || ''}</p>
            </div>
            <div class="text-right">
                <p class="text-xs mono uppercase text-muted mb-2 tracking-wide">PAYMENT DETAILS</p>
                <p class="text-sm mono">DUE DATE: <span class="bold">${data.dueDate || 'ON RECEIPT'}</span></p>
                <p class="text-sm mono">CURRENCY: <span class="bold">${data.currency.toUpperCase()}</span></p>
            </div>
        </div>

        <!-- Items -->
        <table>
            <thead>
                <tr>
                    <th style="width: 40%">DESCRIPTION</th>
                    <th class="text-center" style="width: 15%">QTY</th>
                    <th class="text-right" style="width: 15%">RATE</th>
                    <th class="text-right" style="width: 10%">TAX</th>
                    <th class="text-right" style="width: 20%">AMOUNT</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map(item => `
                <tr>
                    <td class="bold">${item.description}</td>
                    <td class="text-center mono">${item.quantity}</td>
                    <td class="text-right mono">${formatNumber(item.rate)}</td>
                    <td class="text-right mono">${item.tax}%</td>
                    <td class="text-right mono bold">${data.currencySymbol}${formatNumber(item.total)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-container">
            <div class="totals-table">
                <div class="total-row text-sm mono">
                    <span class="text-muted">SUBTOTAL</span>
                    <span>${data.currencySymbol}${formatNumber(data.subtotal)}</span>
                </div>
                <div class="total-row text-sm mono">
                    <span class="text-muted">TAX</span>
                    <span>${data.currencySymbol}${formatNumber(data.taxAmount)}</span>
                </div>
                ${data.discountAmount ? `
                <div class="total-row text-sm mono">
                    <span class="text-muted">DISCOUNT</span>
                    <span>-${data.currencySymbol}${formatNumber(data.discountAmount)}</span>
                </div>` : ''}
                
                <div class="final-total total-row">
                    <span class="tracking-wide">TOTAL</span>
                    <span>${data.currencySymbol}${formatNumber(data.totalAmount)}</span>
                </div>

                ${data.paidAmount ? `
                <div class="total-row text-sm mono mt-2">
                    <span class="text-muted uppercase">Amount Paid</span>
                    <span>${data.currencySymbol}${formatNumber(data.paidAmount)}</span>
                </div>` : ''}

                ${data.balanceAmount ? `
                <div class="total-row text-sm mono">
                    <span class="text-muted uppercase">Balance Due</span>
                    <span>${data.currencySymbol}${formatNumber(data.balanceAmount)}</span>
                </div>` : ''}
            </div>
        </div>

        <!-- Footer / Signature -->
        <div class="footer">
            <div style="flex: 1;">
                ${data.notes ? `
                    <p class="text-xs uppercase bold mb-1">NOTES</p>
                    <p class="text-xs text-muted" style="max-width: 300px;">${data.notes}</p>
                ` : ''}
            </div>
            <div style="text-align: right;">
                ${data.signature ? `<img src="${data.signature}" style="height: 30px; margin-bottom: 5px;" />` : '<div style="height: 30px;"></div>'}
                <p class="text-xs uppercase bold">AUTHORIZED SIGNATURE</p>
                <div class="text-xs text-muted mt-2">GENERATED BY COWL SYSTEM</div>
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
