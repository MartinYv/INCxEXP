import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-2 rounded ${isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"}`;

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/"
            className="group flex items-center gap-4 rounded-2xl outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xl font-black shadow-lg shadow-sky-500/20 ring-1 ring-slate-700 transition group-hover:scale-105">
              <span className="text-emerald-400">I</span>
              <span className="text-sky-300">x</span>
              <span className="text-rose-400">E</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1 text-3xl font-black tracking-tight text-white">
                <span>INC</span>
                <span className="bg-gradient-to-r from-sky-300 to-emerald-300 bg-clip-text text-transparent">
                  x
                </span>
                <span>EXP</span>
              </div>
              <p className="text-slate-400 transition group-hover:text-slate-300">
                Personal finance dashboard for income and expense reporting.
              </p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-full bg-slate-700 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-600"
          >
            Logout
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg">
            <nav className="space-y-2">
              <NavLink end to="/" className={linkClasses}>
                Dashboard
              </NavLink>
              <NavLink to="/add-entry" className={linkClasses}>
                Add Income / Expense
              </NavLink>
              <NavLink to="/monthly-report" className={linkClasses}>
                Monthly Report
              </NavLink>
              <NavLink to="/yearly-report" className={linkClasses}>
                Yearly Report
              </NavLink>
            </nav>
          </aside>
          <main className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
