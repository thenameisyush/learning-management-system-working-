import {
  FiCheckSquare,
  FiClock,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function AvailableQuizzesCard({
  quizzes = [],
  total = 0,
}) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">
              Available Quizzes
            </h2>

            {total > 0 && (
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                {total}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Quizzes available for your enrolled courses.
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
          <FiCheckSquare className="text-lg text-indigo-600" />
        </div>
      </div>

      {quizzes.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
            <FiCheckSquare className="text-slate-500" />
          </div>

          <p className="mt-3 font-semibold text-slate-700">
            No quizzes available
          </p>

          <p className="mt-1 text-sm text-slate-500">
            New quizzes will appear here when available.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {quizzes.slice(0, 5).map((quiz) => {
            const id = quiz._id || quiz.id;

            return (
              <div
                key={id}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-800">
                    {quiz.title || "Untitled Quiz"}
                  </h3>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {quiz.durationMinutes > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <FiClock />
                        {quiz.durationMinutes} min
                      </span>
                    )}

                    {quiz.totalMarks !== undefined && (
                      <span>
                        {quiz.totalMarks} marks
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/quiz/${id}`, {
                      state: { quiz },
                    })
                  }
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                >
                  Start
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