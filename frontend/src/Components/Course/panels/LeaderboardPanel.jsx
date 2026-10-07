import { useEffect, useState } from "react";

import LeaderboardRow from "../../Leaderboard/LeaderboardRow";
import EmptyState from "../../UI/EmptyState";

import {
  getApiErrorMessage,
  leaderboardApi,
} from "../../../Services/leaderboardApi";

export default function LeaderboardPanel({ courseId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [board, setBoard] = useState(null);

  useEffect(() => {
    if (!courseId) return;

    setLoading(true);
    setError(null);

    leaderboardApi
      .get(courseId)
      .then((data) => {
        setBoard(data);
      })
      .catch((err) => {
        setError({
          status: err?.response?.status,
          message: getApiErrorMessage(
            err,
            "Could not load the leaderboard"
          ),
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [courseId]);

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <p className="text-sm font-medium text-slate-500">
          Loading leaderboard...
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Error
  // ---------------------------------------------------------
  if (error) {
    return (
      <EmptyState
        icon={error.status === 403 ? "🔒" : "⚠️"}
        title={
          error.status === 403
            ? "Access denied"
            : "Unable to load leaderboard"
        }
        message={error.message}
      />
    );
  }

  // ---------------------------------------------------------
  // No results
  // ---------------------------------------------------------
  if (!board || board.top10?.length === 0) {
    return (
      <EmptyState
        icon="🏆"
        title="No quiz results yet"
        message="The leaderboard will appear once students complete quizzes."
      />
    );
  }

  const myRankInTop10 =
    board.me &&
    board.top10.some(
      (entry) => entry.rank === board.me.rank
    );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Course Leaderboard
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Top performers based on quiz performance.
            </p>
          </div>

          <div className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
            {board.totalParticipants || 0}{" "}
            {board.totalParticipants === 1
              ? "Participant"
              : "Participants"}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="overflow-x-auto">
        <div className="min-w-[480px] space-y-2">
          {/* Column headings */}
          <div className="grid grid-cols-[44px_minmax(160px,1fr)_80px_80px_80px] items-center gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <div className="text-center">
              Rank
            </div>

            <div>
              Student
            </div>

            <div className="text-center">
              Points
            </div>

            <div className="text-center">
              Accuracy
            </div>

            <div className="text-center">
              Quizzes
            </div>
          </div>

          {/* Top 10 */}
          {board.top10.map((entry) => (
            <LeaderboardRow
              key={`${entry.student?._id}-${entry.rank}`}
              entry={entry}
              highlight={
                board.me?.rank === entry.rank
              }
            />
          ))}
        </div>
      </div>

      {/* Current student's rank when outside Top 10 */}
      {board.me && !myRankInTop10 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">
              Your Position
            </span>

            <span className="text-xs text-slate-500">
              Outside Top 10
            </span>
          </div>

          <LeaderboardRow
            entry={board.me}
            highlight
          />
        </div>
      )}

      {/* Student's current position when already in Top 10 */}
      {board.me && myRankInTop10 && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <p className="text-sm font-semibold text-indigo-800">
            Your current rank: #{board.me.rank}
          </p>

          <p className="mt-1 text-xs text-indigo-600">
            Keep completing quizzes to improve your position.
          </p>
        </div>
      )}
    </div>
  );
}