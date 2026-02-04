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
    partyGoogleLocation?: string

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
    size?: 'A4' | 'THERMAL' | 'NANO'
}

export function generateInvoiceHTML(data: InvoiceData, theme: 'light' | 'dark' = 'light'): string {
    const isSale = data.type === 'SALE'
    const title = isSale ? 'INVOICE' : 'PURCHASE ORDER'
    const accentColor = data.accentColor || '#000000'
    const isA4 = true // Forced A4 as requested

    // Theme-aware color schemes
    const lightColors = {
        bgColor: '#ffffff',
        textMain: '#000000',
        textMuted: '#444444',
        borderColor: '#000000',
        pageBackground: '#f0f0f0',
        infoBg: '#fdfdfd',
        tableBorder: '#eee'
    }

    const darkColors = {
        bgColor: '#0a0a0a',
        textMain: '#fafafa',
        textMuted: '#a3a3a3',
        borderColor: '#fafafa',
        pageBackground: '#000000',
        infoBg: '#141414',
        tableBorder: '#262626'
    }

    const colors = theme === 'dark' ? darkColors : lightColors

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title} - ${data.invoiceNumber}</title>
    <style>
        :root {
            --bg-color: ${colors.bgColor};
            --text-main: ${colors.textMain};
            --text-muted: ${colors.textMuted};
            --border-color: ${colors.borderColor};
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: ${colors.pageBackground};
            color: var(--text-main);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            line-height: 1.2;
            letter-spacing: -0.01em;
            font-weight: 100;
            font-feature-settings: "tnum", "lnum", "cv01";
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: var(--bg-color);
            padding: 12mm;
            position: relative;
            display: flex;
            flex-direction: column;
            font-size: 9.5pt;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        @media print {
            body { background: ${theme === 'dark' ? '#000' : '#fff'}; }
            .page { width: 210mm; height: 297mm; margin: 0; padding: 12mm; box-shadow: none; border: none; }
        }

        /* Classic Centered Header */
        .header { 
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 0.25pt solid var(--border-color);
            padding-bottom: 8px;
        }
        
        .document-title { 
            font-size: 22pt; 
            font-weight: 200; 
            letter-spacing: 4pt;
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        /* Business Info & Logo */
        .business-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            align-items: flex-end;
        }

        .logo { 
            max-height: 50px;
            max-width: 180px;
            object-fit: contain;
        }

        .company-info {
            text-align: right;
            font-size: 9pt;
        }
        
        .company-name { font-size: 12pt; font-weight: 200; text-transform: uppercase; }

        /* Meta & Parties Info Grid */
        .info-grid { 
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            gap: 15px;
        }
        
        .party-box {
            flex: 1;
            border: 0.15pt solid var(--border-color);
            padding: 8px;
        }
        
        .info-box {
            flex: 0.6;
            border: 0.15pt solid var(--border-color);
            padding: 8px;
            background: ${colors.infoBg};
        }
        
        .label { font-size: 7.5pt; font-weight: 200; text-transform: uppercase; color: var(--text-muted); margin-bottom: 2px; }
        .content { font-size: 9pt; font-weight: 100; }
        .content b { font-weight: 100; }

        /* Formal Table */
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
        }
        
        th { 
            text-align: left; 
            font-size: 9pt; 
            font-weight: 200;
            text-transform: uppercase; 
            border-bottom: 0.5pt solid var(--border-color);
            padding: 6px 4px;
        }
        
        td { 
            padding: 6px 4px;
            font-size: 9pt; 
            border-bottom: 0.15pt solid ${colors.tableBorder};
            vertical-align: top;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Totals Area */
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-top: auto;
        }
        
        .totals-table {
            width: 220px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 0.15pt solid ${colors.tableBorder};
            font-size: 9pt;
        }
        
        .grand-total {
            border-top: 0.5pt solid var(--border-color);
            border-bottom: 0.5pt double var(--border-color);
            font-weight: 200;
            font-size: 11pt;
            margin-top: 4px;
            padding: 8px 0;
        }

        /* Footer & Signature */
        .footer { 
            margin-top: 30px;
            border-top: 0.15pt solid ${colors.tableBorder};
            padding-top: 12px;
            font-size: 8.5pt;
            display: flex;
            justify-content: space-between;
        }
        
        .notes-section { flex: 1; margin-right: 30px; }
        .signature-section { width: 180px; text-align: center; }
        .signature-line { border-top: 0.15pt solid var(--border-color); margin-top: 35px; padding-top: 4px; font-weight: 200; text-transform: uppercase; font-size: 7.5pt; }
        .signature-img { max-height: 45px; margin-bottom: -30px; }

    </style>
