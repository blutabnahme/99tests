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
const burnt = "#E8734A";
const green = "#059669";
const pill = { borderRadius: 9999 };

function Label({ children, hint }) {
  return (
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: ink, marginBottom: 6 }}>
      {children}
      {hint && <span style={{ fontWeight: 400, color: slate, marginLeft: 6, fontSize: 12 }}>{hint}</span>}
    </label>
  );
}

function Input({ value, onChange, type = "text", prefix, suffix, placeholder, width }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: width || "100%" }}>
      {prefix && <span style={{ padding: "10px 12px", background: bg, border: `1px solid ${borderColor}`, borderRight: "none", borderRadius: "10px 0 0 10px", fontSize: 14, color: slate, fontWeight: 600 }}>{prefix}</span>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          flex: 1, padding: "10px 14px", border: `1px solid ${borderColor}`, fontSize: 14, color: ink, outline: "none", background: surface, boxSizing: "border-box",
          borderRadius: prefix && suffix ? 0 : prefix ? "0 10px 10px 0" : suffix ? "10px 0 0 10px" : 10,
          minWidth: 0,
        }}
        onFocus={e => e.target.style.borderColor = ruby}
        onBlur={e => e.target.style.borderColor = borderColor} />
      {suffix && <span style={{ padding: "10px 12px", background: bg, border: `1px solid ${borderColor}`, borderLeft: "none", borderRadius: "0 10px 10px 0", fontSize: 14, color: slate, fontWeight: 500 }}>{suffix}</span>}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <div onClick={onChange} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: ink }}>{label}</span>
      <div style={{ width: 44, height: 24, borderRadius: 12, background: checked ? ruby : "#D1D5DB", padding: 2, transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", transform: checked ? "translateX(20px)" : "translateX(0)", transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
      </div>
    </div>
  );
}

function SaveBar({ onSave }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 20, marginTop: 20, borderTop: `1px solid #F3F4F6` }}>
      <button onClick={onSave} style={{
        ...pill, padding: "10px 24px", border: "none", background: ruby, color: "#fff",
        fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        boxShadow: `0 2px 8px ${ruby}20`, transition: "all 0.2s",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "#A51A26"}
        onMouseLeave={e => e.currentTarget.style.background = ruby}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>save</span>
        Save Changes
      </button>
    </div>
  );
}

function SectionCard({ children }) {
  return <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "28px", marginBottom: 20 }}>{children}</div>;
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: rubyLight, border: `1px solid ${rubyBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: ruby }}>{icon}</span>
      </div>
      <div>
        <h3 style={{ fontFamily: "Manrope", fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: slate, margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Admin Sidebar ───
function AdminSidebar({ hover, setHover }) {
  const items = [
    { icon: "dashboard", label: "Overview" },
    { icon: "verified_user", label: "Verifications" },
    { icon: "folder_open", label: "Cases" },
    { icon: "payments", label: "Financial" },
    { icon: "group", label: "Users" },
    { icon: "tune", label: "Configuration", active: true },
  ];
  return (
    <aside style={{ width: 260, background: surface, borderRight: `1px solid ${borderColor}`, display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>
      <div style={{ padding: "24px 24px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, background: ruby, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: 18 }}>bloodtype</span>
        </div>
        <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>Blutabnahme<span style={{ color: ruby }}>.de</span></span>
      </div>
      <div style={{ padding: "0 24px 24px" }}><span style={{ ...pill, fontSize: 10, fontWeight: 700, padding: "3px 10px", background: `${burnt}12`, color: burnt }}>ADMIN</span></div>
      <nav style={{ flex: 1, padding: "0 12px" }}>
        {items.map((item, i) => (
          <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10, cursor: "pointer", marginBottom: 2, background: item.active ? rubyLight : hover === i ? "#F9FAFB" : "transparent", color: item.active ? ruby : ink, transition: "all 0.15s" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: item.active ? ruby : slate }}>{item.icon}</span>
            <span style={{ fontSize: 14, fontWeight: item.active ? 600 : 500 }}>{item.label}</span>
          </div>
        ))}
      </nav>
      <div style={{ padding: "16px 12px", borderTop: `1px solid ${borderColor}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${ruby}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: ruby }}>admin_panel_settings</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Admin</div>
            <div style={{ fontSize: 11, color: slate }}>Platform Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Tab Content Components ───
