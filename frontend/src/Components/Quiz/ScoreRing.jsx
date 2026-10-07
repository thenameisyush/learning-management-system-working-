/**
 * Small circular percentage gauge. Pure SVG, no dependencies, themeable via
 * the `color` prop (a Tailwind stroke-* class).
 */
export default function ScoreRing({
  percentage,
  size = 128,
  strokeWidth = 10,
  color = "stroke-green-500",
}) {
  const pct = Math.max(
    0,
    Math.min(100, Math.round(percentage))
  );

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference * (1 - pct / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
      }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-label={`${pct}%`}
        role="img"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-gray-800"
          strokeWidth={strokeWidth}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <span className="absolute text-2xl font-bold">
        {pct}%
      </span>
    </div>
  );
}