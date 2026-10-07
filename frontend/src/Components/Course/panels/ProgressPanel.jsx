import EmptyState from "../../UI/EmptyState";

/**
 * Honest placeholder: there is no per-student progress-tracking model yet
 * (no "lecture watched" / "quiz completed" state is persisted anywhere), so
 * this deliberately does not fabricate a percentage. Real progress tracking
 * is a backend feature to build, not a course-page layout concern.
 */
export default function ProgressPanel() {
  return (
    <EmptyState
      icon="\uD83D\uDCC8"
      title="Progress tracking is coming soon"
      message="We're not tracking per-lecture completion yet. In the meantime, check the Quizzes tab for your quiz results."
    />
  );
}
