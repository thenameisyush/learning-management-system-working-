import { formatDate } from "../../utils/formatters";
import StatusBadge from "./StatusBadge";

/**
 * Course-page style assignment card: title, description, due date, status,
 * marks, and View/Submit actions. Used both on a single course's assignment
 * list and on the cross-course "My Assignments" list.
 */
export default function AssignmentCard({ assignment: a, onView }) {
  const overdue = a.dueDate && new Date(a.dueDate) < new Date() && (a.myStatus === "PENDING" || a.canManage);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{a.title}</h3>
          {a.description && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{a.description}</p>}
        </div>
        {!a.canManage && <StatusBadge status={a.myStatus || "PENDING"} />}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className={overdue ? "text-red-600 font-medium" : ""}>
          Due: {a.dueDate ? formatDate(a.dueDate) : "No due date"}
        </span>
        <span>Marks: {a.totalMarks}</span>
        {!a.canManage && a.myStatus === "GRADED" && a.myMarks !== null && (
          <span className="text-green-700 font-semibold">Your score: {a.myMarks}/{a.totalMarks}</span>
        )}
      </div>

      <button
        onClick={onView}
        className="w-full min-h-[44px] rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
      >
        {a.canManage
          ? "View Assignment"
          : a.myStatus === "PENDING"
          ? "Submit Assignment"
          : a.myStatus === "GRADED"
          ? "View Result"
          : "View Assignment"}
      </button>
    </div>
  );
}
