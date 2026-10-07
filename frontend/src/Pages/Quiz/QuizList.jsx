import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import EmptyState from "../../Components/UI/EmptyState";
import { getApiErrorMessage, quizApi } from "../../Services/quizApi";

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);

  const nav = useNavigate();

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await quizApi.list();

      console.log("🔥 QUIZ LIST RESPONSE:", data);

      console.log(
        "🔥 QUIZ LIST SUMMARY:",
        data?.quizzes?.map((q) => ({
          id: q?._id,
          title: q?.title,
          status: q?.status,
          canManage: q?.canManage,
          questions: q?.questionCount,
          marks: q?.totalMarks,
          passing: q?.passingMarks,
        }))
      );

      setQuizzes(data?.quizzes || []);
    } catch (err) {
      console.error("❌ QUIZ LIST ERROR:", err);

      setError(
        getApiErrorMessage(
          err,
          "Could not load quizzes"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handlePublishToggle = async (quiz) => {
    try {
      setActionId(quiz._id);
      setError(null);

      if (quiz.status === "PUBLISHED") {
        await quizApi.unpublish(quiz._id);
      } else {
        await quizApi.publish(quiz._id);
      }

      await loadQuizzes();
    } catch (err) {
      console.error("❌ QUIZ STATUS ERROR:", err);

      setError(
        getApiErrorMessage(
          err,
          quiz.status === "PUBLISHED"
            ? "Could not unpublish quiz"
            : "Could not publish quiz"
        )
      );
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <h2 className="text-lg animate-pulse">
          Loading quizzes...
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-[#020617] text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Available Quizzes
          </h1>

          <p className="text-gray-400">
            Select a quiz and start your test
          </p>
        </div>

        {/* ERROR */}
        {error ? (
          <EmptyState
            icon="⚠️"
            title="Couldn't load quizzes"
            message={error}
          />
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No quizzes available"
            message="Check back once your instructor publishes one."
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">

            {quizzes.map((q) => {
              const isManager = q?.canManage === true;
              const isPublished = q?.status === "PUBLISHED";

              const blocked =
                q?.attemptsRemaining === 0 &&
                !q?.hasActiveAttempt;

              const isBusy = actionId === q?._id;

              return (
                <div
                  key={q._id}
                  className="bg-[#0f172a] border border-gray-800 p-5 sm:p-6 rounded-2xl shadow-md hover:shadow-purple-900/30 hover:border-purple-500 transition"
                >

                  {/* TITLE + STATUS */}
                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold">
                        {q.title || "Untitled Quiz"}
                      </h2>

                      <p className="text-gray-400 text-sm mt-2">
                        {q.description || "No description"}
                      </p>
                    </div>

                    {isManager && (
                      <span
                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                          isPublished
                            ? "bg-green-500/15 text-green-400"
                            : "bg-yellow-500/15 text-yellow-400"
                        }`}
                      >
                        {isPublished
                          ? "PUBLISHED"
                          : "DRAFT"}
                      </span>
                    )}

                  </div>

                  {/* STATS */}
                  <div className="grid grid-cols-3 gap-2 mt-5">

                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-xs text-gray-500">
                        Questions
                      </p>

                      <p className="text-white font-semibold mt-1">
                        {q.questionCount ?? 0}
                      </p>
                    </div>

                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-xs text-gray-500">
                        Marks
                      </p>

                      <p className="text-white font-semibold mt-1">
                        {q.totalMarks ?? 0}
                      </p>
                    </div>

                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-xs text-gray-500">
                        Passing
                      </p>

                      <p className="text-white font-semibold mt-1">
                        {q.passingMarks ?? 0}
                      </p>
                    </div>

                  </div>

                  {/* DURATION */}
                  <div className="flex justify-between text-sm text-gray-400 mt-4">
                    <span>Duration</span>

                    <span>
                      {q.durationMinutes ?? 0} min
                    </span>
                  </div>

                  {/* ================= MANAGER ================= */}
                  {isManager ? (
                    <div className="mt-5 space-y-2">

                      {/* EDIT */}
                      <button
                        onClick={() =>
                          nav(`/quizzes/${q._id}/edit`)
                        }
                        className="w-full min-h-[48px] rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 transition"
                      >
                        ✏️ Edit Quiz
                      </button>

                      {/* PUBLISH / UNPUBLISH */}
                      <button
                        disabled={isBusy}
                        onClick={() =>
                          handlePublishToggle(q)
                        }
                        className={`w-full min-h-[48px] rounded-lg font-semibold transition disabled:opacity-50 ${
                          isPublished
                            ? "bg-yellow-600 hover:bg-yellow-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {isBusy
                          ? "Please wait..."
                          : isPublished
                          ? "🔒 Unpublish Quiz"
                          : "🚀 Publish Quiz"}
                      </button>

                      {/* PREVIEW */}
                      <button
                        onClick={() =>
                          nav(`/quiz-preview/${q._id}`)
                        }
                        className="w-full min-h-[48px] rounded-lg font-semibold border border-gray-700 hover:bg-white/5 transition"
                      >
                        👁 Preview Quiz
                      </button>

                      {/* RESULTS */}
                      <button
                        onClick={() =>
                          nav(`/quizzes/${q._id}/results`)
                        }
                        className="w-full min-h-[48px] rounded-lg font-semibold border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition"
                      >
                        📊 View Student Results
                      </button>

                    </div>
                  ) : (

                    /* ================= STUDENT ================= */
                    <div className="mt-5">

                      <button
                        disabled={blocked}
                        onClick={() =>
                          nav(`/quiz-preview/${q._id}`)
                        }
                        className={`w-full min-h-[48px] rounded-lg font-semibold transition ${
                          blocked
                            ? "bg-gray-700 cursor-not-allowed text-gray-400"
                            : "bg-purple-600 hover:bg-purple-700"
                        }`}
                      >
                        {blocked
                          ? "No attempts left"
                          : q?.hasActiveAttempt
                          ? "Resume Quiz"
                          : "Start Quiz 🚀"}
                      </button>

                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}