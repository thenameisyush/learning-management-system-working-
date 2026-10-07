import AppError from './AppError.js';

const asBoolean = (v) => {
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return null;
};

const asNumber = (v) => {
  if (v === '' || v === null || v === undefined || typeof v === 'boolean') return NaN;
  return Number(v);
};

/**
 * Validate + normalise the body of POST/PUT /assignments. Only whitelisted
 * fields are ever read (no mass assignment). `existing` (an Assignment
 * document) makes it a partial update. Returns only the fields supplied.
 * Throws AppError(400) listing every problem found.
 */
export function normalizeAssignmentInput(body = {}, existing = null) {
  const errors = [];
  const data = {};
  const has = (k) => body[k] !== undefined;

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

  if (has('dueDate')) {
    if (body.dueDate === '' || body.dueDate === null) {
      data.dueDate = null; // explicitly clearing the due date
    } else {
      const d = new Date(body.dueDate);
      if (Number.isNaN(d.getTime())) errors.push('Due date is not a valid date');
      else data.dueDate = d;
    }
  }

  if (has('totalMarks')) {
    const m = asNumber(body.totalMarks);
    if (!Number.isFinite(m) || m < 0) errors.push('Total marks must be a number, 0 or more');
    else if (m > 1000) errors.push('Total marks cannot be more than 1000');
    else data.totalMarks = m;
  }

  if (has('allowLateSubmission')) {
    const b = asBoolean(body.allowLateSubmission);
    if (b === null) errors.push('allowLateSubmission must be true or false');
    else data.allowLateSubmission = b;
  }

  if (errors.length) throw new AppError(errors.join('. '), 400);
  return data;
}

export const validateGradeInput = (body, totalMarks) => {
  const errors = [];
  const marks = body.marks === '' || body.marks === null || body.marks === undefined ? null : Number(body.marks);

  if (marks === null || Number.isNaN(marks) || marks < 0) {
    errors.push('Marks must be a number, 0 or more');
  } else if (marks > totalMarks) {
    errors.push(`Marks (${marks}) cannot exceed this assignment's total marks (${totalMarks})`);
  }

  if (body.feedback !== undefined && typeof body.feedback === 'string' && body.feedback.length > 3000) {
    errors.push('Feedback cannot be more than 3000 characters');
  }

  if (errors.length) throw new AppError(errors.join('. '), 400);
  return { marks, feedback: typeof body.feedback === 'string' ? body.feedback.trim() : '' };
};
