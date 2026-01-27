// Types only imports (optional, or just remove static imports)
import { format } from 'date-fns';

export type ReportType = 'SALES' | 'PURCHASES' | 'INVENTORY' | 'PROFIT_LOSS';

interface ReportData {
    title: string;
    headers: string[];
    rows: any[][];
    summary?: { label: string; value: string | number }[];
}

interface BusinessInfo {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
}

export const ReportGenerator = {
    /**
     * Generates a PDF Report
     */
    generatePDF: async (
        reportType: ReportType,
        data: ReportData,
        businessInfo: BusinessInfo,
        dateRange?: { start: Date; end: Date },
        signatureDataUrl?: string
    ) => {
        const { jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- Header Section ---
        let yPos = 20;

        // Business Name
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(businessInfo.name, pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;

        // Add Logo if available
        if (businessInfo.logoUrl) {
            try {
                // Determine if it's base64 or URL
                // If it's a URL, jsPDF might have trouble fetching it synchronously in some environments without a proxy,
                // but for web-based Supabase URLs, it's generally fine if CORS allows.
                doc.addImage(businessInfo.logoUrl, 'PNG', 15, 10, 15, 15);
            } catch (e) {
                console.error('Failed to add logo to report', e);
            }
        }

        // Business Details
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        if (businessInfo.address) {
            doc.text(businessInfo.address, pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
        }
        if (businessInfo.phone || businessInfo.email) {
            const contact = [businessInfo.phone, businessInfo.email].filter(Boolean).join(' | ');
            doc.text(contact, pageWidth / 2, yPos, { align: 'center' });
            yPos += 10;
        }

        // Divider Line
        doc.setLineWidth(0.5);
        doc.line(15, yPos, pageWidth - 15, yPos);
        yPos += 10;

        // Report Title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(data.title.toUpperCase(), 15, yPos);

        // Generated Info (Right aligned)
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${format(new Date(), 'PP p')}`, pageWidth - 15, yPos, { align: 'right' });
        yPos += 5;

        // Date Range
        if (dateRange) {
            doc.text(
                `Period: ${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`,
                15,
                yPos
            );
        }
        yPos += 10;

        // --- Table Section ---
        autoTable(doc, {
            startY: yPos,
            head: [data.headers],
            body: data.rows,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 20 },
            didDrawPage: (data) => {
                // Page Footer
                const pageCount = (doc as any).internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.text(`Page ${pageCount}`, pageWidth - 20, doc.internal.pageSize.height - 10);
            }
        });

        // --- Summary Section ---
        if (data.summary) {
            let summaryY = (doc as any).lastAutoTable.finalY + 15;

            // Check if we need a new page for summary
            if (summaryY > doc.internal.pageSize.height - 40) {
                doc.addPage();
                summaryY = 20;
            }

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Summary', 14, summaryY);
            summaryY += 7;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            data.summary.forEach((item) => {
                doc.text(`${item.label}:`, 14, summaryY);
                doc.setFont('helvetica', 'bold');
                doc.text(`${item.value}`, 70, summaryY); // Align values
                doc.setFont('helvetica', 'normal');
                summaryY += 6;
            });
        }

        // --- Signature Section ---
        if (signatureDataUrl) {
            let signatureY = (doc as any).lastAutoTable.finalY + 30;
            // Check page bounds
            if (signatureY > doc.internal.pageSize.height - 40) {
                doc.addPage();
                signatureY = 40;
            }

            // Add Image
            doc.addImage(signatureDataUrl, 'PNG', 15, signatureY, 40, 20);

            // Add Line and Text
            doc.setLineWidth(0.5);
            doc.line(15, signatureY + 22, 55, signatureY + 22);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('AUTHORIZED SIGNATURE', 15, signatureY + 27);

            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(150, 150, 150);
            doc.text('Digitally Validated', 15, signatureY + 30);
            doc.setTextColor(0, 0, 0); // Reset color
        }

        // Save File
        const fileName = `${data.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
        doc.save(fileName);
    },

    /**
     * Generates an Excel Report
     */
    generateExcel: async (
        reportType: ReportType,
        data: ReportData,
        dateRange?: { start: Date; end: Date }
    ) => {
        const XLSX = await import('xlsx');
        // prepare data for sheet
        const sheetData = [
            [data.title],
            [`Generated on: ${format(new Date(), 'PP p')}`],
            dateRange ? [`Period: ${format(dateRange.start, 'yyyy-MM-dd')} to ${format(dateRange.end, 'yyyy-MM-dd')}`] : [],
            [], // Empty row
            data.headers, // Table Headers
            ...data.rows, // Table Data
            [], // Empty row
            ['Summary'],
            ...(data.summary?.map(s => [s.label, s.value]) || [])
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        // Basic column width spacing (approximate)
        const colWidths = data.headers.map(h => ({ wch: Math.max(h.length, 15) }));
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        const fileName = `${data.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }
};
