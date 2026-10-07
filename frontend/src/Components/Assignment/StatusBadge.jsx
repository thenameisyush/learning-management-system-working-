const STYLES = {
  PENDING: "bg-slate-100 text-slate-600 border-slate-300",
  SUBMITTED: "bg-blue-50 text-blue-700 border-blue-300",
  LATE: "bg-amber-50 text-amber-700 border-amber-300",
  GRADED: "bg-green-50 text-green-700 border-green-300",
};

const LABEL = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  LATE: "Late",
  GRADED: "Graded",
};

/** Small pill for an assignment's PENDING / SUBMITTED / LATE / GRADED status - always computed server-side. */
export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STYLES[status] || STYLES.PENDING}`}>
      {LABEL[status] || status}
    </span>
  );
}
