import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { CreateEntryRequest, EntryType } from "../types";
import { useApi } from "../auth/useApi";
import FormCard from "../components/FormCard";

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

function parseAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

export default function AddEntryPage() {
  const api = useApi();
  const [type, setType] = useState<EntryType>("Income");
  const [amountInput, setAmountInput] = useState("1");
  const [category, setCategory] = useState(defaultCategories.Income[0]);
  const [description, setDescription] = useState("");
  const [categoriesState, setCategoriesState] = useState<{
    Income: string[];
    Expense: string[];
  }>(loadCategories);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);

  const categoryList = categoriesState[type];

  const persistCategories = (newCategories: {
    Income: string[];
    Expense: string[];
  }) => {
    setCategoriesState(newCategories);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "incxexp-categories",
        JSON.stringify(newCategories),
      );
    }
  };

  const handleTypeChange = (newType: EntryType) => {
    setType(newType);
    setCategory(categoriesState[newType][0]);
    setIsCategoryOpen(false);
  };

  const adjustAmount = (delta: number) => {
    const current = parseAmount(amountInput) ?? 0;
    const next = Math.max(0, current + delta);
    setAmountInput(next === 0 ? "" : String(Number(next.toFixed(2))));
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const addCustomCategory = () => {
    const customCategory = window.prompt("Enter a custom category name:");
    if (!customCategory) return;

    const trimmed = customCategory.trim();
    if (!trimmed) return;

    if (trimmed.length > CATEGORY_MAX_LENGTH) {
      setError(`Category must be ${CATEGORY_MAX_LENGTH} characters or fewer.`);
      return;
    }

    const currentList = categoriesState[type];
    if (currentList.includes(trimmed)) {
      setError("This category already exists.");
      return;
    }

    setError(null);
    const updated = {
      ...categoriesState,
      [type]: [...currentList, trimmed],
    };

    persistCategories(updated);
    setCategory(trimmed);
    setIsCategoryOpen(false);
  };

  const removeCategory = (categoryToRemove: string) => {
    const currentList = categoriesState[type];
    if (currentList.length <= 1) {
      setError("At least one category is required.");
      return;
    }

    setError(null);
    const updatedList = currentList.filter((item) => item !== categoryToRemove);
    const updated = {
      ...categoriesState,
      [type]: updatedList,
    };

    persistCategories(updated);
    if (category === categoryToRemove) {
      setCategory(updatedList[0]);
    }
    setIsCategoryOpen(false);
  };

  const amendCategory = (target: string) => {
    const newName = window.prompt("Amend category name:", target);
    if (!newName) return;

    const trimmed = newName.trim();
    if (!trimmed) return;

    if (trimmed.length > CATEGORY_MAX_LENGTH) {
      setError(`Category must be ${CATEGORY_MAX_LENGTH} characters or fewer.`);
      return;
    }

    const currentList = categoriesState[type];
    if (trimmed !== target && currentList.includes(trimmed)) {
      setError("A category with this name already exists.");
      return;
    }

    setError(null);
    const updatedList = currentList.map((item) =>
      item === target ? trimmed : item,
    );
    const updated = {
      ...categoriesState,
      [type]: updatedList,
    };

    persistCategories(updated);
    if (category === target) {
      setCategory(trimmed);
    }
    setIsCategoryOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const amount = parseAmount(amountInput);
    if (amount === null || amount <= 0) {
      setError("Amount must be greater than 0.");
      setLoading(false);
      return;
    }

    const trimmedDescription = description.trim();
    if (category.trim().length > CATEGORY_MAX_LENGTH) {
      setError(`Category must be ${CATEGORY_MAX_LENGTH} characters or fewer.`);
      setLoading(false);
      return;
    }

    if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
      setError(
        `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`,
      );
      setLoading(false);
      return;
    }

    const payload: CreateEntryRequest = {
      type,
      amount,
      category,
      description: trimmedDescription || undefined,
    };

    try {
      await api.post("/entries", payload);
      setSuccess("Entry created successfully.");
      setType("Income");
      setAmountInput("1");
      setCategory(defaultCategories.Income[0]);
      setDescription("");
    } catch (err) {
      let message = "Could not create entry. Please try again.";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as
          | {
              error?: string;
              title?: string;
              errors?: Record<string, string[]>;
            }
          | undefined;

        if (data?.errors) {
          const values = Object.values(data.errors).flat();
          message = values.length > 0 ? values.join(" ") : message;
        } else {
          message = data?.error || data?.title || err.message || message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormCard title="Add Income or Expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Type
          </label>
          <select
            name="type"
            value={type}
            onChange={(event) =>
              handleTypeChange(event.target.value as EntryType)
            }
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
          >
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Amount
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustAmount(-10)}
              className="rounded-2xl bg-slate-800 px-4 py-3 text-slate-100 hover:bg-slate-700"
            >
              -10
            </button>
            <input
              name="amount"
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
              required
            />
            <button
              type="button"
              onClick={() => adjustAmount(10)}
              className="rounded-2xl bg-slate-800 px-4 py-3 text-slate-100 hover:bg-slate-700"
            >
              +10
            </button>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Category
          </label>
          <div className="flex gap-2">
            <div ref={categoryMenuRef} className="relative flex-1">
              <button
                type="button"
                onClick={() => setIsCategoryOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition hover:border-slate-600 focus:border-sky-500"
                aria-haspopup="listbox"
                aria-expanded={isCategoryOpen}
              >
                <span>{category}</span>
                <span className="text-slate-400">▾</span>
              </button>

              {isCategoryOpen && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
                  <div className="max-h-64 overflow-y-auto p-2">
                    {categoryList.map((item) => (
                      <div
                        key={item}
                        className={`mb-2 flex items-center justify-between gap-2 rounded-2xl px-3 py-2 last:mb-0 ${category === item ? "bg-slate-800" : "bg-slate-900/70"}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setCategory(item);
                            setIsCategoryOpen(false);
                          }}
                          className={`flex-1 min-w-0 break-words [overflow-wrap:anywhere] text-left text-sm ${category === item ? "font-semibold text-sky-300" : "text-slate-200"}`}
                        >
                          {item}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => amendCategory(item)}
                            className="rounded-xl bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/20"
                          >
                            Amend
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCategory(item)}
                            disabled={categoryList.length <= 1}
                            className="rounded-xl bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={addCustomCategory}
              className="rounded-2xl bg-slate-800 px-4 py-3 text-slate-100 hover:bg-slate-700"
              aria-label="Add custom category"
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Description
          </label>
          <textarea
            name="description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value.slice(0, DESCRIPTION_MAX_LENGTH),
              )
            }
            maxLength={DESCRIPTION_MAX_LENGTH}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
            rows={4}
          />
          <div className="mt-2 text-right text-xs text-slate-500">
            {description.length}/{DESCRIPTION_MAX_LENGTH}
          </div>
        </div>
        {success && (
          <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white hover:bg-sky-400 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save Entry"}
        </button>
      </form>
    </FormCard>
  );
}
