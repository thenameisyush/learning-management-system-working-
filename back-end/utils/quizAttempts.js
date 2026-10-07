import QuizAttempt from '../models/QuizAttempt.js';
import { getHandler, gradeAttempt, questionType } from './quizGrading.js';

/**
 * Server-side quiz clock.
 *
 * expiresAt is fixed when the attempt starts. A submission is judged only by
 * the SERVER clock:
 *   ON_TIME  now <= expiresAt                 -> the answers in the request are graded
 *   GRACE    expiresAt < now <= expiresAt+G   -> still graded (network latency of the
 *                                                 client's own auto-submit), flagged AUTO_SUBMITTED
 *   EXPIRED  now > expiresAt+G                -> the request's answers are IGNORED; the
 *                                                 last saved progress is graded instead
 * So changing frontend JavaScript can never buy extra time.
 */
export const graceMs = () => (Number(process.env.QUIZ_SUBMIT_GRACE_SECONDS) || 30) * 1000;

export const timingMode = (attempt, now = new Date()) => {
  if (!attempt.expiresAt) return 'ON_TIME'; // untimed quiz
  const t = now.getTime();
  const end = new Date(attempt.expiresAt).getTime();
  if (t <= end) return 'ON_TIME';
  if (t <= end + graceMs()) return 'GRACE';
  return 'EXPIRED';
};

export const remainingSeconds = (attempt, now = new Date()) =>
  attempt.expiresAt
    ? Math.max(0, Math.ceil((new Date(attempt.expiresAt).getTime() - now.getTime()) / 1000))
    : null;

const answersFromDraft = (quiz, draft = []) => {
  const byId = new Map(quiz.questions.map((q) => [String(q._id), q]));
  const map = new Map();
  for (const d of draft) {
    const q = byId.get(String(d.question));
    if (!q) continue;
    try {
      map.set(String(q._id), getHandler(questionType(q)).parseSelected(q, d.selectedAnswer));
    } catch {
      map.set(String(q._id), null);
    }
  }
  return map;
};

/**
 * Grade and close an attempt. Atomic: the update only matches while the attempt
 * is still IN_PROGRESS, so two racing submissions can never both succeed.
 * Returns the updated attempt, or null if someone else already closed it.
 */
export const finalizeAttempt = async ({ attempt, quiz, mode, answerMap, now = new Date() }) => {
  const expired = mode === 'EXPIRED';
  const map = expired ? answersFromDraft(quiz, attempt.draftAnswers) : answerMap;
  const graded = gradeAttempt(quiz, map);

  const submittedAt = expired ? new Date(attempt.expiresAt) : now;
  let timeTaken = Math.max(0, Math.round((submittedAt - new Date(attempt.startedAt)) / 1000));
  if (attempt.expiresAt) {
    const allowed = Math.round((new Date(attempt.expiresAt) - new Date(attempt.startedAt)) / 1000);
    timeTaken = Math.min(timeTaken, allowed);
  }

  return QuizAttempt.findOneAndUpdate(
    { _id: attempt._id, status: 'IN_PROGRESS' },
    {
      $set: {
        status: mode === 'ON_TIME' ? 'SUBMITTED' : 'AUTO_SUBMITTED',
        submittedAt,
        timeTaken,
        answers: graded.answers,
        score: graded.score,
        maxScore: graded.maxScore,
        correctAnswers: graded.correctAnswers,
        wrongAnswers: graded.wrongAnswers,
        unanswered: graded.unanswered,
        totalQuestions: graded.totalQuestions,
        percentage: graded.percentage,
        passed: graded.score >= (quiz.passingMarks || 0),
      },
      $unset: { draftAnswers: '' },
    },
    { new: true, runValidators: true }
  );
};

/** Close an abandoned attempt once it is past deadline + grace. Returns the closed attempt or null. */
export const finalizeIfExpired = async (attempt, quiz, now = new Date()) => {
  if (attempt.status !== 'IN_PROGRESS' || timingMode(attempt, now) !== 'EXPIRED') return null;
  return finalizeAttempt({ attempt, quiz, mode: 'EXPIRED', now });
};

export const finalizeExpiredForQuiz = async (quiz, now = new Date()) => {
  const stale = await QuizAttempt.find({
    quiz: quiz._id,
    status: 'IN_PROGRESS',
    expiresAt: { $ne: null, $lt: new Date(now.getTime() - graceMs()) },
  });
  for (const attempt of stale) await finalizeIfExpired(attempt, quiz, now);
};
