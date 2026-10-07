// node --test tests/assignment-security.test.mjs
// MongoDB and Cloudinary are replaced by in-memory stand-ins (with a tiny
// query matcher, shared with quiz-security.test.mjs's approach); everything
// else is REAL: routing, auth, roles, course-access rules, validation,
// status computation, late detection, and file streaming headers.
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const { default: express } = await import('express');
const { default: cookieParser } = await import('cookie-parser');
const { default: jwt } = await import('jsonwebtoken');
const { default: cloudinary } = await import('cloudinary');
const { default: mongoose } = await import('mongoose');
const { default: Course } = await import('../models/course.model.js');
const { default: Assignment } = await import('../models/Assignment.js');
const { default: Submission } = await import('../models/Submission.js');
const { default: Enrollment } = await import('../models/Enrollment.js');
const { default: User } = await import('../models/user.model.js');
const { default: assignmentRoutes } = await import('../routes/assignment.routes.js');
const { default: errorMiddleware } = await import('../middlewares/error.Middleware.js');

const oid = () => new mongoose.Types.ObjectId();
const S = (v) => String(v && v._id ? v._id : v);

// ---- tiny Mongo-ish matcher (same shape as quiz-security.test.mjs) --------
const isOp = (v) => v && typeof v === 'object' && !(v instanceof mongoose.Types.ObjectId) && !(v instanceof Date) && Object.keys(v).some((k) => k.startsWith('$'));
const matches = (doc, filter = {}) =>
  Object.entries(filter).every(([k, v]) => {
    const val = doc[k];
    if (isOp(v)) {
      return Object.entries(v).every(([op, arg]) => {
        if (op === '$in') return arg.map(S).includes(S(val));
        throw new Error(`matcher: unsupported ${op}`);
      });
    }
    return S(val) === S(v);
  });

class Query {
  constructor(value) { this.value = value; }
  sort(spec) {
    if (Array.isArray(this.value)) {
      const [[k, dir]] = Object.entries(spec);
      this.value = [...this.value].sort((a, b) => {
        const av = a[k] ?? new Date(0), bv = b[k] ?? new Date(0);
        return (av > bv ? 1 : av < bv ? -1 : 0) * dir;
      });
    }
    return this;
  }
  limit(n) { if (Array.isArray(this.value)) this.value = this.value.slice(0, n); return this; }
  select() { return this; }
  populate(opts) { globalThis.__populateOpts = opts; return this; }
  then(res, rej) { return Promise.resolve(this.value).then(res, rej); }
}
const q = (v) => new Query(v);

// ---- state + stubs ---------------------------------------------------------
const ids = { admin: oid(), t1: oid(), t2: oid(), s1: oid(), s2: oid(), outsider: oid(), subscriber: oid() };
const users = new Map(Object.entries({
  admin: 'ADMIN', t1: 'TEACHER', t2: 'TEACHER', s1: 'USER', s2: 'USER', outsider: 'USER', subscriber: 'USER',
}).map(([k, role]) => [S(ids[k]), { _id: ids[k], role, ...(k === 'subscriber' ? { subscription: { status: 'active' } } : {}) }]));

let courseA, courseB, assignments, submissions, enrollments, uploaded, destroyed, failUploadAt;

Assignment.prototype.save = async function () { await this.validate(); if (!assignments.includes(this)) assignments.push(this); return this; };
Assignment.prototype.deleteOne = async function () { assignments.splice(assignments.indexOf(this), 1); };
Assignment.find = (f) => q(assignments.filter((d) => matches(d, f)));
Assignment.findById = (id) => q(assignments.find((d) => S(d) === S(id)) || null);
Assignment.create = async (data) => { const a = new Assignment(data); await a.save(); return a; };

