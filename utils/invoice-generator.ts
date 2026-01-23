import { jsPDF } from 'jspdf'
import 'jspdf-autotable'


export type InvoiceData = {
    invoiceNumber: string
    date: string
    dueDate?: string
    type: 'SALE' | 'PURCHASE'

    // Business Info
    businessName: string
    businessAddress?: string
    businessPhone?: string

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
    const title = isSale ? 'SALES INVOICE' : 'PURCHASE BILL'

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${data.invoiceNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            line-height: 1.4;
        }
        .invoice-page {
            width: 126mm;
            min-height: 178mm;
            margin: 0 auto;
            background: white;
            padding: 6mm;
            box-shadow: 0 0 5mm rgba(0,0,0,0.1);
            display: flex;
            flex-column;
            flex-direction: column;
        }
        @page {
            size: A4;
            margin: 0;
        }
        @media print {
            body { background: white; padding: 0; }
            .invoice-page { box-shadow: none; margin: 0; width: 210mm; height: 297mm; }
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 4px solid #10b981;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #10b981;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: -0.2px;
        }
        .header .biz-name {
            font-size: 4px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.2px;
        }
        .header .doc-info {
            text-align: right;
        }
        .header .doc-info p.label {
            font-size: 3.5px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .header .doc-info p.val {
            font-size: 7px;
            font-weight: 900;
            color: #0f172a;
        }

        .parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
        }
        .party h3 {
            font-size: 4px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 0.5px solid #f1f5f9;
            padding-bottom: 2px;
            margin-bottom: 3px;
        }
        .party .name {
            font-size: 5px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 1px;
            text-transform: uppercase;
        }
        .party .detail {
            font-size: 4.5px;
            color: #64748b;
            line-height: 1.2;
        }

        .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
            background: #f8fafc;
            padding: 4px;
            border-radius: 3px;
            margin-bottom: 8px;
            border: 0.5px solid #e2e8f0;
        }
        .meta-item { text-align: center; }
        .meta-item p.label {
            font-size: 3.5px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
            margin-bottom: 1px;
        }
        .meta-item p.val {
            font-size: 4.5px;
            font-weight: 700;
            color: #0f172a;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
        }
        th {
            background: #10b981;
            color: white;
            padding: 6px;
            font-size: 6px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            text-align: left;
        }
        th:first-child { border-radius: 4px 0 0 0; }
        th:last-child { border-radius: 0 4px 0 0; }
        td {
            padding: 6px;
            font-size: 7px;
            border-bottom: 0.5px solid #f1f5f9;
            color: #334155;
        }
        td.bold { font-weight: 700; }
        td.right { text-align: right; }
        td.center { text-align: center; }

        .summary-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 12px;
        }
        .summary-box {
            width: 80px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            font-size: 5px;
        }
        .summary-row.total {
            border-top: 1px solid #10b981;
            margin-top: 3px;
            padding-top: 4px;
            font-size: 7px;
            font-weight: 900;
            color: #0f172a;
        }
        .summary-row.accent { color: #10b981; font-weight: 700; }
        .summary-row.danger { color: #ef4444; font-weight: 700; }

        .notes {
            background: #f8fafc;
            padding: 6px;
            border-radius: 4px;
            border-left: 2px solid #10b981;
            margin-top: 6px;
        }
        .notes h4 {
            font-size: 4px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .notes p {
            font-size: 5px;
            color: #475569;
            line-height: 1.2;
        }

        .footer {
            margin-top: auto;
            padding-top: 9px;
            border-top: 0.5px solid #f1f5f9;
            text-align: center;
            color: #94a3b8;
            font-size: 4px;
            letter-spacing: 0.3px;
        }
        
        .signature-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 40px;
        }
        .sig-box {
            text-align: center;
            width: 180px;
        }
        .sig-line {
            border-bottom: 2px solid #0f172a;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
        }
        .sig-image { height: 50px; width: auto; }
        .sig-label {
            font-size: 10px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
        }

        .attachments { margin-top: 40px; }
        .attachments-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }
        .attachment-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            background: #f8fafc;
        }
        .attachment-img {
            width: 100%;
            height: 180px;
            object-fit: contain;
            background: white;
        }
    </style>
