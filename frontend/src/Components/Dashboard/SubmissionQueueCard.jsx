import { useNavigate } from "react-router-dom";

import { formatDateTime } from "../../utils/formatters";
import DashboardCard, { Empty } from "./DashboardCard";

const SHOWN = 6;

/** Submissions awaiting grading, across every owned course. */
export default function SubmissionQueueCard({ queue, total }) {
  const navigate = useNavigate();
  const shown = queue.slice(0, SHOWN);

  return (
    <DashboardCard title="Submissions to grade">
      {shown.length === 0 ? (
        <Empty>Nothing waiting to be graded. 🎉</Empty>
      ) : (
        <ul className="divide-y divide-slate-100">
          {shown.map((s) => (
            <li key={s._id}>
              <button
                onClick={() => navigate(`/assignments/${s.assignment._id}`)}
                className="w-full text-left py-3 min-h-[44px] flex items-start justify-between gap-3 hover:bg-slate-50 rounded-lg px-1"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-slate-900 truncate">{s.student.fullName}</span>
                  <span className="block text-xs text-slate-500 truncate">{s.assignment.title} · {s.course.title}</span>
                </span>
                <span className="shrink-0 text-right text-xs">
                  <span className="block text-slate-500">{formatDateTime(s.submittedAt)}</span>
                  {s.late && <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Late</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {total > shown.length && <p className="text-xs text-slate-500 mt-2">+ {total - shown.length} more to grade</p>}
    </DashboardCard>
  );
}
