import { useState } from "react";
import { formatDateTime } from "../../utils/formatters";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../Services/assignmentApi";
import StatusBadge from "./StatusBadge";
import {
  FaFileAlt,
  FaFileExcel,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
} from "react-icons/fa";

const ICONS = {
  pdf: { Icon: FaFilePdf, color: "text-red-600" },
  doc: { Icon: FaFileWord, color: "text-blue-600" },
  docx: { Icon: FaFileWord, color: "text-blue-600" },
  ppt: { Icon: FaFilePowerpoint, color: "text-orange-600" },
  pptx: { Icon: FaFilePowerpoint, color: "text-orange-600" },
  xls: { Icon: FaFileExcel, color: "text-green-600" },
  xlsx: { Icon: FaFileExcel, color: "text-green-600" },
};

const FileIcon = ({ format, className = "" }) => {
  const { Icon, color } = ICONS[format] || {
    Icon: FaFileAlt,
    color: "text-slate-500",
  };

  return (
    <Icon
      className={`${color} ${className}`}
      aria-hidden="true"
    />
  );
};

/**
 * One student's submission, for the teacher/admin management view.
 * Rendered as a card (not a table row) so it works at any width.
 */
export default function SubmissionCard({
  submission,
  totalMarks,
  onGrade,
  onAllowResubmit,
}) {
  const [editing, setEditing] = useState(false);
  const [marks, setMarks] = useState(submission.marks ?? "");
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);

    try {
      await onGrade(submission._id, {
        marks: Number(marks),
        feedback,
      });

      setEditing(false);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Could not save the grade")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
      {/* Student information */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">
            {submission.student?.fullName || "Unknown student"}
          </p>

          <p className="text-xs text-slate-500 truncate">
            {submission.student?.email}
          </p>
        </div>

        <StatusBadge status={submission.status} />
      </div>

      {/* Submission date */}
      <p className="text-xs text-slate-500">
        Submitted {formatDateTime(submission.submittedAt)}
      </p>

      {/* Text submission */}
      {submission.text && (
        <p className="text-sm text-slate-700 whitespace-pre-line">
          {submission.text}
        </p>
      )}

      {/* Google Drive submission */}
      {submission.driveLink && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-600 mb-2">
            Student Submission
          </p>

          <a
            href={submission.driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[40px] items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            🔗 Open Google Drive
          </a>

          <p className="mt-2 text-xs text-slate-500 break-all">
            {submission.driveLink}
          </p>
        </div>
      )}

      {/* Resubmission approval */}
      {submission.resubmitRequested &&
        !submission.resubmitAllowed && (
          <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
            <div className="mb-3">
              <p className="font-semibold text-yellow-800">
                Resubmission requested
              </p>

              <p className="mt-1 text-sm text-yellow-700">
                This student has requested permission to resubmit this
                assignment.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onAllowResubmit?.(submission._id)
              }
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Allow Resubmission
            </button>
          </div>
        )}

      {/* Grading */}
      {editing ? (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max={totalMarks}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-24 min-h-[40px] rounded-lg border border-slate-300 px-2"
            />

            <span className="text-sm text-slate-500">
              / {totalMarks}
            </span>
          </div>

          <textarea
            rows={2}
            placeholder="Feedback (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm resize-y"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="min-h-[40px] px-3 rounded-lg border border-slate-300 text-sm font-medium"
            >
              Cancel
            </button>

            <button
              onClick={save}
              disabled={saving}
              className="min-h-[40px] px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Grade"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-sm">
            {submission.status === "GRADED" ? (
              <>
                <span className="font-semibold text-green-700">
                  {submission.marks}/{totalMarks}
                </span>

                {submission.feedback && (
                  <span className="text-slate-500">
                    {" "}
                    &middot; {submission.feedback}
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-400">
                Not graded yet
              </span>
            )}
          </p>

          <button
            onClick={() => setEditing(true)}
            className="min-h-[40px] px-3 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
          >
            {submission.status === "GRADED"
              ? "Edit Grade"
              : "Grade"}
          </button>
        </div>
      )}
    </div>
  );
}