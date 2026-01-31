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

    // Customization
    accentColor?: string
    footerNote?: string
    size?: 'A4' | 'THERMAL'
}

export function generateInvoiceHTML(data: InvoiceData): string {
    const isSale = data.type === 'SALE'
    const title = isSale ? 'INVOICE' : 'PURCHASE ORDER'
    const accentColor = data.accentColor || '#111827'
    const isThermal = data.size === 'THERMAL'

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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Share+Tech+Mono&display=swap');
        
        :root {
            --bg-color: #ffffff;
            --text-main: #111827;
            --text-muted: #6b7280;
            --accent-bg: #f9fafb;
            --primary: ${accentColor};
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
            width: ${isThermal ? '80mm' : '210mm'};
            min-height: ${isThermal ? 'auto' : '297mm'};
            margin: 0 auto;
            background: var(--bg-color);
            padding: ${isThermal ? '4mm' : '12mm'};
            position: relative;
            display: flex;
            flex-direction: column;
            ${isThermal ? 'font-size: 10px; padding-bottom: 20mm;' : ''}
        }

        @media print {
            body { background: white; }
            .page { width: 100%; margin: 0; padding: ${isThermal ? '0' : '10mm'}; box-shadow: none; border: none; }
        }

        /* Header */
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: ${isThermal ? '4mm' : '6mm'}; 
            ${isThermal ? 'flex-direction: column; align-items: center; text-align: center;' : ''}
        }
        .brand-section { flex: 1; }
        .meta-section { text-align: ${isThermal ? 'center' : 'right'}; ${isThermal ? 'margin-top: 10px; width: 100%;' : ''} }
        
        .logo { 
            height: ${isThermal ? '25px' : '35px'}; 
            width: auto; 
            object-fit: contain; 
            margin-bottom: 6px; 
            display: ${isThermal ? 'inline-block' : 'block'}; 
        }
        
        .company-name { font-size: ${isThermal ? '14px' : '20px'}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; margin-bottom: 2px; }
        .company-details { font-size: ${isThermal ? '8px' : '9px'}; color: var(--text-muted); line-height: 1.3; text-transform: uppercase; }

        .status-badge {
            display: inline-block;
            background: ${statusColor};
            color: white;
            padding: 2px 8px;
            border-radius: 99px;
            font-weight: 700;
            font-size: ${isThermal ? '8px' : '10px'};
            text-transform: uppercase;
            margin-bottom: ${isThermal ? '4px' : '10px'};
        }

        .document-title { font-size: ${isThermal ? '16px' : '24px'}; font-weight: 900; margin-bottom: 2px; letter-spacing: 0.1em; }
        .document-meta { font-size: ${isThermal ? '10px' : '11px'}; color: var(--text-muted); }
        .document-meta b { color: var(--text-main); }

        /* Info Grid */
        .info-grid { 
            display: grid; 
            grid-template-columns: ${isThermal ? '1fr' : '1fr 1fr'}; 
            gap: ${isThermal ? '8px' : '16px'}; 
            margin-bottom: ${isThermal ? '4mm' : '6mm'}; 
            background: var(--accent-bg);
            padding: ${isThermal ? '8px' : '12px'};
            border-radius: ${isThermal ? '8px' : '12px'};
        }
        
        .info-title { font-size: ${isThermal ? '7px' : '8px'}; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: ${isThermal ? '2px' : '6px'}; }
        .info-content { font-size: ${isThermal ? '10px' : '11px'}; font-weight: 400; line-height: 1.3; }
        .info-content b { font-weight: 900; text-transform: uppercase; }

        /* Table */
        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: ${isThermal ? '6mm' : '10mm'}; }
        th { 
            text-align: left; 
            font-size: ${isThermal ? '9px' : '11px'}; 
            font-weight: 700;
            text-transform: uppercase; 
            background: var(--primary);
            color: white;
            padding: ${isThermal ? '6px 8px' : '12px 15px'}; 
        }
        th:first-child { border-radius: 8px 0 0 8px; }
        th:last-child { border-radius: 0 8px 8px 0; }
        
        td { 
            padding: ${isThermal ? '6px 8px' : '10px 15px'}; 
            font-size: ${isThermal ? '10px' : '11px'}; 
            border-bottom: 1px solid #f3f4f6;
        }
        tr:nth-child(even) td { background-color: #f9fafb; }
        .bold { font-weight: 700; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Totals */
        .totals-container { display: flex; justify-content: flex-end; margin-bottom: ${isThermal ? '6mm' : '8mm'}; }
        .totals-table { width: ${isThermal ? '100%' : '240px'}; }
        .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: ${isThermal ? '11px' : '12px'}; }
        .final-total { 
            background: var(--primary);
            color: white;
            border-radius: ${isThermal ? '8px' : '12px'};
            margin-top: 8px; 
            padding: ${isThermal ? '8px 12px' : '12px 16px'}; 
            font-weight: 900; 
            font-size: ${isThermal ? '14px' : '16px'};
        }

        /* Footer */
        .footer { 
            margin-top: auto; 
            border-top: 1px solid #eee; 
            padding-top: ${isThermal ? '12px' : '20px'}; 
            display: flex; 
            ${isThermal ? 'flex-direction: column; gap: 12px; text-align: center;' : 'justify-content: space-between;'}
            font-size: 10px;
            color: var(--text-muted);
        }
        .footer-note { 
            font-family: 'Share Tech Mono', monospace; 
            background: #fdfdfd; 
            border: 1px dashed #e5e7eb; 
            padding: 8px; 
            border-radius: 8px; 
            font-size: ${isThermal ? '9px' : '10px'};
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
            <div class="${isThermal ? '' : 'text-right'}">
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
                    <th style="width: ${isThermal ? '40%' : '45%'}">Desc</th>
                    ${isThermal ? '' : '<th class="text-center" style="width: 10%">Qty</th>'}
                    <th class="text-right" style="width: ${isThermal ? '25%' : '15%'}">${isThermal ? 'Price' : 'Rate'}</th>
                    ${isThermal ? '' : '<th class="text-right" style="width: 10%">Tax</th>'}
                    <th class="text-right" style="width: ${isThermal ? '35%' : '20%'}">Amt</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map(item => `
                <tr>
                    <td>
                        <div class="bold">${item.description}</div>
                        ${isThermal ? `<div style="font-size: 8px; color: #9ca3af;">${item.quantity} x ${formatNumber(item.rate)}</div>` : ''}
                    </td>
                    ${isThermal ? '' : `<td class="text-center">${item.quantity}</td>`}
                    ${isThermal ? `<td class="text-right">${formatNumber(item.rate)}</td>` : `<td class="text-right">${formatNumber(item.rate)}</td>`}
                    ${isThermal ? '' : `<td class="text-right text-muted">${item.tax}%</td>`}
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
                ${(data.notes || data.footerNote) ? `
                    <div class="footer-note">
                        ${data.notes ? `<p class="info-content" style="margin-bottom: 4px;"><strong>NOTES:</strong> ${data.notes.toUpperCase()}</p>` : ''}
                        ${data.footerNote ? `<p class="info-content" style="opacity: 0.8;">${data.footerNote}</p>` : ''}
                    </div>
                ` : ''}
            </div>
            <div style="text-align: ${isThermal ? 'center' : 'right'};">
                ${data.signature ? `<img src="${data.signature}" style="height: 28px; margin-bottom: 4px;" />` : '<div style="height: 28px;"></div>'}
                <p class="info-title">Authorized Signature</p>
                <div class="text-uppercase mt-2" style="font-size: 8px; opacity: 0.5;">Generated by COWL System</div>
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