</head>
<body>
    <div class="invoice-page">
        <div class="header">
            <div>
                <h1>${title}</h1>
                <p class="biz-name">${data.businessName}</p>
            </div>
            <div class="doc-info">
                <p class="label">Document No.</p>
                <p class="val">${data.invoiceNumber}</p>
            </div>
        </div>
        
        <div class="parties">
            <div class="party">
                <h3>From</h3>
                <p class="name">${data.businessName}</p>
                <p class="detail">${data.businessAddress || ''}</p>
                <p class="detail">${data.businessPhone || ''}</p>
            </div>
            <div class="party">
                <h3>${isSale ? 'Bill To' : 'Supplier'}</h3>
                <p class="name">${data.partyName}</p>
                <p class="detail">${data.partyAddress || ''}</p>
                <p class="detail">${data.partyPhone || ''}</p>
            </div>
        </div>
        
        <div class="meta-grid">
            <div class="meta-item">
                <p class="label">Date</p>
                <p class="val">${new Date(data.date).toLocaleDateString()}</p>
            </div>
            <div class="meta-item">
                <p class="label">Due Date</p>
                <p class="val">${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div class="meta-item">
                <p class="label">Status</p>
                <p class="val" style="color: ${data.status === 'PAID' ? '#10b981' : '#ef4444'}">${data.status}</p>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="center">Qty</th>
                    <th class="right">Rate</th>
                    <th class="right">Tax</th>
                    <th class="right">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map(item => `
                <tr>
                    <td class="bold">${item.description}</td>
                    <td class="center">${item.quantity}</td>
                    <td class="right">${data.currencySymbol}${item.rate.toFixed(2)}</td>
                    <td class="right">${item.tax}%</td>
                    <td class="right" style="font-weight: 900">${data.currencySymbol}${item.total.toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="summary-container">
            <div class="summary-box">
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>${data.currencySymbol}${data.subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Taxation</span>
                    <span>${data.currencySymbol}${data.taxAmount.toFixed(2)}</span>
                </div>
                ${data.discountAmount && data.discountAmount > 0 ? `
                <div class="summary-row" style="color: #f59e0b">
                    <span>Discount</span>
                    <span>-${data.currencySymbol}${data.discountAmount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="summary-row total">
                    <span>Total Amount</span>
                    <span>${data.currencySymbol}${data.totalAmount.toFixed(2)}</span>
                </div>
                ${data.paidAmount && data.paidAmount > 0 ? `
                <div class="summary-row accent">
                    <span>Amount Paid</span>
                    <span>${data.currencySymbol}${data.paidAmount.toFixed(2)}</span>
                </div>
                ` : ''}
                ${data.balanceAmount && data.balanceAmount > 0 ? `
                <div class="summary-row danger">
                    <span>Balance Due</span>
                    <span>${data.currencySymbol}${data.balanceAmount.toFixed(2)}</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        ${data.notes ? `
        <div class="notes">
            <h4>Notes</h4>
            <p>${data.notes}</p>
        </div>
        ` : ''}

        <div class="signature-section">
            <div class="sig-box">
                <div class="sig-line">
                    ${data.signature ? `<img src="${data.signature}" class="sig-image">` : ''}
                </div>
                <p class="sig-label">Authorized Signature</p>
            </div>
        </div>

        ${data.attachments && data.attachments.length > 0 ? `
        <div class="attachments">
            <h4 style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px;">Recorded Proof</h4>
            <div class="attachments-grid">
                ${data.attachments.map((url, idx) => `
                <div class="attachment-card">
                    <img src="${url}" class="attachment-img" onerror="this.src='https://via.placeholder.com/200?text=Attachment+${idx + 1}'">
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="footer">
            <p>GENERATED BY LUCY-EX CLOUD SYSTEM • ${new Date().toLocaleString()}</p>
            <p>${data.businessAddress || ''} • ${data.businessPhone || ''}</p>
        </div>
    </div>
</body>
</html>
    `.trim()
}

/**
 * Opens invoice in new window for printing/saving
 */
export function printInvoice(data: InvoiceData) {
    const html = generateInvoiceHTML(data)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        // Auto-trigger print dialog after a short delay
        setTimeout(() => {
            printWindow.print()
        }, 250)
    }
}


/**
 * Download invoice as PDF file using jsPDF
 */
export function downloadInvoice(data: InvoiceData) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [126, 178]
    })

    const isSale = data.type === 'SALE'
    const title = isSale ? 'SALES INVOICE' : 'PURCHASE BILL'

    // Colors
    const primaryColor = [16, 185, 129] // #10b981
    const darkColor = [15, 23, 42] // #0f172a
    const grayColor = [100, 116, 139] // #64748b

    // Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text(title, 8, 10)

    doc.setFontSize(3.5)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text(data.businessName.toUpperCase(), 8, 13)

    // Document No
    doc.setFontSize(3)
    doc.text('NO.', 118, 9, { align: 'right' })
    doc.setFontSize(5)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(data.invoiceNumber, 118, 13, { align: 'right' })

    // Divider
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.2)
    doc.line(8, 16, 118, 16)

    // Parties
    let y = 22

    // FROM
    doc.setFontSize(2.5)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text('FROM', 8, y)
    doc.text(isSale ? 'BILL TO' : 'SUPPLIER', 66, y)

    y += 2
    doc.setFontSize(4.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(data.businessName, 8, y)
    doc.text(data.partyName, 66, y)

    y += 2
    doc.setFontSize(3.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text(data.businessAddress || '', 8, y, { maxWidth: 50 })
    doc.text(data.partyAddress || '', 66, y, { maxWidth: 50 })

    y += 4
    doc.text(data.businessPhone || '', 8, y)
    doc.text(data.partyPhone || '', 66, y)

    // Meta Grid
    y += 7
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(8, y, 110, 7, 0.8, 0.8, 'F')

    doc.setFontSize(2.5)
    doc.setFont('helvetica', 'bold')
    doc.text('DATE', 26, y + 2.5, { align: 'center' })
    doc.text('DUE DATE', 63, y + 2.5, { align: 'center' })
    doc.text('STATUS', 100, y + 2.5, { align: 'center' })

    doc.setFontSize(3.5)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(new Date(data.date).toLocaleDateString(), 26, y + 5.5, { align: 'center' })
    doc.text(data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'N/A', 63, y + 5.5, { align: 'center' })
    doc.text(data.status, 100, y + 5.5, { align: 'center' })

    // Table
    y += 10
    const tableBody = data.items.map(item => [
        item.description,
        item.quantity.toString(),
        `${data.currencySymbol}${item.rate.toFixed(2)}`,
        `${item.tax}%`,
        `${data.currencySymbol}${item.total.toFixed(2)}`
    ])

        ; (doc as any).autoTable({
            startY: y,
            head: [['Item', 'Qty', 'Rate', 'Tax', 'Total']],
            body: tableBody,
            theme: 'grid',
            margin: { left: 8, right: 8 },
            headStyles: {
                fillColor: [16, 185, 129],
                textColor: 255,
                fontSize: 3.5,
                fontStyle: 'bold',
                halign: 'left'
            },
            columnStyles: {
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right', fontStyle: 'bold' }
            },
            styles: {
                fontSize: 3.5,
                cellPadding: 1
            }
        })

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 3
    doc.setFontSize(3.5)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])

    let ty = finalY
    doc.text('Subtotal:', 88, ty)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(`${data.currencySymbol}${data.subtotal.toFixed(2)}`, 118, ty, { align: 'right' })

    ty += 2.5
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text('Tax:', 88, ty)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(`${data.currencySymbol}${data.taxAmount.toFixed(2)}`, 118, ty, { align: 'right' })

    if (data.discountAmount && data.discountAmount > 0) {
        ty += 2.5
        doc.setTextColor(245, 158, 11)
        doc.text('Off:', 88, ty)
        doc.text(`-${data.currencySymbol}${data.discountAmount.toFixed(2)}`, 118, ty, { align: 'right' })
    }

    ty += 4
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.line(88, ty - 2, 118, ty - 2)
    doc.setFontSize(5)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('TOTAL:', 88, ty)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(`${data.currencySymbol}${data.totalAmount.toFixed(2)}`, 118, ty, { align: 'right' })

    // Signature Area
    if (data.signature) {
        doc.addImage(data.signature, 'PNG', 88, ty + 3, 15, 8)
    }
    doc.setFontSize(2.5)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.line(88, ty + 12, 118, ty + 12)
    doc.text('AUTH SIGNATURE', 103, ty + 14, { align: 'center' })

    // Footer
    doc.setFontSize(2.5)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text(`GENERATED BY LUCY-EX CLOUD SYSTEM • ${new Date().toLocaleString()}`, 63, 174, { align: 'center' })

    doc.save(`${data.invoiceNumber}.pdf`)
}

