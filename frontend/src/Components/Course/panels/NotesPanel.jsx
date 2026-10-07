import { useEffect, useState } from "react";
import { FiEdit2, FiExternalLink, FiPlus, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { notesApi, getApiErrorMessage } from "../../../Services/notesApi";

export default function NotesPanel({
  courseId,
  courseTitle,
}) {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [canManage, setCanManage] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // ---------------------------------------------------------
  // LOAD COURSE NOTES
  // ---------------------------------------------------------
  const loadNotes = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError("");

      const data = await notesApi.list(courseId);

      setNotes(
        Array.isArray(data?.notes)
          ? data.notes
          : []
      );

      setCanManage(data?.canManage === true);
    } catch (err) {
      console.error("Load notes error:", err);

      setError(
        getApiErrorMessage(
          err,
          "Unable to load course notes."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [courseId]);

  // ---------------------------------------------------------
  // DELETE NOTE
  // ---------------------------------------------------------
  const handleDelete = async (noteId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(noteId);
      setError("");

      await notesApi.remove(noteId);

      setNotes((prev) =>
        prev.filter(
          (note) => note._id !== noteId
        )
      );
    } catch (err) {
      console.error("Delete note error:", err);

      setError(
        getApiErrorMessage(
          err,
          "Unable to delete note."
        )
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className="space-y-5">

      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Course Notes
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {courseTitle
                ? `Notes for ${courseTitle}`
                : "Study notes for this course"}
            </p>
          </div>

          {/* MANAGER BUTTON */}
          {canManage && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/courses/${courseId}/notes/new`,
                  {
                    state: {
                      courseId,
                      courseTitle,
                    },
                  }
                )
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                min-h-[44px]
                px-5
                rounded-xl
                bg-blue-600
                hover:bg-blue-700
                text-white
                font-semibold
                transition
              "
            >
              <FiPlus size={18} />

              Add Note
            </button>
          )}

        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* EMPTY */}
      {notes.length === 0 && !error && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">

          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <FiEdit2 size={24} />
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-900">
            No notes available
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            There are no notes added to this course yet.
          </p>

          {canManage && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/courses/${courseId}/notes/new`,
                  {
                    state: {
                      courseId,
                      courseTitle,
                    },
                  }
                )
              }
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                px-4
                py-2.5
                rounded-xl
                bg-blue-600
                hover:bg-blue-700
                text-white
                font-semibold
              "
            >
              <FiPlus size={17} />
              Add First Note
            </button>
          )}

        </div>
      )}

      {/* NOTES LIST */}
      {notes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {notes.map((note) => (
            <div
              key={note._id}
              className="
                bg-white
                border
                border-slate-200
                rounded-2xl
                p-5
                shadow-sm
                hover:shadow-md
                transition
              "
            >

              {/* NOTE HEADER */}
              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <h3 className="font-bold text-slate-900 truncate">
                    {note.title || "Untitled Note"}
                  </h3>

                  {note.description && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-3">
                      {note.description}
                    </p>
                  )}

                </div>

                <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FiEdit2 size={18} />
                </div>

              </div>

              {/* NOTE INFO */}
              <div className="mt-4 text-xs text-slate-400">
                {note.createdAt
                  ? new Date(
                      note.createdAt
                    ).toLocaleDateString()
                  : ""}
              </div>

              {/* ACTIONS */}
              <div className="mt-5 flex flex-wrap gap-2">

                {/* OPEN DRIVE */}
                {note.driveUrl && (
                  <a
                    href={note.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-4
                      py-2.5
                      rounded-xl
                      bg-blue-600
                      hover:bg-blue-700
                      text-white
                      text-sm
                      font-semibold
                    "
                  >
                    <FiExternalLink size={16} />
                    Open Note
                  </a>
                )}

                {/* EDIT */}
                {canManage && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/notes/${note._id}/edit`,
                        {
                          state: {
                            courseId,
                            courseTitle,
                          },
                        }
                      )
                    }
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-4
                      py-2.5
                      rounded-xl
                      border
                      border-slate-300
                      hover:bg-slate-50
                      text-slate-700
                      text-sm
                      font-semibold
                    "
                  >
                    <FiEdit2 size={16} />
                    Edit
                  </button>
                )}

                {/* DELETE */}
                {canManage && (
                  <button
                    type="button"
                    disabled={deletingId === note._id}
                    onClick={() =>
                      handleDelete(note._id)
                    }
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-4
                      py-2.5
                      rounded-xl
                      border
                      border-red-200
                      hover:bg-red-50
                      text-red-600
                      text-sm
                      font-semibold
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    "
                  >
                    <FiTrash2 size={16} />

                    {deletingId === note._id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                )}

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}