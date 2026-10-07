/**
 * Client-side validation for the quiz builder. Mirrors the backend's
 * back-end/utils/quizValidation.js so the teacher sees the same errors
 * immediately instead of only after a round trip - but the backend is the
 * final authority, so nothing here weakens that.
 */
export const QUIZ_TITLE_MAX = 150;
export const DESCRIPTION_MAX = 2000;
export const INSTRUCTIONS_MAX = 5000;
export const OPTION_MAX = 300;
export const MAX_OPTIONS = 6;
export const MIN_OPTIONS = 2;
export const MAX_QUESTIONS = 200;

export const emptyQuestion = () => ({
  key: crypto.randomUUID(),
  text: "",
  type: "MCQ",
  options: ["", ""],
  correctOptionIndex: 0,
  marks: 1,
});

export const totalMarksOf = (questions) =>
  questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

/** Validates one question. Returns a map of field -> message (empty = valid). */
export function validateQuestion(q) {
  const errors = {};

  if (!q.text.trim()) errors.text = "Question text is required";
  else if (q.text.length > 1000) errors.text = "Question text is too long (max 1000 characters)";

  if (q.type === "MCQ") {
    const options = q.options.map((o) => o.trim());
    if (options.length < MIN_OPTIONS) errors.options = `Add at least ${MIN_OPTIONS} options`;
    else if (options.length > MAX_OPTIONS) errors.options = `A question can have at most ${MAX_OPTIONS} options`;
    else {
      const blank = options.findIndex((o) => !o);
      if (blank !== -1) errors.options = `Option ${String.fromCharCode(65 + blank)} is empty`;
      else if (options.some((o) => o.length > OPTION_MAX)) errors.options = `An option cannot be longer than ${OPTION_MAX} characters`;
      else if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) {
        errors.options = "Options must be different from each other";
      }
    }
    if (q.correctOptionIndex === null || q.correctOptionIndex === undefined || q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
      errors.correctAnswer = "Choose which option is correct";
    }
  } else if (q.type === "TRUE_FALSE") {
    if (q.correctOptionIndex !== 0 && q.correctOptionIndex !== 1) {
      errors.correctAnswer = "Choose True or False";
    }
  }

  const marks = Number(q.marks);
  if (!Number.isFinite(marks) || marks <= 0) errors.marks = "Marks must be greater than 0";
  else if (marks > 1000) errors.marks = "Marks cannot be more than 1000";

  return errors;
}

/** Validates the whole quiz. Returns { meta: {...}, questions: [{...}, ...], valid }. */
export function validateQuiz({ title, description, instructions, durationMinutes, passingMarks, allowRetry, maxAttempts, questions }) {
  const meta = {};

  if (!title.trim()) meta.title = "Title is required";
  else if (title.length > QUIZ_TITLE_MAX) meta.title = `Title cannot be more than ${QUIZ_TITLE_MAX} characters`;

  if (description.length > DESCRIPTION_MAX) meta.description = `Description cannot be more than ${DESCRIPTION_MAX} characters`;
  if (instructions.length > INSTRUCTIONS_MAX) meta.instructions = `Instructions cannot be more than ${INSTRUCTIONS_MAX} characters`;

  const duration = Number(durationMinutes);
  if (!Number.isFinite(duration) || duration < 0) meta.durationMinutes = "Duration must be 0 or more minutes";
  else if (duration > 600) meta.durationMinutes = "Duration cannot be more than 600 minutes";

  if (questions.length === 0) meta.questions = "Add at least one question";
  else if (questions.length > MAX_QUESTIONS) meta.questions = `A quiz can have at most ${MAX_QUESTIONS} questions`;

  const total = totalMarksOf(questions);
  const passing = Number(passingMarks);
  if (!Number.isFinite(passing) || passing < 0) meta.passingMarks = "Passing marks must be 0 or more";
  else if (passing > total) meta.passingMarks = `Passing marks (${passing}) cannot exceed total marks (${total})`;

  if (allowRetry) {
    const attempts = Number(maxAttempts);
    if (!Number.isInteger(attempts) || attempts < 0 || attempts > 100) {
      meta.maxAttempts = "Must be a whole number from 0 to 100 (0 = unlimited)";
    }
  }

  const questionErrors = questions.map(validateQuestion);

  const valid =
    Object.keys(meta).length === 0 && questionErrors.every((e) => Object.keys(e).length === 0);

  return { meta, questions: questionErrors, valid };
}

/** Turns the builder's local question shape into the API payload shape. */
export const toApiQuestion = (q) => ({
  ...(q._id ? { _id: q._id } : {}),
  text: q.text.trim(),
  type: q.type,
  options: q.type === "TRUE_FALSE" ? ["True", "False"] : q.options.map((o) => o.trim()),
  correctAnswer: q.type === "TRUE_FALSE" ? q.correctOptionIndex === 0 : q.correctOptionIndex,
  marks: Number(q.marks),
});
