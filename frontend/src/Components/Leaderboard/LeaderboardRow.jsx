const MEDAL = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export default function LeaderboardRow({
  entry,
  highlight = false,
}) {
  const medal = MEDAL[entry.rank];

  return (
    <div
      className={`grid grid-cols-[56px_minmax(0,1fr)_90px_90px_90px] items-center gap-3 rounded-xl border px-4 py-3 ${
        highlight
          ? "border-indigo-300 bg-indigo-50"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Rank */}
      <div className="text-center font-bold text-slate-700">
        {medal || entry.rank}
      </div>

      {/* Student */}
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-800">
          {entry.student?.fullName || "Unknown student"}

          {highlight && (
            <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              You
            </span>
          )}
        </p>
      </div>

      {/* Points */}
      <div className="text-center">
        <p className="text-sm font-bold text-slate-800">
          {entry.points}
        </p>
        <p className="text-xs text-slate-500">
          Points
        </p>
      </div>

      {/* Accuracy */}
      <div className="text-center">
        <p className="text-sm font-bold text-slate-800">
          {entry.accuracy}%
        </p>
        <p className="text-xs text-slate-500">
          Accuracy
        </p>
      </div>

      {/* Quizzes */}
      <div className="text-center">
        <p className="text-sm font-bold text-slate-800">
          {entry.quizCount}
        </p>
        <p className="text-xs text-slate-500">
          {entry.quizCount === 1 ? "Quiz" : "Quizzes"}
        </p>
      </div>
    </div>
  );
}