/**
 * One-off, idempotent migration for the "video is optional" change.
 *
 * Old courses have no `numberOfVideos` / `price`, and `numberOfLectures` may be
 * stale. This script recomputes the counters from the embedded lectures.
 * It never deletes or rewrites lecture/video data.
 *
 *   node scripts/migrate-optional-video.js           # dry run (default)
 *   node scripts/migrate-optional-video.js --apply   # write changes
 *   node scripts/migrate-optional-video.js --apply --uri="mongodb://..."
 *
 * Without --uri it uses the same connection string logic as the app
 * (process.env.MONGO_URI, else mongodb://127.0.0.1:27017/lms).
 */
import { config } from 'dotenv';
import mongoose from 'mongoose';

import Course from '../models/course.model.js';

config();

const apply = process.argv.includes('--apply');
const uriArg = process.argv.find((a) => a.startsWith('--uri='));
const uri =
  (uriArg && uriArg.slice('--uri='.length)) ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/lms';

const run = async () => {
  await mongoose.connect(uri);
  console.log(`Connected to database "${mongoose.connection.name}" on ${mongoose.connection.host}`);
  console.log(apply ? 'MODE: APPLY (writing changes)' : 'MODE: DRY RUN (no writes) - pass --apply to write');

  const ops = [];
  let scanned = 0;

  for await (const course of Course.find({}).lean()) {
    scanned += 1;
    const lectures = course.lectures || [];
    const numberOfLectures = lectures.length;
    const numberOfVideos = lectures.filter((l) => l?.lecture?.secure_url).length;

    const $set = {};
    if (course.numberOfLectures !== numberOfLectures) $set.numberOfLectures = numberOfLectures;
    if (course.numberOfVideos !== numberOfVideos) $set.numberOfVideos = numberOfVideos;
    if (course.price === undefined) $set.price = 0;

    if (Object.keys($set).length) {
      ops.push({ updateOne: { filter: { _id: course._id }, update: { $set } } });
      console.log(`- ${course.title}:`, $set);
    }
  }

  console.log(`Scanned ${scanned} course(s); ${ops.length} need updating.`);

  if (apply && ops.length) {
    const res = await Course.bulkWrite(ops);
    console.log(`Updated ${res.modifiedCount} course(s).`);
  }

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Migration failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
