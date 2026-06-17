import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthResponse, RegisterRequest } from "../types";
import { useAuth } from "../auth/AuthContext";
import axios from "axios";
import FormCard from "../components/FormCard";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState<RegisterRequest>({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post<AuthResponse>(
        "http://localhost:5157/api/auth/register",
        form,
      );
      login(response.data);
      navigate("/");
    } catch (err) {
      let message = "Registration failed. Please try again.";

      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as any;
        if (data.errors) {
          const values = Object.values(data.errors).flat();
          message = Array.isArray(values) ? values.join(" ") : String(values);
        } else if (data.error) {
          message = data.error;
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16">
      <FormCard title="Create your INCxEXP account">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Username
            </label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
              required
              minLength={6}
            />
          </div>
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
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>
        <p className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-sky-400 hover:text-sky-300">
            Login
          </Link>
        </p>
      </FormCard>
    </div>
  );
}
