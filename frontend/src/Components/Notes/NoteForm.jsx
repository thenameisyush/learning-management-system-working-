import { useState } from "react";

const inputClass =
  "w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function NoteForm({
  initialNote,
  submitting = false,
  onSubmit,
  onCancel,
}) {
  const editing = Boolean(initialNote?._id);

  const [title, setTitle] = useState(
    initialNote?.title || ""
  );

  const [description, setDescription] = useState(
    initialNote?.description || ""
  );

  const [driveUrl, setDriveUrl] = useState(
    initialNote?.driveUrl || ""
  );

  const [touched, setTouched] = useState(false);

  const errors = {};

  if (!title.trim()) {
    errors.title = "Title is required";
  } else if (title.trim().length > 120) {
    errors.title =
      "Title cannot be more than 120 characters";
  }

  if (description.length > 2000) {
    errors.description =
      "Description cannot be more than 2000 characters";
  }

  if (!driveUrl.trim()) {
    errors.driveUrl =
      "Google Drive link is required";
  } else {
    try {
      const url = new URL(driveUrl.trim());

      if (
        url.protocol !== "https:" ||
        ![
          "drive.google.com",
          "docs.google.com",
        ].includes(url.hostname)
      ) {
        errors.driveUrl =
          "Please enter a valid Google Drive link";
      }
    } catch {
      errors.driveUrl =
        "Please enter a valid Google Drive link";
    }
  }

  const show = (key) =>
    touched && errors[key];

  function handleSubmit(e) {
    e.preventDefault();

    setTouched(true);

    if (Object.keys(errors).length) {
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      driveUrl: driveUrl.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5"
    >
      {/* Title */}
      <div>
        <label
          htmlFor="note-title"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Title <span className="text-red-500">*</span>
        </label>

        <input
          id="note-title"
          className={inputClass}
          value={title}
          maxLength={120}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="e.g. DBMS Unit 1 Notes"
        />

        {show("title") && (
          <p className="mt-1 text-sm text-red-600">
            {errors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="note-desc"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Description
        </label>

        <textarea
          id="note-desc"
          rows={4}
          className={`${inputClass} resize-y`}
          value={description}
          maxLength={2000}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          placeholder="What is covered in this material?"
        />

        <div className="flex justify-between">
          {show("description") ? (
            <p className="mt-1 text-sm text-red-600">
              {errors.description}
            </p>
          ) : (
            <span />
          )}

          <p className="mt-1 text-xs text-slate-500">
            {description.length}/2000
          </p>
        </div>
      </div>

      {/* Google Drive Link */}
      <div>
        <label
          htmlFor="drive-url"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Google Drive Link{" "}
          <span className="text-red-500">*</span>
        </label>

        <input
          id="drive-url"
          type="url"
          className={inputClass}
          value={driveUrl}
          onChange={(e) =>
            setDriveUrl(e.target.value)
          }
          placeholder="https://drive.google.com/..."
        />

        <p className="mt-1 text-xs text-slate-500">
          Paste the Google Drive link of your notes.
        </p>

        {show("driveUrl") && (
          <p className="mt-1 text-sm text-red-600">
            {errors.driveUrl}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="min-h-[48px] px-5 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="min-h-[48px] px-6 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting
            ? "Saving..."
            : editing
            ? "Save changes"
            : "Publish note"}
        </button>
      </div>
    </form>
  );
}