export default function QuizReviewList({ review }) {
  if (!review?.reviewAvailable) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-xl font-bold">
            Review is not available
          </h2>
          <p className="text-gray-400 mt-2">
            Your instructor has turned off answer review for this quiz.
          </p>
        </div>
      </div>
    );
  }

  const questions = review.questions || [];

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          Review Answers
        </h1>

        {questions.map((q, i) => {
          const selectedAnswer = q.selectedAnswer;
          const correctAnswer = q.correctAnswer;

          return (
            <div
              key={q._id || i}
              className="bg-[#0f172a] p-5 sm:p-6 rounded-xl border border-gray-700 space-y-3"
            >
              {/* QUESTION HEADER */}
              <div className="flex justify-between items-start gap-3">
                <h2 className="font-semibold">
                  Q{i + 1}. {q.text}
                </h2>

                <span
                  className={`shrink-0 text-xs font-semibold px-2 py-1 rounded ${
                    q.result === "CORRECT"
                      ? "bg-green-900/50 text-green-400"
                      : q.result === "WRONG"
                      ? "bg-red-900/50 text-red-400"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {q.result === "CORRECT"
                    ? "Correct"
                    : q.result === "WRONG"
                    ? "Wrong"
                    : "Unanswered"}{" "}
                  - {q.marksObtained}/{q.marks}
                </span>
              </div>

              {/* OPTIONS */}
              <div className="space-y-2">
                {(q.options || []).map((option, j) => {
                  /*
                   * MCQ:
                   *   option value = 0, 1, 2...
                   *
                   * TRUE_FALSE:
                   *   first option = true
                   *   second option = false
                   */
                  const optionValue =
                    q.type === "TRUE_FALSE"
                      ? j === 0
                      : j;

                  const isCorrectOption =
                    optionValue === correctAnswer;

                  const isSelected =
                    selectedAnswer !== null &&
                    selectedAnswer !== undefined &&
                    optionValue === selectedAnswer;

                  const isWrongSelected =
                    isSelected && !isCorrectOption;

                  return (
                    <div
                      key={j}
                      className={`p-3 rounded border ${
                        isCorrectOption
                          ? "border-green-500 bg-green-900/30"
                          : isWrongSelected
                          ? "border-red-500 bg-red-900/30"
                          : "border-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{option}</span>

                        <div className="flex gap-2 text-xs font-semibold">
                          {isCorrectOption && (
                            <span className="text-green-400">
                              ✓ Correct
                            </span>
                          )}

                          {isWrongSelected && (
                            <span className="text-red-400">
                              ✕ Your Answer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CORRECT ANSWER */}
              <div className="mt-4 text-green-400 font-semibold">
                Correct Answer:{" "}
                {q.type === "TRUE_FALSE"
                  ? correctAnswer
                    ? "True"
                    : "False"
                  : q.options?.[Number(correctAnswer)] || "N/A"}
              </div>

              {/* YOUR ANSWER */}
              <div className="text-gray-400 text-sm">
                Your Answer:{" "}
                {selectedAnswer === null ||
                selectedAnswer === undefined
                  ? "Not answered"
                  : q.type === "TRUE_FALSE"
                  ? selectedAnswer
                    ? "True"
                    : "False"
                  : q.options?.[Number(selectedAnswer)] || "N/A"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}