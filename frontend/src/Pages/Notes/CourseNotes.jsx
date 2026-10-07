import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import ConfirmDialog from "../../Components/UI/ConfirmDialog";
import EmptyState from "../../Components/UI/EmptyState";
import NoteCard from "../../Components/Notes/NoteCard";
import HomeLayout from "../../Layouts/HomeLayout";
import { getApiErrorMessage, notesApi } from "../../Services/notesApi";

const Skeleton = () => (
  <div
    className="space-y-4"
    aria-busy="true"
    aria-label="Loading notes"
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="bg-white/80 rounded-2xl p-5 animate-pulse space-y-3"
      >
        <div className="h-5 w-1/2 bg-slate-200 rounded" />
        <div className="h-4 w-3/4 bg-slate-200 rounded" />
        <div className="h-12 w-full bg-slate-100 rounded-xl" />
      </div>
    ))}
  </div>
);

export default function CourseNotes() {
  const { courseId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState([]);
  const [canManage, setCanManage] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!courseId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await notesApi.list(courseId);

      setNotes(data?.notes || []);
      setCanManage(Boolean(data?.canManage));
    } catch (err) {
      setError({
        status: err?.response?.status,
        message: getApiErrorMessage(err, "Could not load notes"),
      });
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!toDelete?._id) return;

    setDeleting(true);

    try {
      await notesApi.remove(toDelete._id);

      setNotes((list) =>
        list.filter((note) => note._id !== toDelete._id)
      );

      toast.success("Note deleted");
      setToDelete(null);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Could not delete the note")
      );
    } finally {
      setDeleting(false);
    }
  }

  const goNew = () => {
    navigate(`/courses/${courseId}/notes/new`, {
      state,
    });
  };

  return (
    <HomeLayout>
      <div className="min-h-[80vh] px-4 sm:px-8 pt-16 pb-16 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Study Notes
            </h1>

            {(state?.courseTitle || state?.title) && (
              <p className="text-sm text-slate-700 mt-1">
                {state?.courseTitle || state?.title}
              </p>
            )}
          </div>

          {canManage && (
            <button
              type="button"
              onClick={goNew}
              className="min-h-[48px] px-5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              + Add note
            </button>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <Skeleton />
        ) : error ? (
          /* Error */
          <EmptyState
            icon={error.status === 403 ? "🔒" : "⚠️"}
            title={
              error.status === 403
                ? "Notes are locked"
                : "Couldn't load notes"
            }
            message={error.message}
            action={
              error.status === 403 ? (
                <Link
                  to="/courses"
                  className="min-h-[44px] inline-flex items-center px-5 rounded-lg bg-indigo-600 text-white font-semibold"
                >
                  Browse courses
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={load}
                  className="min-h-[44px] px-5 rounded-lg bg-indigo-600 text-white font-semibold"
                >
                  Try again
                </button>
              )
            }
          />
        ) : notes.length === 0 ? (
          /* Empty */
          <EmptyState
            icon="📄"
            title="No notes available yet."
            message={
              canManage
                ? "Add study material for your students."
                : "Your instructor hasn't shared any study material yet."
            }
            action={
              canManage && (
                <button
                  type="button"
                  onClick={goNew}
                  className="min-h-[44px] px-5 rounded-lg bg-indigo-600 text-white font-semibold"
                >
                  + Add the first note
                </button>
              )
            }
          />
        ) : (
          /* Notes */
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                canManage={canManage}
                onEdit={(selectedNote) =>
                  navigate(`/notes/${selectedNote._id}/edit`, {
                    state,
                  })
                }
                onDelete={setToDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        loading={deleting}
        title="Delete this note?"
        message={
          toDelete
            ? `"${toDelete.title}" will be permanently removed.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </HomeLayout>
  );
}