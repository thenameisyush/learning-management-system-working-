import { FaCopy, FaGripVertical, FaTrash } from "react-icons/fa";

import { MAX_OPTIONS, MIN_OPTIONS, OPTION_MAX } from "../../utils/quizClientValidation";

const inputClass =
  "w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

/**
 * One question card in the quiz builder. Purely controlled - all state lives
 * in the parent (QuizCreate) so drag/duplicate/remove stay simple.
 */
export default function QuestionEditor({
  question: q,
  index,
  errors = {},
  showErrors,
  onChange,
  onDuplicate,
  onRemove,
  canRemove,
}) {
  const set = (patch) => onChange({ ...q, ...patch });

  function setType(type) {
    if (type === q.type) return;
    set(
      type === "TRUE_FALSE"
        ? { type, options: ["True", "False"], correctOptionIndex: 0 }
        : { type, options: ["", ""], correctOptionIndex: 0 }
    );
  }

  function setOption(i, value) {
    const options = [...q.options];
    options[i] = value;
    set({ options });
  }

  function addOption() {
    if (q.options.length >= MAX_OPTIONS) return;
    set({ options: [...q.options, ""] });
  }

  function removeOption(i) {
    if (q.options.length <= MIN_OPTIONS) return;
    const options = q.options.filter((_, idx) => idx !== i);
    set({ options, correctOptionIndex: q.correctOptionIndex === i ? 0 : q.correctOptionIndex > i ? q.correctOptionIndex - 1 : q.correctOptionIndex });
  }

  const err = showErrors ? errors : {};

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold text-sm">
            {index + 1}
          </span>
          <h3 className="font-semibold text-slate-800">Question {index + 1}</h3>
          <FaGripVertical className="text-slate-300 hidden sm:block" aria-hidden="true" />
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicate question"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            <FaCopy aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            title={canRemove ? "Remove question" : "A quiz needs at least one question"}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <FaTrash aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* type toggle */}
      <div className="flex gap-2">
        {[
          ["MCQ", "Multiple Choice"],
          ["TRUE_FALSE", "True / False"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              q.type === value
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* question text */}
      <div>
        <textarea
          rows={2}
          className={`${inputClass} resize-y`}
          placeholder="Enter the question..."
          value={q.text}
          onChange={(e) => set({ text: e.target.value })}
        />
        {err.text && <p className="mt-1 text-sm text-red-600">{err.text}</p>}
      </div>

      {/* options */}
      <div>
        <div className="flex justify-between mb-2">
          <p className="text-sm font-medium text-slate-700">Options</p>
          <p className="text-sm font-medium text-slate-700">Correct</p>
        </div>

        <div className="space-y-2">
          {q.options.map((opt, j) => (
            <div
              key={j}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                q.correctOptionIndex === j ? "border-indigo-400 bg-indigo-50/60" : "border-slate-200"
              }`}
            >
              <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-semibold text-sm">
                {String.fromCharCode(65 + j)}
              </span>

              {q.type === "TRUE_FALSE" ? (
                <span className="flex-1 text-slate-800 font-medium">{opt}</span>
              ) : (
                <input
                  className="flex-1 min-h-[40px] bg-transparent outline-none text-slate-800"
                  value={opt}
                  maxLength={OPTION_MAX}
                  placeholder={`Option ${j + 1}`}
                  onChange={(e) => setOption(j, e.target.value)}
                />
              )}

              <label className="flex items-center gap-2 shrink-0 cursor-pointer select-none">
                <input
                  type="radio"
                  name={`correct-${q.key}`}
                  checked={q.correctOptionIndex === j}
                  onChange={() => set({ correctOptionIndex: j })}
                  className="w-5 h-5 accent-indigo-600"
                />
              </label>

              {q.type === "MCQ" && q.options.length > MIN_OPTIONS && (
                <button
                  type="button"
                  onClick={() => removeOption(j)}
                  aria-label={`Remove option ${String.fromCharCode(65 + j)}`}
                  className="shrink-0 min-h-[44px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-red-500"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>

        {q.type === "MCQ" && q.options.length < MAX_OPTIONS && (
          <button type="button" onClick={addOption} className="mt-2 text-sm font-medium text-indigo-600 hover:underline">
            + Add option
          </button>
        )}

        {(err.options || err.correctAnswer) && (
          <p className="mt-2 text-sm text-red-600">{err.options || err.correctAnswer}</p>
        )}
      </div>

      {/* marks */}
      <div className="max-w-[140px]">
        <label className="block text-sm font-medium text-slate-700 mb-1">Marks</label>
        <input
          type="number"
          min="1"
          step="1"
          value={q.marks}
          onChange={(e) => set({ marks: e.target.value })}
          className={inputClass}
        />
        {err.marks && <p className="mt-1 text-sm text-red-600">{err.marks}</p>}
      </div>
    </div>
  );
}
