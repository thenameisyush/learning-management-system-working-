import { useState } from "react";

import { totalMarksOf } from "../../utils/quizClientValidation";
import EmptyState from "../UI/EmptyState";

/**
 * Read-only, exam-style preview of the quiz as currently being edited (no
 * network call - this is local, unsaved state). Shows which option is marked
 * correct, since only the teacher/admin ever sees this pane.
 */
export default function QuizPreviewPane({ form, questions }) {
  const [i, setI] = useState(0);

  if (questions.length === 0) {
    return <EmptyState icon="\uD83D\uDC40" title="Nothing to preview yet" message="Add a question to see how it will look to students." />;
  }

  const q = questions[Math.min(i, questions.length - 1)];
  const totalMarks = totalMarksOf(questions);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-xl font-bold text-slate-900">{form.title || "Untitled quiz"}</h2>
        {form.description && <p className="text-slate-600 mt-1">{form.description}</p>}
        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <span className="bg-slate-100 rounded-full px-3 py-1">{questions.length} question{questions.length === 1 ? "" : "s"}</span>
          <span className="bg-slate-100 rounded-full px-3 py-1">{totalMarks} total marks</span>
          <span className="bg-slate-100 rounded-full px-3 py-1">Pass: {form.passingMarks || 0}</span>
          <span className="bg-slate-100 rounded-full px-3 py-1">{Number(form.durationMinutes) > 0 ? `${form.durationMinutes} min` : "No time limit"}</span>
        </div>
        {form.instructions && (
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-600 whitespace-pre-line">
            {form.instructions}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {questions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`min-w-[40px] min-h-[40px] rounded-lg text-sm font-semibold border ${
              idx === i ? "border-indigo-500 bg-indigo-600 text-white" : "border-slate-300 text-slate-600 bg-white"
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <p className="text-xs font-medium text-slate-500 mb-2">
          Question {i + 1} of {questions.length} &middot; {q.marks || 0} mark{Number(q.marks) === 1 ? "" : "s"}
        </p>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{q.text || <span className="text-slate-400">(empty question)</span>}</h3>

        <div className="space-y-2">
          {q.options.map((opt, j) => (
            <div
              key={j}
              className={`p-3 rounded-xl border ${
                q.correctOptionIndex === j ? "border-green-500 bg-green-50" : "border-slate-200"
              }`}
            >
              <span className="font-medium text-slate-500 mr-2">{String.fromCharCode(65 + j)}.</span>
              {opt || <span className="text-slate-400">(empty option)</span>}
              {q.correctOptionIndex === j && <span className="ml-2 text-xs font-semibold text-green-700">Correct answer</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          disabled={i === 0}
          onClick={() => setI((n) => n - 1)}
          className="min-h-[44px] px-4 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          disabled={i === questions.length - 1}
          onClick={() => setI((n) => n + 1)}
          className="min-h-[44px] px-4 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
