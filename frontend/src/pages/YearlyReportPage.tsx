import { useEffect, useMemo, useState } from "react";
import { EntryDto } from "../types";
import { useApi } from "../auth/useApi";
import FormCard from "../components/FormCard";
import {
  exportYearlyReportPdf,
  ReportStats,
  YearlyMonthSummary,
} from "../utils/reportPdf";

interface YearlyGroup {
  year: string;
  stats: ReportStats;
  entries: EntryDto[];
  months: YearlyMonthSummary[];
}

function monthLabel(monthIndex: number) {
  return new Date(2000, monthIndex, 1).toLocaleString("default", {
    month: "long",
  });
}

export default function YearlyReportPage() {
  const api = useApi();
  const [entries, setEntries] = useState<EntryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get<EntryDto[]>("/entries");
        setEntries(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [api]);

  const yearly = useMemo(() => {
    const grouped = new Map<string, YearlyGroup>();
    const monthStats = new Map<string, Map<number, ReportStats>>();

    entries.forEach((entry) => {
      const date = new Date(entry.createdAt);
      const year = date.getFullYear().toString();
      const month = date.getMonth();
      const current = grouped.get(year) ?? {
        year,
        stats: { income: 0, expense: 0, total: 0 },
        entries: [],
        months: [],
      };
      const yearMonths = monthStats.get(year) ?? new Map<number, ReportStats>();
      const currentMonth = yearMonths.get(month) ?? {
        income: 0,
        expense: 0,
        total: 0,
      };

      if (entry.type === "Income") {
        current.stats.income += entry.amount;
        currentMonth.income += entry.amount;
      } else {
        current.stats.expense += entry.amount;
        currentMonth.expense += entry.amount;
      }

      current.stats.total = current.stats.income - current.stats.expense;
      currentMonth.total = currentMonth.income - currentMonth.expense;
      current.entries.push(entry);
      yearMonths.set(month, currentMonth);
      monthStats.set(year, yearMonths);
      grouped.set(year, current);
    });

    grouped.forEach((group) => {
      const yearMonths =
        monthStats.get(group.year) ?? new Map<number, ReportStats>();
      group.months = Array.from(yearMonths.entries())
        .sort(([a], [b]) => a - b)
        .map(([month, stats]) => ({ month: monthLabel(month), stats }));
    });

    return Array.from(grouped.values()).sort(
      (a, b) => Number(b.year) - Number(a.year),
    );
  }, [entries]);

  return (
    <FormCard title="Yearly Report">
      {loading ? (
        <div className="text-slate-300">Loading yearly report…</div>
      ) : yearly.length === 0 ? (
        <div className="text-slate-400">
          No entries available to generate a report.
        </div>
      ) : (
        <div className="space-y-4">
          {yearly.map(({ year, stats, entries: yearEntries, months }) => (
            <div
              key={year}
              className="rounded-3xl border border-slate-800 bg-slate-950/95 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{year}</h3>
                  <p className="text-sm text-slate-500">
                    {yearEntries.length} entries included in this PDF export.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span
                    className={`rounded-full px-3 py-1 text-sm ${stats.total >= 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}
                  >
                    Balance {stats.total >= 0 ? "+" : "-"}$
                    {Math.abs(stats.total).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      exportYearlyReportPdf({
                        year,
                        fileName: `incxexp-yearly-${year}`,
                        stats,
                        months,
                      })
                    }
                    className="rounded-full bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/20"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-900 p-4 text-sm text-slate-300">
                  <div className="text-slate-400">Income</div>
                  <div className="mt-2 text-2xl font-semibold text-emerald-300">
                    ${stats.income.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900 p-4 text-sm text-slate-300">
                  <div className="text-slate-400">Expense</div>
                  <div className="mt-2 text-2xl font-semibold text-rose-300">
                    ${stats.expense.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900 p-4 text-sm text-slate-300">
                  <div className="text-slate-400">Net</div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    ${stats.total.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </FormCard>
  );
}
