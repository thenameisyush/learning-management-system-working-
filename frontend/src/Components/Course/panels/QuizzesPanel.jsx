import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import EmptyState from "../../UI/EmptyState";
import {
  getApiErrorMessage,
  quizApi,
} from "../../../Services/quizApi";

const Skeleton = () => (
  <div
    className="grid grid-cols-1 gap-5 md:grid-cols-2"
    aria-busy="true"
    aria-label="Loading quizzes"
  >
    {[0, 1].map((i) => (
      <div
        key={i}
        className="animate-pulse rounded-2xl border border-black/10 bg-gray-100 p-5"
      >
        <div className="h-5 w-1/2 rounded bg-gray-300" />
        <div className="mt-3 h-4 w-3/4 rounded bg-gray-200" />
        <div className="mt-5 h-10 w-full rounded-xl bg-gray-200" />
      </div>
    ))}
  </div>
);

/* QUIZ CARD */
function QuizCard({ quiz: q, canManage, onView }) {
  const blocked =
    q?.attemptsRemaining === 0 &&
    !q?.hasActiveAttempt &&
    !canManage;

  return (
    <div
      className="
        group
        flex
        min-w-0
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-black/10
        bg-white
        p-5
        shadow-md
        transition
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
      "
    >
      {/* QUIZ TITLE */}
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 break-words text-lg font-bold text-gray-900">
            {q?.title}
          </h3>

          {canManage && (
            <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold text-purple-700">
              MANAGE
            </span>
          )}
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
          {q?.description || "No description"}
        </p>
      </div>

      {/* QUIZ INFO */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-gray-50 p-3 text-center">
          <p className="text-lg font-bold text-gray-900">
            {q?.questionCount ?? 0}
          </p>
          <p className="text-[10px] font-medium text-gray-500">
            Questions
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-3 text-center">
          <p className="text-lg font-bold text-gray-900">
            {q?.totalMarks ?? 0}
          </p>
          <p className="text-[10px] font-medium text-gray-500">
            Marks
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-3 text-center">
          <p className="text-lg font-bold text-gray-900">
            {q?.durationMinutes || "∞"}
          </p>
          <p className="text-[10px] font-medium text-gray-500">
            {q?.durationMinutes ? "Minutes" : "Time"}
          </p>
        </div>
      </div>

      {/* STUDENT STATUS */}
      {!canManage && (
        <p className="mt-3 text-xs font-medium text-gray-500">
          {q?.status !== "PUBLISHED"
            ? "Draft"
            : q?.attemptsUsed > 0
            ? `Attempted (${q.attemptsUsed})`
            : "Not attempted yet"}
        </p>
      )}

      {/* BUTTON */}
      <button
        onClick={onView}
        disabled={blocked}
        className={`
          mt-5
          min-h-[46px]
          w-full
          rounded-xl
          px-4
          text-sm
          font-bold
          transition
          duration-200
          ${
            blocked
              ? "cursor-not-allowed bg-gray-200 text-gray-400"
              : canManage
              ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400 hover:shadow-lg"
              : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:-translate-y-0.5 hover:shadow-lg"
          }
        `}
      >
        {canManage
          ? "Manage Quiz"
          : blocked
          ? "No attempts left"
          : q?.hasActiveAttempt
          ? "Resume Quiz"
          : "Start Quiz"}
      </button>
    </div>
  );
}

/**
 * Course-scoped quiz list.
 */
export default function QuizzesPanel({ courseId }) {
  const navigate = useNavigate();

  const { role } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [canManage, setCanManage] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await quizApi.list(courseId);
      console.log("QUIZ LIST RESPONSE:", data);
      setQuizzes(data?.quizzes || []);

      /*
       * IMPORTANT:
       * Course ownership comes from backend.
       * Frontend role alone is NOT used for permission.
       */
      setCanManage(
  role === "TEACHER" ||
  role === "ADMIN" ||
  Boolean(data?.quizzes?.[0]?.canManage)
);
    } catch (err) {
      setError({
        status: err?.response?.status,
        message: getApiErrorMessage(
          err,
          "Could not load quizzes"
        ),
      });
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreateQuiz = () => {
    navigate("/quizzes/create", {
      state: {
        courseId,
      },
    });
  };

  const openQuiz = (quizId) => {
    navigate(`/quiz-preview/${quizId}`);
  };

  return (
    <div className="w-full min-w-0">

      {/* HEADER */}
      <div
        className="
          mb-6
          flex
          flex-col
          gap-4
          rounded-2xl
          border
          border-black/10
          bg-yellow-50
          p-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-xl">
              🧠
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Quizzes
              </h2>

              <p className="text-xs text-gray-500">
                Test your knowledge and track your performance
              </p>
            </div>
          </div>
        </div>

        {/* CREATE QUIZ */}
        {canManage && (
          <button
            onClick={openCreateQuiz}
            className="
              inline-flex
              min-h-[46px]
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-gradient-to-r
              from-purple-600
              to-indigo-600
              px-5
              py-3
              text-sm
              font-bold
              text-white
              shadow-md
              transition
              duration-200
              hover:-translate-y-0.5
              hover:shadow-lg
            "
          >
            <span className="text-lg">+</span>
            Create Quiz
          </button>
        )}
      </div>

      {/* LOADING */}
      {loading ? (
        <Skeleton />
      ) : error ? (
        <EmptyState
          icon={error.status === 403 ? "🔒" : "⚠️"}
          title="Couldn't load quizzes"
          message={error.message}
        />
      ) : quizzes.length === 0 ? (
        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-black/15
            bg-gray-50
            px-6
            py-12
            text-center
          "
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100 text-3xl">
            🧠
          </div>

          <h3 className="mt-4 text-lg font-bold text-gray-900">
            No quizzes available yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            {canManage
              ? "Create your first quiz for this course."
              : "Check back once your instructor publishes a quiz."}
          </p>

          {/* CREATE BUTTON ALSO HERE */}
          {canManage && (
            <button
              onClick={openCreateQuiz}
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-purple-600
                px-5
                py-3
                text-sm
                font-bold
                text-white
                shadow-md
                transition
                hover:bg-purple-700
                hover:shadow-lg
              "
            >
              <span className="text-lg">+</span>
              Create Quiz
            </button>
          )}
        </div>
      ) : (
        /* QUIZ GRID */
        <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
          {quizzes.map((q) => (
            <QuizCard
              key={q._id}
              quiz={q}
              canManage={canManage}
              onView={() => openQuiz(q._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}