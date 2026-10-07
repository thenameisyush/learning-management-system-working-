import {
  FiClipboard,
  FiClock,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function PendingAssignmentsCard({
  assignments = [],
  total = 0,
}) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">
              Pending Assignments
            </h2>

            {total > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                {total}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Assignments that still need your attention.
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <FiClipboard className="text-lg text-amber-600" />
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <FiClipboard className="text-emerald-600" />
          </div>

          <p className="mt-3 font-semibold text-emerald-700">
            All caught up!
          </p>

          <p className="mt-1 text-sm text-slate-500">
            You don't have any pending assignments.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {assignments.slice(0, 5).map((assignment) => {
            const id = assignment._id || assignment.id;

            return (
              <div
                key={id}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-800">
                    {assignment.title || "Untitled Assignment"}
                  </h3>

                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <FiClock />

                    <span>
                      {assignment.dueDate
                        ? new Date(
                            assignment.dueDate
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "No due date"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/assignments/${id}`)
                  }
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                >
                  Open
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