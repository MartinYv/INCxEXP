import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { EntryDto, UpdateEntryRequest } from "../types";
import { useApi } from "../auth/useApi";

const defaultCategories = {
  Income: ["Salary", "Freelance", "Investment", "Gift"],
  Expense: ["Food", "Transportation", "Rent", "Utilities", "Entertainment"],
};

const CATEGORY_MAX_LENGTH = 40;
const DESCRIPTION_MAX_LENGTH = 200;

function loadCategories() {
  if (typeof window === "undefined") return defaultCategories;
  const stored = window.localStorage.getItem("incxexp-categories");
  if (!stored) return defaultCategories;

  try {
    const parsed = JSON.parse(stored);
    return {
      Income: Array.isArray(parsed?.Income)
        ? parsed.Income
        : defaultCategories.Income,
      Expense: Array.isArray(parsed?.Expense)
        ? parsed.Expense
        : defaultCategories.Expense,
    };
  } catch {
    return defaultCategories;
  }
}

export default function DashboardPage() {
  const api = useApi();
  const [entries, setEntries] = useState<EntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<EntryDto["type"]>("Income");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const categories = useMemo<{ Income: string[]; Expense: string[] }>(
    () => loadCategories(),
    [],
  );
  const availableEditCategories = categories[editType];

  const loadEntries = async () => {
    try {
      const response = await api.get<EntryDto[]>("/entries");
      setEntries(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [api]);

  const totalIncome = entries
    .filter((entry) => entry.type === "Income")
    .reduce((acc, entry) => acc + entry.amount, 0);
  const totalExpense = entries
    .filter((entry) => entry.type === "Expense")
    .reduce((acc, entry) => acc + entry.amount, 0);
  const balance = totalIncome - totalExpense;

  const startEdit = (entry: EntryDto) => {
    setEditingId(entry.id);
    setEditType(entry.type);
    setEditAmount(String(entry.amount));
    setEditCategory(entry.category);
    setEditDescription(entry.description ?? "");
    setError(null);
    setSuccess(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const updateEntry = async (id: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const amount = Number(editAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Amount must be greater than 0.");
      setSaving(false);
      return;
    }

    const trimmedCategory = editCategory.trim();
    if (!trimmedCategory) {
      setError("Category is required.");
      setSaving(false);
      return;
    }

    if (trimmedCategory.length > CATEGORY_MAX_LENGTH) {
      setError(`Category must be ${CATEGORY_MAX_LENGTH} characters or fewer.`);
      setSaving(false);
      return;
    }

    const trimmedDescription = editDescription.trim();
    if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
      setError(
        `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`,
      );
      setSaving(false);
      return;
    }

    const payload: UpdateEntryRequest = {
      type: editType,
      amount,
      category: trimmedCategory,
      description: trimmedDescription || undefined,
    };

    try {
      let response;
      try {
        response = await api.put<EntryDto>(`/entries/${id}`, payload);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 405) {
          response = await api.post<EntryDto>(`/entries/${id}/update`, payload);
        } else {
          throw err;
        }
      }

      setEntries((prev) =>
        prev.map((entry) => (entry.id === id ? response.data : entry)),
      );
      setEditingId(null);
      setSuccess("Entry updated successfully.");
    } catch (err) {
      let message = "Could not update entry. Please try again.";
      if (axios.isAxiosError(err)) {
        message =
          err.response?.data?.error ||
          err.response?.data?.title ||
          err.message ||
          message;
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      try {
        await api.delete(`/entries/${id}`);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 405) {
          await api.post(`/entries/${id}/delete`);
        } else {
          throw err;
        }
      }

      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
      setSuccess("Entry removed successfully.");
    } catch (err) {
      let message = "Could not delete entry. Please try again.";
      if (axios.isAxiosError(err)) {
        message =
          err.response?.data?.error ||
          err.response?.data?.title ||
          err.message ||
          message;
      }
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-xl">
          <h2 className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Balance
          </h2>
          <p className="mt-4 text-4xl font-semibold text-white">
            ${balance.toFixed(2)}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-xl">
          <h2 className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Income
          </h2>
          <p className="mt-4 text-4xl font-semibold text-emerald-400">
            ${totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-xl">
          <h2 className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Expense
          </h2>
          <p className="mt-4 text-4xl font-semibold text-rose-400">
            ${totalExpense.toFixed(2)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Recent Entries</h2>
          <span className="text-sm text-slate-400">{entries.length} total</span>
        </div>

        {loading ? (
          <div className="mt-8 text-slate-300">Loading entries...</div>
        ) : entries.length === 0 ? (
          <div className="mt-8 text-slate-400">
            No entries yet. Add income or expense to get started.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {entries.map((entry) =>
              editingId === entry.id ? (
                <div
                  key={entry.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Type
                      </label>
                      <select
                        value={editType}
                        onChange={(event) => {
                          const nextType = event.target
                            .value as EntryDto["type"];
                          setEditType(nextType);
                          setEditCategory(categories[nextType][0] ?? "");
                        }}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                      >
                        <option value="Income">Income</option>
                        <option value="Expense">Expense</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Category
                      </label>
                      <select
                        value={editCategory}
                        onChange={(event) =>
                          setEditCategory(event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                      >
                        {availableEditCategories.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editAmount}
                        onChange={(event) => setEditAmount(event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(event) =>
                          setEditDescription(
                            event.target.value.slice(0, DESCRIPTION_MAX_LENGTH),
                          )
                        }
                        maxLength={DESCRIPTION_MAX_LENGTH}
                        placeholder="Description"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                      />
                      <div className="mt-2 text-right text-xs text-slate-500">
                        {editDescription.length}/{DESCRIPTION_MAX_LENGTH}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Created {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <div className="flex w-full flex-wrap gap-2 xl:justify-end">
                        <button
                          type="button"
                          onClick={() => updateEntry(entry.id)}
                          disabled={saving}
                          className="rounded-xl bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/20 disabled:opacity-60"
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={entry.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/70"
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] xl:items-start">
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Type
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          entry.type === "Income"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {entry.type}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Category
                      </div>
                      <div className="min-w-0 [overflow-wrap:anywhere] text-slate-100">
                        {entry.category}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Amount
                      </div>
                      <div
                        className={`font-semibold ${
                          entry.type === "Income"
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }`}
                      >
                        ${entry.amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Description / Date
                      </div>
                      <div className="min-w-0 [overflow-wrap:anywhere] text-slate-200">
                        {entry.description?.trim() || "No description"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-start xl:justify-end">
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(entry)}
                          className="rounded-xl bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/20"
                        >
                          Amend
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEntry(entry.id)}
                          className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}
      </section>
    </div>
  );
}
