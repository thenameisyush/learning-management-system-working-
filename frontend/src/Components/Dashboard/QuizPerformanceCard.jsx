import { useNavigate } from "react-router-dom";

import DashboardCard, { Empty } from "./DashboardCard";

/** Per-quiz attempt counts, average score and pass rate, across owned courses. */
export default function QuizPerformanceCard({ quizzes }) {
  const navigate = useNavigate();

  return (
    <DashboardCard title="Quiz performance">
      {quizzes.length === 0 ? (
        <Empty>No quiz attempts yet.</Empty>
      ) : (
        <ul className="divide-y divide-slate-100">
          {quizzes.map((q) => (
            <li key={q._id}>
              <button onClick={() => navigate(`/quizzes/${q._id}/results`)} className="w-full text-left py-3 min-h-[44px] flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg px-1">
                <span className="min-w-0">
                  <span className="block font-medium text-slate-900 truncate">{q.title}</span>
                  <span className="block text-xs text-slate-500 truncate">{q.course.title} · {q.attempts} attempt{q.attempts === 1 ? "" : "s"}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold text-slate-900">{q.averagePercentage}%</span>
                  <span className="text-xs text-slate-500">{q.passRate}% passed</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
