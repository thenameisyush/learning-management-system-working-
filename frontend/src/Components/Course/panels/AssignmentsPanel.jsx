import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AssignmentCard from "../../Assignment/AssignmentCard";
import EmptyState from "../../UI/EmptyState";
import { assignmentApi, getApiErrorMessage } from "../../../Services/assignmentApi";

const Skeleton = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading assignments">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white/80 rounded-2xl p-5 animate-pulse space-y-3">
        <div className="h-5 w-1/2 bg-slate-200 rounded" />
        <div className="h-4 w-3/4 bg-slate-200 rounded" />
        <div className="h-9 w-full bg-slate-100 rounded-lg" />
      </div>
    ))}
  </div>
);

/**
 * Course-scoped assignment cards. Extracted from
 * Pages/Assignment/CourseAssignments.jsx so the standalone route AND the
 * course page's "Assignments" tab share one implementation.
 */
export default function AssignmentsPanel({ courseId, courseTitle }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [canManage, setCanManage] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assignmentApi.list(courseId);
      setAssignments(data.assignments || []);
      // Comes from the course itself (server-computed from ownership/role),
      // never from whether the list happens to be empty - so the FIRST
      // assignment can still be created on a course with zero so far.
      setCanManage(Boolean(data.canManage));
    } catch (err) {
      setError({ status: err?.response?.status, message: getApiErrorMessage(err, "Could not load assignments") });
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex justify-end mb-4">
        {canManage && (
          <button
            onClick={() => navigate("/assignments/create", { state: { courseId, courseTitle } })}
            className="min-h-[44px] px-5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            + New Assignment
          </button>
        )}
      </div>

      {loading ? (
        <Skeleton />
      ) : error ? (
        <EmptyState
          icon={error.status === 403 ? "\uD83D\uDD12" : "\u26A0\uFE0F"}
          title={error.status === 403 ? "Assignments are locked" : "Couldn't load assignments"}
          message={error.message}
          action={
            error.status === 403 ? (
              <Link to="/courses" className="min-h-[44px] inline-flex items-center px-5 rounded-lg bg-indigo-600 text-white font-semibold">
                Browse courses
              </Link>
            ) : (
              <button onClick={load} className="min-h-[44px] px-5 rounded-lg bg-indigo-600 text-white font-semibold">
                Try again
              </button>
            )
          }
        />
      ) : assignments.length === 0 ? (
        <EmptyState icon="\uD83D\uDCDD" title="No assignments yet" message="Check back once your instructor posts one." />
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <AssignmentCard key={a._id} assignment={a} onView={() => navigate(`/assignments/${a._id}`, { state: { courseTitle } })} />
          ))}
        </div>
      )}
    </div>
  );
}
