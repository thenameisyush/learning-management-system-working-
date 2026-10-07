import { useState } from "react";
import { FaBookmark, FaRegBookmark, FaTimes } from "react-icons/fa";

const formatClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * Question-navigator button, shared between the desktop sidebar and the
 * mobile drawer so the two stay visually and behaviourally identical.
 */
function NavButton({ index, current, answered, marked, onClick }) {
  const state = current
    ? "border-purple-400 bg-purple-600 text-white ring-2 ring-purple-300"
    : answered
    ? "border-green-600 bg-green-900/40 text-green-100"
    : marked
    ? "border-amber-500 bg-amber-900/30 text-amber-200"
    : "border-gray-700 bg-black/40 text-gray-300";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={current ? "true" : undefined}
      className={`relative min-w-[44px] min-h-[44px] rounded-lg text-sm font-semibold border transition ${state}`}
    >
      {index + 1}
      {marked && (
        <FaBookmark
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 text-amber-400 text-xs bg-black/70 rounded-full p-0.5"
        />
      )}
    </button>
  );
}

function NavigatorGrid({ questions, current, answers, markedForReview, onNavigate }) {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-2">
      {questions.map((q, i) => (
        <NavButton
          key={q._id}
          index={i}
          current={i === current}
          answered={answers[q._id] !== undefined}
          marked={markedForReview.has(q._id)}
          onClick={() => onNavigate(i)}
        />
      ))}
    </div>
  );
}

function Legend() {
  const items = [
    ["bg-purple-600 border-purple-400", "Current"],
    ["bg-green-900/40 border-green-600", "Answered"],
    ["bg-amber-900/30 border-amber-500", "Marked"],
    ["bg-black/40 border-gray-700", "Not answered"],
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400">
      {items.map(([swatch, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`inline-block w-3 h-3 rounded border ${swatch}`} aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  );
}

/**
 * The question-by-question quiz-taking screen. Timer, autosave and submit
 * logic stay in the parent (QuizPreview.jsx) - this component only renders
 * the current question and lets the student navigate/answer/mark it.
 */
export default function QuizAttemptRunner({
  quiz,
  answers,
  current,
  remaining, // seconds, or null = untimed
  markedForReview, // Set<questionId>
  onSelect,
  onNavigate,
  onToggleMark,
  onRequestSubmit,
}) {
  const [navOpen, setNavOpen] = useState(false);

  const questions = quiz.questions;
  const q = questions[current];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isLast = current === total - 1;
  const urgent = remaining !== null && remaining <= 60;
  const marked = markedForReview.has(q._id);

  const isSelected = (j) => (q.type === "TRUE_FALSE" ? answers[q._id] === (j === 0) : answers[q._id] === j);
  const select = (j) => onSelect(q._id, q.type === "TRUE_FALSE" ? j === 0 : j);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-[#020617] text-white">
      {/* sticky top bar: title, progress, timer - always visible */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold truncate">{quiz.title}</h1>
            <p className="text-xs text-gray-400">
              Question {current + 1} of {total} &middot; {answeredCount} answered
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {remaining !== null && (
              <div
                className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${
                  urgent ? "bg-red-600 animate-pulse" : "bg-red-700/80"
                }`}
                aria-live="polite"
              >
                &#9200; {formatClock(Math.max(0, remaining))}
              </div>
            )}
            {/* mobile: opens the navigator drawer */}
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="lg:hidden min-h-[40px] px-3 rounded-lg border border-gray-700 text-sm font-semibold"
            >
              Q{current + 1}/{total} &#9662;
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-gray-800">
          <div
            className="h-1.5 bg-purple-600 transition-all"
            style={{ width: `${((current + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 lg:flex lg:gap-6 lg:items-start">
        {/* main column */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-[#0f172a] p-5 sm:p-6 rounded-2xl border border-gray-700">
            <div className="flex items-start justify-between gap-3 mb-5">
              <h2 className="text-lg sm:text-xl font-semibold">{q.text}</h2>
              <button
                type="button"
                onClick={() => onToggleMark(q._id)}
                aria-pressed={marked}
                title={marked ? "Unmark for review" : "Mark for review"}
                className={`shrink-0 flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg border text-xs font-semibold transition ${
                  marked
                    ? "border-amber-400 bg-amber-900/30 text-amber-300"
                    : "border-gray-700 text-gray-400 hover:border-amber-400 hover:text-amber-300"
                }`}
              >
                {marked ? <FaBookmark aria-hidden="true" /> : <FaRegBookmark aria-hidden="true" />}
                <span className="hidden sm:inline">{marked ? "Marked" : "Mark for review"}</span>
              </button>
            </div>

            <div className="space-y-3">
              {q.options.map((opt, j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => select(j)}
                  aria-pressed={isSelected(j)}
                  className={`w-full text-left min-h-[48px] p-4 rounded-xl border transition ${
                    isSelected(j) ? "border-purple-500 bg-purple-900/30" : "border-gray-700 hover:border-purple-500"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <button
              disabled={current === 0}
              onClick={() => onNavigate(current - 1)}
              className="min-h-[48px] px-5 rounded-lg bg-gray-700 disabled:opacity-40"
            >
              Previous
            </button>
            {isLast ? (
              <button onClick={onRequestSubmit} className="min-h-[48px] px-6 rounded-lg bg-green-600 font-semibold">
                Submit Quiz
              </button>
            ) : (
              <button onClick={() => onNavigate(current + 1)} className="min-h-[48px] px-6 rounded-lg bg-purple-600 font-semibold">
                Next
              </button>
            )}
          </div>
        </div>

        {/* desktop sidebar navigator */}
        <div className="hidden lg:block w-64 shrink-0 sticky top-24 space-y-4">
          <div className="bg-[#0f172a] p-4 rounded-2xl border border-gray-700 space-y-4">
            <p className="text-sm font-semibold text-gray-300">Questions</p>
            <NavigatorGrid questions={questions} current={current} answers={answers} markedForReview={markedForReview} onNavigate={onNavigate} />
            <Legend />
            <button onClick={onRequestSubmit} className="w-full min-h-[44px] rounded-lg bg-green-600 font-semibold">
              Submit Quiz
            </button>
          </div>
        </div>
      </div>

      {/* mobile navigator drawer */}
      {navOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 flex items-end"
          role="dialog"
          aria-modal="true"
          aria-label="Question navigator"
          onClick={() => setNavOpen(false)}
        >
          <div
            className="w-full bg-[#0f172a] border-t border-gray-700 rounded-t-2xl p-4 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold">Questions</p>
              <button
                onClick={() => setNavOpen(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>
            <NavigatorGrid
              questions={questions}
              current={current}
              answers={answers}
              markedForReview={markedForReview}
              onNavigate={(i) => {
                onNavigate(i);
                setNavOpen(false);
              }}
            />
            <div className="mt-4">
              <Legend />
            </div>
            <button
              onClick={() => {
                setNavOpen(false);
                onRequestSubmit();
              }}
              className="w-full mt-4 min-h-[48px] rounded-lg bg-green-600 font-semibold"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