Submission.prototype.save = async function () {
  await this.validate();
  const clash = submissions.some((s) => s !== this && String(s.assignment) === String(this.assignment) && String(s.student) === String(this.student));
  if (clash) throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
  if (!submissions.includes(this)) submissions.push(this);
  return this;
};
Submission.prototype.deleteOne = async function () { submissions.splice(submissions.indexOf(this), 1); };
Submission.find = (f) => q(submissions.filter((d) => matches(d, f)));
Submission.findOne = (f) => q(submissions.find((d) => matches(d, f)) || null);
Submission.findById = (id) => q(submissions.find((d) => S(d) === S(id)) || null);
Submission.countDocuments = async (f) => submissions.filter((d) => matches(d, f)).length;
Submission.deleteMany = async (f) => { for (const d of submissions.filter((x) => matches(x, f))) submissions.splice(submissions.indexOf(d), 1); };
Submission.create = async (data) => { const s = new Submission(data); await s.save(); return s; };

Course.findById = (id) => q([courseA, courseB].find((c) => S(c) === S(id)) || null);
Course.find = (f) => q([courseA, courseB].filter((c) => matches(c, f)));
User.findById = (id) => q(users.get(S(id)) || null);
Enrollment.exists = async (f) => (enrollments.find((e) => String(e.user) === String(f.user) && String(e.course) === String(f.course) && e.status === 'active') ? { _id: 1 } : null);
Enrollment.find = (f) => q(enrollments.filter((e) => matches(e, f)));

let fileServer, fileBase;
cloudinary.v2.uploader.upload = async (_path, opts) => {
  if (failUploadAt !== undefined && uploaded.length === failUploadAt) throw new Error('boom');
  const r = { public_id: `${opts.folder}/${opts.public_id}`, opts };
  uploaded.push(r);
  return r;
};
cloudinary.v2.uploader.destroy = async (id, opts) => { destroyed.push({ id, opts }); return { result: 'ok' }; };
cloudinary.v2.url = (id, opts) => { globalThis.__lastUrlOpts = opts; return `${fileBase}/${id}`; };

// ---- app -------------------------------------------------------------------
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/assignments', assignmentRoutes);
app.use(errorMiddleware);

let server, root;
before(async () => {
  fileServer = http.createServer((req, res) => { res.setHeader('content-type', 'text/html'); res.end('%PDF-fake-bytes'); });
  await new Promise((r) => fileServer.listen(0, r));
  fileBase = `http://127.0.0.1:${fileServer.address().port}`;
  server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  root = `http://127.0.0.1:${server.address().port}/api/v1/assignments`;
});
after(() => { server.close(); fileServer.close(); });

beforeEach(() => {
  assignments = []; submissions = []; enrollments = []; uploaded = []; destroyed = []; failUploadAt = undefined;
  courseA = new Course({ title: 'Physics Batch 2026', description: 'A description that is long enough.', category: 'Science', createdBy: 'T1', instructor: ids.t1 });
  courseB = new Course({ title: 'Chemistry Batch 2026', description: 'A description that is long enough.', category: 'Science', createdBy: 'T2', instructor: ids.t2 });
  enrollments.push({ user: ids.s1, course: courseA._id, status: 'active' }, { user: ids.s2, course: courseA._id, status: 'active' });
});

