const Stat = ({ value, label }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
    <p className="text-2xl font-bold text-slate-900">{value}</p>
    <p className="text-xs text-slate-500 mt-1">{label}</p>
  </div>
);

/** Responsive stat tile grid for the admin dashboard's headline numbers. */
export default function PlatformStatsGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map(({ value, label }) => (
        <Stat key={label} value={value} label={label} />
      ))}
    </div>
  );
}
