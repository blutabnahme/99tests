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

function SidebarNav() {
  const [hover, setHover] = useState(null);
  const items = [
    { icon: "dashboard", label: "Dashboard" },
    { icon: "folder_open", label: "Cases", active: true },
    { icon: "receipt_long", label: "Billing" },
    { icon: "group", label: "Team" },
    { icon: "settings", label: "Settings" },
  ];
  return (
    <aside style={{ width: 260, background: surface, borderRight: `1px solid ${borderColor}`, display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>
      <div style={{ padding: "24px 24px 32px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, background: ruby, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: 18 }}>bloodtype</span>
        </div>
        <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>Blutabnahme<span style={{ color: ruby }}>.de</span></span>
      </div>
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
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${steel}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "Manrope", fontSize: 14, fontWeight: 700, color: steel }}>BH</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Berlin Health Lab</div>
            <div style={{ fontSize: 11, color: slate }}>Healthcare Company</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ExpBadge({ icon, label, color = slate }) {
  return (
    <span style={{ ...pill, display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: `${color}10`, fontSize: 11, fontWeight: 600, color }}>
      <span className="material-symbols-outlined" style={{ fontSize: 12, color }}>{icon}</span>
      {label}
    </span>
  );
}

const caseInfo = {
  id: "BLT-2024-0846",
  patient: "Tobias Richter",
  test: "Thyroid Panel",
  urgency: "Urgent",
  type: "Practice",
  address: "Prenzlauer Berg, Berlin",
};

const collectors = [
  {
    id: 1, name: "Anna Weber", photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=faces",
    qualification: "Medical Assistant (MFA)", rating: 4.9, ratingCount: 156, collections: 1247,
    distance: 3.2, practiceAddress: "Schönhauser Allee 58, Berlin",
    baseFee: 32, totalFee: 32,
    expChildren: true, expElderly: true, expRollvenen: true, expObese: false,
    hasCentrifuge: true, hasFreezer: true,
    nextSlot: "Tomorrow, 10:00", slotsAvailable: 4, bestMatch: true,
  },
  {
    id: 2, name: "Dr. Klaus Frey", photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=faces",
    qualification: "Doctor (Arzt)", rating: 4.8, ratingCount: 89, collections: 634,
    distance: 5.7, practiceAddress: "Kastanienallee 12, Berlin",
    baseFee: 45, totalFee: 45,
    expChildren: false, expElderly: true, expRollvenen: false, expObese: false,
    hasCentrifuge: true, hasFreezer: false,
    nextSlot: "Tomorrow, 14:30", slotsAvailable: 2, bestMatch: false,
  },
  {
    id: 3, name: "Sophie Lang", photo: "https://images.unsplash.com/photo-1594824476967-48c8b964f137?w=200&h=200&fit=crop&crop=faces",
    qualification: "Nurse", rating: 4.7, ratingCount: 203, collections: 1891,
    distance: 8.4, practiceAddress: "Frankfurter Allee 91, Berlin",
    baseFee: 28, totalFee: 28,
    expChildren: true, expElderly: true, expRollvenen: true, expObese: true,
    hasCentrifuge: false, hasFreezer: false,
    nextSlot: "Mar 15, 09:00", slotsAvailable: 6, bestMatch: false,
  },
  {
    id: 4, name: "Lisa Hartmann", photo: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&h=200&fit=crop&crop=faces",
    qualification: "Medical Assistant (MFA)", rating: 4.6, ratingCount: 67, collections: 312,
    distance: 11.2, practiceAddress: "Karl-Marx-Straße 45, Berlin",
    baseFee: 30, totalFee: 30,
    expChildren: false, expElderly: false, expRollvenen: false, expObese: false,
    hasCentrifuge: true, hasFreezer: true,
    nextSlot: "Mar 15, 11:00", slotsAvailable: 3, bestMatch: false,
  },
];

export default function MatchingShortlist() {
  const [sortBy, setSortBy] = useState("recommended");
  const [approved, setApproved] = useState(new Set([1])); // best match pre-approved
  const [sent, setSent] = useState(false);
  const [filterExp, setFilterExp] = useState({ children: false, elderly: false, rollvenen: false });
  const [filterEquip, setFilterEquip] = useState({ centrifuge: false, freezer: false });

  const toggleApprove = (id) => {
    const next = new Set(approved);
    if (next.has(id)) next.delete(id); else next.add(id);
    setApproved(next);
  };

  let filtered = [...collectors];
  if (filterExp.children) filtered = filtered.filter(c => c.expChildren);
  if (filterExp.elderly) filtered = filtered.filter(c => c.expElderly);
  if (filterExp.rollvenen) filtered = filtered.filter(c => c.expRollvenen);
  if (filterEquip.centrifuge) filtered = filtered.filter(c => c.hasCentrifuge);
  if (filterEquip.freezer) filtered = filtered.filter(c => c.hasFreezer);

  if (sortBy === "distance") filtered.sort((a, b) => a.distance - b.distance);
  else if (sortBy === "price") filtered.sort((a, b) => a.totalFee - b.totalFee);
  else if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);
  else if (sortBy === "experience") filtered.sort((a, b) => b.collections - a.collections);
  else filtered.sort((a, b) => (b.bestMatch ? 1 : 0) - (a.bestMatch ? 1 : 0) || a.distance - b.distance);

  const approvedList = collectors.filter(c => approved.has(c.id));

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: ink, background: bg, minHeight: "100vh", display: "flex" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300&display=swap" rel="stylesheet" />

      <SidebarNav />

      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 1200, minWidth: 0 }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: slate, marginBottom: 8 }}>
          <a href="#" style={{ color: slate, textDecoration: "none" }}>Dashboard</a><span style={{ margin: "0 8px" }}>›</span>
          <a href="#" style={{ color: slate, textDecoration: "none" }}>Cases</a><span style={{ margin: "0 8px" }}>›</span>
          <a href="#" style={{ color: slate, textDecoration: "none" }}>{caseInfo.id}</a><span style={{ margin: "0 8px" }}>›</span>
          <span style={{ color: ink, fontWeight: 500 }}>Approve Shortlist</span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Manrope", fontSize: 28, fontWeight: 800, letterSpacing: -0.8, margin: "0 0 4px" }}>Approve Blood Collectors</h1>
          <p style={{ fontSize: 14, color: slate, margin: 0 }}>
            Select which professionals to include in the patient's shortlist. The patient will choose their preferred collector.
          </p>
        </div>

        {/* How it works banner */}
        {!sent && (
          <div style={{ background: `${steel}06`, borderRadius: 14, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 24 }}>
            {[
              { num: "1", text: "You approve qualified collectors", icon: "checklist", active: true },
              { num: "2", text: "Patient receives the shortlist", icon: "send" },
              { num: "3", text: "Patient picks their preferred BC", icon: "person_search" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: s.active ? ruby : `${steel}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.active ? "#fff" : steel }}>{s.num}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: s.active ? 600 : 400, color: s.active ? ink : slate }}>{s.text}</span>
                {i < 2 && <div style={{ flex: 1, height: 1, background: borderColor, marginLeft: 8 }} />}
              </div>
            ))}
          </div>
        )}

        {/* Sent confirmation */}
        {sent && (
          <div style={{ background: `${green}08`, border: `1px solid ${green}25`, borderRadius: 16, padding: "32px", textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${green}15`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: green }}>check_circle</span>
            </div>
            <div style={{ fontFamily: "Manrope", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Shortlist sent to {caseInfo.patient}!</div>
            <p style={{ fontSize: 14, color: slate, margin: "0 0 16px", lineHeight: 1.6 }}>
              The patient will receive an email and SMS with a link to view the {approvedList.length} approved blood collectors and choose their preferred one.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              {approvedList.map(bc => (
                <img key={bc.id} src={bc.photo} alt={bc.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: `2px solid ${surface}`, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }} />
              ))}
            </div>
          </div>
        )}

        {!sent && (
          <>
            {/* Case Summary */}
            <div style={{ background: surface, borderRadius: 14, border: `1px solid ${borderColor}`, padding: "16px 24px", marginBottom: 24, display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
              {[
                { label: "Patient", value: caseInfo.patient, icon: "person" },
                { label: "Test", value: caseInfo.test, icon: "science" },
                { label: "Urgency", value: caseInfo.urgency, icon: "priority_high", highlight: true },
                { label: "Type", value: caseInfo.type, icon: "local_hospital" },
                { label: "Location", value: caseInfo.address, icon: "location_on" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: item.highlight ? burnt : slate }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: slate, fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: item.highlight ? burnt : ink }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sort + Filter */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: slate, fontWeight: 500 }}>Sort:</span>
                {["recommended", "distance", "price", "rating", "experience"].map(s => (
                  <button key={s} onClick={() => setSortBy(s)} style={{
                    ...pill, padding: "6px 14px", border: sortBy === s ? `1.5px solid ${ruby}` : `1px solid ${borderColor}`,
                    background: sortBy === s ? `${ruby}06` : surface, fontSize: 12, fontWeight: sortBy === s ? 600 : 500,
                    color: sortBy === s ? ruby : slate, cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
                  }}>{s}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "children", label: "Pediatric", st: filterExp, set: setFilterExp, c: steel },
                  { key: "elderly", label: "Elderly", st: filterExp, set: setFilterExp, c: steel },
                  { key: "rollvenen", label: "Rollvenen", st: filterExp, set: setFilterExp, c: steel },
                  { key: "centrifuge", label: "Centrifuge", st: filterEquip, set: setFilterEquip, c: green },
                  { key: "freezer", label: "Freezer", st: filterEquip, set: setFilterEquip, c: green },
                ].map(f => (
                  <button key={f.key} onClick={() => f.set({ ...f.st, [f.key]: !f.st[f.key] })} style={{
                    ...pill, padding: "6px 12px", border: f.st[f.key] ? `1.5px solid ${f.c}` : `1px solid ${borderColor}`,
                    background: f.st[f.key] ? `${f.c}08` : surface, fontSize: 11, fontWeight: 500,
                    color: f.st[f.key] ? f.c : slate, cursor: "pointer", transition: "all 0.15s",
                  }}>{f.label}</button>
                ))}
              </div>
            </div>

            {/* BC Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filtered.map(bc => {
                const isApproved = approved.has(bc.id);
                return (
                  <div key={bc.id} style={{
                    background: surface, borderRadius: 18, overflow: "hidden",
                    border: isApproved ? `2px solid ${green}` : bc.bestMatch ? `2px solid ${ruby}20` : `1px solid ${borderColor}`,
                    transition: "all 0.2s", position: "relative",
                    boxShadow: isApproved ? `0 2px 12px ${green}10` : "none",
                  }}>
                    {bc.bestMatch && !isApproved && (
                      <div style={{ background: `${ruby}08`, padding: "5px 0", textAlign: "center", fontSize: 11, fontWeight: 700, color: ruby, letterSpacing: 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>verified</span>
                        BEST MATCH — RECOMMENDED
                      </div>
                    )}
                    {isApproved && (
                      <div style={{ background: green, padding: "5px 0", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>
                        APPROVED FOR SHORTLIST
                      </div>
                    )}

                    <div style={{ padding: "22px 24px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 20, alignItems: "start" }}>
                        {/* Photo + info */}
                        <div style={{ display: "flex", alignItems: "start", gap: 14 }}>
                          <div style={{ position: "relative" }}>
                            <img src={bc.photo} alt={bc.name} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: isApproved ? `2px solid ${green}` : `2px solid ${borderColor}` }} />
                            {isApproved && (
                              <div style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: "50%", background: green, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${surface}` }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 12, color: "#fff" }}>check</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontFamily: "Manrope", fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{bc.name}</div>
                            <div style={{ fontSize: 13, color: slate, marginBottom: 8 }}>{bc.qualification}</div>
                            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#F59E0B" }}>star</span>
                                <span style={{ fontFamily: "Manrope", fontSize: 14, fontWeight: 800 }}>{bc.rating}</span>
                                <span style={{ fontSize: 11, color: slate }}>({bc.ratingCount})</span>
                              </div>
                              <div style={{ width: 1, height: 14, background: borderColor }} />
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 13, color: steel }}>clinical_notes</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: steel }}>{bc.collections.toLocaleString()}</span>
                              </div>
                              <div style={{ width: 1, height: 14, background: borderColor }} />
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 13, color: slate }}>location_on</span>
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{bc.distance} km</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center", alignSelf: "center" }}>
                          {bc.expChildren && <ExpBadge icon="child_care" label="Pediatric" color={steel} />}
                          {bc.expElderly && <ExpBadge icon="elderly" label="Elderly" color={steel} />}
                          {bc.expRollvenen && <ExpBadge icon="cardiology" label="Rollvenen" color={burnt} />}
                          {bc.expObese && <ExpBadge icon="monitor_weight" label="Obese" color={steel} />}
                          {bc.hasCentrifuge && <ExpBadge icon="cycle" label="Centrifuge" color={green} />}
                          {bc.hasFreezer && <ExpBadge icon="ac_unit" label="Freezer" color={green} />}
                        </div>

                        {/* Price + action */}
                        <div style={{ textAlign: "right", minWidth: 150 }}>
                          <div style={{ fontSize: 11, color: slate }}>Est. fee</div>
                          <div style={{ fontFamily: "Manrope", fontSize: 26, fontWeight: 800, color: ink, marginBottom: 2 }}>€{bc.totalFee.toFixed(2)}</div>
                          <div style={{ fontSize: 11, color: slate, marginBottom: 10 }}>practice visit</div>
                          <button onClick={() => toggleApprove(bc.id)} style={{
                            ...pill, padding: "9px 20px", border: "none", width: "100%",
                            background: isApproved ? surface : green,
                            color: isApproved ? ruby : "#fff",
                            borderWidth: isApproved ? 1 : 0, borderStyle: "solid", borderColor: borderColor,
                            fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{isApproved ? "remove_circle_outline" : "add_circle"}</span>
                            {isApproved ? "Remove" : "Add to Shortlist"}
                          </button>
                        </div>
                      </div>

                      {/* Bottom row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: `1px solid #F3F4F6` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13, color: slate }}>home_work</span>
                          <span style={{ fontSize: 12, color: slate }}>{bc.practiceAddress}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13, color: green }}>event_available</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: green }}>{bc.nextSlot}</span>
                          <span style={{ ...pill, fontSize: 10, fontWeight: 600, padding: "2px 8px", background: `${green}10`, color: green }}>{bc.slotsAvailable} slots</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "60px 40px", textAlign: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#E5E7EB", marginBottom: 16, display: "block" }}>search_off</span>
                <div style={{ fontFamily: "Manrope", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No matches found</div>
                <div style={{ fontSize: 14, color: slate, marginBottom: 20 }}>Try removing some filters.</div>
                <button onClick={() => { setFilterExp({ children: false, elderly: false, rollvenen: false }); setFilterEquip({ centrifuge: false, freezer: false }); }}
                  style={{ ...pill, padding: "10px 24px", border: `1px solid ${borderColor}`, background: surface, fontSize: 13, fontWeight: 500, color: ink, cursor: "pointer" }}>Clear all filters</button>
              </div>
            )}
          </>
        )}

        {/* Sticky Shortlist Summary */}
        {!sent && approved.size > 0 && (
          <div style={{
            position: "sticky", bottom: 0, marginTop: 24, background: surface, borderRadius: "16px 16px 0 0",
            border: `1px solid ${borderColor}`, borderBottom: "none", padding: "18px 28px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex" }}>
                {approvedList.map((bc, i) => (
                  <img key={bc.id} src={bc.photo} alt={bc.name}
                    style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: `2px solid ${surface}`, marginLeft: i > 0 ? -8 : 0, position: "relative", zIndex: approvedList.length - i }} />
                ))}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {approved.size} collector{approved.size !== 1 ? "s" : ""} on shortlist
                </div>
                <div style={{ fontSize: 12, color: slate }}>
                  Patient will choose from {approvedList.map(c => c.name.split(" ")[0]).join(", ")}
                </div>
              </div>
            </div>
            <button onClick={() => setSent(true)} style={{
              ...pill, padding: "12px 28px", border: "none", background: ruby, color: "#fff",
              fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 16px ${ruby}25`,
              display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#A51A26"}
              onMouseLeave={e => e.currentTarget.style.background = ruby}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
              Send Shortlist to Patient
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