function PricingTab() {
  const [urgentPct, setUrgentPct] = useState("25");
  const [emergencyPct, setEmergencyPct] = useState("50");
  const [specialToggle, setSpecialToggle] = useState(true);
  const [specialPct, setSpecialPct] = useState("15");
  const [perKm, setPerKm] = useState("0.40");
  const [minFee, setMinFee] = useState("15");
  const [maxFee, setMaxFee] = useState("100");
  const [minPayout, setMinPayout] = useState("12.50");
  return (
    <>
      <SectionCard>
        <SectionTitle icon="speed" title="Urgency Surcharges" subtitle="Percentage added to base fee for urgent and emergency cases." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div><Label>Normal</Label><Input value="0" prefix="+" suffix="%" onChange={() => {}} /></div>
          <div><Label>Urgent</Label><Input value={urgentPct} prefix="+" suffix="%" onChange={e => setUrgentPct(e.target.value)} /></div>
          <div><Label>Emergency</Label><Input value={emergencyPct} prefix="+" suffix="%" onChange={e => setEmergencyPct(e.target.value)} /></div>
        </div>
      </SectionCard>
      <SectionCard>
        <SectionTitle icon="accessibility_new" title="Special Case Surcharges" subtitle="Additional fee for minor, elderly, or Rollvenen cases." />
        <div style={{ marginBottom: 16 }}><Toggle checked={specialToggle} onChange={() => setSpecialToggle(!specialToggle)} label="Enable special case surcharges" /></div>
        {specialToggle && (
          <div style={{ padding: "16px", borderRadius: 12, background: bg, border: `1px solid #F0F0F0` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div><Label>Minor</Label><Input value={specialPct} prefix="+" suffix="%" onChange={e => setSpecialPct(e.target.value)} /></div>
              <div><Label>Elderly</Label><Input value={specialPct} prefix="+" suffix="%" onChange={e => setSpecialPct(e.target.value)} /></div>
              <div><Label>Rollvenen</Label><Input value={specialPct} prefix="+" suffix="%" onChange={e => setSpecialPct(e.target.value)} /></div>
            </div>
            <div style={{ fontSize: 12, color: slate, marginTop: 10 }}>When disabled, these flags are informational only and don't affect pricing.</div>
          </div>
        )}
      </SectionCard>
      <SectionCard>
        <SectionTitle icon="route" title="Travel & Fee Bounds" subtitle="Per-km rate and min/max BC fee limits." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
          <div><Label hint="per km">Travel Rate</Label><Input value={perKm} prefix="€" onChange={e => setPerKm(e.target.value)} /></div>
          <div><Label>Min BC Fee</Label><Input value={minFee} prefix="€" onChange={e => setMinFee(e.target.value)} /></div>
          <div><Label>Max BC Fee</Label><Input value={maxFee} prefix="€" onChange={e => setMaxFee(e.target.value)} /></div>
          <div><Label>Min BC Payout</Label><Input value={minPayout} prefix="€" onChange={e => setMinPayout(e.target.value)} /></div>
        </div>
      </SectionCard>
      <SaveBar />
    </>
  );
}

function FeesTab() {
  const [practiceOrg, setPracticeOrg] = useState("20.00");
  const [homeOrg, setHomeOrg] = useState("35.00");
  const [logisticsFee, setLogisticsFee] = useState("12.00");
  const [materialShipping, setMaterialShipping] = useState("8.50");
  return (
    <>
      <SectionCard>
        <SectionTitle icon="business" title="B2B Organization Fees" subtitle="Charged to healthcare companies per case. Can be overridden per-HC." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div><Label>Practice Visit</Label><Input value={practiceOrg} prefix="€" onChange={e => setPracticeOrg(e.target.value)} /></div>
          <div><Label>Home Visit</Label><Input value={homeOrg} prefix="€" onChange={e => setHomeOrg(e.target.value)} /></div>
        </div>
      </SectionCard>
      <SectionCard>
        <SectionTitle icon="local_shipping" title="Logistics Fees" subtitle="Charged when the platform handles material shipping or return logistics." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div><Label>Material Shipping</Label><Input value={materialShipping} prefix="€" onChange={e => setMaterialShipping(e.target.value)} /></div>
          <div><Label>Return Shipping</Label><Input value={logisticsFee} prefix="€" onChange={e => setLogisticsFee(e.target.value)} /></div>
        </div>
      </SectionCard>
      <SaveBar />
    </>
  );
}

function TaxTab() {
  const [vatRate, setVatRate] = useState("19");
  return (
    <SectionCard>
      <SectionTitle icon="receipt" title="VAT Configuration" subtitle="Applied to all displayed prices." />
      <div style={{ maxWidth: 300 }}><Label>VAT Rate</Label><Input value={vatRate} suffix="%" onChange={e => setVatRate(e.target.value)} /></div>
      <div style={{ fontSize: 12, color: slate, marginTop: 8 }}>Standard German VAT: 19%. Reduced rate: 7%. Change only if legally required.</div>
      <SaveBar />
    </SectionCard>
  );
}

function MaterialsTab() {
  const [items] = useState([
    { name: "EDTA Tube (2.7ml)", type: "Tube", price: "0.85", active: true },
    { name: "EDTA Tube (4.9ml)", type: "Tube", price: "0.95", active: true },
    { name: "Serum Tube (4.9ml)", type: "Tube", price: "0.90", active: true },
    { name: "Lithium Heparin Tube", type: "Tube", price: "1.10", active: true },
    { name: "Citrate Tube (3.2ml)", type: "Tube", price: "1.20", active: true },
    { name: "Butterfly Needle 21G", type: "Needle", price: "0.65", active: true },
    { name: "Standard Needle 21G", type: "Needle", price: "0.30", active: true },
    { name: "Alcohol Swab Pack (10)", type: "Supply", price: "0.50", active: true },
    { name: "Shipping Container (Ambient)", type: "Shipping", price: "3.50", active: true },
    { name: "Shipping Container (Cold Chain)", type: "Shipping", price: "7.20", active: true },
    { name: "Ice Pack", type: "Shipping", price: "1.80", active: false },
  ]);
  return (
    <SectionCard>
      <SectionTitle icon="inventory_2" title="Material Catalog" subtitle="Items available for HC case creation. Prices are per unit excluding VAT." />
      <div style={{ borderRadius: 12, border: `1px solid ${borderColor}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: bg }}>
              {["Item Name", "Type", "Unit Price", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: slate, textTransform: "uppercase", letterSpacing: 0.8, textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderTop: `1px solid #F3F4F6` }}>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500 }}>{item.name}</td>
                <td style={{ padding: "12px 16px" }}><span style={{ ...pill, fontSize: 11, fontWeight: 500, padding: "2px 10px", background: bg, color: slate }}>{item.type}</span></td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "Manrope", fontWeight: 600 }}>€{item.price}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ ...pill, fontSize: 11, fontWeight: 600, padding: "3px 10px", background: item.active ? `${green}10` : "#FEE2E2", color: item.active ? green : "#991B1B" }}>
                    {item.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button style={{ marginTop: 16, ...pill, padding: "8px 20px", border: `1px dashed ${borderColor}`, background: "transparent", fontSize: 13, fontWeight: 500, color: ruby, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
        Add Item
      </button>
    </SectionCard>
  );
}

function CommissionTab() {
  const [defaultRate, setDefaultRate] = useState("17.5");
  const overrides = [
    { name: "Anna Weber", type: "MFA", rate: "15.0", reason: "Early adopter partnership" },
    { name: "Dr. Klaus Frey", type: "Doctor", rate: "12.5", reason: "High-volume agreement" },
  ];
  return (
    <>
      <SectionCard>
        <SectionTitle icon="percent" title="Default Commission" subtitle="Applied to all BCs unless overridden." />
        <div style={{ maxWidth: 300 }}><Label>Platform Commission Rate</Label><Input value={defaultRate} suffix="%" onChange={e => setDefaultRate(e.target.value)} /></div>
        <div style={{ fontSize: 12, color: slate, marginTop: 8 }}>Deducted from BC payout. Min payout rule still applies.</div>
      </SectionCard>
      <SectionCard>
        <SectionTitle icon="tune" title="Per-BC Overrides" subtitle="Custom commission rates for individual blood collectors." />
        <div style={{ borderRadius: 12, border: `1px solid ${borderColor}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: bg }}>
              {["Blood Collector", "Type", "Custom Rate", "Reason"].map(h => (
                <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: slate, textTransform: "uppercase", letterSpacing: 0.8, textAlign: "left" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {overrides.map((o, i) => (
                <tr key={i} style={{ borderTop: `1px solid #F3F4F6` }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{o.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: slate }}>{o.type}</td>
                  <td style={{ padding: "12px 16px", fontFamily: "Manrope", fontWeight: 700, color: ruby }}>{o.rate}%</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: slate }}>{o.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button style={{ marginTop: 16, ...pill, padding: "8px 20px", border: `1px dashed ${borderColor}`, background: "transparent", fontSize: 13, fontWeight: 500, color: ruby, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Add Override
        </button>
      </SectionCard>
      <SaveBar />
    </>
  );
}

function AlertsTab() {
  const [unmatchedHours, setUnmatchedHours] = useState("24");
  const [schedulingAttempts, setSchedulingAttempts] = useState("3");
  const [schedulingHours, setSchedulingHours] = useState("72");
  const [reVerifDays, setReVerifDays] = useState("30");
  const [cancelThreshold, setCancelThreshold] = useState("3");
  const [autoFallbackToggle, setAutoFallbackToggle] = useState(true);
  const [autoFallbackHours, setAutoFallbackHours] = useState("72");
  return (
    <>
      <SectionCard>
        <SectionTitle icon="notifications_active" title="Case Monitoring Alerts" subtitle="Thresholds for automatic admin notifications." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div><Label>Unmatched case alert</Label><Input value={unmatchedHours} suffix="hours" onChange={e => setUnmatchedHours(e.target.value)} /></div>
          <div><Label>Scheduling conflict: failed attempts</Label><Input value={schedulingAttempts} suffix="attempts" onChange={e => setSchedulingAttempts(e.target.value)} /></div>
          <div><Label>Scheduling conflict: max time</Label><Input value={schedulingHours} suffix="hours" onChange={e => setSchedulingHours(e.target.value)} /></div>
          <div><Label>BC cancellation threshold</Label><Input value={cancelThreshold} suffix="in 30 days" onChange={e => setCancelThreshold(e.target.value)} /></div>
        </div>
      </SectionCard>
      <SectionCard>
        <SectionTitle icon="autorenew" title="Auto-Fallback (HC Curates Mode)" subtitle="If HC doesn't send shortlist in time, auto-switch to Patient Decides." />
        <div style={{ marginBottom: 16 }}><Toggle checked={autoFallbackToggle} onChange={() => setAutoFallbackToggle(!autoFallbackToggle)} label="Enable auto-fallback" /></div>
        {autoFallbackToggle && (
          <div style={{ maxWidth: 300 }}><Label>Fallback after</Label><Input value={autoFallbackHours} suffix="hours" onChange={e => setAutoFallbackHours(e.target.value)} /></div>
        )}
      </SectionCard>
      <SectionCard>
        <SectionTitle icon="verified_user" title="Re-Verification" subtitle="Optional document re-verification for BCs." />
        <div style={{ maxWidth: 300 }}><Label>Non-response alert after</Label><Input value={reVerifDays} suffix="days" onChange={e => setReVerifDays(e.target.value)} /></div>
        <div style={{ fontSize: 12, color: slate, marginTop: 8 }}>Automated re-verification reminders are feature-flagged and dormant.</div>
      </SectionCard>
      <SaveBar />
    </>
  );
}

function ApiTab() {
  const [rateLimit, setRateLimit] = useState("100");
  const hcs = [
    { name: "Berlin Health Lab", enabled: true, keyPrefix: "blt_sk_...a4f2", created: "Feb 12, 2026", lastUsed: "2 min ago", requests: "1,247" },
    { name: "Synlab Integration", enabled: true, keyPrefix: "blt_sk_...c8d1", created: "Mar 1, 2026", lastUsed: "1 hour ago", requests: "342" },
    { name: "aeon.life", enabled: false, keyPrefix: "—", created: "—", lastUsed: "—", requests: "0" },
  ];
  return (
    <>
      <SectionCard>
        <SectionTitle icon="api" title="REST API Settings" subtitle="Manage API access for healthcare company integrations." />
        <div style={{ maxWidth: 300, marginBottom: 20 }}><Label>Global Rate Limit</Label><Input value={rateLimit} suffix="req/min" onChange={e => setRateLimit(e.target.value)} /></div>
        <div style={{ borderRadius: 12, border: `1px solid ${borderColor}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: bg }}>
              {["Healthcare Company", "Status", "API Key", "Created", "Last Used", "Requests"].map(h => (
                <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: slate, textTransform: "uppercase", letterSpacing: 0.8, textAlign: "left" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {hcs.map((hc, i) => (
                <tr key={i} style={{ borderTop: `1px solid #F3F4F6` }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{hc.name}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ ...pill, fontSize: 11, fontWeight: 600, padding: "3px 10px", background: hc.enabled ? `${green}10` : bg, color: hc.enabled ? green : slate }}>
                      {hc.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: slate }}>{hc.keyPrefix}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: slate }}>{hc.created}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: hc.lastUsed === "—" ? "#D1D5DB" : green, fontWeight: 500 }}>{hc.lastUsed}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "Manrope", fontWeight: 600 }}>{hc.requests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button style={{ ...pill, padding: "8px 20px", border: `1px solid ${borderColor}`, background: surface, fontSize: 13, fontWeight: 500, color: ink, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>key</span>
            Generate New Key
          </button>
          <button style={{ ...pill, padding: "8px 20px", border: `1px solid ${borderColor}`, background: surface, fontSize: 13, fontWeight: 500, color: ink, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>description</span>
            View API Docs
          </button>
        </div>
      </SectionCard>
      <SectionCard>
        <SectionTitle icon="webhook" title="Webhooks" subtitle="HC webhook endpoints for event notifications." />
        <div style={{ fontSize: 13, color: slate, lineHeight: 1.6, marginBottom: 16 }}>
          Webhook URLs are configured per-HC in their company settings. Events: case.matched, case.bc_selected, case.appointment_booked, case.completed, case.cancelled, case.payment_received, shortlist.sent.
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 10, background: bg, fontSize: 12, color: steel, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
          Webhook delivery logs are available in the Financial &gt; API Logs section.
        </div>
      </SectionCard>
      <SaveBar />
    </>
  );
}

// ─── Main ───
const tabs = [
  { id: "pricing", label: "Pricing", icon: "sell" },
  { id: "fees", label: "Fees", icon: "payments" },
  { id: "tax", label: "Tax", icon: "receipt" },
  { id: "materials", label: "Materials", icon: "inventory_2" },
  { id: "commission", label: "Commission", icon: "percent" },
  { id: "alerts", label: "Alerts", icon: "notifications" },
  { id: "api", label: "API", icon: "api" },
];

export default function AdminConfig() {
  const [activeTab, setActiveTab] = useState("pricing");
  const [sidebarHover, setSidebarHover] = useState(null);

  const renderTab = () => {
    switch (activeTab) {
      case "pricing": return <PricingTab />;
      case "fees": return <FeesTab />;
      case "tax": return <TaxTab />;
      case "materials": return <MaterialsTab />;
      case "commission": return <CommissionTab />;
      case "alerts": return <AlertsTab />;
      case "api": return <ApiTab />;
      default: return null;
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: ink, background: bg, minHeight: "100vh", display: "flex" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300&display=swap" rel="stylesheet" />

      <AdminSidebar hover={sidebarHover} setHover={setSidebarHover} />

      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 1000, minWidth: 0 }}>
        <h1 style={{ fontFamily: "Manrope", fontSize: 28, fontWeight: 800, letterSpacing: -0.8, margin: "0 0 4px" }}>Configuration</h1>
        <p style={{ fontSize: 14, color: slate, margin: "0 0 28px" }}>Manage platform pricing, fees, materials, and integrations.</p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: `1px solid ${borderColor}`, paddingBottom: 0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "10px 18px", border: "none", background: "transparent", fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? ruby : slate, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              borderBottom: activeTab === tab.id ? `2px solid ${ruby}` : `2px solid transparent`,
              marginBottom: -1, transition: "all 0.15s",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {renderTab()}
      </main>
    </div>
  );
}
