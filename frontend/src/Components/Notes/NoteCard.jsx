import { FaExternalLinkAlt } from "react-icons/fa";
// import { FileIcon } from "../Notes/NoteCard";

import { formatDate } from "../../utils/formatters";

/**
 * Presentational card for one note.
 * Notes now use a manually added Google Drive link.
 */
export default function NoteCard({
  note,
  canManage = false,
  onEdit,
  onDelete,
}) {
  const driveUrl = note?.driveUrl?.trim();

  return (
    <article className="bg-white text-slate-800 rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold break-words">
            {note?.title}
          </h3>

          {note?.createdAt && (
            <p className="text-xs text-slate-500 mt-0.5">
              Uploaded {formatDate(note.createdAt)}
            </p>
          )}
        </div>

        {canManage && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onEdit?.(note)}
              className="min-h-[44px] min-w-[44px] px-3 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => onDelete?.(note)}
              className="min-h-[44px] min-w-[44px] px-3 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </header>

      {/* Description */}
      {note?.description && (
        <p className="mt-3 text-sm text-slate-600 whitespace-pre-line break-words">
          {note.description}
        </p>
      )}

      {/* Google Drive Link */}
      {driveUrl && (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                📚 Study Material
              </p>

              <p className="text-xs text-slate-500 mt-1 truncate">
                Google Drive
              </p>
            </div>

            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              Open Notes
              <FaExternalLinkAlt className="text-xs" />
            </a>
          </div>
        </div>
      )}
    </article>
  );
}