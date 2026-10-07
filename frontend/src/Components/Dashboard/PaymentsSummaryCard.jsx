import DashboardCard from "./DashboardCard";

const Tile = ({ value, label }) => (
  <div className="bg-slate-50 rounded-xl p-3 text-center">
    <p className="text-xl font-bold text-slate-900">{value}</p>
    <p className="text-xs text-slate-500">{label}</p>
  </div>
);

/**
 * DB-backed counts only. No payment record in this database stores an
 * amount, so a currency total is never shown here - only real counts.
 */
export default function PaymentsSummaryCard({ payments }) {
  return (
    <DashboardCard title="Payments & subscriptions">
      <div className="grid grid-cols-3 gap-3">
        <Tile value={payments.activeSubscribers} label="Active subscribers" />
        <Tile value={payments.verifiedPayments} label="Verified payments" />
        <Tile value={payments.verifiedPaymentsLast30Days} label="Last 30 days" />
      </div>
      <p className="text-xs text-slate-400 mt-3">
        Revenue figures aren't tracked in the database; see the Payments page for live Razorpay records.
      </p>
    </DashboardCard>
  );
}
