// Run with:  node --test tests/
// No MongoDB or Cloudinary needed: model DB calls and Cloudinary are stubbed.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const { default: express } = await import('express');
const { default: cookieParser } = await import('cookie-parser');
const { default: jwt } = await import('jsonwebtoken');
const { default: cloudinary } = await import('cloudinary');
const { default: Course } = await import('../models/course.model.js');
const { default: courseRoutes } = await import('../routes/course.routes.js');
const { default: errorMiddleware } = await import('../middlewares/error.Middleware.js');

// ---- stubs ---------------------------------------------------------------
const store = new Map(); // id -> course doc (in memory)
const destroyed = [];

Course.create = async (data) => {
  const doc = new Course(data);
  await doc.validate(); // real schema validation
  doc.save = async function () {
    await this.validate();
    store.set(String(this._id), this);
    return this;
  };
  doc.deleteOne = async function () {
    store.delete(String(this._id));
  };
  store.set(String(doc._id), doc);
  return doc;
};
Course.findById = (id) => {
  const doc = store.get(String(id));
  if (doc && !doc.save.__patched) {
    const realValidate = doc.validate.bind(doc);
    doc.save = async () => {
      await realValidate();
      return doc;
    };
    doc.save.__patched = true;
    doc.deleteOne = async () => store.delete(String(id));
  }
  const p = Promise.resolve(doc || null);
  p.populate = () => Promise.resolve(doc || null); // Quiz model not needed here
  return p;
};
cloudinary.v2.uploader.upload = async () => ({
  public_id: 'lms/fake_video',
  secure_url: 'https://res.cloudinary.com/demo/video/upload/fake_video.mp4',
});
cloudinary.v2.uploader.destroy = async (id) => {
  destroyed.push(id);
  return { result: 'ok' };
};

// ---- app -----------------------------------------------------------------
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/courses', courseRoutes);
app.use(errorMiddleware);

let server, base;
const adminToken = () =>
  jwt.sign({ id: '64b000000000000000000001', role: 'ADMIN' }, 'test-secret');
const authed = (extra = {}) => ({ headers: { Cookie: `token=${adminToken()}` }, ...extra });

before(async () => {
  server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}/api/v1/courses`;
});
after(() => server.close());

const form = (fields, file) => {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  if (file) fd.append(file.field, new Blob([file.content], { type: file.type }), file.name);
  return fd;
};

const baseCourse = {
  title: 'Full Stack Bootcamp',
  description: 'A long enough description for validation to pass.',
  category: 'Web',
  createdBy: 'Teacher One',
};

let courseId;

test('create course WITHOUT any video/thumbnail succeeds', async () => {
  const res = await fetch(base, { method: 'POST', body: form({ ...baseCourse, price: '499', duration: '6 weeks' }), ...authed() });
  const body = await res.json();
  assert.equal(res.status, 201, JSON.stringify(body));
  assert.equal(body.course.price, 499);
  assert.equal(body.course.numberOfVideos, 0);
  courseId = body.course._id;
});

test('create course with missing description returns 400 (not 500)', async () => {
  const { description, ...rest } = baseCourse;
  const res = await fetch(base, { method: 'POST', body: form(rest), ...authed() });
  assert.equal(res.status, 400);
});

test('negative price is rejected with 400', async () => {
  const res = await fetch(base, { method: 'POST', body: form({ ...baseCourse, price: '-5' }), ...authed() });
  assert.equal(res.status, 400);
});

test('add lecture WITHOUT video succeeds and counts correctly', async () => {
  const res = await fetch(`${base}/${courseId}`, { method: 'POST', body: form({ title: 'Intro (live on Zoom)', description: 'Notes only session' }), ...authed() });
  const body = await res.json();
  assert.equal(res.status, 200, JSON.stringify(body));
  assert.equal(body.course.numberOfLectures, 1);
  assert.equal(body.course.numberOfVideos, 0);
});

test('add lecture WITH video still works (video feature preserved)', async () => {
  const res = await fetch(`${base}/${courseId}`, {
    method: 'POST',
    body: form({ title: 'Lecture 2', description: 'Has a recorded video' }, { field: 'lecture', content: 'fakevideo', type: 'video/mp4', name: 'v.mp4' }),
    ...authed(),
  });
  const body = await res.json();
  assert.equal(res.status, 200, JSON.stringify(body));
  assert.equal(body.course.numberOfLectures, 2);
  assert.equal(body.course.numberOfVideos, 1);
});

test('lectures endpoint flags hasVideo per lecture', async () => {
  const res = await fetch(`${base}/${courseId}`, authed());
  const body = await res.json();
  assert.equal(res.status, 200, JSON.stringify(body));
  assert.deepEqual(body.lectures.map((l) => l.hasVideo), [false, true]);
  assert.equal(body.course.numberOfVideos, 1);
});

test('removing a video-less lecture does not call Cloudinary', async () => {
  const doc = store.get(courseId);
  const videoLess = doc.lectures[0]._id.toString();
  destroyed.length = 0;
  const res = await fetch(`${base}?courseId=${courseId}&lectureId=${videoLess}`, { method: 'DELETE', ...authed() });
  assert.equal(res.status, 200);
  assert.equal(destroyed.length, 0);
  assert.equal(store.get(courseId).numberOfLectures, 1);
});

test('removing a lecture with video deletes it from Cloudinary', async () => {
  const doc = store.get(courseId);
  const withVideo = doc.lectures[0]._id.toString();
  destroyed.length = 0;
  const res = await fetch(`${base}?courseId=${courseId}&lectureId=${withVideo}`, { method: 'DELETE', ...authed() });
  assert.equal(res.status, 200);
  assert.deepEqual(destroyed, ['lms/fake_video']);
  assert.equal(store.get(courseId).numberOfVideos, 0);
});

test('non-video file as lecture is rejected', async () => {
  const res = await fetch(`${base}/${courseId}`, {
    method: 'POST',
    body: form({ title: 'Bad upload', description: 'image instead of video' }, { field: 'lecture', content: 'x', type: 'image/png', name: 'x.png' }),
    ...authed(),
  });
  assert.equal(res.status, 400);
});

test('legacy lecture documents (video present, no new fields) remain valid', async () => {
  const legacy = new Course({
    ...baseCourse,
    lectures: [{ title: 'Old', description: 'Old lecture', lecture: { public_id: 'a', secure_url: 'https://x/y.mp4' } }],
  });
  await legacy.validate();
  assert.equal(legacy.price, 0);
});

test('update whitelists fields (cannot overwrite lectures via body)', async () => {
  const before = store.get(courseId).lectures.length;
  const res = await fetch(`${base}/${courseId}`, {
    method: 'PUT',
    body: form({ title: 'Renamed Bootcamp', lectures: '[]', numberOfLectures: '99' }),
    ...authed(),
  });
  const body = await res.json();
  assert.equal(res.status, 200, JSON.stringify(body));
  assert.equal(body.course.title, 'Renamed Bootcamp');
  assert.notEqual(body.course.numberOfLectures, 99);
  assert.equal(store.get(courseId).lectures.length, before);
});

test('delete course route exists and works', async () => {
  const res = await fetch(`${base}/${courseId}`, { method: 'DELETE', ...authed() });
  assert.equal(res.status, 200);
  assert.equal(store.has(courseId), false);
});

test('invalid ObjectId returns 400', async () => {
  const res = await fetch(`${base}/not-an-id`, authed());
  assert.equal(res.status, 400);
});
