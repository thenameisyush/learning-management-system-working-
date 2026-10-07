import {
  FiBookOpen,
  FiCheckCircle,
  FiClipboard,
  FiAward,
} from "react-icons/fi";

export default function WelcomeHeader({ fullName, stats = {} }) {
  const firstName = fullName?.split(" ")?.[0] || "Student";

  const cards = [
    {
      label: "My Courses",
      value: stats.courses ?? 0,
      icon: FiBookOpen,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      label: "Pending Assignments",
      value: stats.pendingAssignments ?? 0,
      icon: FiClipboard,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      label: "Available Quizzes",
      value: stats.availableQuizzes ?? 0,
      icon: FiCheckCircle,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      label: "Quiz Results",
      value: stats.completedQuizzes ?? 0,
      icon: FiAward,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-6 py-7 text-white shadow-sm sm:px-8 sm:py-8">
        <div className="relative z-10">
          <p className="text-sm font-medium text-indigo-100">
            Welcome back 👋
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Hello, {firstName}!
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-indigo-100 sm:text-base">
            Keep learning, complete your pending work and check your latest
            quiz performance.
          </p>
        </div>

        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-20 h-44 w-44 rounded-full bg-white/5" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <Icon className={`text-lg ${card.iconColor}`} />
                </div>

                <p className="text-2xl font-bold text-slate-800">
                  {card.value}
                </p>
              </div>

              <p className="mt-3 text-xs font-medium text-slate-500 sm:text-sm">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}