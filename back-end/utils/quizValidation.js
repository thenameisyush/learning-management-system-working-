import mongoose from 'mongoose';

import AppError from './AppError.js';
import { getHandler, round2 } from './quizGrading.js';
import { QUESTION_TYPES } from '../models/Quiz.js';

const asBoolean = (v) => {
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return null;
};

const asNumber = (v) => {
  if (v === '' || v === null || typeof v === 'boolean') return NaN;
  return Number(v);
};

const normalizeType = (v) => String(v ?? 'MCQ').trim().toUpperCase().replace(/[-\s]/g, '_');

/**
 * Validate + normalise the body of POST/PUT /quizzes.
 *  - only whitelisted fields are ever read (no mass assignment)
 *  - totalMarks is NOT accepted: it is always computed from the questions
 *  - `existing` (a quiz document) makes it a partial update
 * Returns only the fields that were supplied (plus derived retry values).
 * Throws AppError(400) listing every problem found.
 */
export function normalizeQuizInput(body = {}, existing = null) {
  const errors = [];
  const data = {};
  const has = (k) => body[k] !== undefined;

  // ---- text fields --------------------------------------------------------
  if (!existing || has('title')) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) errors.push('Title is required');
    else if (title.length > 150) errors.push('Title cannot be more than 150 characters');
    else data.title = title;
  }

  for (const [key, max] of [['description', 2000], ['instructions', 5000]]) {
    if (has(key)) {
      if (typeof body[key] !== 'string') errors.push(`${key} must be text`);
      else if (body[key].length > max) errors.push(`${key} cannot be more than ${max} characters`);
      else data[key] = body[key].trim();
    }
  }

  // ---- duration (0 = no time limit) ---------------------------------------
  const rawDuration = body.durationMinutes ?? body.duration;
  if (rawDuration !== undefined) {
    const d = asNumber(rawDuration);
    if (!Number.isFinite(d) || d < 0) errors.push('Duration must be a number of minutes, 0 or more');
    else if (d > 600) errors.push('Duration cannot be more than 600 minutes');
    else data.durationMinutes = d;
  }

  // ---- questions ----------------------------------------------------------
  if (has('questions')) {
    if (!Array.isArray(body.questions)) {
      errors.push('questions must be an array');
    } else if (body.questions.length > 200) {
      errors.push('A quiz can have at most 200 questions');
    } else {
      const existingIds = new Set((existing?.questions || []).map((q) => String(q._id)));
      const questions = [];

      body.questions.forEach((raw, i) => {
        const label = `Question ${i + 1}`;
        if (!raw || typeof raw !== 'object') return errors.push(`${label}: invalid question`);

        const text = String(raw.text ?? raw.question ?? '').trim();
        if (!text) return errors.push(`${label}: question text is required`);
        if (text.length > 1000) return errors.push(`${label}: question text is too long (max 1000)`);

        const type = normalizeType(raw.type ?? raw.questionType);
        if (!QUESTION_TYPES.includes(type)) {
          return errors.push(`${label}: type must be one of ${QUESTION_TYPES.join(', ')}`);
        }

        const marks = raw.marks === undefined ? 1 : asNumber(raw.marks);
        if (!Number.isFinite(marks) || marks <= 0 || marks > 1000) {
          return errors.push(`${label}: marks must be a number greater than 0`);
        }

        let core;
        try {
          core = getHandler(type).normalize(raw);
        } catch (err) {
          return errors.push(`${label}: ${err.message}`);
        }

        const q = { text, type, marks: round2(marks), ...core };
        const id = String(raw._id ?? raw.questionId ?? '');
        if (id && existingIds.has(id)) q._id = id; // keep ids of existing questions stable
        questions.push(q);
      });

      data.questions = questions;
    }
  }

  // ---- passing marks (must fit the FINAL set of questions) ----------------
  const finalQuestions = data.questions ?? existing?.questions ?? [];
  const totalMarks = round2(finalQuestions.reduce((s, q) => s + (Number(q.marks) || 0), 0));

  if (has('passingMarks')) {
    const p = asNumber(body.passingMarks);
    if (!Number.isFinite(p) || p < 0) errors.push('Passing marks must be a number, 0 or more');
    else data.passingMarks = round2(p);
  }
  const finalPassing = data.passingMarks ?? existing?.passingMarks ?? 0;
  if (finalPassing > totalMarks) {
    errors.push(`Passing marks (${finalPassing}) cannot exceed total marks (${totalMarks})`);
  }

  // ---- retry rules --------------------------------------------------------
  let allow = existing?.allowRetry ?? false;
  if (has('allowRetry')) {
    const b = asBoolean(body.allowRetry);
    if (b === null) errors.push('allowRetry must be true or false');
    else allow = b;
  }

  let maxAttempts;
  if (has('maxAttempts')) {
    const m = asNumber(body.maxAttempts);
    if (!Number.isInteger(m) || m < 0 || m > 100) {
      errors.push('maxAttempts must be a whole number from 0 to 100 (0 = unlimited)');
    } else maxAttempts = m;
  }

  if (!existing || has('allowRetry') || has('maxAttempts')) {
    data.allowRetry = allow;
    if (!allow) data.maxAttempts = 1; // no retry = exactly one attempt
    else data.maxAttempts = maxAttempts ?? (existing?.allowRetry ? existing.maxAttempts : 3);
  }

  if (has('allowReview')) {
    const b = asBoolean(body.allowReview);
    if (b === null) errors.push('allowReview must be true or false');
    else data.allowReview = b;
  }

  if (errors.length) throw new AppError(errors.join('. '), 400);
  return data;
}

/** A quiz can only be published when students could actually take it. */
export function assertPublishable(quiz) {
  const problems = [];
  if (!quiz.questions?.length) problems.push('add at least one question');
  const total = (quiz.questions || []).reduce((s, q) => s + (Number(q.marks) || 0), 0);
  if (total <= 0) problems.push('total marks must be greater than 0');
  if ((quiz.passingMarks || 0) > total) problems.push('passing marks cannot exceed total marks');
  if (problems.length) throw new AppError(`Cannot publish: ${problems.join(', ')}`, 400);
}

export const isValidId = (id) => mongoose.Types.ObjectId.isValid(id) && String(id).length === 24;

/** Content-only comparison (ids ignored) used to lock question edits once attempts exist. */
export const questionsEqual = (a = [], b = []) =>
  a.length === b.length &&
  a.every((q, i) => {
    const o = b[i];
    return (
      q.text === o.text &&
      (q.type || 'MCQ') === (o.type || 'MCQ') &&
      q.correctOptionIndex === o.correctOptionIndex &&
      Number(q.marks) === Number(o.marks) &&
      q.options.length === o.options.length &&
      q.options.every((opt, j) => opt === o.options[j])
    );
  });
