import {
  FiAward,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const MEDALS = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export default function LeaderboardHighlightsCard({
  entries = [],
  courses = [],
}) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Leaderboard
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your position across your courses.
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <FiAward className="text-lg text-amber-600" />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <FiAward className="text-amber-600" />
          </div>

          <p className="mt-3 font-semibold text-slate-700">
            No leaderboard data yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Complete quizzes to appear on course leaderboards.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {entries.map((entry) => {
            const rank = entry.rank ?? "-";

            const course = entry.course || {};

            return (
              <div
                key={course._id || `${rank}-${course.title}`}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-lg">
                    {MEDALS[rank] || `#${rank}`}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">
                      {course.title || "Course"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {entry.totalParticipants || 0} participants
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Your Rank
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-800">
                      #{rank}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Points
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {entry.points ?? 0}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/course/content", {
                      state: {
                        ...course,
                        isManager: false,
                        access: "student",
                      },
                    })
                  }
                  className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                >
                  Open Course Leaderboard
                  <FiChevronRight />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {entries.length === 0 && courses.length > 0 && (
        <p className="mt-4 text-center text-xs text-slate-400">
          Complete a quiz to get your leaderboard position.
        </p>
      )}
    </div>
  );
}