// Types only imports (optional, or just remove static imports)
import { format } from 'date-fns';
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export type ReportType = 'SALES' | 'PURCHASES' | 'INVENTORY' | 'PROFIT_LOSS' | 'CUSTOMER_REPORT' | 'SUPPLIER_REPORT' | 'PARTY_SALES' | 'PARTY_PURCHASES';

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

        // --- Premium Header Section ---
        let yPos = 25;

        // Add Logo if available (Left Aligned)
        if (businessInfo.logoUrl) {
            try {
                // Determine if it's base64 or URL
                doc.addImage(businessInfo.logoUrl, 'PNG', 15, 15, 20, 20);
            } catch (e) {
                console.error('Failed to add logo to report', e);
            }
        }

        // Business Details (Right Aligned)
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39); // neutral-900
        doc.text(businessInfo.name.toUpperCase(), pageWidth - 15, yPos, { align: 'right' });
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128); // neutral-400
        if (businessInfo.address) {
            doc.text(businessInfo.address, pageWidth - 15, yPos, { align: 'right' });
            yPos += 5;
        }
        if (businessInfo.phone || businessInfo.email) {
            const contact = [businessInfo.phone, businessInfo.email].filter(Boolean).join(' | ');
            doc.text(contact, pageWidth - 15, yPos, { align: 'right' });
            yPos += 12;
        }

        // Accent Divider
        doc.setDrawColor(99, 102, 241); // indigo-500
        doc.setLineWidth(2);
        doc.line(15, yPos, pageWidth - 15, yPos);
        yPos += 15;

        // Report Title & Date
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text(data.title.toUpperCase(), 15, yPos);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(156, 163, 175);
        doc.text(`ISSUED: ${format(new Date(), 'PP p')}`, pageWidth - 15, yPos, { align: 'right' });
        yPos += 6;

        if (dateRange) {
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128);
            doc.text(
                `ANALYSIS PERIOD: ${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`,
                15,
                yPos
            );
        }
        yPos += 12;

        // --- Table Section ---
        autoTable(doc, {
            startY: yPos,
            head: [data.headers],
            body: data.rows,
            theme: 'grid',
            headStyles: {
                fillColor: [17, 24, 39], // neutral-900 
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10,
                cellPadding: 5
            },
            styles: {
                fontSize: 9,
                cellPadding: 4,
                lineColor: [243, 244, 246]
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251]
            },
            margin: { left: 15, right: 15 },
            didDrawPage: (data) => {
                const pageCount = (doc as any).internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(156, 163, 175);
                doc.text(`COWL BUSINESS INTELLIGENCE - PAGE ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            }
        });

        // --- Summary Section ---
        if (data.summary) {
            let summaryY = (doc as any).lastAutoTable.finalY + 15;

            if (summaryY > doc.internal.pageSize.height - 50) {
                doc.addPage();
                summaryY = 25;
            }

            // Summary Card Background
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(15, summaryY, pageWidth - 30, (data.summary.length * 8) + 15, 5, 5, 'F');
            summaryY += 10;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text('Key Performance Indicators', 20, summaryY);
            summaryY += 8;

            doc.setFontSize(10);
            data.summary.forEach((item) => {
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(107, 114, 128);
                doc.text(`${item.label}:`, 20, summaryY);

                doc.setFont('helvetica', 'bold');
                doc.setTextColor(17, 24, 39);
                doc.text(`${item.value}`, pageWidth - 20, summaryY, { align: 'right' });
                summaryY += 8;
            });
        }

        // --- Signature Section ---
        if (signatureDataUrl) {
            let signatureY = (doc as any).lastAutoTable.finalY + 40;
            if (signatureY > doc.internal.pageSize.height - 60) {
                doc.addPage();
                signatureY = 40;
            }

            // Signature Wrapper
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.1);
            doc.line(15, signatureY, 85, signatureY);

            doc.addImage(signatureDataUrl, 'PNG', 20, signatureY + 5, 45, 18);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text('AUTHENTICATED SIGNATURE', 15, signatureY + 30);

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(156, 163, 175);
            doc.text('This document is digitally verified for business records.', 15, signatureY + 34);
        }

        // Generate Blob for mobile compatibility
        const blob = doc.output('blob');
        const fileName = `${data.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;

        // Only auto-save on desktop
        if (!Capacitor.isNativePlatform()) {
            doc.save(fileName);
        }

        return new File([blob], fileName, { type: 'application/pdf' });
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

        const colWidths = data.headers.map(h => ({ wch: Math.max(h.length, 15) }));
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        const fileName = `${data.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`;

        // Generate Blob for mobile compatibility
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        return new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    },

    /**
     * Share a report file using native share API
     */
    shareReport: async (file: File, title: string) => {
        if (Capacitor.isNativePlatform()) {
            try {
                const reader = new FileReader()
                const base64Promise = new Promise<string>((resolve) => {
                    reader.onloadend = () => {
                        const base64data = reader.result as string
                        resolve(base64data.split(',')[1])
                    }
                })
                reader.readAsDataURL(file)
                const base64Data = await base64Promise

                const writeResult = await Filesystem.writeFile({
                    path: file.name,
                    data: base64Data,
                    directory: Directory.Cache
                })

                await Share.share({
                    title: title,
                    text: `Business Report: ${title}`,
                    url: writeResult.uri,
                    dialogTitle: 'Save or Share Report'
                })
                return true
            } catch (error) {
                console.error('Native report share failed:', error)
                return false
            }
        }

        if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: title,
                    text: `Business Report: ${title}`
                });
                return true;
            } catch (error) {
                console.error('Navigator share failed:', error);
                return false;
            }
        }
        return false;
    }
};
