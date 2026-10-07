import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import EmptyState from "../../Components/UI/EmptyState";
import NoteForm from "../../Components/Notes/NoteForm";
import HomeLayout from "../../Layouts/HomeLayout";
import {
  getApiErrorMessage,
  notesApi,
} from "../../Services/notesApi";

export default function NoteEditor() {
  const {
    courseId: courseIdParam,
    noteId,
  } = useParams();

  const { state } = useLocation();
  const navigate = useNavigate();

  const editing = Boolean(noteId);

  const [note, setNote] = useState(null);
  const [loading, setLoading] =
    useState(editing);

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    if (!editing) return;

    notesApi
      .get(noteId)
      .then((data) => setNote(data.note))
      .catch((err) =>
        setError(
          getApiErrorMessage(
            err,
            "Could not load this note"
          )
        )
      )
      .finally(() => setLoading(false));
  }, [editing, noteId]);

  const courseId =
    courseIdParam || note?.course;

  const backToList = () =>
    navigate(
      courseId
        ? `/courses/${courseId}/notes`
        : "/courses",
      { state }
    );

  async function handleSubmit({
    title,
    description,
    driveUrl,
  }) {
    const payload = {
      title,
      description,
      driveUrl,
    };

    if (!editing) {
      payload.courseId = courseId;
    }

    setSubmitting(true);

    try {
      if (editing) {
        await notesApi.update(
          noteId,
          payload
        );

        toast.success("Note updated");
      } else {
        await notesApi.create(payload);

        toast.success("Note published");
      }

      backToList();
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          "Could not save the note"
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <HomeLayout>
      <div className="min-h-[80vh] px-4 sm:px-8 pt-16 pb-16 max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
          {editing
            ? "Edit note"
            : "Add a note"}
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
          {loading ? (
            <div
              className="space-y-3 animate-pulse"
              aria-busy="true"
            >
              <div className="h-11 bg-slate-200 rounded-lg" />
              <div className="h-28 bg-slate-200 rounded-lg" />
              <div className="h-11 bg-slate-200 rounded-lg" />
            </div>
          ) : error ? (
            <EmptyState
              icon="⚠️"
              title="Can't edit this note"
              message={error}
            />
          ) : (
            <NoteForm
              initialNote={note}
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={backToList}
            />
          )}
        </div>
      </div>
    </HomeLayout>
  );
}