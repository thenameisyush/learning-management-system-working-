import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizApi, getApiErrorMessage } from "../../Services/quizApi";

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [timeLeft, setTimeLeft] = useState(0);

  // ==========================================
  // START QUIZ
  // ==========================================
  useEffect(() => {
    const startQuiz = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await quizApi.start(id);

        console.log("🔥 START QUIZ RESPONSE:", data);

        /*
          Expected Phase-4 response:
          {
            success: true,
            attempt: {...},
            quiz: {...}
          }
        */

        const attempt = data?.attempt;
        const quizData = data?.quiz;

        if (!attempt || !quizData) {
          throw new Error("Invalid quiz start response");
        }

        setAttemptId(attempt._id || attempt.id);
        setQuiz(quizData);

        if (quizData.durationMinutes) {
          setTimeLeft(Number(quizData.durationMinutes) * 60);
        }

        // Restore already saved answers if available
        if (attempt.answers) {
          const restoredAnswers = {};

          attempt.answers.forEach((answer) => {
            const questionId =
              answer.questionId?._id ||
              answer.questionId ||
              answer.question;

            if (questionId) {
              restoredAnswers[String(questionId)] =
                answer.selectedOptionIndex;
            }
          });

          setAnswers(restoredAnswers);
        }
      } catch (err) {
        console.error("❌ START QUIZ ERROR:", err);

        setError(
          getApiErrorMessage(
            err,
            "Unable to start quiz. Please try again."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    startQuiz();
  }, [id]);

  // ==========================================
  // TIMER
  // ==========================================
  useEffect(() => {
    if (!quiz || !attemptId || submitting) return;

    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quiz, attemptId, submitting]);

  // ==========================================
  // SELECT ANSWER
  // ==========================================
  const handleSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [String(questionId)]: optionIndex,
    }));
  };

  // ==========================================
  // SAVE PROGRESS
  // ==========================================
 const saveCurrentProgress = async () => {
  if (!attemptId) return;

  try {
    const answersArray = Object.entries(answers).map(
      ([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      })
    );

    await quizApi.saveProgress(
      id,
      attemptId,
      answersArray
    );

    console.log("✅ QUIZ PROGRESS SAVED");
  } catch (err) {
    console.error("❌ SAVE PROGRESS ERROR:", err);
  }
};

  // ==========================================
  // SUBMIT QUIZ
  // ==========================================
  const handleSubmit = async (autoSubmit = false) => {
    if (submitting) return;

    if (!autoSubmit) {
      const confirmed = window.confirm(
        "Are you sure you want to submit the quiz?"
      );

      if (!confirmed) return;
    }

    try {
      setSubmitting(true);
      setError(null);

      console.log("🔥 SUBMITTING QUIZ:", {
        quizId: id,
        attemptId,
        answers,
      });

     const answersArray = Object.entries(answers).map(
  ([questionId, selectedAnswer]) => ({
    questionId,
    selectedAnswer,
  })
);

const data = await quizApi.submit(
  id,
  attemptId,
  answersArray
);

      console.log("🔥 SUBMIT RESPONSE:", data);

      /*
        Store result temporarily so QuizResults
        can be connected in the next step.
      */

      sessionStorage.setItem(
        `quiz-result-${id}`,
        JSON.stringify(data)
      );

      sessionStorage.setItem(
        `quiz-attempt-${id}`,
        String(attemptId)
      );

      navigate(`/quizzes/${id}/results`);
    } catch (err) {
      console.error("❌ SUBMIT QUIZ ERROR:", err);

      setError(
        getApiErrorMessage(
          err,
          "Quiz submission failed. Please try again."
        )
      );

      setSubmitting(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="animate-pulse text-lg">
          Starting Quiz...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0f172a] border border-red-500/30 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-3">
            Unable to Start Quiz
          </h2>

          <p className="text-gray-300 mb-6">
            {error}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // NO QUIZ
  // ==========================================
  if (!quiz || !attemptId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Quiz data not available.</p>
      </div>
    );
  }

  const questions = Array.isArray(quiz.questions)
    ? quiz.questions
    : [];

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">
            No Questions Found
          </h2>

          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-5 py-2 bg-purple-600 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  const questionId =
  question?._id ||
  question?.id;

  const selectedOption =
    answers[String(questionId)];

  const progress =
    ((currentQuestion + 1) / questions.length) * 100;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-[#020617] text-white p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">
            {quiz.title}
          </h1>

          <div className="bg-red-600 px-4 py-2 rounded-lg font-semibold">
            ⏰ {minutes}:
            {seconds.toString().padStart(2, "0")}
          </div>
        </div>

        {/* PROGRESS */}
        <div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-purple-600 h-3 rounded-full transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <p className="text-gray-400 text-sm mt-2">
            Question {currentQuestion + 1} of{" "}
            {questions.length}
          </p>
        </div>

        {/* QUESTION */}
        <div className="bg-[#0f172a] p-5 sm:p-6 rounded-2xl border border-gray-700">

          <h2 className="text-xl font-semibold mb-6">
            Q{currentQuestion + 1}.{" "}
             {question.text}
          </h2>

          <div className="space-y-3">
            {Array.isArray(question.options) &&
              question.options.map(
                (option, index) => {
                  const isSelected =
                    Number(selectedOption) ===
                    Number(index);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() =>
                        handleSelect(
                          questionId,
                          index
                        )
                      }
                      className={`w-full text-left p-4 rounded-xl border transition ${
                        isSelected
                          ? "border-purple-500 bg-purple-900/30"
                          : "border-gray-700 hover:border-purple-500"
                      }`}
                    >
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + index)}.
                      </span>

                      {option}
                    </button>
                  );
                }
              )}
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="flex justify-between gap-3">

          <button
            disabled={currentQuestion === 0}
            onClick={() =>
              setCurrentQuestion(
                (prev) => prev - 1
              )
            }
            className="px-5 py-2 rounded-lg bg-gray-700 disabled:opacity-40"
          >
            Previous
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : "Submit Quiz"}
            </button>
          ) : (
            <button
              onClick={async () => {
                await saveCurrentProgress();

                setCurrentQuestion(
                  (prev) => prev + 1
                );
              }}
              className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700"
            >
              Next
            </button>
          )}
        </div>

      </div>
    </div>
  );
}