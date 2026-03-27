import { useState } from "react";

const ruby = "#BE1E2D";
const rubyLight = "#BE1E2D0A";
const rubyBorder = "#BE1E2D20";
const steel = "#2D4A6F";
const ink = "#1A1A2E";
const slate = "#6B7280";
const bg = "#F7F7F8";
const surface = "#FFFFFF";
const borderColor = "#E5E7EB";
const pill = { borderRadius: 9999 };

const statusStyles = {
  Pending: { bg: "#FEF3C7", color: "#92400E" },
  Matched: { bg: "#DBEAFE", color: "#1E40AF" },
  Booked: { bg: "#E0E7FF", color: "#3730A3" },
  Completed: { bg: "#D1FAE5", color: "#065F46" },
  Cancelled: { bg: "#FEE2E2", color: "#991B1B" },
  Urgent: { bg: "#FDE68A", color: "#78350F" },
};

function Badge({ status }) {
  const s = statusStyles[status] || statusStyles.Pending;
  return (
    <span style={{ ...pill, background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, padding: "4px 12px", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

function MetricCard({ icon, label, value, trend, trendUp }) {
  return (
    <div style={{
      background: surface, borderRadius: 16, padding: "24px 28px", border: `1px solid ${borderColor}`,
      flex: 1, minWidth: 0, transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.04)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: rubyLight, border: `1px solid ${rubyBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="material-symbols-outlined" style={{ color: ruby, fontSize: 20 }}>{icon}</span>
        </div>
        {trend && (
          <span style={{ fontSize: 12, fontWeight: 600, color: trendUp ? "#059669" : "#DC2626", display: "flex", alignItems: "center", gap: 2 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{trendUp ? "trending_up" : "trending_down"}</span>
            {trend}
          </span>
        )}
      </div>
      <div style={{ fontFamily: "Manrope", fontSize: 32, fontWeight: 800, color: ink, letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 13, color: slate, marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

const navItems = [
  { icon: "dashboard", label: "Dashboard", active: true },
  { icon: "folder_open", label: "Cases", active: false },
  { icon: "receipt_long", label: "Billing", active: false },
  { icon: "group", label: "Team", active: false },
  { icon: "settings", label: "Settings", active: false },
];

const cases = [
  { id: "BLT-2024-0847", patient: "Maria Schmidt", age: 67, test: "Complete Blood Count", bc: "Anna Weber", status: "Booked", date: "Mar 14, 2026", urgency: null, type: "Home Visit" },
  { id: "BLT-2024-0846", patient: "Tobias Richter", age: 34, test: "Thyroid Panel", bc: "—", status: "Pending", date: "Mar 13, 2026", urgency: "Urgent", type: "Practice" },
  { id: "BLT-2024-0845", patient: "Elena Becker", age: 45, test: "Vitamin D + B12", bc: "Dr. Klaus Frey", status: "Completed", date: "Mar 12, 2026", urgency: null, type: "Practice" },
  { id: "BLT-2024-0844", patient: "Hans Mueller", age: 72, test: "Liver Function Panel", bc: "Sophie Lang", status: "Matched", date: "Mar 12, 2026", urgency: null, type: "Home Visit" },
  { id: "BLT-2024-0843", patient: "Laura Fischer", age: 28, test: "Hormone Panel", bc: "Anna Weber", status: "Completed", date: "Mar 11, 2026", urgency: null, type: "Practice" },
  { id: "BLT-2024-0842", patient: "Karl Braun", age: 81, test: "HbA1c + Glucose", bc: "—", status: "Cancelled", date: "Mar 11, 2026", urgency: null, type: "Home Visit" },
];

const activity = [
  { time: "2 min ago", text: "Anna Weber confirmed appointment with Maria Schmidt", icon: "check_circle", color: "#059669" },
  { time: "1 hour ago", text: "New case BLT-2024-0846 created for Tobias Richter", icon: "add_circle", color: steel },
  { time: "3 hours ago", text: "Dr. Klaus Frey completed collection for Elena Becker", icon: "task_alt", color: "#059669" },
  { time: "5 hours ago", text: "Sophie Lang matched with Hans Mueller's case", icon: "handshake", color: ruby },
  { time: "Yesterday", text: "Invoice #INV-2024-032 generated — €240.00", icon: "receipt", color: slate },
];

export default function HCDashboard() {
  const [sidebarHover, setSidebarHover] = useState(null);
  const [selectedTab, setSelectedTab] = useState("All");
  const tabs = ["All", "Pending", "Matched", "Booked", "Completed"];
  const filteredCases = selectedTab === "All" ? cases : cases.filter(c => c.status === selectedTab);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: ink, background: bg, minHeight: "100vh", display: "flex" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300&display=swap" rel="stylesheet" />

      {/* ════════ SIDEBAR ════════ */}
      <aside style={{
        width: 260, background: surface, borderRight: `1px solid ${borderColor}`,
        display: "flex", flexDirection: "column", padding: "0", flexShrink: 0, height: "100vh", position: "sticky", top: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 24px 32px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: ruby, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: 18 }}>bloodtype</span>
          </div>
          <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>
            Blutabnahme<span style={{ color: ruby }}>.de</span>
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {navItems.map((item, i) => (
            <div
              key={i}
              onMouseEnter={() => setSidebarHover(i)}
              onMouseLeave={() => setSidebarHover(null)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10, cursor: "pointer",
                marginBottom: 2,
                background: item.active ? rubyLight : sidebarHover === i ? "#F9FAFB" : "transparent",
                color: item.active ? ruby : ink,
                transition: "all 0.15s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: item.active ? ruby : slate }}>{item.icon}</span>
              <span style={{ fontSize: 14, fontWeight: item.active ? 600 : 500 }}>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${borderColor}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${steel}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "Manrope", fontSize: 14, fontWeight: 700, color: steel }}>BH</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Berlin Health Lab</div>
              <div style={{ fontSize: 11, color: slate }}>Healthcare Company</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ════════ MAIN CONTENT ════════ */}
      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 1200, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "Manrope", fontSize: 28, fontWeight: 800, letterSpacing: -0.8, margin: "0 0 4px" }}>Dashboard</h1>
            <p style={{ fontSize: 14, color: slate, margin: 0 }}>Welcome back, Berlin Health Lab. Here's your overview.</p>
          </div>
          <button style={{
            ...pill, background: ruby, color: "#fff", border: "none", padding: "12px 28px",
            fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            boxShadow: `0 4px 16px ${ruby}25`, transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#A51A26"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = ruby; e.currentTarget.style.transform = "translateY(0)"; }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            New Case
          </button>
        </div>

        {/* Metrics */}
        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          <MetricCard icon="pending_actions" label="Active Cases" value="12" trend="+3 this week" trendUp={true} />
          <MetricCard icon="hourglass_top" label="Pending Match" value="4" trend="2 urgent" trendUp={false} />
          <MetricCard icon="check_circle" label="Completed (Mar)" value="38" trend="+12% vs Feb" trendUp={true} />
          <MetricCard icon="euro" label="Total Spend (Mar)" value="€1,840" trend="+8% vs Feb" trendUp={true} />
        </div>

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          {/* Cases Table */}
          <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, overflow: "hidden" }}>
            {/* Table Header */}
            <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "Manrope", fontSize: 18, fontWeight: 700, margin: 0 }}>Recent Cases</h2>
              <a href="#" style={{ fontSize: 13, color: ruby, fontWeight: 600, textDecoration: "none" }}>View all →</a>
            </div>

            {/* Filter Tabs */}
            <div style={{ padding: "16px 24px 0", display: "flex", gap: 4 }}>
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  style={{
                    ...pill, border: "none", padding: "6px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                    background: selectedTab === tab ? rubyLight : "transparent",
                    color: selectedTab === tab ? ruby : slate,
                    transition: "all 0.15s",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Table */}
            <div style={{ padding: "12px 0 8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                    {["Patient", "Test", "Collector", "Type", "Status", "Date"].map(h => (
                      <th key={h} style={{ padding: "10px 24px", fontSize: 11, fontWeight: 600, color: slate, textTransform: "uppercase", letterSpacing: 0.8, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((c, i) => (
                    <tr key={i} style={{ borderBottom: i < filteredCases.length - 1 ? `1px solid #F3F4F6` : "none", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 24px" }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{c.patient}</div>
                        <div style={{ fontSize: 12, color: slate }}>{c.id}</div>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: ink }}>{c.test}</td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: c.bc === "—" ? "#D1D5DB" : ink }}>{c.bc}</td>
                      <td style={{ padding: "14px 24px" }}>
                        <span style={{ fontSize: 12, color: slate, display: "flex", alignItems: "center", gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: c.type === "Home Visit" ? "#E8734A" : steel }}>
                            {c.type === "Home Visit" ? "home" : "local_hospital"}
                          </span>
                          {c.type}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <Badge status={c.status} />
                          {c.urgency && <Badge status={c.urgency} />}
                        </div>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: slate }}>{c.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCases.length === 0 && (
                <div style={{ padding: "40px 24px", textAlign: "center", color: slate, fontSize: 14 }}>No cases matching this filter.</div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "20px 24px", alignSelf: "start" }}>
            <h2 style={{ fontFamily: "Manrope", fontSize: 16, fontWeight: 700, margin: "0 0 20px" }}>Recent Activity</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {activity.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: i < activity.length - 1 ? `1px solid #F3F4F6` : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${a.color}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: a.color }}>{a.icon}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: ink, lineHeight: 1.5 }}>{a.text}</div>
                    <div style={{ fontSize: 11, color: "#B0B5BE", marginTop: 4 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <button style={{
              width: "100%", marginTop: 16, padding: "10px", borderRadius: 10, border: `1px solid ${borderColor}`,
              background: "transparent", fontSize: 13, fontWeight: 500, color: slate, cursor: "pointer", transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.target.style.background = "#F9FAFB"; e.target.style.color = ink; }}
              onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = slate; }}>
              View all activity
            </button>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 24 }}>
          {/* Upcoming Appointments */}
          <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "Manrope", fontSize: 14, fontWeight: 700, margin: 0 }}>Upcoming Appointments</h3>
              <span style={{ fontSize: 12, color: slate }}>Next 48h</span>
            </div>
            {[
              { patient: "Maria Schmidt", time: "Tomorrow, 09:30", bc: "Anna Weber", type: "Home Visit" },
              { patient: "Hans Mueller", time: "Tomorrow, 14:00", bc: "Sophie Lang", type: "Home Visit" },
            ].map((apt, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i === 0 ? `1px solid #F3F4F6` : "none" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{apt.patient}</div>
                  <div style={{ fontSize: 12, color: slate }}>{apt.bc} · {apt.type}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: steel, background: `${steel}08`, ...pill, padding: "4px 12px" }}>{apt.time}</div>
              </div>
            ))}
          </div>

          {/* Billing Summary */}
          <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "Manrope", fontSize: 14, fontWeight: 700, margin: 0 }}>Billing Summary</h3>
              <span style={{ fontSize: 12, color: slate }}>March 2026</span>
            </div>
            {[
              { label: "Organization Fees", value: "€760.00" },
              { label: "Material Costs", value: "€340.00" },
              { label: "Logistics Fees", value: "€180.00" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? `1px solid #F3F4F6` : "none" }}>
                <span style={{ fontSize: 13, color: slate }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "Manrope" }}>{item.value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Total (incl. VAT)</span>
              <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "Manrope", color: ruby }}>€1,523.20</span>
            </div>
          </div>

          {/* Performance */}
          <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "Manrope", fontSize: 14, fontWeight: 700, margin: 0 }}>Performance</h3>
              <span style={{ fontSize: 12, color: slate }}>Last 30 days</span>
            </div>
            {[
              { label: "Avg. time to match", value: "4.2 hours", good: true },
              { label: "Avg. time to appointment", value: "1.8 days", good: true },
              { label: "Cancellation rate", value: "3.1%", good: true },
              { label: "BC satisfaction", value: "4.8 / 5.0", good: true },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? `1px solid #F3F4F6` : "none" }}>
                <span style={{ fontSize: 13, color: slate }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: item.good ? "#059669" : "#DC2626" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
