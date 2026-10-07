import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import EmptyState from "../../Components/UI/EmptyState";
import { getApiErrorMessage, quizApi } from "../../Services/quizApi";

export default function QuizResults() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const [attemptResponse, statsResponse] =
          await Promise.all([
            quizApi.attempts(id),
            quizApi.stats(id),
          ]);

        console.log(
          "🔥 QUIZ ATTEMPTS:",
          attemptResponse
        );

        console.log(
          "🔥 QUIZ STATS:",
          statsResponse
        );

        setAttempts(
          attemptResponse?.attempts || []
        );

        setStats(
          statsResponse?.stats || null
        );
      } catch (err) {
        console.error(
          "❌ QUIZ RESULTS ERROR:",
          err
        );

        setError(
          getApiErrorMessage(
            err,
            "Could not load results"
          )
        );
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="animate-pulse">
          Loading results...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <EmptyState
          icon="⚠️"
          title="Couldn't load results"
          message={error}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-purple-400 text-sm font-semibold">
              TEACHER / ADMIN
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold">
              Quiz Results
            </h1>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="min-h-[44px] px-4 rounded-lg border border-gray-700 hover:bg-gray-800"
          >
            Back
          </button>
        </div>

        {/* STATS */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

            <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">
                {stats.totalAttempts ?? 0}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Attempts
              </p>
            </div>

            <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">
                {stats.uniqueStudents ?? 0}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Students
              </p>
            </div>

            <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">
                {stats.averagePercentage ?? 0}%
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Average
              </p>
            </div>

            <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">
                {stats.passRate ?? 0}%
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Pass Rate
              </p>
            </div>

          </div>
        )}

        {/* ATTEMPTS */}
        {attempts.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No student attempts yet"
            message="Students have not submitted this quiz yet."
          />
        ) : (
          <div className="space-y-4">

            {attempts.map((attempt) => {

              const passed =
                attempt.passed === true;

              const student =
                attempt.student || {};

              return (
                <div
                  key={attempt._id}
                  className="bg-[#0f172a] border border-gray-800 rounded-2xl p-5"
                >

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    {/* STUDENT */}
                    <div>
                      <h2 className="text-lg font-semibold">
                        {student.fullName ||
                          "Student"}
                      </h2>

                      {student.email && (
                        <p className="text-sm text-gray-400">
                          {student.email}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        Attempt #
                        {attempt.attemptNumber ??
                          1}
                      </p>
                    </div>

                    {/* RESULT */}
                    <div className="text-left md:text-right">

                      <p className="text-2xl font-bold">
                        {attempt.score ?? 0}
                        <span className="text-gray-500 text-base">
                          {" "}
                          /{" "}
                          {attempt.maxScore ?? 0}
                        </span>
                      </p>

                      <p className="text-sm text-gray-400">
                        {attempt.percentage ?? 0}%
                      </p>

                      <span
                        className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          passed
                            ? "bg-green-500/15 text-green-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {passed
                          ? "PASSED"
                          : "FAILED"}
                      </span>

                    </div>

                  </div>

                  {/* DETAILS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">

                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-xs text-gray-500">
                        Correct
                      </p>

                      <p className="font-semibold text-green-400 mt-1">
                        {attempt.correctAnswers ??
                          0}
                      </p>
                    </div>

                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-xs text-gray-500">
                        Wrong
                      </p>

                      <p className="font-semibold text-red-400 mt-1">
                        {attempt.wrongAnswers ??
                          0}
                      </p>
                    </div>

                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-xs text-gray-500">
                        Unanswered
                      </p>

                      <p className="font-semibold text-yellow-400 mt-1">
                        {attempt.unanswered ??
                          0}
                      </p>
                    </div>

                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-xs text-gray-500">
                        Status
                      </p>

                      <p className="font-semibold mt-1">
                        {attempt.status ||
                          "-"}
                      </p>
                    </div>

                  </div>

                  {/* SUBMITTED */}
                  {attempt.submittedAt && (
                    <p className="text-xs text-gray-500 mt-4">
                      Submitted:{" "}
                      {new Date(
                        attempt.submittedAt
                      ).toLocaleString()}
                    </p>
                  )}

                  {/* VIEW ATTEMPT */}
                  <button
                    onClick={() =>
                      navigate(
                        `/quiz-preview/${id}?attemptId=${attempt._id}`
                      )
                    }
                    className="mt-4 min-h-[44px] px-5 rounded-lg border border-gray-700 hover:bg-white/5 font-semibold"
                  >
                    👁 View Attempt
                  </button>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}