// ---- helpers -----------------------------------------------------------------
const cookie = (who) => ({ Cookie: `token=${jwt.sign({ id: S(ids[who]), role: users.get(S(ids[who])).role }, 'test-secret')}` });
const asJson = (who, body) => fetch(`${root}${''}`, {}); // unused placeholder (kept out of call sites below)
const callJson = async (method, path, who, body) => {
  const res = await fetch(`${root}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(who ? cookie(who) : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, body: json, text };
};
const form = (fields = {}, files = [], fileField = 'attachments') => {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)));
  files.forEach((f) => fd.append(fileField, new Blob([f.content ?? 'x'], { type: f.type || 'application/pdf' }), f.name));
  return fd;
};
const callForm = async (method, path, who, fields, files, fileField) => {
  const res = await fetch(`${root}${path}`, { method, ...(who ? { headers: cookie(who) } : {}), body: form(fields, files, fileField) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, body: json, text };
};
const pdf = (name = 'homework.pdf') => ({ name, content: '%PDF-1.4 test' });

const createAssignment = async (over = {}, who = 't1') => {
  const r = await callForm('POST', '/', who, { courseId: S(courseA._id), title: 'Essay 1', description: 'Write about photosynthesis', dueDate: '2026-10-01T00:00:00.000Z', totalMarks: 20, ...over });
  assert.equal(r.status, 201, r.text);
  return r.body.assignment;
};

// =========================== ACCESS TO MANAGEMENT ============================
test('unauthenticated cannot do anything -> 401', async () => {
  assert.equal((await callJson('GET', '/', null)).status, 401);
  assert.equal((await callForm('POST', '/', null, { courseId: S(courseA._id), title: 'x' })).status, 401);
  assert.equal((await callJson('GET', `/${oid()}`, null)).status, 401);
});

test('student cannot create, edit or delete an assignment -> 403', async () => {
  const denied = await callForm('POST', '/', 's1', { courseId: S(courseA._id), title: 'x' });
  assert.equal(denied.status, 403);
  const a = await createAssignment();
  assert.equal((await callForm('PUT', `/${a._id}`, 's1', { title: 'Hacked' })).status, 403);
  assert.equal((await callJson('DELETE', `/${a._id}`, 's1')).status, 403);
  assert.equal(assignments[0].title, 'Essay 1');
});

test('teacher creates an assignment for their own course; totalMarks/createdBy trusted only from the server', async () => {
  const a = await createAssignment({ createdBy: S(ids.admin) });
  assert.equal(S(assignments[0].createdBy), S(ids.t1));
  assert.equal(S(assignments[0].course), S(courseA._id));
  assert.equal(a.canManage, true);
});

test("teacher cannot create in, or modify assignments of, another teacher's course -> 403", async () => {
  assert.equal((await callForm('POST', '/', 't2', { courseId: S(courseA._id), title: 'x' })).status, 403);
  const a = await createAssignment();
  assert.equal((await callForm('PUT', `/${a._id}`, 't2', { title: 'Stolen' })).status, 403);
  assert.equal((await callJson('DELETE', `/${a._id}`, 't2')).status, 403);
  assert.equal((await callJson('GET', `/${a._id}/submissions`, 't2')).status, 403);
  assert.equal(assignments[0].title, 'Essay 1');
});

test('admin manages assignments of every course', async () => {
  const r = await callForm('POST', '/', 'admin', { courseId: S(courseB._id), title: 'Admin Essay' });
  assert.equal(r.status, 201, r.text);
  const id = r.body.assignment._id;
  assert.equal((await callForm('PUT', `/${id}`, 'admin', { title: 'Renamed' })).status, 200);
  assert.equal((await callJson('DELETE', `/${id}`, 'admin')).status, 200);
  assert.equal(assignments.length, 0);
});

// =========================== VISIBILITY ============================
test('assignment is visible to enrolled students and subscribers, not to outsiders (404, not 403 - no id-probing)', async () => {
  const a = await createAssignment();
  assert.equal((await callJson('GET', `/${a._id}`, 's1')).status, 200);
  assert.equal((await callJson('GET', `/${a._id}`, 'subscriber')).status, 200, 'platform subscription still works');
  const out = await callJson('GET', `/${a._id}`, 'outsider');
  assert.equal(out.status, 404);
  assert.equal((await callJson('GET', '/?courseId=' + courseA._id, 'outsider')).status, 403, 'listing by courseId is still a 403 (course itself is not secret)');

  process.env.SUBSCRIPTION_GRANTS_ALL_COURSES = 'false';
  assert.equal((await callJson('GET', `/${a._id}`, 'subscriber')).status, 404);
  delete process.env.SUBSCRIPTION_GRANTS_ALL_COURSES;
});

test('cross-course list only returns assignments the caller can manage or access', async () => {
  await createAssignment({ title: 'Course A essay' }, 't1');
  const r = await callForm('POST', '/', 't2', { courseId: S(courseB._id), title: 'Course B essay' });
  assert.equal(r.status, 201, r.text);
  assert.equal((await callJson('GET', '/', 's1')).body.assignments.length, 1);
  assert.equal((await callJson('GET', '/', 't1')).body.assignments.length, 1);
  assert.equal((await callJson('GET', '/', 'admin')).body.assignments.length, 2);
  assert.equal((await callJson('GET', '/', 'outsider')).body.assignments.length, 0);
});

// =========================== SUBMISSION + STATUS ============================
test('student submits with text only; student comes from the session, not the body; status becomes SUBMITTED', async () => {
  const a = await createAssignment({ dueDate: '' }); // no due date -> never late
  const r = await callForm('POST', `/${a._id}/submit`, 's1', { text: 'My essay text', student: S(ids.s2) }, [], 'files');
  assert.equal(r.status, 200, r.text);
  assert.equal(submissions.length, 1);
  assert.equal(S(submissions[0].student), S(ids.s1));
  assert.equal(S(submissions[0].course), S(courseA._id));
  assert.equal(r.body.submission.status, 'SUBMITTED');
  assert.equal(r.body.submission.late, false);
});

test('empty submission (no text, no files) is rejected', async () => {
  const a = await createAssignment();
  const r = await callForm('POST', `/${a._id}/submit`, 's1', {}, [], 'files');
  assert.equal(r.status, 400);
});

test('student submits a Google Drive link; link is stored and returned, no Cloudinary upload is used', async () => {
  const a = await createAssignment();

  const driveLink =
    'https://drive.google.com/file/d/1ExampleDriveFileId/view';

  const r = await callJson(
    'POST',
    `/${a._id}/submit`,
    's1',
    {
      text: 'see attached',
      driveLink,
      student: S(ids.s2),
    }
  );

  assert.equal(r.status, 200, r.text);
  assert.equal(submissions.length, 1);
  assert.equal(S(submissions[0].student), S(ids.s1));
  assert.equal(submissions[0].driveLink, driveLink);
  assert.equal(r.body.submission.driveLink, driveLink);
  assert.equal(uploaded.length, 0);
});

test('teachers/admins cannot submit assignments', async () => {
  const a = await createAssignment();
  assert.equal((await callForm('POST', `/${a._id}/submit`, 't1', { text: 'x' }, [], 'files')).status, 403);
  assert.equal((await callForm('POST', `/${a._id}/submit`, 'admin', { text: 'x' }, [], 'files')).status, 403);
});

test('student without course access cannot submit (404)', async () => {
  const a = await createAssignment();
  assert.equal((await callForm('POST', `/${a._id}/submit`, 'outsider', { text: 'x' }, [], 'files')).status, 404);
});

test('late detection: submitting after the due date sets late=true and status=LATE when allowed', async () => {
  const a = await createAssignment({ dueDate: '2000-01-01T00:00:00.000Z', allowLateSubmission: 'true' });
  const r = await callForm('POST', `/${a._id}/submit`, 's1', { text: 'sorry, this is late' }, [], 'files');
  assert.equal(r.status, 200, r.text);
  assert.equal(r.body.submission.late, true);
  assert.equal(r.body.submission.status, 'LATE');
});

test('late submission is refused outright when allowLateSubmission=false', async () => {
  const a = await createAssignment({ dueDate: '2000-01-01T00:00:00.000Z', allowLateSubmission: 'false' });
  const r = await callForm('POST', `/${a._id}/submit`, 's1', { text: 'too late' }, [], 'files');
  assert.equal(r.status, 403);
  assert.equal(r.body.code, 'PAST_DUE');
  assert.equal(submissions.length, 0);
});

test('resubmission before grading replaces the same submission and updates the Drive link', async () => {
  const a = await createAssignment();

  const firstLink =
    'https://drive.google.com/file/d/firstDriveFileId/view';

  const first = await callJson(
    'POST',
    `/${a._id}/submit`,
    's1',
    {
      text: 'draft 1',
      driveLink: firstLink,
    }
  );

  assert.equal(first.status, 200, first.text);
  assert.equal(submissions.length, 1);
  assert.equal(submissions[0].driveLink, firstLink);

  const secondLink =
    'https://drive.google.com/file/d/secondDriveFileId/view';

  const second = await callJson(
    'POST',
    `/${a._id}/submit`,
    's1',
    {
      text: 'draft 2 (final)',
      driveLink: secondLink,
    }
  );

  assert.equal(second.status, 200, second.text);
  assert.equal(submissions.length, 1, 'still one submission document');
  assert.equal(submissions[0].text, 'draft 2 (final)');
  assert.equal(submissions[0].driveLink, secondLink);
  assert.equal(second.body.submission.driveLink, secondLink);
});

test('resubmission after grading is blocked', async () => {
  const a = await createAssignment();
  await callForm('POST', `/${a._id}/submit`, 's1', { text: 'draft 1' }, [], 'files');
  const sub = submissions[0];
  await callJson('PUT', `/submissions/${sub._id}/grade`, 't1', { marks: 15, feedback: 'Good' });
  const again = await callForm('POST', `/${a._id}/submit`, 's1', { text: 'trying to resubmit' }, [], 'files');
  assert.equal(again.status, 409);
  assert.equal(again.body.code, 'ALREADY_GRADED');
  assert.equal(submissions[0].text, 'draft 1');
});

// =========================== GRADING ============================
test('teacher grades a submission; status becomes GRADED; marks/feedback trusted only from the request', async () => {
  const a = await createAssignment({ totalMarks: 20 });
  await callForm('POST', `/${a._id}/submit`, 's1', { text: 'my work' }, [], 'files');
  const sub = submissions[0];
  const r = await callJson('PUT', `/submissions/${sub._id}/grade`, 't1', { marks: 18, feedback: 'Well done' });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.body.submission.status, 'GRADED');
  assert.equal(r.body.submission.marks, 18);
  assert.equal(S(submissions[0].gradedBy), S(ids.t1));
  assert.ok(submissions[0].gradedAt);
});

test('marks above totalMarks, or negative, are rejected', async () => {
  const a = await createAssignment({ totalMarks: 10 });
  await callForm('POST', `/${a._id}/submit`, 's1', { text: 'x' }, [], 'files');
  const sub = submissions[0];
  assert.equal((await callJson('PUT', `/submissions/${sub._id}/grade`, 't1', { marks: 11 })).status, 400);
  assert.equal((await callJson('PUT', `/submissions/${sub._id}/grade`, 't1', { marks: -1 })).status, 400);
  assert.equal((await callJson('PUT', `/submissions/${sub._id}/grade`, 't1', { marks: 'lots' })).status, 400);
});

test('a non-owning teacher and a student cannot grade -> 403', async () => {
  const a = await createAssignment();
  await callForm('POST', `/${a._id}/submit`, 's1', { text: 'x' }, [], 'files');
  const sub = submissions[0];
  assert.equal((await callJson('PUT', `/submissions/${sub._id}/grade`, 't2', { marks: 5 })).status, 403);
  assert.equal((await callJson('PUT', `/submissions/${sub._id}/grade`, 's1', { marks: 5 })).status, 403);
  assert.equal(submissions[0].marks, undefined ?? null);
});

// =========================== MY SUBMISSION / SUBMISSIONS LIST ============================
// =========================== MY SUBMISSION / SUBMISSIONS LIST ============================

test('my-submission returns PENDING with no submission, then the real one after submitting - only the caller\'s own', async () => {
  const a = await createAssignment({ dueDate: '' });

  const before = await callJson(
    'GET',
    `/${a._id}/my-submission`,
    's1'
  );

  assert.equal(
    before.body.submission.status,
    'PENDING'
  );

  await callForm(
    'POST',
    `/${a._id}/submit`,
    's1',
    { text: 'mine' },
    [],
    'files'
  );

  const mine = await callJson(
    'GET',
    `/${a._id}/my-submission`,
    's1'
  );

  assert.equal(
    mine.body.submission.status,
    'SUBMITTED'
  );

  const other = await callJson(
    'GET',
    `/${a._id}/my-submission`,
    's2'
  );

  assert.equal(
    other.body.submission.status,
    'PENDING',
    "s2's own status is unaffected by s1's submission"
  );
});

test('submissions list is manager-only and includes every student, with computed status and counts', async () => {
  const a = await createAssignment({ dueDate: '2000-01-01T00:00:00.000Z' });
  await callForm('POST', `/${a._id}/submit`, 's1', { text: 'a' }, [], 'files'); // will be LATE
  await callForm('POST', `/${a._id}/submit`, 's2', { text: 'b' }, [], 'files'); // will be LATE
  await callJson('PUT', `/submissions/${submissions[0]._id}/grade`, 't1', { marks: 10 });

  const list = await callJson('GET', `/${a._id}/submissions`, 't1');
  assert.equal(list.status, 200);
  assert.equal(list.body.submissions.length, 2);
  assert.equal(list.body.submissions.find((s) => s.status === 'GRADED') !== undefined, true);
  assert.equal(list.body.submissions.find((s) => s.status === 'LATE') !== undefined, true);

  for (const who of ['s1', 't2', 'outsider']) {
    assert.equal((await callJson('GET', `/${a._id}/submissions`, who)).status, 403, who);
  }

  const detail = await callJson('GET', `/${a._id}`, 't1');
  assert.deepEqual(detail.body.assignment.submissionCounts, { total: 2, submitted: 0, late: 1, graded: 1 });
});

// =========================== FILE STREAMING ============================
test('assignment attachment: streamed to anyone with course access, blocked for outsiders', async () => {
  const a = await createAssignment({}, 't1');
  // re-create WITH an attachment (courseId path already covered above; add one with a file here)
  const withFile = await callForm('POST', '/', 't1', { courseId: S(courseA._id), title: 'With attachment' }, [pdf('brief.pdf')]);
  const fileId = withFile.body.assignment.attachments[0]._id;
  const aid = withFile.body.assignment._id;

  const ok = await fetch(`${root}/${aid}/attachments/${fileId}`, { headers: cookie('s1') });
  assert.equal(ok.status, 200);
  assert.equal(await ok.text(), '%PDF-fake-bytes');
  assert.equal(globalThis.__lastUrlOpts.type, 'authenticated');

  const blocked = await fetch(`${root}/${aid}/attachments/${fileId}`, { headers: cookie('outsider') });
  assert.equal(blocked.status, 404);
});



// =========================== VALIDATION ============================
test('validation errors return 400 with a readable message', async () => {
  assert.match((await callForm('POST', '/', 't1', { courseId: S(courseA._id), title: '  ' })).body.message, /Title is required/);
  assert.match((await callForm('POST', '/', 't1', { courseId: 'nope', title: 'x' })).body.message, /Invalid course id/);
  assert.match((await callForm('POST', '/', 't1', { courseId: S(courseA._id), title: 'x', totalMarks: -5 })).body.message, /Total marks/);
  assert.match((await callForm('POST', '/', 't1', { courseId: S(courseA._id), title: 'x', dueDate: 'not-a-date' })).body.message, /Due date/);
  assert.match((await callForm('POST', '/', 't1', { courseId: S(courseA._id), title: 'x', allowLateSubmission: 'sometimes' })).body.message, /allowLateSubmission/);
  assert.equal(assignments.length, 0);
});

test('an unsupported file extension is rejected (multer fileFilter -> 400 via error middleware)', async () => {
  const r = await callForm('POST', '/', 't1', { courseId: S(courseA._id), title: 'x' }, [{ name: 'virus.exe', type: 'application/octet-stream' }]);
  assert.equal(r.status, 400);
  assert.match(r.body.message, /Unsupported file type/);
});

// =========================== EDIT / DELETE ============================
test('editing: metadata, adding and removing attachments all work', async () => {
  const a = await callForm('POST', '/', 't1', { courseId: S(courseA._id), title: 'Essay', totalMarks: 20 }, [pdf('rubric.pdf')]);
  const id = a.body.assignment._id;
  const oldFileId = a.body.assignment.attachments[0]._id;
  const oldPublicId = assignments[0].attachments[0].public_id;

  const edited = await callForm('PUT', `/${id}`, 't1', { title: 'Essay v2', removeAttachmentIds: JSON.stringify([oldFileId]) }, [pdf('rubric-v2.pdf')]);
  assert.equal(edited.status, 200, edited.text);
  assert.equal(edited.body.assignment.title, 'Essay v2');
  assert.deepEqual(edited.body.assignment.attachments.map((f) => f.originalName), ['rubric-v2.pdf']);
  assert.equal(destroyed.some((d) => d.id === oldPublicId), true);
});

test('delete refuses when submissions exist unless ?force=true', async () => {
  const a = await createAssignment();
  await callForm('POST', `/${a._id}/submit`, 's1', { text: 'x' }, [], 'files');

  const refused = await callJson('DELETE', `/${a._id}`, 't1');
  assert.equal(refused.status, 409);
  assert.equal(refused.body.code, 'ASSIGNMENT_HAS_SUBMISSIONS');
  assert.equal(assignments.length, 1);

  assert.equal((await callJson('DELETE', `/${a._id}?force=true`, 't1')).status, 200);
  assert.equal(assignments.length, 0);
  assert.equal(submissions.length, 0);
});

// =========================== LEGACY / ORPHAN DATA ============================
test('a legacy assignment doc with no `course` is treated as an orphan: admin-only, invisible to everyone else', async () => {
  const orphan = new Assignment({ title: 'Old assignment', totalMarks: 50 });
  await orphan.save();
  assert.equal((await callJson('GET', `/${orphan._id}`, 's1')).status, 404);
  assert.equal((await callJson('GET', `/${orphan._id}`, 't1')).status, 404, 'not even the owning-looking teacher, since there is no course to check ownership against');
  assert.equal((await callJson('GET', `/${orphan._id}`, 'admin')).status, 200);
});


test('student submission rejects non-HTTPS Google Drive links', async () => {
  const a = await createAssignment();

  const r = await callJson(
    'POST',
    `/${a._id}/submit`,
    's1',
    {
      text: 'invalid link',
      driveLink: 'http://drive.google.com/file/d/example/view',
    }
  );

  assert.equal(r.status, 400);
  assert.equal(submissions.length, 0);
});

test('student submission rejects non-Google Drive links', async () => {
  const a = await createAssignment();

  const r = await callJson(
    'POST',
    `/${a._id}/submit`,
    's1',
    {
      text: 'invalid link',
      driveLink: 'https://example.com/file.pdf',
    }
  );

  assert.equal(r.status, 400);
  assert.equal(submissions.length, 0);
});

test('student submission rejects malformed Drive links', async () => {
  const a = await createAssignment();

  const r = await callJson(
    'POST',
    `/${a._id}/submit`,
    's1',
    {
      text: 'invalid link',
      driveLink: 'not-a-valid-url',
    }
  );

  assert.equal(r.status, 400);
  assert.equal(submissions.length, 0);
});