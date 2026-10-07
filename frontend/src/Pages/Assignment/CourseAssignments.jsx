import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import AssignmentCard from "../../Components/Assignment/AssignmentCard";
import EmptyState from "../../Components/UI/EmptyState";
import HomeLayout from "../../Layouts/HomeLayout";

import {
  assignmentApi,
  getApiErrorMessage,
} from "../../Services/assignmentApi";

const Skeleton = () => (
  <div
    className="space-y-4"
    aria-busy="true"
    aria-label="Loading assignments"
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="bg-white/80 rounded-2xl p-5 animate-pulse space-y-3"
      >
        <div className="h-5 w-1/2 bg-slate-200 rounded" />

        <div className="h-4 w-3/4 bg-slate-200 rounded" />

        <div className="h-9 w-full bg-slate-100 rounded-lg" />
      </div>
    ))}
  </div>
);

export default function CourseAssignments() {
  const { courseId } = useParams();

  const { state } = useLocation();

  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [assignments, setAssignments] =
    useState([]);

  /*
   * Course title can come from navigation state.
   */
  const courseTitle =
    state?.courseTitle || "";

  const load = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const data =
          await assignmentApi.list(
            courseId
          );

        setAssignments(
          data?.assignments || []
        );
      } catch (err) {
        setError({
          status:
            err?.response?.status,
          message:
            getApiErrorMessage(
              err,
              "Could not load assignments"
            ),
        });
      } finally {
        setLoading(false);
      }
    },
    [courseId]
  );

  useEffect(() => {
    load();
  }, [load]);

  /*
   * If assignments exist, use the backend's
   * canManage value.
   *
   * If no assignment exists, we don't assume
   * the user can manage it.
   */
  const canManage =
    assignments.some(
      (assignment) =>
        assignment.canManage === true
    );

  return (
    <HomeLayout>
      <div className="min-h-[80vh] px-4 sm:px-8 pt-16 pb-16 max-w-3xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Assignments
            </h1>

            {courseTitle && (
              <p className="text-sm text-slate-700 mt-1">
                {courseTitle}
              </p>
            )}
          </div>

          {canManage && (
            <button
              onClick={() =>
                navigate(
                  "/assignments/create",
                  {
                    state: {
                      courseId,
                      courseTitle,
                    },
                  }
                )
              }
              className="min-h-[48px] px-5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              + New Assignment
            </button>
          )}

        </div>

        {/* LOADING */}

        {loading && (
          <Skeleton />
        )}

        {/* ERROR */}

        {!loading && error && (
          <EmptyState
            icon={
              error.status === 403
                ? "🔒"
                : "⚠️"
            }
            title={
              error.status === 403
                ? "Assignments are locked"
                : "Couldn't load assignments"
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
                  onClick={load}
                  className="min-h-[44px] px-5 rounded-lg bg-indigo-600 text-white font-semibold"
                >
                  Try again
                </button>
              )
            }
          />
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          assignments.length === 0 && (
            <EmptyState
              icon="📝"
              title="No assignments yet"
              message="Check back once your instructor posts one."
            />
          )}

        {/* ASSIGNMENTS */}

        {!loading &&
          !error &&
          assignments.length > 0 && (
            <div className="space-y-4">

              {assignments.map(
                (assignment) => (
                  <AssignmentCard
                    key={assignment._id}
                    assignment={
                      assignment
                    }
                    onView={() =>
                      navigate(
                        `/assignments/${assignment._id}`,
                        {
                          state: {
                            courseTitle,
                          },
                        }
                      )
                    }
                  />
                )
              )}

            </div>
          )}

      </div>
    </HomeLayout>
  );
}