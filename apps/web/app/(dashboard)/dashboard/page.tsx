import LeadsPreview from "./components/leads-preview"
import AnalyticsSummary from "./components/analytics-summary"
import AnalyticsChart from "./components/analytics-chart"
import Card from "@/components/Card"

export default function DashboardPage(){

  return (
    <div style={{ padding: 16 }}>
      <header style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.4px" }}>Home</h2>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted)", fontWeight: 400 }}>
          Welcome back! Here’s a quick snapshot of your business.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <Card title="Total Menus" value="₹140" valueColor="#22c55e" />
        <Card title="Total Orders" value="₹175" valueColor="#2563eb" />
        <Card title="Total Clients" value="263" valueColor="#f59e0b" />
        <Card title="Total Revenue" value="₹13,755" valueColor="#10b981" />
      </div>

      <div style={{ marginTop: 22 }}>
        <AnalyticsSummary />
        <AnalyticsChart />
      </div>

      <div style={{ marginTop: 22 }}>
        <LeadsPreview />
      </div>
    </div>
  )
}
