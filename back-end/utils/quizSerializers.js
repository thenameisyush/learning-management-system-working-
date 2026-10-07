import { correctAnswerOf, questionType } from './quizGrading.js';

/**
 * ALL quiz data leaves the API through these functions.
 * They build objects from an explicit whitelist - a quiz/question document is
 * never spread or sent as-is, so a new secret field can't leak by accident.
 * Only toManagerQuestion / toReviewQuestion may contain answers.
 */

/** Legacy quizzes have only `isPublished`; new ones have `status`. */
export const effectiveStatus = (quiz) =>
  quiz.status || (quiz.isPublished ? 'PUBLISHED' : 'DRAFT');

// Mongo filter equivalent of effectiveStatus === 'PUBLISHED'
export const PUBLISHED_FILTER = {
  $or: [{ status: 'PUBLISHED' }, { status: { $exists: false }, isPublished: true }],
};

/** null = unlimited */
export const attemptLimit = (quiz) => {
  if (!quiz.allowRetry) return 1;
  if (quiz.maxAttempts === 0) return null;
  return quiz.maxAttempts || 3;
};

/** A question as a STUDENT may see it during an attempt: no answer, ever. */
export const toSafeQuestion = (q) => ({
  _id: q._id,
  questionId: q._id,
  text: q.text,
  type: questionType(q),
  options: [...q.options],
  marks: q.marks,
});

/** Authorised teacher/admin view (preview): includes the answer. */
export const toManagerQuestion = (q) => ({
  ...toSafeQuestion(q),
  correctAnswer: correctAnswerOf(q),
  correctOptionIndex: q.correctOptionIndex, // legacy field, kept for the existing UI
});

const quizBase = (quiz) => ({
  _id: quiz._id,
  title: quiz.title,
  description: quiz.description || '',
  instructions: quiz.instructions || '',
  course: quiz.course || null,
  status: effectiveStatus(quiz),
  durationMinutes: quiz.durationMinutes || 0,
  totalMarks: quiz.totalMarks ?? (quiz.questions || []).reduce((s, q) => s + (Number(q.marks) || 0), 0),
  passingMarks: quiz.passingMarks || 0,
  questionCount: (quiz.questions || []).length,
  allowRetry: Boolean(quiz.allowRetry),
  maxAttempts: attemptLimit(quiz), // null = unlimited
  allowReview: quiz.allowReview !== false,
  createdAt: quiz.createdAt,
  updatedAt: quiz.updatedAt,
});

/** Full quiz for teacher/admin, answers included. */
export const toManagerQuiz = (quiz, extra = {}) => ({
  ...quizBase(quiz),
  publishedAt: quiz.publishedAt || null,
  createdBy: quiz.createdBy || null,
  questions: (quiz.questions || []).map(toManagerQuestion),
  canManage: true,
  ...extra,
});

/** List row (no questions at all). `extra` carries per-student attempt info. */
export const toQuizSummary = (quiz, extra = {}) => ({ ...quizBase(quiz), ...extra });

/** Quiz details for a student BEFORE starting: metadata only, no questions. */
export const toStudentQuizDetails = (quiz, extra = {}) => ({
  ...quizBase(quiz),
  canManage: false,
  ...extra,
});

/** The quiz payload returned by /start: questions without answers. */
export const toActiveQuiz = (quiz) => ({
  ...quizBase(quiz),
  questions: quiz.questions.map(toSafeQuestion),
});

export const toAttemptSummary = (attempt) => ({
  _id: attempt._id,
  quiz: attempt.quiz,
  course: attempt.course,
  attemptNumber: attempt.attemptNumber,
  status: attempt.status,
  startedAt: attempt.startedAt,
  submittedAt: attempt.submittedAt || null,
  timeTaken: attempt.timeTaken ?? null,
  score: attempt.score ?? null,
  maxScore: attempt.maxScore ?? null,
  percentage: attempt.percentage ?? null,
  passed: attempt.passed ?? null,
  correctAnswers: attempt.correctAnswers ?? null,
  wrongAnswers: attempt.wrongAnswers ?? null,
  unanswered: attempt.unanswered ?? null,
  totalQuestions: attempt.totalQuestions ?? null,
});

/** Question-by-question review: ONLY for a finished attempt. */
export const toReviewQuestion = (q, answer) => {
  const answered = answer && answer.selectedAnswer !== null && answer.selectedAnswer !== undefined;
  return {
    ...toSafeQuestion(q),
    selectedAnswer: answered ? answer.selectedAnswer : null,
    correctAnswer: correctAnswerOf(q),
    isCorrect: Boolean(answer?.isCorrect),
    marksObtained: answer?.marksObtained ?? 0,
    result: !answered ? 'UNANSWERED' : answer.isCorrect ? 'CORRECT' : 'WRONG',
  };
};
