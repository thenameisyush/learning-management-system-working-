import ScoreRing from "./ScoreRing";

export default function QuizResultSummary({
  result,
  formatClock,
  onReview,
  onRetry,
  onBack,
}) {
  const a = result.attempt;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-purple-700 rounded-2xl p-6 sm:p-8 space-y-6">

        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-purple-400 font-semibold">
            Quiz Result
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            {result.quiz?.title || "Quiz Result"}
          </h1>
        </div>

        <div className="flex justify-center">
          <ScoreRing
            percentage={a.percentage}
            color={
              a.passed
                ? "stroke-green-500"
                : "stroke-red-500"
            }
          />
        </div>

        <div className="text-center">
          <p className="text-4xl font-bold">
            {a.score} / {a.maxScore}
          </p>

          <p
            className={`text-xl font-bold mt-2 ${
              a.passed
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {a.passed
              ? "PASSED ✅"
              : "FAILED ❌"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-black/40 rounded-lg p-3 text-center">
            <p className="text-green-400 font-semibold text-lg">
              {a.correctAnswers}
            </p>
            <p className="text-gray-400">
              Correct
            </p>
          </div>

          <div className="bg-black/40 rounded-lg p-3 text-center">
            <p className="text-red-400 font-semibold text-lg">
              {a.wrongAnswers}
            </p>
            <p className="text-gray-400">
              Wrong
            </p>
          </div>

          <div className="bg-black/40 rounded-lg p-3 text-center">
            <p className="text-gray-300 font-semibold text-lg">
              {a.unanswered}
            </p>
            <p className="text-gray-400">
              Unanswered
            </p>
          </div>
        </div>

        {a.timeTaken !== null &&
          a.timeTaken !== undefined && (
            <p className="text-center text-gray-400 text-sm">
              Time taken:{" "}
              {formatClock(a.timeTaken)}
            </p>
          )}

        {result.autoSubmitted && (
          <p className="text-center text-yellow-400 text-sm">
            Submitted automatically when time ran out.
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {result.reviewAvailable && (
            <button
              onClick={onReview}
              className="min-h-[44px] px-5 rounded-lg bg-yellow-600 font-semibold"
            >
              Review Answers
            </button>
          )}

          {result.canRetry && (
            <button
              onClick={onRetry}
              className="min-h-[44px] px-5 rounded-lg bg-green-600 font-semibold"
            >
              Retry Quiz
            </button>
          )}

          <button
            onClick={onBack}
            className="min-h-[44px] px-5 rounded-lg bg-purple-600 font-semibold"
          >
            Back to Course
          </button>
        </div>
      </div>
    </div>
  );
}