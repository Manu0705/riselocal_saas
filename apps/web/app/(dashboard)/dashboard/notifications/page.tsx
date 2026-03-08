"use client"

import { Clock3, Phone, Star } from "lucide-react"
import NotificationItem from "@/components/notification-item"
import MobilePageTitle from "../components/mobile-page-title"
import { useDashboardData } from "@/context/DashboardDataContext"

export default function NotificationsPage() {
  const { leads, loading, error } = useDashboardData()

  const sampleName = leads[0]?.name ?? "Sarah Johnson"
  const secondName = leads[1]?.name ?? "Michael Chen"

  const notifications = [
    {
      id: "followup",
      icon: Clock3,
      title: `Followup Reminder - ${sampleName}`,
      time: "2h ago",
    },
    {
      id: "missed",
      icon: Phone,
      title: `Missed Lead - ${secondName}`,
      time: "4h ago",
    },
    {
      id: "review",
      icon: Star,
      title: "Review Request Pending",
      time: "1d ago",
    },
  ] as const

  return (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      <MobilePageTitle title="Notifications" />

      {loading ? <p style={{ color: "var(--muted)" }}>Loading notifications...</p> : null}
      {error ? <p style={{ color: "#b91c1c" }}>Error: {error}</p> : null}

      {!loading && !error ? (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {notifications.map((item) => (
            <NotificationItem
              key={item.id}
              icon={item.icon}
              title={item.title}
              time={item.time}
              onClick={() => alert(item.title)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
