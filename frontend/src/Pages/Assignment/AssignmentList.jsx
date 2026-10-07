import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AssignmentCard from "../../Components/Assignment/AssignmentCard";
import EmptyState from "../../Components/UI/EmptyState";
import HomeLayout from "../../Layouts/HomeLayout";
import {
  assignmentApi,
  getApiErrorMessage,
} from "../../Services/assignmentApi";

export default function AssignmentList() {
  const [assignments, setAssignments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function loadAssignments() {
      setLoading(true);
      setError(null);

      try {
        const data =
          await assignmentApi.list();

        if (!mounted) return;

        setAssignments(
          data?.assignments || []
        );
      } catch (err) {
        if (!mounted) return;

        setError(
          getApiErrorMessage(
            err,
            "Could not load assignments"
          )
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAssignments();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <HomeLayout>
      <div className="min-h-[80vh] px-4 sm:px-8 pt-16 pb-16 max-w-3xl mx-auto">

        {/* HEADER */}

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            My Assignments
          </h1>

          <p className="text-sm text-slate-600 mt-1">
            Assignments from your courses
          </p>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="space-y-4">

            {[0, 1, 2].map(
              (item) => (
                <div
                  key={item}
                  className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-3"
                >
                  <div className="h-5 w-1/2 bg-slate-200 rounded" />
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-10 w-full bg-slate-100 rounded-lg" />
                </div>
              )
            )}

          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <EmptyState
            icon="⚠️"
            title="Couldn't load assignments"
            message={error}
            action={
              <button
                onClick={() =>
                  window.location.reload()
                }
                className="min-h-[44px] px-5 rounded-lg bg-indigo-600 text-white font-semibold"
              >
                Try again
              </button>
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
              message="Nothing has been posted for your courses yet."
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
                    assignment={assignment}
                    onView={() =>
                      navigate(
                        `/assignments/${assignment._id}`
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