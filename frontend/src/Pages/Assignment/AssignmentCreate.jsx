import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import HomeLayout from "../../Layouts/HomeLayout";

import {
  assignmentApi,
  getApiErrorMessage,
} from "../../Services/assignmentApi";

const inputClass =
  "w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function AssignmentCreate() {
  const { id: assignmentId } = useParams();

  const editing = Boolean(assignmentId);

  const location = useLocation();
  const navigate = useNavigate();

  /*
   * Create mode:
   * CourseAssignments page sends:
   *
   * {
   *   state: {
   *     courseId,
   *     courseTitle
   *   }
   * }
   */

  const courseId =
    location.state?.courseId || null;

  const courseTitle =
    location.state?.courseTitle || "";

  const [loading, setLoading] =
    useState(editing);

  const [loadError, setLoadError] =
    useState(null);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [instructions, setInstructions] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [totalMarks, setTotalMarks] =
    useState(100);

  const [allowLateSubmission, setAllowLateSubmission] =
    useState(true);

  // Teacher/Admin assignment Google Drive link
  const [driveLink, setDriveLink] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  /*
   * Load existing assignment when editing.
   */
  useEffect(() => {
    if (!editing) return;

    let mounted = true;

    async function loadAssignment() {
      setLoading(true);
      setLoadError(null);

      try {
        const data =
          await assignmentApi.get(
            assignmentId
          );

        if (!mounted) return;

        const assignment =
          data?.assignment;

        if (!assignment) {
          throw new Error(
            "Assignment not found"
          );
        }

        if (!assignment.canManage) {
          throw new Error(
            "You do not have permission to edit this assignment"
          );
        }

        setTitle(
          assignment.title || ""
        );

        setDescription(
          assignment.description || ""
        );

        setInstructions(
          assignment.instructions || ""
        );

        if (assignment.dueDate) {
          const d =
            new Date(
              assignment.dueDate
            );

          const pad = (n) =>
            String(n).padStart(2, "0");

          setDueDate(
            `${d.getFullYear()}-${pad(
              d.getMonth() + 1
            )}-${pad(
              d.getDate()
            )}T${pad(
              d.getHours()
            )}:${pad(
              d.getMinutes()
            )}`
          );
        } else {
          setDueDate("");
        }

        setTotalMarks(
          assignment.totalMarks ?? 100
        );

        setAllowLateSubmission(
          assignment.allowLateSubmission !==
            false
        );

        setDriveLink(
          assignment.driveLink || ""
        );
      } catch (err) {
        if (!mounted) return;

        setLoadError(
          getApiErrorMessage(
            err,
            "Could not load this assignment"
          )
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAssignment();

    return () => {
      mounted = false;
    };
  }, [editing, assignmentId]);

  /*
   * Create / Update assignment.
   */
  async function handleSave(e) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!editing && !courseId) {
      toast.error(
        "Course is missing. Open Create Assignment from a course's assignment page."
      );
      return;
    }

    if (!driveLink.trim()) {
      toast.error(
        "Google Drive assignment link is required"
      );
      return;
    }

    // Basic frontend validation.
    try {
      const url = new URL(
        driveLink.trim()
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

    const payload = {
      title: title.trim(),

      description:
        description.trim(),

      instructions:
        instructions.trim(),

      dueDate: dueDate
        ? new Date(
            dueDate
          ).toISOString()
        : "",

      totalMarks:
        Number(totalMarks),

      allowLateSubmission,

      driveLink:
        driveLink.trim(),
    };

    if (!editing) {
      payload.courseId = courseId;
    }

    setSaving(true);

    try {
      const data = editing
        ? await assignmentApi.update(
            assignmentId,
            payload
          )
        : await assignmentApi.create(
            payload
          );

      toast.success(
        editing
          ? "Assignment updated"
          : "Assignment created"
      );

      const newId =
        data?.assignment?._id;

      if (newId) {
        navigate(
          `/assignments/${newId}`
        );
      } else {
        navigate("/assignments");
      }
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          editing
            ? "Could not update the assignment"
            : "Could not create the assignment"
        )
      );
    } finally {
      setSaving(false);
    }
  }

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

  if (loadError) {
    return (
      <HomeLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-700">
              Can't edit this assignment
            </h2>

            <p className="text-sm text-red-600 mt-2">
              {loadError}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              className="mt-4 min-h-[44px] px-5 rounded-lg bg-indigo-600 text-white font-semibold"
            >
              Go back
            </button>
          </div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="min-h-[80vh] px-4 sm:px-8 pt-16 pb-24 max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
          {editing
            ? "Edit Assignment"
            : "Create Assignment"}
        </h1>

        {!editing &&
          courseTitle && (
            <div className="mb-4 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
              <p className="text-sm text-indigo-800">
                Course:{" "}
                <strong>
                  {courseTitle}
                </strong>
              </p>
            </div>
          )}

        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5"
        >
          {/* TITLE */}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder="e.g. Essay: The Water Cycle"
              className={inputClass}
              required
            />
          </div>

          {/* DESCRIPTION */}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>

            <textarea
              rows={3}
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Assignment description"
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* INSTRUCTIONS */}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instructions
            </label>

            <textarea
              rows={4}
              value={instructions}
              onChange={(e) =>
                setInstructions(
                  e.target.value
                )
              }
              placeholder="What should students submit, and how?"
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* GOOGLE DRIVE LINK */}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Google Drive Assignment Link
              <span className="text-red-500">
                {" "}
                *
              </span>
            </label>

            <input
              type="url"
              value={driveLink}
              onChange={(e) =>
                setDriveLink(
                  e.target.value
                )
              }
              placeholder="https://drive.google.com/..."
              className={inputClass}
              required
            />

            <p className="text-xs text-slate-500 mt-1.5">
              Upload the assignment material to
              Google Drive, set the required sharing
              permission, and paste the link here.
            </p>
          </div>

          {/* DUE DATE + MARKS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Due Date
              </label>

              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) =>
                  setDueDate(
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Total Marks
              </label>

              <input
                type="number"
                min="1"
                value={totalMarks}
                onChange={(e) =>
                  setTotalMarks(
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* LATE SUBMISSION */}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={
                allowLateSubmission
              }
              onChange={(e) =>
                setAllowLateSubmission(
                  e.target.checked
                )
              }
              className="h-4 w-4"
            />

            <span className="text-sm text-slate-700">
              Allow late submissions
            </span>
          </label>

          {/* ACTIONS */}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              className="min-h-[46px] px-5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 min-h-[46px] rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving
                ? editing
                  ? "Updating..."
                  : "Creating..."
                : editing
                ? "Update Assignment"
                : "Create Assignment"}
            </button>
          </div>
        </form>
      </div>
    </HomeLayout>
  );
}