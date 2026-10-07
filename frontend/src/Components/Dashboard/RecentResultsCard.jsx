import { FiAward, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function RecentResultsCard({ results = [] }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Recent Quiz Results
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your latest quiz performance.
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
          <FiAward className="text-lg text-purple-600" />
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
            <FiAward className="text-slate-500" />
          </div>

          <p className="mt-3 font-semibold text-slate-700">
            No quiz results yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Complete a quiz and your result will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {results.map((result) => {
            const score = Number(result.score ?? 0);
            const maxScore = Number(result.maxScore ?? 0);
            const percentage = Number(result.percentage ?? 0);

            return (
              <div
                key={result.attemptId}
                className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-800">
                      {result.quiz?.title || "Quiz"}
                    </h3>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {result.course?.title || "Course"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {result.submittedAt
                        ? new Date(
                            result.submittedAt
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Recently completed"}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-slate-800">
                      {score}
                      <span className="text-sm font-medium text-slate-400">
                        /{maxScore}
                      </span>
                    </p>

                    <p
                      className={`text-xs font-semibold ${
                        percentage >= 80
                          ? "text-emerald-600"
                          : percentage >= 50
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {percentage.toFixed(0)}%
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/quiz/attempt/${result.attemptId}/review`
                    )
                  }
                  className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                >
                  Review
                  <FiChevronRight />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}