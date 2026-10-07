import { useCallback, useEffect, useState } from "react";

import AttendanceCard from "../../Components/Dashboard/AttendanceCard";
import AvailableQuizzesCard from "../../Components/Dashboard/AvailableQuizzesCard";
import CourseProgressList from "../../Components/Dashboard/CourseProgressList";
import LeaderboardHighlightsCard from "../../Components/Dashboard/LeaderboardHighlightsCard";
import PendingAssignmentsCard from "../../Components/Dashboard/PendingAssignmentsCard";
import RecentResultsCard from "../../Components/Dashboard/RecentResultsCard";
import WelcomeHeader from "../../Components/Dashboard/WelcomeHeader";

import EmptyState from "../../Components/UI/EmptyState";
import HomeLayout from "../../Layouts/HomeLayout";

import {
  dashboardApi,
  getApiErrorMessage,
} from "../../Services/dashboardApi";

const Skeleton = () => (
  <div
    className="space-y-4 animate-pulse"
    aria-busy="true"
    aria-label="Loading dashboard"
  >
    <div className="h-40 rounded-2xl bg-slate-200" />

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-28 rounded-2xl bg-slate-200"
        />
      ))}
    </div>

    <div className="h-56 rounded-2xl bg-slate-200" />
    <div className="h-48 rounded-2xl bg-slate-200" />
  </div>
);

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await dashboardApi.student();

      setData(response);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Could not load your dashboard"
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <HomeLayout>
      <div className="min-h-[90vh] bg-slate-50 pb-16">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          {loading ? (
            <Skeleton />
          ) : error ? (
            <EmptyState
              icon="⚠️"
              title="Couldn't load your dashboard"
              message={error}
              action={
                <button
                  type="button"
                  onClick={load}
                  className="min-h-[44px] rounded-lg bg-indigo-600 px-5 font-semibold text-white transition hover:bg-indigo-700"
                >
                  Try again
                </button>
              }
            />
          ) : (
            <div className="space-y-5">
              <WelcomeHeader
                fullName={data?.student?.fullName}
                stats={data?.stats}
              />

              <div className="grid items-start gap-5 lg:grid-cols-3">
                {/* Main content */}
                <div className="min-w-0 space-y-5 lg:col-span-2">
                  <CourseProgressList
                    courses={data?.courses || []}
                  />

                  <PendingAssignmentsCard
                    assignments={
                      data?.pendingAssignments || []
                    }
                    total={
                      data?.stats?.pendingAssignments || 0
                    }
                  />

                  <AvailableQuizzesCard
                    quizzes={
                      data?.availableQuizzes || []
                    }
                    total={
                      data?.stats?.availableQuizzes || 0
                    }
                  />

                  <RecentResultsCard
                    results={
                      data?.recentResults || []
                    }
                  />
                </div>

                {/* Sidebar */}
                <div className="min-w-0 space-y-5">
                  <AttendanceCard
                    attendance={data?.attendance || {}}
                  />

                  <LeaderboardHighlightsCard
                    entries={
                      data?.leaderboard || []
                    }
                    courses={data?.courses || []}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </HomeLayout>
  );
}