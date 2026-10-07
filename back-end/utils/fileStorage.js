import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import cloudinary from 'cloudinary';

import AppError from './AppError.js';

export const MIME_BY_EXT = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain; charset=utf-8',
  zip: 'application/zip',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export const INLINE_FORMATS = [
  'pdf',
  'txt',
  'jpg',
  'jpeg',
  'png',
];

export const removeTempFiles = async (files = []) => {
  await Promise.all(
    files.map((f) =>
      fs.rm(f.path, { force: true }).catch(() => {})
    )
  );
};

export const toClientFile = (f) => ({
  _id: f._id,
  originalName: f.originalName || f.filename || '',
  format: f.format || '',
  size: f.size || 0,
});

const uploadOne = async (file, folder) => {
  const ext = path
    .extname(file.originalname)
    .toLowerCase();

  const format = ext.replace('.', '');

  const publicId =
    `${crypto.randomBytes(12).toString('hex')}${ext}`;

  const result = await cloudinary.v2.uploader.upload(
    file.path,
    {
      folder,
      public_id: publicId,
      resource_type: 'raw',
      type: 'authenticated',
    }
  );

  return {
    // Required by Assignment attachments
    filename: file.originalname,

    // Keep original name too
    originalName: file.originalname,

    // Required for Cloudinary streaming/deleting
    public_id: result.public_id,

    // Keep Cloudinary URLs if available
    secure_url: result.secure_url || '',
    url: result.secure_url || result.url || '',

    format,
    size: file.size || 0,
  };
};

export const destroyStoredFiles = async (files = []) => {
  const outcomes = await Promise.allSettled(
    files
      .filter((f) => f?.public_id)
      .map((f) =>
        cloudinary.v2.uploader.destroy(
          f.public_id,
          {
            resource_type: 'raw',
            type: 'authenticated',
          }
        )
      )
  );

  outcomes
    .filter((o) => o.status === 'rejected')
    .forEach((o) =>
      console.error(
        'Cloudinary file cleanup failed:',
        o.reason
      )
    );
};

export const uploadFilesToCloudinary = async (
  files,
  folder
) => {
  const stored = [];

  try {
    for (const file of files) {
      stored.push(
        await uploadOne(file, folder)
      );
    }

    return stored;
  } catch (err) {
    console.error(
      'Cloudinary upload failed:',
      err
    );

    await destroyStoredFiles(stored);

    throw new AppError(
      'File upload failed, please try again',
      400
    );
  } finally {
    await removeTempFiles(files);
  }
};

export const streamStoredFile = async (
  res,
  file,
  { download = false } = {}
) => {
  if (!file?.public_id) {
    throw new AppError(
      'File is currently unavailable, please try again later',
      502
    );
  }

  const signedUrl = cloudinary.v2.url(
  file.public_id,
  {
    resource_type: 'raw',
    type: 'authenticated',
    secure: true,
    sign_url: true,
  }
);

  const upstream = await fetch(signedUrl);

  if (!upstream.ok || !upstream.body) {
    console.error(
      'Cloudinary fetch failed:',
      upstream.status,
      file.public_id
    );

    throw new AppError(
      'File is currently unavailable, please try again later',
      502
    );
  }

  const format = String(
    file.format ||
      path
        .extname(
          file.originalName ||
          file.filename ||
          ''
        )
        .replace('.', '')
  ).toLowerCase();

  const inline =
    !download &&
    INLINE_FORMATS.includes(format);

  const originalName =
    file.originalName ||
    file.filename ||
    'download';

  const safeName = originalName.replace(
    /[\r\n"]/g,
    ''
  );

  res.setHeader(
    'Content-Type',
    MIME_BY_EXT[format] ||
      'application/octet-stream'
  );

  res.setHeader(
    'Content-Disposition',
    `${
      inline ? 'inline' : 'attachment'
    }; filename="${encodeURIComponent(
      safeName
    )}"; filename*=UTF-8''${encodeURIComponent(
      safeName
    )}`
  );

  res.setHeader(
    'X-Content-Type-Options',
    'nosniff'
  );

  res.setHeader(
    'Cache-Control',
    'private, no-store'
  );

  const len =
    upstream.headers.get('content-length');

  if (len) {
    res.setHeader(
      'Content-Length',
      len
    );
  }

  try {
    await pipeline(
      Readable.fromWeb(upstream.body),
      res
    );
  } catch (err) {
    console.error(
      'Streaming stored file failed:',
      err.message
    );

    if (!res.destroyed) {
      res.destroy(err);
    }
  }
};