import AppError from './AppError.js';

/**
 * Question-type registry.
 *
 * To add a new question type (e.g. MULTI_SELECT, SHORT_TEXT):
 *   1. add it to QUESTION_TYPES in models/Quiz.js
 *   2. add a handler below with the same four functions
 * Nothing else in the grading / attempt flow needs to change.
 *
 * Handler contract
 *   normalize(raw)          -> { options, correctOptionIndex }   (throws Error(msg) when invalid)
 *   parseSelected(q, raw)   -> the student's answer in stored form, or null = unanswered (throws Error(msg))
 *   isCorrect(q, selected)  -> boolean
 *   correctAnswer(q)        -> the answer as exposed to authorised users
 */

const asInt = (v) => {
  if (typeof v === 'number' && Number.isInteger(v)) return v;
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return parseInt(v, 10);
  return null;
};

const asBool = (v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true') return true;
    if (s === 'false') return false;
  }
  return null;
};

const isBlank = (v) => v === null || v === undefined || v === '';

const handlers = {
  MCQ: {
    normalize(raw) {
      if (!Array.isArray(raw.options)) throw new Error('options must be an array');
      const options = raw.options.map((o) => (typeof o === 'string' ? o.trim() : ''));
      if (options.length < 2 || options.length > 6) throw new Error('an MCQ needs between 2 and 6 options');

      const blank = options.findIndex((o) => !o);
      if (blank !== -1) throw new Error(`option ${String.fromCharCode(65 + blank)} is empty`);
      if (options.some((o) => o.length > 300)) throw new Error('an option cannot be longer than 300 characters');
      if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) {
        throw new Error('options must be different from each other');
      }

      const correct = asInt(raw.correctAnswer ?? raw.correctOptionIndex);
      if (correct === null || correct < 0 || correct >= options.length) {
        throw new Error('choose which option is correct');
      }
      return { options, correctOptionIndex: correct };
    },

    parseSelected(q, raw) {
      if (isBlank(raw)) return null;
      const idx = asInt(raw);
      if (idx === null || idx < 0 || idx >= q.options.length) throw new Error('selected option is invalid');
      return idx;
    },

    isCorrect: (q, selected) => selected === q.correctOptionIndex,
    correctAnswer: (q) => q.correctOptionIndex,
  },

  TRUE_FALSE: {
    normalize(raw) {
      const correct = asBool(raw.correctAnswer);
      if (correct === null) throw new Error('correctAnswer must be true or false');
      // Fixed options: index 0 = True, index 1 = False
      return { options: ['True', 'False'], correctOptionIndex: correct ? 0 : 1 };
    },

    parseSelected(_q, raw) {
      if (isBlank(raw)) return null;
      const b = asBool(raw);
      if (b === null) throw new Error('answer must be true or false');
      return b;
    },

    isCorrect: (q, selected) => selected === (q.correctOptionIndex === 0),
    correctAnswer: (q) => q.correctOptionIndex === 0,
  },
};

export const getHandler = (type = 'MCQ') => handlers[type] || null;
export const questionType = (q) => q.type || 'MCQ'; // legacy questions have no type

export const correctAnswerOf = (q) => getHandler(questionType(q)).correctAnswer(q);

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Validate the answers array sent by the client and turn it into
 * Map<questionId, storedAnswer|null>. Only ids + selected answers are read -
 * anything else in the payload (score, isCorrect, ...) is ignored.
 */
export const parseAnswerList = (quiz, rawAnswers) => {
  if (!Array.isArray(rawAnswers)) throw new AppError('answers must be an array', 400);

  const byId = new Map(quiz.questions.map((q) => [String(q._id), q]));
  const parsed = new Map();

  for (const item of rawAnswers) {
    const id = item && String(item.questionId ?? item.question ?? '');
    const question = byId.get(id);
    if (!question) throw new AppError('Answers contain a question that is not part of this quiz', 400);
    if (parsed.has(id)) throw new AppError('Duplicate answer for the same question', 400);

    try {
      parsed.set(id, getHandler(questionType(question)).parseSelected(question, item.selectedAnswer));
    } catch (err) {
      throw new AppError(`Invalid answer for "${question.text.slice(0, 40)}": ${err.message}`, 400);
    }
  }

  return parsed;
};

/** Grade on the server. Returns one graded entry per question (unanswered included). */
export const gradeAttempt = (quiz, answerMap) => {
  let score = 0;
  let maxScore = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let unanswered = 0;

  const answers = quiz.questions.map((q) => {
    const marks = Number(q.marks) || 0;
    maxScore += marks;

    const selected = answerMap.has(String(q._id)) ? answerMap.get(String(q._id)) : null;

    if (selected === null) {
      unanswered += 1;
      return { question: q._id, selectedAnswer: null, isCorrect: false, marksObtained: 0 };
    }

    const isCorrect = getHandler(questionType(q)).isCorrect(q, selected);
    if (isCorrect) {
      correctAnswers += 1;
      score += marks;
    } else {
      wrongAnswers += 1;
    }
    return { question: q._id, selectedAnswer: selected, isCorrect, marksObtained: isCorrect ? marks : 0 };
  });

  score = round2(score);
  maxScore = round2(maxScore);

  return {
    answers,
    score,
    maxScore,
    correctAnswers,
    wrongAnswers,
    unanswered,
    totalQuestions: quiz.questions.length,
    percentage: maxScore > 0 ? round2((score / maxScore) * 100) : 0,
  };
};