</head>
<body>
    <div class="page">
        <!-- Centered Header -->
        <div class="header">
            <h1 class="document-title">${title}</h1>
            <p>NO. <b>${data.invoiceNumber}</b> | DATE: <b>${data.date}</b></p>
        </div>

        <!-- Business Section -->
        <div class="business-section">
            <div>
                ${data.businessLogoUrl ? `<img src="${data.businessLogoUrl}" class="logo" />` : ''}
            </div>
            <div class="company-info">
                <h2 class="company-name">${data.businessName}</h2>
                <p>${data.businessAddress || ''}</p>
                <p>${data.businessPhone || ''}</p>
            </div>
        </div>

        <!-- Info Grid -->
        <div class="info-grid">
            <div class="party-box">
                <p class="label">Bill To:</p>
                <div class="content">
                    <p><b>${data.partyName}</b></p>
                    <p>${data.partyAddress || ''}</p>
                    <p>${data.partyPhone || ''}</p>
                </div>
            </div>
            <div class="info-box">
                <div style="margin-bottom: 10px;">
                    <p class="label">Due Date:</p>
                    <p class="content"><b>${data.dueDate || 'ON RECEIPT'}</b></p>
                </div>
                <div>
                    <p class="label">Currency:</p>
                    <p class="content"><b>${data.currency.toUpperCase()} (${data.currencySymbol})</b></p>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th style="width: 50%">Description</th>
                    <th class="text-center" style="width: 10%">Qty</th>
                    <th class="text-right" style="width: 20%">Rate</th>
                    <th class="text-right" style="width: 20%">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map(item => `
                <tr>
                    <td>
                        <b>${item.description}</b>
                        ${item.tax ? `<br><small style="color: #666; font-size: 8pt;">Tax: ${item.tax}%</small>` : ''}
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${formatNumber(item.rate)}</td>
                    <td class="text-right"><b>${formatNumber(item.total)}</b></td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
            <div class="totals-table">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>${data.currencySymbol}${formatNumber(data.subtotal)}</span>
                </div>
                <div class="total-row">
                    <span>Tax Total:</span>
                    <span>${data.currencySymbol}${formatNumber(data.taxAmount)}</span>
                </div>
                ${data.discountAmount ? `
                <div class="total-row">
                    <span>Discount:</span>
                    <span>-${data.currencySymbol}${formatNumber(data.discountAmount)}</span>
                </div>` : ''}
                
                <div class="grand-total total-row">
                    <span>TOTAL AMOUNT:</span>
                    <span>${data.currencySymbol}${formatNumber(data.totalAmount)}</span>
                </div>

                ${data.paidAmount ? `
                <div class="total-row" style="color: #000;">
                    <span>Amount Paid:</span>
                    <span>${data.currencySymbol}${formatNumber(data.paidAmount)}</span>
                </div>` : ''}

                ${data.balanceAmount && data.balanceAmount > 0 ? `
                <div class="total-row" style="color: red; font-weight: bold;">
                    <span>Balance Due:</span>
                    <span>${data.currencySymbol}${formatNumber(data.balanceAmount)}</span>
                </div>` : ''}
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="notes-section">
                ${data.notes ? `<p class="label">Notes:</p><p>${data.notes}</p>` : ''}
                ${data.footerNote ? `<p style="margin-top: 10px; font-style: italic; color: #666;">${data.footerNote}</p>` : ''}
            </div>
            <div class="signature-section">
                ${data.signature ? `<img src="${data.signature}" class="signature-img" />` : ''}
                <div class="signature-line">Authorized Signature</div>
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
export function printInvoice(data: InvoiceData, theme: 'light' | 'dark' = 'light') {
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
        doc.write(generateInvoiceHTML(data, theme))
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
 * Download invoice as PDF file using html2canvas + jsPDF for accurate rendering.
 * Returns the File object for potential sharing.
 */
export async function downloadInvoice(data: InvoiceData, autoDownload = true, theme: 'light' | 'dark' = 'light'): Promise<File | void> {
    // 1. Create a hidden container to render the invoice specifically for capture
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.top = '-10000px'
    container.style.left = '-10000px'

    // Set appropriate width for container
    const isNano = data.size === 'NANO'
    const isThermal = data.size === 'THERMAL'
    container.style.width = isNano ? '58mm' : (isThermal ? '80mm' : '210mm')
    if (!isNano && !isThermal) container.style.minHeight = '297mm'

    // Inject the HTML
    container.innerHTML = generateInvoiceHTML(data, theme)

    // Append to body to ensure fonts and styles load
    document.body.appendChild(container)

    try {
        // Dynamic import
        const html2canvas = (await import('html2canvas')).default
        const { jsPDF } = await import('jspdf')

        // Wait for images and fonts to render
        await new Promise(resolve => setTimeout(resolve, 800))
        if (typeof document !== 'undefined' && (document as any).fonts) {
            await (document as any).fonts.ready;
        }

        const target = container.querySelector('.page') as HTMLElement
        const canvas = await html2canvas(target, {
            scale: 2.5, // Even higher quality for tiny fonts
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        })

        const imgData = canvas.toDataURL('image/jpeg', 1.0)

        // PDF Generation
        const format = isNano ? [58, canvas.height * (58 / canvas.width)] : (isThermal ? [80, canvas.height * (80 / canvas.width)] : 'a4')
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: format
        })

        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)

        const blob = pdf.output('blob')
        const fileName = `${data.invoiceNumber}.pdf`

        if (autoDownload) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = fileName
            a.click()
            URL.revokeObjectURL(url)
        }

        return new File([blob], fileName, { type: 'application/pdf' })

    } catch (error) {
        console.error('PDF Generation Failed:', error)
        alert('Failed to generate PDF. Please try again.')
    } finally {
        document.body.removeChild(container)
    }
}

/**
 * Capture invoice as high-quality image (Snapshot)
 */
export async function saveInvoiceAsImage(data: InvoiceData, autoDownload = true, theme: 'light' | 'dark' = 'light'): Promise<File | void> {
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.top = '-10000px'
    container.style.left = '-10000px'

    const isNano = data.size === 'NANO'
    const isThermal = data.size === 'THERMAL'
    container.style.width = isNano ? '58mm' : (isThermal ? '80mm' : '210mm')

    container.innerHTML = generateInvoiceHTML(data, theme)
    document.body.appendChild(container)

    try {
        const html2canvas = (await import('html2canvas')).default
        await new Promise(resolve => setTimeout(resolve, 800))
        if (typeof document !== 'undefined' && (document as any).fonts) {
            await (document as any).fonts.ready;
        }

        const target = container.querySelector('.page') as HTMLElement
        const canvas = await html2canvas(target, {
            scale: 3, // Ultra-high quality for image mode
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        })

        const imgData = canvas.toDataURL('image/png', 1.0)
        const fileName = `${data.invoiceNumber}_snapshot.png`

        if (autoDownload) {
            const a = document.createElement('a')
            a.href = imgData
            a.download = fileName
            a.click()
        }

        // Convert base64 to blob/file for sharing
        const res = await fetch(imgData)
        const blob = await res.blob()
        return new File([blob], fileName, { type: 'image/png' })

    } catch (error) {
        console.error('Snapshot Failed:', error)
    } finally {
        document.body.removeChild(container)
    }
}

/**
 * Handle robust sharing of the Invoice (PDF or Image)
 */
export async function shareInvoice(data: InvoiceData, theme: 'light' | 'dark' = 'light') {
    try {
        // We prefer PDF for sharing
        const file = await downloadInvoice(data, false, theme)

        if (file && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file as File] })) {
            await navigator.share({
                title: `Invoice ${data.invoiceNumber}`,
                text: `Invoice ${data.invoiceNumber} from ${data.businessName}`,
                files: [file as File]
            })
            return true
        } else {
            // Fallback for devices that don't support file sharing but might support text sharing
            // or just trigger the download if all else fails
            if (file) {
                const url = URL.createObjectURL(file)
                const a = document.createElement('a')
                a.href = url
                a.download = file.name
                a.click()
                URL.revokeObjectURL(url)
            }
            return false
        }
    } catch (error) {
        console.error('Error sharing:', error)
        return false
    }
}
