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
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            line-height: 1.5;
        }
        .invoice-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            padding: 20mm;
            box-shadow: 0 0 10mm rgba(0,0,0,0.1);
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
            font-size: 32px;
            font-weight: 900;
            letter-spacing: -1px;
        }
        .header .biz-name {
            font-size: 14px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header .doc-info {
            text-align: right;
        }
        .header .doc-info p.label {
            font-size: 10px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        .header .doc-info p.val {
            font-size: 24px;
            font-weight: 900;
            color: #0f172a;
        }

        .parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        .party h3 {
            font-size: 10px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .party .name {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
            text-transform: uppercase;
        }
        .party .detail {
            font-size: 12px;
            color: #64748b;
            line-height: 1.4;
        }

        .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            background: #f8fafc;
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
        }
        .meta-item { text-align: center; }
        .meta-item p.label {
            font-size: 9px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
            margin-bottom: 3px;
        }
        .meta-item p.val {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th {
            background: #10b981;
            color: white;
            padding: 12px;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: left;
        }
        th:first-child { border-radius: 8px 0 0 0; }
        th:last-child { border-radius: 0 8px 0 0; }
        td {
            padding: 12px;
            font-size: 12px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
        }
        td.bold { font-weight: 700; }
        td.right { text-align: right; }
        td.center { text-align: center; }

        .summary-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
        }
        .summary-box {
            width: 250px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
        }
        .summary-row.total {
            border-top: 2px solid #10b981;
            margin-top: 10px;
            padding-top: 12px;
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
        }
        .summary-row.accent { color: #10b981; font-weight: 700; }
        .summary-row.danger { color: #ef4444; font-weight: 700; }

        .notes {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #10b981;
            margin-top: 20px;
        }
        .notes h4 {
            font-size: 10px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .notes p {
            font-size: 12px;
            color: #475569;
            line-height: 1.5;
        }

        .footer {
            margin-top: auto;
            padding-top: 30px;
            border-top: 1px solid #f1f5f9;
            text-align: center;
            color: #94a3b8;
            font-size: 10px;
            letter-spacing: 1px;
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
        format: 'a4'
    })

    const isSale = data.type === 'SALE'
    const title = isSale ? 'SALES INVOICE' : 'PURCHASE BILL'

    // Colors
    const primaryColor = [16, 185, 129] // #10b981
    const darkColor = [15, 23, 42] // #0f172a
    const grayColor = [100, 116, 139] // #64748b

    // Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text(title, 20, 25)

    doc.setFontSize(10)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text(data.businessName.toUpperCase(), 20, 32)

    // Document No
    doc.setFontSize(8)
    doc.text('DOCUMENT NO.', 190, 20, { align: 'right' })
    doc.setFontSize(18)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(data.invoiceNumber, 190, 28, { align: 'right' })

    // Divider
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(1)
    doc.line(20, 38, 190, 38)

    // Parties
    let y = 50

    // FROM
    doc.setFontSize(8)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text('FROM', 20, y)
    doc.text(isSale ? 'BILL TO' : 'SUPPLIER', 110, y)

    y += 5
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(data.businessName, 20, y)
    doc.text(data.partyName, 110, y)

    y += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text(data.businessAddress || '', 20, y, { maxWidth: 70 })
    doc.text(data.partyAddress || '', 110, y, { maxWidth: 70 })

    y += 10
    doc.text(data.businessPhone || '', 20, y)
    doc.text(data.partyPhone || '', 110, y)

    // Meta Grid
    y += 15
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(20, y, 170, 15, 3, 3, 'F')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('DATE', 35, y + 6, { align: 'center' })
    doc.text('DUE DATE', 105, y + 6, { align: 'center' })
    doc.text('STATUS', 175, y + 6, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(new Date(data.date).toLocaleDateString(), 35, y + 11, { align: 'center' })
    doc.text(data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'N/A', 105, y + 11, { align: 'center' })
    doc.text(data.status, 175, y + 11, { align: 'center' })

    // Table
    y += 25
    const tableBody = data.items.map(item => [
        item.description,
        item.quantity.toString(),
        `${data.currencySymbol}${item.rate.toFixed(2)}`,
        `${item.tax}%`,
        `${data.currencySymbol}${item.total.toFixed(2)}`
    ])

        ; (doc as any).autoTable({
            startY: y,
            head: [['Description', 'Qty', 'Rate', 'Tax', 'Amount']],
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [16, 185, 129],
                textColor: 255,
                fontSize: 9,
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
                fontSize: 9,
                cellPadding: 5
            }
        })

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])

    let ty = finalY
    doc.text('Subtotal:', 140, ty)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(`${data.currencySymbol}${data.subtotal.toFixed(2)}`, 190, ty, { align: 'right' })

    ty += 7
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text('Taxation:', 140, ty)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(`${data.currencySymbol}${data.taxAmount.toFixed(2)}`, 190, ty, { align: 'right' })

    if (data.discountAmount && data.discountAmount > 0) {
        ty += 7
        doc.setTextColor(245, 158, 11) // Amber
        doc.text('Discount:', 140, ty)
        doc.text(`-${data.currencySymbol}${data.discountAmount.toFixed(2)}`, 190, ty, { align: 'right' })
    }

    ty += 10
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.line(140, ty - 5, 190, ty - 5)
    doc.setFontSize(14)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('TOTAL:', 140, ty)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(`${data.currencySymbol}${data.totalAmount.toFixed(2)}`, 190, ty, { align: 'right' })

    // Signature Area
    if (data.signature) {
        doc.addImage(data.signature, 'PNG', 140, ty + 10, 40, 20)
    }
    doc.setFontSize(8)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.line(140, ty + 30, 185, ty + 30)
    doc.text('AUTHORIZED SIGNATURE', 162.5, ty + 34, { align: 'center' })

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text(`GENERATED BY LUCY-EX CLOUD SYSTEM • ${new Date().toLocaleString()}`, 105, 285, { align: 'center' })

    doc.save(`${data.invoiceNumber}.pdf`)
}

