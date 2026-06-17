export default function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-xl">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
