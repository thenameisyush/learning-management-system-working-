import React, { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../../utils/api";

export default function QuizPreview() {

  const { id } = useParams();
  const nav = useNavigate();

  const [searchParams] = useSearchParams();

  const mode = searchParams.get("mode");

  const [quiz, setQuiz] = useState(null);

  const [answers, setAnswers] = useState({});

  const [submitted, setSubmitted] = useState(false);

  const [result, setResult] = useState(null);

  const [showReview, setShowReview] =
    useState(false);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [timeLeft, setTimeLeft] =
    useState(0);

  // ================= FETCH QUIZ =================
  useEffect(() => {

    api
      .get(`/api/v1/quizzes/${id}?mode=${mode}`)
      .then((res) => {

        setQuiz(res.data);

        if (res.data.durationMinutes) {
          setTimeLeft(
            res.data.durationMinutes * 60
          );
        }
      });

  }, [id, mode]);

  // ================= TIMER =================
  useEffect(() => {

    if (mode === "admin") return;

    if (submitted) return;

    if (timeLeft <= 0 && quiz) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);

  }, [timeLeft, submitted, quiz]);

  // ================= SELECT =================
  const handleSelect = (
    qIndex,
    optIndex
  ) => {

    if (mode === "admin") return;

    setAnswers((prev) => ({
      ...prev,
      [qIndex]: optIndex,
    }));
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    try {

      const answersArray =
        quiz.questions.map(
          (_, i) => answers[i] ?? null
        );

      const res = await api.post(
        `/api/v1/quizzes/${id}/attempt`,
        {
          answers: answersArray,

          timeTaken:
            quiz.durationMinutes * 60 -
            timeLeft,
        }
      );

      setResult(res.data);

      // 🔥 FETCH REVIEW DATA
      const reviewQuiz = await api.get(
        `/api/v1/quizzes/${id}?mode=review`
      );

      console.log(
        "🔥 REVIEW DATA",
        reviewQuiz.data
      );

      setQuiz(reviewQuiz.data);

      setSubmitted(true);

    } catch (err) {

      console.error(err);

      alert("Submit failed");
    }
  };

  // ================= LOADING =================
  if (!quiz) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading Quiz...
      </div>
    );
  }

  // ================= ADMIN =================
  if (mode === "admin") {
    return (
      <div className="p-6 text-white bg-black min-h-screen">

        <h1 className="text-3xl font-bold mb-6">
          {quiz.title}
        </h1>

        {quiz.questions.map((q, i) => (
          <div
            key={i}
            className="p-5 bg-[#0f172a] mt-4 rounded-xl border border-gray-700"
          >

            <h3 className="font-semibold">
              Q{i + 1}. {q.text}
            </h3>

            {q.options.map((opt, j) => (
              <div
                key={j}
                className={`p-3 mt-3 rounded border ${
                  Number(q.correctOptionIndex) === Number(j)
                    ? "border-green-500 bg-green-900/30"
                    : "border-gray-700"
                }`}
              >
                {opt}
              </div>
            ))}
          </div>
        ))}

        <p className="text-green-400 mt-5">
          Green = Correct Answer
        </p>
      </div>
    );
  }

  // ================= RESULT =================
  if (submitted && !showReview) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">

        <div className="bg-[#0f172a] p-8 rounded-2xl text-center space-y-4 w-full max-w-md border border-purple-700">

          <h1 className="text-3xl font-bold">
            Quiz Submitted 🎉
          </h1>

          <h2 className="text-xl">
            Score: {result.score} / {result.totalMarks}
          </h2>

          <h3 className="text-lg">
            Percentage: {result.percentage}%
          </h3>

          <h3
            className={`text-xl font-bold ${
              result.percentage >= 50
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {result.percentage >= 50
              ? "PASS ✅"
              : "FAIL ❌"}
          </h3>

          {/* REVIEW BUTTON */}
          <button
            onClick={() =>
              setShowReview(true)
            }
            className="bg-yellow-600 px-5 py-2 rounded-lg"
          >
            Review Answers
          </button>

          {/* BACK */}
          <button
            onClick={() =>
              nav("/courses")
            }
            className="bg-purple-600 px-5 py-2 rounded-lg ml-3"
          >
            Back To Courses
          </button>

        </div>
      </div>
    );
  }

  // ================= REVIEW =================
  if (showReview) {
    return (
      <div className="min-h-screen bg-black text-white p-6">

        <div className="max-w-4xl mx-auto space-y-6">

          <h1 className="text-3xl font-bold text-center">
            Review Answers
          </h1>

          {quiz.questions.map((q, i) => (
            <div
              key={i}
              className="bg-[#0f172a] p-6 rounded-xl border border-gray-700"
            >

              {/* QUESTION */}
              <h2 className="font-semibold mb-4">
                Q{i + 1}. {q.text}
              </h2>

              {/* OPTIONS */}
              {q.options.map((opt, j) => {

                // ✅ selected option
                const selectedAnswer =
                  Number(answers[i]);

                // ✅ correct option
                const correctAnswer =
                  Number(q.correctOptionIndex);

                // ✅ green only correct
                const isCorrect =
                  j === correctAnswer;

                // ✅ red only wrong selected
                const isWrongSelected =
                  j === selectedAnswer &&
                  selectedAnswer !== correctAnswer;

                return (
                  <div
                    key={j}
                    className={`p-3 rounded border mt-2 ${
                      isCorrect
                        ? "border-green-500 bg-green-900/30"

                        : isWrongSelected
                        ? "border-red-500 bg-red-900/30"

                        : "border-gray-700"
                    }`}
                  >
                    {opt}
                  </div>
                );
              })}

              {/* CORRECT ANSWER */}
              <div className="mt-4 text-green-400 font-semibold">
                Correct Answer:{" "}
                {
                  q.options[
                    Number(q.correctOptionIndex)
                  ]
                }
              </div>

            </div>
          ))}

          <button
            onClick={() =>
              nav("/courses")
            }
            className="bg-purple-600 px-6 py-2 rounded-lg"
          >
            Back To Courses
          </button>

        </div>
      </div>
    );
  }

  // ================= CURRENT QUESTION =================
  const q =
    quiz.questions[currentQuestion];

  // ================= PROGRESS =================
  const progress =
    ((currentQuestion + 1) /
      quiz.questions.length) *
    100;

  // ================= TIMER FORMAT =================
  const minutes = Math.floor(
    timeLeft / 60
  );

  const seconds = timeLeft % 60;

  // ================= STUDENT =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-[#020617] text-white p-6">

      <div className="max-w-3xl mx-auto space-y-6">

        {/* TOP */}
        <div className="flex justify-between items-center">

          <h1 className="text-2xl font-bold">
            {quiz.title}
          </h1>

          {/* TIMER */}
          <div className="bg-red-600 px-4 py-2 rounded-lg font-semibold">
            ⏰ {minutes}:
            {seconds
              .toString()
              .padStart(2, "0")}
          </div>
        </div>

        {/* PROGRESS */}
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-purple-600 h-3 rounded-full"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <p className="text-gray-400">
          Question {currentQuestion + 1} of{" "}
          {quiz.questions.length}
        </p>

        {/* QUESTION CARD */}
        <div className="bg-[#0f172a] p-6 rounded-2xl border border-gray-700">

          <h2 className="text-xl font-semibold mb-5">
            {q.text}
          </h2>

          <div className="space-y-4">

            {q.options.map((opt, j) => (
              <div
                key={j}
                onClick={() =>
                  handleSelect(
                    currentQuestion,
                    j
                  )
                }
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  Number(
                    answers[currentQuestion]
                  ) === Number(j)
                    ? "border-purple-500 bg-purple-900/30"
                    : "border-gray-700 hover:border-purple-500"
                }`}
              >
                {opt}
              </div>
            ))}

          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex justify-between">

          <button
            disabled={
              currentQuestion === 0
            }
            onClick={() =>
              setCurrentQuestion(
                (prev) => prev - 1
              )
            }
            className="bg-gray-700 px-5 py-2 rounded disabled:opacity-40"
          >
            Previous
          </button>

          {currentQuestion ===
          quiz.questions.length - 1 ? (
            <button
              onClick={() => {

                const confirmSubmit =
                  window.confirm(
                    "Are you sure you want to submit?"
                  );

                if (confirmSubmit) {
                  handleSubmit();
                }
              }}
              className="bg-green-600 px-6 py-2 rounded-lg"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestion(
                  (prev) => prev + 1
                )
              }
              className="bg-purple-600 px-6 py-2 rounded-lg"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}