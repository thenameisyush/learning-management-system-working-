import {
  useCallback,
  useEffect,
  useState,
} from "react";

import toast from "react-hot-toast";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import StatusBadge from "../../Components/Assignment/StatusBadge";
import SubmissionCard from "../../Components/Assignment/SubmissionCard";

import ConfirmDialog from "../../Components/UI/ConfirmDialog";
import EmptyState from "../../Components/UI/EmptyState";

import HomeLayout from "../../Layouts/HomeLayout";

import {
  assignmentApi,
  getApiErrorCode,
  getApiErrorMessage,
} from "../../Services/assignmentApi";

import {
  formatDate,
  formatDateTime,
} from "../../utils/formatters";

export default function AssignmentView() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [assignment, setAssignment] =
    useState(null);

  const [mySubmission, setMySubmission] =
    useState(null);

  const [submissions, setSubmissions] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  // Student submission
  const [text, setText] =
    useState("");

  const [driveLink, setDriveLink] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [confirmSubmit, setConfirmSubmit] =
    useState(false);

    const [requestingResubmit, setRequestingResubmit] = useState(false);

  // Delete
  const [confirmDelete, setConfirmDelete] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  /*
   * Load assignment.
   */
  const load = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const data =
          await assignmentApi.get(id);

        const currentAssignment =
          data?.assignment;

        if (!currentAssignment) {
          throw new Error(
            "Assignment not found"
          );
        }

        setAssignment(
          currentAssignment
        );

        if (
          currentAssignment.canManage
        ) {
          const subs =
            await assignmentApi.submissions(
              id
            );

          setSubmissions(
            subs?.submissions || []
          );

          setMySubmission(null);
          setShowForm(false);
        } else {
          const submission =
            data?.mySubmission || {
              status: "PENDING",
            };

          setMySubmission(
            submission
          );

          setShowForm(
            submission?.status ===
              "PENDING"
          );
        }
      } catch (err) {
        setError({
          status:
            err?.response?.status,
          message:
            getApiErrorMessage(
              err,
              "Could not load this assignment"
            ),
        });
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  /*
   * Student submits text + Google Drive link.
   */
  async function doSubmit() {
    const cleanText =
      text.trim();

    const cleanDriveLink =
      driveLink.trim();

    if (
      !cleanText &&
      !cleanDriveLink
    ) {
      toast.error(
        "Add some text or provide a Google Drive link"
      );
      return;
    }

    if (cleanDriveLink) {
      try {
        const url =
          new URL(
            cleanDriveLink
          );

        const allowedHosts = [
          "drive.google.com",
          "docs.google.com",
        ];

        if (
          url.protocol !== "https:" ||
          !allowedHosts.includes(
            url.hostname.toLowerCase()
          )
        ) {
          toast.error(
            "Please provide a valid Google Drive link"
          );
          return;
        }
      } catch {
        toast.error(
          "Please provide a valid Google Drive link"
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const data =
        await assignmentApi.submit(
          id,
          {
            text: cleanText,
            driveLink:
              cleanDriveLink,
          }
        );

      toast.success(
        data?.message ||
          "Assignment submitted"
      );

      setDriveLink("");
      setText("");

      setShowForm(false);
      setConfirmSubmit(false);

      await load();
    } catch (err) {
      const code =
        getApiErrorCode(err);

      toast.error(
        getApiErrorMessage(
          err,
          "Could not submit assignment"
        )
      );

      if (
        code === "PAST_DUE"
      ) {
        setConfirmSubmit(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  //resubmit

  async function handleRequestResubmit() {
  setRequestingResubmit(true);

  try {
    const data = await assignmentApi.requestResubmit(id);

    toast.success(
      data?.message || "Resubmission request sent to teacher"
    );

    await load();
  } catch (err) {
    toast.error(
      getApiErrorMessage(
        err,
        "Could not request resubmission"
      )
    );
  } finally {
    setRequestingResubmit(false);
  }
}

async function handleAllowResubmit(submissionId) {
  try {
    const data = await assignmentApi.allowResubmit(submissionId);

    toast.success(
      data?.message || "Resubmission allowed successfully"
    );

    await load();
  } catch (err) {
    toast.error(
      getApiErrorMessage(err, "Could not allow resubmission")
    );
  }
}

  /*
   * Teacher/Admin grading.
   */
  async function handleGrade(
    submissionId,
    payload
  ) {
    try {
      const data =
        await assignmentApi.grade(
          submissionId,
          payload
        );

      setSubmissions(
        (list) =>
          (list || []).map(
            (submission) =>
              submission._id ===
              submissionId
                ? {
                    ...submission,
                    ...data.submission,
                  }
                : submission
          )
      );

      toast.success(
        "Grade saved"
      );
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          "Could not save grade"
        )
      );
    }
  }

  /*
   * Delete assignment.
   */
  async function handleDelete() {
    setDeleting(true);

    try {
      await assignmentApi.remove(
        id
      );

      toast.success(
        "Assignment deleted"
      );

      navigate(-1);
    } catch (err) {
      const code =
        getApiErrorCode(err);

      if (
        code ===
        "ASSIGNMENT_HAS_SUBMISSIONS"
      ) {
        toast(
          (t) => (
            <span>
              {err?.response?.data
                ?.message}{" "}

              <button
                type="button"
                className="underline font-semibold"
                onClick={async () => {
                  toast.dismiss(
                    t.id
                  );

                  try {
                    await assignmentApi.remove(
                      id,
                      {
                        force: true,
                      }
                    );

                    toast.success(
                      "Assignment deleted"
                    );

                    navigate(-1);
                  } catch (e2) {
                    toast.error(
                      getApiErrorMessage(
                        e2,
                        "Could not delete"
                      )
                    );
                  }
                }}
              >
                Delete anyway
              </button>
            </span>
          )
        );
      } else {
        toast.error(
          getApiErrorMessage(
            err,
            "Could not delete assignment"
          )
        );
      }
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <HomeLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-slate-500 animate-pulse">
            Loading assignment...
          </p>
        </div>
      </HomeLayout>
    );
  }

  /*
   * Error
   */
  if (error) {
    return (
      <HomeLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <EmptyState
            icon={
              error.status === 404
                ? "🔍"
                : error.status === 403
                ? "🔒"
                : "⚠️"
            }
            title={
              error.status === 404
                ? "Assignment not found"
                : "Couldn't load this assignment"
            }
            message={error.message}
            action={
              <button
                type="button"
                onClick={() =>
                  navigate(-1)
                }
                className="min-h-[44px] px-5 rounded-lg bg-indigo-600 text-white font-semibold"
              >
                Go back
              </button>
            }
          />
        </div>
      </HomeLayout>
    );
  }

  const a = assignment;

  const overdue =
    Boolean(a?.dueDate) &&
    new Date(a.dueDate) <
      new Date();

  return (
    <HomeLayout>
      <div className="min-h-[80vh] px-4 sm:px-8 pt-16 pb-16 max-w-3xl mx-auto space-y-6">
        {/* ASSIGNMENT HEADER */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {a.title}
            </h1>

            {!a.canManage && (
              <StatusBadge
                status={
                  mySubmission?.status ||
                  "PENDING"
                }
              />
            )}
          </div>

          {a.description && (
            <p className="text-slate-600">
              {a.description}
            </p>
          )}

          {a.instructions && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 whitespace-pre-line">
              {a.instructions}
            </div>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span
              className={
                overdue
                  ? "text-red-600 font-medium"
                  : ""
              }
            >
              Due:{" "}
              {a.dueDate
                ? formatDate(
                    a.dueDate
                  )
                : "No due date"}
            </span>

            <span>
              Marks: {a.totalMarks}
            </span>

            {!a.allowLateSubmission && (
              <span>
                Late submissions not allowed
              </span>
            )}
          </div>

          {/* TEACHER GOOGLE DRIVE LINK */}

          {a.driveLink && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Assignment Material
              </p>

              <a
                href={a.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                📂 Open Assignment on Google Drive
              </a>

              <p className="mt-2 text-xs text-slate-500 break-all">
                {a.driveLink}
              </p>
            </div>
          )}

          {/* MANAGER ACTIONS */}

          {a.canManage && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/assignments/${id}/edit`
                  )
                }
                className="min-h-[44px] px-4 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirmDelete(
                    true
                  )
                }
                className="min-h-[44px] px-4 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* TEACHER / ADMIN SUBMISSIONS */}

        {a.canManage ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Submissions{" "}
              {a.submissionCounts &&
                `(${a.submissionCounts.total})`}
            </h2>

            {a.submissionCounts && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1">
                  {
                    a.submissionCounts
                      .submitted
                  }{" "}
                  submitted
                </span>

                <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1">
                  {
                    a.submissionCounts
                      .late
                  }{" "}
                  late
                </span>

                <span className="bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
                  {
                    a.submissionCounts
                      .graded
                  }{" "}
                  graded
                </span>
              </div>
            )}

            {!submissions ||
            submissions.length === 0 ? (
              <EmptyState
                icon="📥"
                title="No submissions yet"
              />
            ) : (
              <div className="space-y-3">
                {submissions.map(
                  (submission) => (
                    <SubmissionCard
  key={submission._id}
  submission={submission}
  totalMarks={a.totalMarks}
  onGrade={handleGrade}
  onAllowResubmit={handleAllowResubmit}
/>
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          /* STUDENT */

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Your Submission
            </h2>

            {/* EXISTING SUBMISSION */}

            {mySubmission &&
              mySubmission.status !==
                "PENDING" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Submitted{" "}
                    {formatDateTime(
                      mySubmission.submittedAt
                    )}
                  </p>

                  {mySubmission.text && (
                    <p className="text-sm text-slate-700 whitespace-pre-line">
                      {mySubmission.text}
                    </p>
                  )}

                  {/* STUDENT DRIVE LINK */}

                  {mySubmission.driveLink && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">
                        Submitted Google Drive File
                      </p>

                      <a
                        href={
                          mySubmission.driveLink
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        Open Google Drive
                      </a>

                      <p className="mt-2 text-xs text-slate-500 break-all">
                        {
                          mySubmission.driveLink
                        }
                      </p>
                    </div>
                  )}

                  {/* GRADED RESULT */}

                  {mySubmission.status ===
                  "GRADED" ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-lg font-bold text-green-700">
                        {mySubmission.marks}{" "}
                        / {a.totalMarks}
                      </p>

                      {mySubmission.feedback && (
                        <p className="text-sm text-green-800 mt-1">
                          {
                            mySubmission.feedback
                          }
                        </p>
                      )}
                    </div>
                  ) : (
                    !showForm && (
  <>
    {mySubmission?.resubmitAllowed ? (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="min-h-[44px] px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
      >
        Resubmit Now
      </button>
    ) : mySubmission?.resubmitRequested ? (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Resubmission request sent. Please wait for teacher approval.
      </div>
    ) : (
      <button
        type="button"
        onClick={handleRequestResubmit}
        disabled={requestingResubmit}
        className="min-h-[44px] px-4 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
      >
        {requestingResubmit
          ? "Requesting..."
          : "Request Resubmit"}
      </button>
    )}
  </>
)
                  )}
                </div>
              )}

            {/* SUBMISSION FORM */}

            {showForm &&
              mySubmission?.status !==
                "GRADED" && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  {/* TEXT ANSWER */}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Answer
                    </label>

                    <textarea
                      rows={5}
                      value={text}
                      onChange={(e) =>
                        setText(
                          e.target.value
                        )
                      }
                      placeholder="Write your answer here (optional if you're submitting a Drive link)..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* GOOGLE DRIVE LINK */}

                  <div className="space-y-2">
                    <label
                      htmlFor="submission-drive-link"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Google Drive Link
                    </label>

                    <input
                      id="submission-drive-link"
                      type="url"
                      value={driveLink}
                      onChange={(e) =>
                        setDriveLink(
                          e.target.value
                        )
                      }
                      placeholder="https://drive.google.com/..."
                      className="w-full min-h-[48px] rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <p className="text-xs text-slate-500">
                      Upload your assignment to
                      Google Drive, set the required
                      sharing permission, and paste
                      the link here.
                    </p>
                  </div>

                  {/* ACTIONS */}

                  <div className="flex gap-2">
                    {mySubmission?.status !==
                      "PENDING" && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowForm(
                            false
                          )
                        }
                        className="min-h-[48px] px-4 rounded-lg border border-slate-300 text-sm font-semibold"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmSubmit(
                          true
                        )
                      }
                      disabled={
                        !text.trim() &&
                        !driveLink.trim()
                      }
                      className="flex-1 min-h-[48px] rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Submit Assignment
                    </button>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* SUBMIT CONFIRMATION */}

      <ConfirmDialog
        open={confirmSubmit}
        loading={submitting}
        title="Submit this assignment?"
        message={
          overdue
            ? "The due date has passed - this will be marked as a late submission. Continue?"
            : "Once submitted, your instructor will be notified. Any resubmission requires teacher approval."
        }
        confirmLabel="Submit"
        onConfirm={doSubmit}
        onCancel={() =>
          setConfirmSubmit(false)
        }
      />

      {/* DELETE CONFIRMATION */}

      <ConfirmDialog
        open={confirmDelete}
        danger
        loading={deleting}
        title="Delete this assignment?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() =>
          setConfirmDelete(false)
        }
      />
    </HomeLayout>
  );
}