import { EntryDto } from "../types";

export interface ReportStats {
  income: number;
  expense: number;
  total: number;
}

interface ExportReportPdfOptions {
  title: string;
  periodLabel: string;
  fileName: string;
  stats: ReportStats;
  entries: EntryDto[];
}

export interface YearlyMonthSummary {
  month: string;
  stats: ReportStats;
}

interface ExportYearlyReportPdfOptions {
  year: string;
  fileName: string;
  stats: ReportStats;
  months: YearlyMonthSummary[];
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function sanitizeFileName(value: string) {
  return value
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

async function createReportDocument(
  title: string,
  periodLabel: string,
  stats: ReportStats,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const addPageIfNeeded = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = 18;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(periodLabel, margin, y);
  y += 10;

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Income", margin + 6, y + 8);
  doc.text("Expense", margin + contentWidth / 3 + 6, y + 8);
  doc.text("Net", margin + (contentWidth / 3) * 2 + 6, y + 8);
  doc.setFontSize(12);
  doc.text(currency.format(stats.income), margin + 6, y + 17);
  doc.text(
    currency.format(stats.expense),
    margin + contentWidth / 3 + 6,
    y + 17,
  );
  doc.text(
    currency.format(stats.total),
    margin + (contentWidth / 3) * 2 + 6,
    y + 17,
  );
  doc.setTextColor(0, 0, 0);
  y += 34;

  return {
    doc,
    pageWidth,
    margin,
    getY: () => y,
    setY: (nextY: number) => {
      y = nextY;
    },
    addPageIfNeeded,
  };
}

export async function exportReportPdf({
  title,
  periodLabel,
  fileName,
  stats,
  entries,
}: ExportReportPdfOptions) {
  const { doc, pageWidth, margin, getY, setY, addPageIfNeeded } =
    await createReportDocument(title, periodLabel, stats);
  let y = getY();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Entries", margin, y);
  y += 8;
  setY(y);

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  if (sortedEntries.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("No entries for this period.", margin, y);
  } else {
    doc.setFontSize(9);
    sortedEntries.forEach((entry) => {
      const description = entry.description?.trim() || "No description";
      const descriptionLines = doc.splitTextToSize(description, 78);
      const rowHeight = Math.max(12, descriptionLines.length * 5 + 5);
      addPageIfNeeded(rowHeight + 4);
      y = getY();

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      doc.setFont("helvetica", "bold");
      doc.text(formatDate(entry.createdAt), margin, y);
      doc.text(entry.type, margin + 34, y);
      doc.text(currency.format(entry.amount), margin + 66, y);

      doc.setFont("helvetica", "normal");
      doc.text(entry.category, margin + 98, y, { maxWidth: 38 });
      doc.text(descriptionLines, margin + 138, y);
      y += rowHeight;
      setY(y);
    });
  }

  doc.save(`${sanitizeFileName(fileName)}.pdf`);
}

export async function exportYearlyReportPdf({
  year,
  fileName,
  stats,
  months,
}: ExportYearlyReportPdfOptions) {
  const { doc, pageWidth, margin, getY, setY, addPageIfNeeded } =
    await createReportDocument("INCxEXP Yearly Report", year, stats);
  let y = getY();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Monthly Summary", margin, y);
  y += 9;

  doc.setFontSize(10);
  doc.text("Month", margin, y);
  doc.text("Income", margin + 54, y);
  doc.text("Expense", margin + 96, y);
  doc.text("Net", margin + 140, y);
  y += 5;
  setY(y);

  months.forEach(({ month, stats: monthStats }) => {
    addPageIfNeeded(12);
    y = getY();

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.text(month, margin, y);
    doc.text(currency.format(monthStats.income), margin + 54, y);
    doc.text(currency.format(monthStats.expense), margin + 96, y);
    doc.text(currency.format(monthStats.total), margin + 140, y);
    y += 7;
    setY(y);
  });

  doc.save(`${sanitizeFileName(fileName)}.pdf`);
}
