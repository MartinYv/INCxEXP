import { useEffect, useMemo, useState } from "react";
import { EntryDto } from "../types";
import { useApi } from "../auth/useApi";
import FormCard from "../components/FormCard";
import { exportReportPdf, ReportStats } from "../utils/reportPdf";

interface MonthlyGroup {
  key: string;
  label: string;
  stats: ReportStats;
  entries: EntryDto[];
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

export default function MonthlyReportPage() {
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

  const monthly = useMemo(() => {
    const grouped = new Map<string, MonthlyGroup>();

    entries.forEach((entry) => {
      const date = new Date(entry.createdAt);
      const key = monthKey(date);
      const current = grouped.get(key) ?? {
        key,
        label: monthLabel(date),
        stats: { income: 0, expense: 0, total: 0 },
        entries: [],
      };

      if (entry.type === "Income") {
        current.stats.income += entry.amount;
      } else {
        current.stats.expense += entry.amount;
      }

      current.stats.total = current.stats.income - current.stats.expense;
      current.entries.push(entry);
      grouped.set(key, current);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      b.key.localeCompare(a.key),
    );
  }, [entries]);

  return (
    <FormCard title="Monthly Report">
      {loading ? (
        <div className="text-slate-300">Loading monthly report…</div>
      ) : monthly.length === 0 ? (
        <div className="text-slate-400">
          No entries available to generate a report.
        </div>
      ) : (
        <div className="space-y-4">
          {monthly.map(({ key, label, stats, entries: monthEntries }) => (
            <div
              key={key}
              className="rounded-3xl border border-slate-800 bg-slate-950/95 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{label}</h3>
                  <p className="text-sm text-slate-500">
                    {monthEntries.length} entries included in this PDF export.
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
                      exportReportPdf({
                        title: "INCxEXP Monthly Report",
                        periodLabel: label,
                        fileName: `incxexp-monthly-${key}`,
                        stats,
                        entries: monthEntries,
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
