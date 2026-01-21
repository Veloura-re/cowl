/**
 * Invoice Generator Utility
 * Generates printable HTML invoices that can be saved or printed
 */

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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: #f5f5f5;
        }
        .invoice {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #10b981;
        }
        .header h1 {
            color: #10b981;
            font-size: 28px;
            font-weight: 700;
        }
        .header .invoice-number {
            text-align: right;
        }
        .header .invoice-number h2 {
            font-size: 16px;
            color: #666;
            font-weight: 600;
        }
        .header .invoice-number p {
            font-size: 24px;
            color: #000;
            font-weight: 700;
            margin-top: 5px;
        }
        .parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        .party h3 {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .party p {
            font-size: 14px;
            color: #000;
            line-height: 1.6;
        }
        .party .name {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .dates {
            display: flex;
            gap: 30px;
            margin-bottom: 30px;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
        }
        .date-item {
            flex: 1;
        }
        .date-item label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 5px;
        }
        .date-item span {
            font-size: 14px;
            font-weight: 600;
            color: #000;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        thead {
            background: #10b981;
            color: white;
        }
        th {
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        th.right, td.right {
            text-align: right;
        }
        th.center, td.center {
            text-align: center;
        }
        tbody tr {
            border-bottom: 1px solid #e5e7eb;
        }
        tbody tr:hover {
            background: #f9fafb;
        }
        td {
            padding: 12px;
            font-size: 13px;
            color: #374151;
        }
        .totals {
            margin-left: auto;
            width: 350px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 14px;
        }
        .totals-row.subtotal {
            color: #666;
        }
        .totals-row.total {
            border-top: 2px solid #10b981;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 18px;
            font-weight: 700;
            color: #000;
        }
        .totals-row.discount {
            color: #f59e0b;
        }
        .status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status.paid {
            background: #d1fae5;
            color: #065f46;
        }
        .status.unpaid {
            background: #fee2e2;
            color: #991b1b;
        }
        .status.partial {
            background: #fef3c7;
            color: #92400e;
        }
        .notes {
            margin-top: 30px;
            padding: 20px;
            background: #f9fafb;
            border-left: 4px solid #10b981;
            border-radius: 4px;
        }
        .notes h4 {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .notes p {
            font-size: 13px;
            color: #374151;
            line-height: 1.6;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 11px;
        }
        .signature-container {
            margin-top: 40px;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 20px;
        }
        .signature-box {
            text-align: center;
            width: 200px;
        }
        .signature-image {
            width: 150px;
            height: auto;
            border-bottom: 2px solid #000;
            margin-bottom: 5px;
        }
        .signature-label {
            font-size: 12px;
            color: #666;
            font-weight: 600;
            text-transform: uppercase;
        }
        .attachments-grid {
            margin-top: 40px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        .attachment-item {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            background: #f9fafb;
        }
        .attachment-image {
            width: 100%;
            height: 200px;
            object-fit: contain;
        }
        .attachment-label {
            padding: 8px;
            font-size: 10px;
            color: #666;
            background: #fff;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }
        @media print {
            body { padding: 0; background: white; }
            .invoice { box-shadow: none; width: 100%; max-width: none; border: none; padding: 20px; }
            .attachment-item { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <div>
                <h1>${title}</h1>
                <p style="color: #666; font-size: 14px; margin-top: 5px;">${data.businessName}</p>
            </div>
            <div class="invoice-number">
                <h2>Invoice Number</h2>
                <p>${data.invoiceNumber}</p>
            </div>
        </div>
        
        <div class="parties">
            <div class="party">
                <h3>From</h3>
                <p class="name">${data.businessName}</p>
                ${data.businessAddress ? `<p>${data.businessAddress}</p>` : ''}
                ${data.businessPhone ? `<p>${data.businessPhone}</p>` : ''}
            </div>
            <div class="party">
                <h3>${isSale ? 'Bill To' : 'Supplier'}</h3>
                <p class="name">${data.partyName}</p>
                ${data.partyAddress ? `<p>${data.partyAddress}</p>` : ''}
                ${data.partyPhone ? `<p>${data.partyPhone}</p>` : ''}
            </div>
        </div>
        
        <div class="dates">
            <div class="date-item">
                <label>Invoice Date</label>
                <span>${new Date(data.date).toLocaleDateString()}</span>
            </div>
            ${data.dueDate ? `
            <div class="date-item">
                <label>Due Date</label>
                <span>${new Date(data.dueDate).toLocaleDateString()}</span>
            </div>
            ` : ''}
            <div class="date-item">
                <label>Status</label>
                <span class="status ${data.status.toLowerCase()}">${data.status}</span>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="center">Quantity</th>
                    <th class="right">Rate</th>
                    <th class="right">Tax</th>
                    <th class="right">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td class="center">${item.quantity}</td>
                    <td class="right">${data.currencySymbol} ${item.rate.toFixed(2)}</td>
                    <td class="right">${item.tax}%</td>
                    <td class="right">${data.currencySymbol} ${item.total.toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="totals">
            <div class="totals-row subtotal">
                <span>Subtotal</span>
                <span>${data.currencySymbol} ${data.subtotal.toFixed(2)}</span>
            </div>
            <div class="totals-row subtotal">
                <span>Tax</span>
                <span>${data.currencySymbol} ${data.taxAmount.toFixed(2)}</span>
            </div>
            ${data.discountAmount && data.discountAmount > 0 ? `
            <div class="totals-row discount">
                <span>Discount</span>
                <span>- ${data.currencySymbol} ${data.discountAmount.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="totals-row total">
                <span>Total Amount</span>
                <span>${data.currencySymbol} ${data.totalAmount.toFixed(2)}</span>
            </div>
            ${data.paidAmount && data.paidAmount > 0 ? `
            <div class="totals-row subtotal" style="color: #10b981;">
                <span>Paid</span>
                <span>${data.currencySymbol} ${data.paidAmount.toFixed(2)}</span>
            </div>
            ` : ''}
            ${data.balanceAmount && data.balanceAmount > 0 ? `
            <div class="totals-row subtotal" style="color: #dc2626;">
                <span>Balance Due</span>
                <span>${data.currencySymbol} ${data.balanceAmount.toFixed(2)}</span>
            </div>
            ` : ''}
        </div>
        
        ${data.notes ? `
        <div class="notes">
            <h4>Notes</h4>
            <p>${data.notes}</p>
        </div>
        ` : ''}

        ${data.attachments && data.attachments.length > 0 ? `
        <div style="margin-top: 30px;">
            <h4 style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Attachments / Proof</h4>
            <div class="attachments-grid">
                ${data.attachments.map((url, idx) => `
                <div class="attachment-item">
                    <img src="${url}" class="attachment-image" onerror="this.src='https://via.placeholder.com/200?text=Attachment+${idx + 1}'">
                    <div class="attachment-label">Proof Document #${idx + 1}</div>
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="signature-container">
            ${data.signature ? `
            <div class="signature-box">
                <img src="${data.signature}" class="signature-image" alt="Signature">
                <div class="signature-label">Authorized Signature</div>
            </div>
            ` : `
            <div class="signature-box" style="visibility: hidden;">
                <div class="signature-image"></div>
                <div class="signature-label">Authorized Signature</div>
            </div>
            `}
        </div>
        
        <div class="footer">
            <p>Generated by LUCY-ex on ${new Date().toLocaleString()}</p>
            <p>Phone: ${data.businessPhone || 'N/A'} | Address: ${data.businessAddress || 'N/A'}</p>
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
 * Download invoice as HTML file
 */
export function downloadInvoice(data: InvoiceData) {
    const html = generateInvoiceHTML(data)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.invoiceNumber}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
