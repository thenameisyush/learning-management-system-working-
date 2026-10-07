/** Reusable empty / error state card. */
export default function EmptyState({ icon = "📭", title, message, action }) {
  return (
    <div className="bg-white/90 border border-dashed border-slate-300 rounded-2xl px-6 py-10 text-center">
      <div className="text-4xl" aria-hidden="true">{icon}</div>
      <p className="mt-3 text-lg font-semibold text-slate-800">{title}</p>
      {message && <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">{message}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
