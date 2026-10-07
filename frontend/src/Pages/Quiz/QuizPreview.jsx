import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { getApiErrorCode, getApiErrorMessage, quizApi } from "../../Services/quizApi";
import { useNavigate, useParams } from "react-router-dom";
import QuizAttemptRunner from "../../Components/Quiz/QuizAttemptRunner";

// import { quizApi } from "../../Services/quizApi";
import QuizResultSummary from "../../Components/Quiz/QuizResultSummary";
import QuizReviewList from "../../Components/Quiz/QuizReviewList";
import { formatClock } from "../../utils/formatters";

export default function QuizPreview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("loading");
  const [markedForReview, setMarkedForReview] = useState(new Set());

  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [review, setReview] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD QUIZ
  // =========================================================

  const loadQuiz = async () => {
    try {
      setError("");
      setPhase("loading");

      const data = await quizApi.get(id);

      if (!data?.success || !data?.quiz) {
        throw new Error(
          data?.message || "Unable to load quiz"
        );
      }

      const q = data.quiz;

      setQuiz(q);

      // Teacher / Admin
      if (q.canManage) {
        setPhase("manager");
        return;
      }

      // Student
      setPhase("details");
    } catch (err) {
      console.error(
        "❌ QUIZ LOAD ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load quiz"
      );

      setPhase("error");
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [id]);

  // =========================================================
  // FORMAT TIME
  // =========================================================

  

  // =========================================================
  // ANSWER LIST
  // =========================================================

  const toAnswerList = (map) => {
    return Object.entries(map).map(
      ([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      })
    );
  };

  // =========================================================
  // START QUIZ
  // =========================================================

  const startQuiz = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await quizApi.start(id);

      console.log(
        "✅ START QUIZ RESPONSE:",
        data
      );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to start quiz"
        );
      }

      setAttempt(
        data?.attempt || null
      );

      const activeQuiz =
        data?.quiz || quiz;

      setQuiz(activeQuiz);

      // Restore saved answers
      const existingAnswers =
        data?.attempt?.answers ||
        data?.answers ||
        data?.attempt?.savedAnswers ||
        [];

      let answerMap = {};

      if (
        Array.isArray(
          existingAnswers
        )
      ) {
        existingAnswers.forEach(
          (item) => {
            if (
              item?.questionId
            ) {
              answerMap[
                String(
                  item.questionId
                )
              ] =
                item.selectedAnswer;
            }
          }
        );
      } else if (
        existingAnswers &&
        typeof existingAnswers ===
          "object"
      ) {
        answerMap =
          existingAnswers;
      }

      setAnswers(answerMap);
      setMarkedForReview(new Set());

      const durationSeconds =
        Number(
          activeQuiz?.durationMinutes ||
            0
        ) * 60;

      const elapsed =
        Number(
          data?.attempt?.timeTaken ||
            0
        );

      const remaining =
        data?.attempt?.timeLeft !=
        null
          ? Number(
              data.attempt.timeLeft
            )
          : Math.max(
              0,
              durationSeconds -
                elapsed
            );

      setTimeLeft(remaining);

      setCurrentQuestion(0);
      setPhase("attempt");
    } catch (err) {
      console.error(
        "❌ START QUIZ ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to start quiz"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESUME ACTIVE ATTEMPT
  // =========================================================

  const resumeQuiz = async () => {
    await startQuiz();
  };

  // =========================================================
  // SAVE PROGRESS
  // =========================================================

  const saveProgress = async (
    nextAnswers = answers
  ) => {
    if (!attempt?._id) return;

    try {
      const answerList =
        toAnswerList(
          nextAnswers
        );

      const data =
        await quizApi.saveProgress(
          id,
          attempt._id,
          answerList
        );

      console.log(
        "✅ QUIZ PROGRESS SAVED:",
        data
      );
    } catch (err) {
      console.error(
        "❌ SAVE PROGRESS ERROR:",
        err?.response?.data ||
          err
      );
    }
  };

  // =========================================================
  // SELECT ANSWER
  // =========================================================

  const handleSelect = (
    questionId,
    selectedAnswer
  ) => {
    if (phase !== "attempt")
      return;

    setAnswers((prev) => {
      const next = {
        ...prev,
        [questionId]:
          selectedAnswer,
      };

      // Autosave
      saveProgress(next);

      return next;
    });
  };


  const toggleMarkForReview = (questionId) => {
  setMarkedForReview((prev) => {
    const next = new Set(prev);

    if (next.has(questionId)) {
      next.delete(questionId);
    } else {
      next.add(questionId);
    }

    return next;
  });
};


  // =========================================================
  // SUBMIT QUIZ
  // =========================================================

  const handleSubmit = async (
    autoSubmitted = false
  ) => {
    if (!attempt?._id) {
      setError(
        "No active quiz attempt found."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const answerList =
        toAnswerList(answers);

      console.log(
        "🔥 SUBMITTING QUIZ:",
        {
          quizId: id,
          attemptId:
            attempt._id,
          answers,
          answerList,
        }
      );

      const data =
        await quizApi.submit(
          id,
          attempt._id,
          answerList
        );

      console.log(
        "🔥 SUBMIT RESPONSE:",
        data
      );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Quiz submission failed"
        );
      }

      setResult(data);

      if (data?.attempt) {
        setAttempt(
          data.attempt
        );
      }

      setPhase("result");
    } catch (err) {
      console.error(
        "❌ QUIZ SUBMIT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Quiz submission failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // TIMER
  // =========================================================

  useEffect(() => {
    if (phase !== "attempt")
      return;

    if (timeLeft <= 0) {
      return;
    }

    const timer =
      setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);

            setTimeout(() => {
              handleSubmit(true);
            }, 0);

            return 0;
          }

          return prev - 1;
        });
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [phase, timeLeft]);

  // =========================================================
  // REVIEW ANSWERS
  // =========================================================

  const openReview = async () => {
    try {
      setLoading(true);
      setError("");

      if (
        result?.attempt?._id
      ) {
        try {
          const attemptData =
            await quizApi.getAttempt(
              result.attempt._id
            );
       console.log("REVIEW DATA:", attemptData);
          if (
            attemptData?.success
          ) {
            setReview(
              attemptData
            );

            setPhase("review");
            return;
          }
        } catch (attemptErr) {
          console.warn(
            "⚠️ Attempt review endpoint failed:",
            attemptErr
          );
        }
      }

      // Fallback
      setReview({
        success: true,
        quiz,
        attempt:
          result?.attempt ||
          attempt,
      });

      setPhase("review");
    } catch (err) {
      console.error(
        "❌ REVIEW ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load review"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // PUBLISH
  // =========================================================

  const publishQuiz = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await quizApi.publish(id);

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to publish quiz"
        );
      }

      await loadQuiz();
    } catch (err) {
      console.error(
        "❌ PUBLISH ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to publish quiz"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UNPUBLISH
  // =========================================================

  const unpublishQuiz = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await quizApi.unpublish(id);

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to unpublish quiz"
        );
      }

      await loadQuiz();
    } catch (err) {
      console.error(
        "❌ UNPUBLISH ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to unpublish quiz"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // QUESTION DATA
  // =========================================================

  const questions =
    quiz?.questions || [];

  const current =
    questions[
      currentQuestion
    ];

  const progress = useMemo(() => {
    if (!questions.length)
      return 0;

    return (
      ((currentQuestion + 1) /
        questions.length) *
      100
    );
  }, [
    currentQuestion,
    questions.length,
  ]);

  // =========================================================
  // LOADING
  // =========================================================

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-lg">
          Loading Quiz...
        </p>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">

        <div className="bg-[#0f172a] border border-red-700 rounded-2xl p-8 max-w-lg w-full text-center">

          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Unable to Load Quiz
          </h1>

          <p className="text-gray-300 mb-6">
            {error ||
              "Something went wrong."}
          </p>

          <button
            onClick={
              loadQuiz
            }
            className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-lg"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  // =========================================================
  // MANAGER / TEACHER / ADMIN
  // =========================================================

  if (phase === "manager") {
    return (
      <div className="min-h-screen bg-black text-white p-6">

        <div className="max-w-5xl mx-auto">

          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">

            <div>

              <h1 className="text-3xl font-bold">
                {quiz?.title}
              </h1>

              <p className="text-gray-400 mt-2">
                {quiz?.description ||
                  "Quiz Preview"}
              </p>

            </div>

            <div className="flex gap-3 flex-wrap">

              <button
                onClick={() =>
                  navigate(
                    `/quizzes/${id}/edit`
                  )
                }
                className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg"
              >
                Edit
              </button>

              {quiz?.status ===
              "PUBLISHED" ? (
                <button
                  onClick={
                    unpublishQuiz
                  }
                  disabled={loading}
                  className="bg-yellow-600 hover:bg-yellow-700 px-5 py-2 rounded-lg disabled:opacity-50"
                >
                  Unpublish
                </button>
              ) : (
                <button
                  onClick={
                    publishQuiz
                  }
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg disabled:opacity-50"
                >
                  Publish
                </button>
              )}

              <button
                onClick={() =>
                  navigate(
                    `/quizzes/${id}/results`
                  )
                }
                className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-lg"
              >
                Student Results
              </button>

            </div>

          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-300">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-4 gap-4 mb-8">

            <div className="bg-[#0f172a] border border-gray-700 rounded-xl p-4">

              <p className="text-gray-400 text-sm">
                Status
              </p>

              <p className="font-bold mt-1">
                {quiz?.status ||
                  "DRAFT"}
              </p>

            </div>

            <div className="bg-[#0f172a] border border-gray-700 rounded-xl p-4">

              <p className="text-gray-400 text-sm">
                Questions
              </p>

              <p className="font-bold mt-1">
                {quiz?.questionCount ??
                  questions.length}
              </p>

            </div>

            <div className="bg-[#0f172a] border border-gray-700 rounded-xl p-4">

              <p className="text-gray-400 text-sm">
                Total Marks
              </p>

              <p className="font-bold mt-1">
                {quiz?.totalMarks ??
                  0}
              </p>

            </div>

            <div className="bg-[#0f172a] border border-gray-700 rounded-xl p-4">

              <p className="text-gray-400 text-sm">
                Passing Marks
              </p>

              <p className="font-bold mt-1">
                {quiz?.passingMarks ??
                  0}
              </p>

            </div>

          </div>

          {questions.map(
            (
              question,
              index
            ) => (
              <div
                key={
                  question._id ||
                  index
                }
                className="bg-[#0f172a] border border-gray-700 rounded-xl p-6 mb-5"
              >

                <div className="flex justify-between gap-4">

                  <h2 className="text-lg font-semibold">
                    Q{index + 1}.{" "}
                    {question.text}
                  </h2>

                  <span className="text-gray-400 whitespace-nowrap">
                    {question.marks ||
                      0}{" "}
                    marks
                  </span>

                </div>

                <div className="mt-5 space-y-3">

                  {(
                    question.options ||
                    []
                  ).map(
                    (
                      option,
                      optionIndex
                    ) => {

                      const isCorrect =
                        Number(
                          question.correctOptionIndex
                        ) ===
                        Number(
                          optionIndex
                        );

                      return (
                        <div
                          key={
                            optionIndex
                          }
                          className={`p-3 rounded-lg border ${
                            isCorrect
                              ? "border-green-500 bg-green-900/30"
                              : "border-gray-700"
                          }`}
                        >

                          {option}

                          {isCorrect && (
                            <span className="text-green-400 ml-2">
                              ✓ Correct
                            </span>
                          )}

                        </div>
                      );
                    }
                  )}

                </div>

              </div>
            )
          )}

        </div>
      </div>
    );
  }

  // =========================================================
  // STUDENT DETAILS
  // =========================================================

  if (phase === "details") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">

        <div className="bg-[#0f172a] border border-gray-700 rounded-2xl p-8 max-w-xl w-full">

          <h1 className="text-3xl font-bold mb-4">
            {quiz?.title}
          </h1>

          {quiz?.description && (
            <p className="text-gray-300 mb-6">
              {quiz.description}
            </p>
          )}

          {quiz?.instructions && (
            <div className="mb-6">

              <h2 className="font-semibold mb-2">
                Instructions
              </h2>

              <p className="text-gray-400 whitespace-pre-line">
                {quiz.instructions}
              </p>

            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">

            <div className="bg-black/40 rounded-xl p-4">

              <p className="text-gray-400 text-sm">
                Questions
              </p>

              <p className="text-xl font-bold">
                {quiz?.questionCount ??
                  0}
              </p>

            </div>

            <div className="bg-black/40 rounded-xl p-4">

              <p className="text-gray-400 text-sm">
                Total Marks
              </p>

              <p className="text-xl font-bold">
                {quiz?.totalMarks ??
                  0}
              </p>

            </div>

            <div className="bg-black/40 rounded-xl p-4">

              <p className="text-gray-400 text-sm">
                Duration
              </p>

              <p className="text-xl font-bold">
                {quiz?.durationMinutes ??
                  0}{" "}
                min
              </p>

            </div>

            <div className="bg-black/40 rounded-xl p-4">

              <p className="text-gray-400 text-sm">
                Passing Marks
              </p>

              <p className="text-xl font-bold">
                {quiz?.passingMarks ??
                  0}
              </p>

            </div>

          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={
              startQuiz
            }
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading
              ? "Starting..."
              : "Start Quiz"}
          </button>

        </div>

      </div>
    );
  }

  // =========================================================
  // ACTIVE ATTEMPT
  // =========================================================

  if (phase === "attempt") {
  if (!quiz || !questions.length) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Loading quiz...</p>
      </div>
    );
  }

  return (
    <QuizAttemptRunner
      quiz={quiz}
      answers={answers}
      current={currentQuestion}
      remaining={timeLeft}
      markedForReview={markedForReview}
      onSelect={handleSelect}
      onNavigate={setCurrentQuestion}
      onToggleMark={toggleMarkForReview}
      onRequestSubmit={() => handleSubmit(false)}
    />
  );
}

  // =========================================================
  // RESULT
  // =========================================================

 if (phase === "result") {
  const attemptResult =
    result?.attempt ||
    result?.result ||
    result;

  const score =
    attemptResult?.score ??
    result?.score ??
    0;

  const maxScore =
    attemptResult?.maxScore ??
    result?.maxScore ??
    quiz?.totalMarks ??
    0;

  const percentage =
    attemptResult?.percentage ??
    result?.percentage ??
    (
      maxScore
        ? ((Number(score) / Number(maxScore)) * 100).toFixed(2)
        : 0
    );

  const correct =
    attemptResult?.correctAnswers ??
    attemptResult?.correct ??
    attemptResult?.correctCount ??
    result?.correctAnswers ??
    result?.correct ??
    result?.correctCount ??
    0;

  const wrong =
    attemptResult?.wrongAnswers ??
    attemptResult?.wrong ??
    attemptResult?.wrongCount ??
    attemptResult?.incorrectAnswers ??
    result?.wrongAnswers ??
    result?.wrong ??
    result?.wrongCount ??
    result?.incorrectAnswers ??
    0;

  const unanswered =
    attemptResult?.unanswered ??
    attemptResult?.unansweredCount ??
    attemptResult?.unattempted ??
    attemptResult?.unattemptedCount ??
    result?.unanswered ??
    result?.unansweredCount ??
    result?.unattempted ??
    result?.unattemptedCount ??
    0;

  const passingMarks =
    attemptResult?.passingMarks ??
    result?.passingMarks ??
    quiz?.passingMarks ??
    0;

  const passed =
    typeof attemptResult?.passed === "boolean"
      ? attemptResult.passed
      : typeof result?.passed === "boolean"
      ? result.passed
      : Number(score) >= Number(passingMarks);

  const normalizedResult = {
    ...result,

    quiz: result?.quiz || quiz,

    attempt: {
      ...attemptResult,

      score,
      maxScore,
      percentage: Number(percentage),

      correctAnswers: correct,
      wrongAnswers: wrong,
      unanswered,

      passingMarks,
      passed,
    },
  };

  return (
    <QuizResultSummary
      result={normalizedResult}
      formatClock={formatClock}
      onReview={openReview}
      onRetry={() => {
        setResult(null);
        setAttempt(null);
        setAnswers({});
        setCurrentQuestion(0);
        setPhase("details");
      }}
      onBack={() => navigate("/courses")}
    />
  );
}

  // =========================================================
  // REVIEW
  // =========================================================

 if (phase === "review") {
  return <QuizReviewList review={review} />;
}

  return null;
}