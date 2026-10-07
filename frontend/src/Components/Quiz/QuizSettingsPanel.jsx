import { DESCRIPTION_MAX, INSTRUCTIONS_MAX, QUIZ_TITLE_MAX } from "../../utils/quizClientValidation";

const inputClass =
  "w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

const Field = ({ label, error, children, hint }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    {children}
    {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

/** Toggle-switch used for allowRetry / allowReview. */
const Switch = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <span
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
        checked ? "bg-indigo-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </span>
  </label>
);

/** Quiz-level metadata: title, description, instructions, timing, retry rules. */
export default function QuizSettingsPanel({ form, errors = {}, showErrors, onChange }) {
  const set = (patch) => onChange({ ...form, ...patch });
  const err = showErrors ? errors : {};

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-5">
      <Field label="Quiz title" error={err.title}>
        <input
          className={inputClass}
          value={form.title}
          maxLength={QUIZ_TITLE_MAX + 20}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="e.g. Chapter 3 - Kinematics"
        />
      </Field>

      <Field label="Description" error={err.description} hint={`${form.description.length}/${DESCRIPTION_MAX}`}>
        <textarea
          rows={2}
          className={`${inputClass} resize-y`}
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="What is this quiz about?"
        />
      </Field>

      <Field label="Instructions for students" error={err.instructions} hint={`${form.instructions.length}/${INSTRUCTIONS_MAX}`}>
        <textarea
          rows={3}
          className={`${inputClass} resize-y`}
          value={form.instructions}
          onChange={(e) => set({ instructions: e.target.value })}
          placeholder="e.g. Read every question carefully. You cannot go back once submitted."
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Time limit (minutes)" error={err.durationMinutes} hint="0 = no time limit">
          <input
            type="number"
            min="0"
            className={inputClass}
            value={form.durationMinutes}
            onChange={(e) => set({ durationMinutes: e.target.value })}
          />
        </Field>

        <Field label="Passing marks" error={err.passingMarks}>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={form.passingMarks}
            onChange={(e) => set({ passingMarks: e.target.value })}
          />
        </Field>
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-3">
        <Switch checked={form.allowRetry} onChange={(v) => set({ allowRetry: v })} label="Allow students to retry" />

        {form.allowRetry && (
          <Field label="Max attempts" error={err.maxAttempts} hint="0 = unlimited attempts">
            <input
              type="number"
              min="0"
              className={`${inputClass} max-w-[140px]`}
              value={form.maxAttempts}
              onChange={(e) => set({ maxAttempts: e.target.value })}
            />
          </Field>
        )}

        <Switch checked={form.allowReview} onChange={(v) => set({ allowReview: v })} label="Let students review answers after submitting" />
      </div>
    </div>
  );
}
