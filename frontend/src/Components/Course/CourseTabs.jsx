export const COURSE_TABS = [
  { key: "overview", label: "Overview" },
  { key: "videos", label: "Videos" },
  { key: "notes", label: "Notes" },
  { key: "quizzes", label: "Quizzes" },
  { key: "assignments", label: "Assignments" },
  { key: "attendance", label: "Attendance" },
  { key: "progress", label: "Progress" },
  { key: "leaderboard", label: "Leaderboard" },
];

/**
 * Horizontally scrollable tab strip (deliberately - a tab bar that scrolls
 * sideways with a visible active indicator is the standard mobile pattern;
 * this is not the "unintentional page overflow" the rest of the app avoids).
 */
export default function CourseTabs({ active, onChange }) {
  return (
    <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-slate-200 -mx-4 sm:mx-0 px-4 sm:px-0">
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {COURSE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`shrink-0 min-h-[44px] px-4 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition ${
              active === tab.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
