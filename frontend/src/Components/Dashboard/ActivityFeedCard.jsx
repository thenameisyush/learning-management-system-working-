import { formatDateTime } from "../../utils/formatters";
import DashboardCard from "./DashboardCard";

const ICON = {
  SUBMISSION: "📥",
  QUIZ_ATTEMPT: "📝",
  ENROLLMENT: "🎓",
  COURSE_CREATED: "📚",
};

/**
 * Shared recent-activity list for both the teacher
 * (course-scoped) and admin (platform-wide) dashboards.
 */
export default function ActivityFeedCard({
  title = "Recent activity",
  activity = [],
}) {
  return (
    <DashboardCard title={title}>
      {activity.length === 0 ? (
        <div className="py-6 text-center text-sm text-slate-500">
          Nothing has happened yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {activity.map((e, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm"
            >
              <span className="shrink-0" aria-hidden="true">
                {ICON[e.type] || "•"}
              </span>

              <span className="min-w-0">
                <span className="block text-slate-800">
                  {e.text}
                  {e.course && (
                    <span className="text-slate-500">
                      {" "}
                      · {e.course.title}
                    </span>
                  )}
                </span>

                <span className="block text-xs text-slate-400">
                  {formatDateTime(e.at)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}