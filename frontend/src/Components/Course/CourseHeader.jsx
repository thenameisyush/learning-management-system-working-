import { formatDate } from "../../utils/formatters";

/**
 * Course page header.
 * Shows thumbnail, title, description, instructor,
 * course metadata and access information.
 */
export default function CourseHeader({ course, access }) {
  const badge = {
    manager: {
      label: "You manage this course",
      cls: "bg-purple-100 text-purple-700 border-purple-200",
    },
    subscribed: {
      label: "Enrolled",
      cls: "bg-green-100 text-green-700 border-green-200",
    },
    guest: {
      label: "Preview",
      cls: "bg-gray-100 text-gray-600 border-gray-200",
    },
  }[access] || null;

  const lectureCount = course?.numberOfLectures ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      <div className="flex flex-col lg:flex-row">

        {/* THUMBNAIL */}
        {course?.thumbnail?.secure_url ? (
          <div className="w-full shrink-0 lg:w-[330px]">
            <div className="h-56 w-full lg:h-full lg:min-h-[250px]">
              <img
                src={course.thumbnail.secure_url}
                alt={course?.title || "Course thumbnail"}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="flex h-56 w-full shrink-0 items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100 lg:h-auto lg:min-h-[250px] lg:w-[330px]">
            <div className="text-center">
              <div className="text-5xl">📚</div>
              <p className="mt-2 text-sm font-medium text-gray-500">
                No thumbnail
              </p>
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div className="flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-7">

          {/* TITLE + BADGE */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

            <div className="min-w-0">
              <h1 className="break-words text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                {course?.title || "Course"}
              </h1>

              <div className="mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500" />
            </div>

            {badge && (
              <span
                className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${badge.cls}`}
              >
                {badge.label}
              </span>
            )}
          </div>

          {/* DESCRIPTION */}
          {course?.description && (
            <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-7 text-gray-600 sm:text-base">
              {course.description}
            </p>
          )}

          {/* COURSE INFORMATION */}
          <div className="mt-5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 xl:grid-cols-3">

            {course?.createdBy && (
              <div className="flex items-center gap-2 rounded-xl bg-yellow-50 px-3 py-2.5">
                <span>👨‍🏫</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Instructor
                  </p>
                  <p className="truncate font-semibold text-gray-800">
                    {course.createdBy}
                  </p>
                </div>
              </div>
            )}

            {course?.category && (
              <div className="flex items-center gap-2 rounded-xl bg-yellow-50 px-3 py-2.5">
                <span>📚</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Category
                  </p>
                  <p className="truncate font-semibold text-gray-800">
                    {course.category}
                  </p>
                </div>
              </div>
            )}

            {typeof course?.price === "number" && (
              <div className="flex items-center gap-2 rounded-xl bg-yellow-50 px-3 py-2.5">
                <span>💰</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Price
                  </p>
                  <p className="font-semibold text-gray-800">
                    {course.price > 0
                      ? `₹${course.price}`
                      : "Free"}
                  </p>
                </div>
              </div>
            )}

            {course?.duration && (
              <div className="flex items-center gap-2 rounded-xl bg-yellow-50 px-3 py-2.5">
                <span>⏱️</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Duration
                  </p>
                  <p className="font-semibold text-gray-800">
                    {course.duration}
                  </p>
                </div>
              </div>
            )}

            {course?.createdAt && (
              <div className="flex items-center gap-2 rounded-xl bg-yellow-50 px-3 py-2.5">
                <span>📅</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Added
                  </p>
                  <p className="font-semibold text-gray-800">
                    {formatDate(course.createdAt)}
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* COURSE STATS */}
          <div className="mt-5 flex flex-wrap gap-2">

            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-xs font-semibold text-yellow-800">
              🎥 {lectureCount} lecture
              {lectureCount === 1 ? "" : "s"}
            </span>

            {typeof course?.numberOfVideos === "number" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
                ▶️ {course.numberOfVideos} with video
              </span>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}