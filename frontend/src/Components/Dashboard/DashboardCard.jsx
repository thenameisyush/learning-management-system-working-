import { FiArrowRight } from "react-icons/fi";

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = "bg-indigo-100",
  iconColor = "text-indigo-600",
  actionLabel,
  onAction,
  children,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          {value !== undefined && (
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {value}
            </p>
          )}

          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className={`text-xl ${iconColor}`} />
          </div>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
        >
          {actionLabel}
          <FiArrowRight />
        </button>
      )}
    </div>
  );
}
export function Empty({ children }) {
  return (
    <div className="py-6 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}