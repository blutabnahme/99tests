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
const pill = { borderRadius: 9999 };
const green = "#059669";

function Label({ children, required }) {
  return (
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: ink, marginBottom: 6 }}>
      {children}{required && <span style={{ color: ruby, marginLeft: 3 }}>*</span>}
    </label>
  );
}

function Input({ placeholder, type = "text", value, onChange, style: s }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${borderColor}`, fontSize: 14, color: ink, outline: "none", background: surface, boxSizing: "border-box", transition: "border 0.2s", ...s }}
      onFocus={e => e.target.style.border = `2px solid ${ruby}`}
      onBlur={e => e.target.style.border = `1px solid ${borderColor}`} />
  );
}

function Select({ options, value, onChange, placeholder }) {
  return (
    <select value={value} onChange={onChange}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${borderColor}`, fontSize: 14, color: value ? ink : slate, outline: "none", background: surface, cursor: "pointer", appearance: "auto", boxSizing: "border-box" }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  );
}

function Toggle({ checked, onChange, label, sublabel }) {
  return (
    <div onClick={onChange} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, border: `1px solid ${checked ? rubyBorder : borderColor}`, background: checked ? `${ruby}03` : surface, cursor: "pointer", transition: "all 0.15s" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: ink }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: slate, marginTop: 2 }}>{sublabel}</div>}
      </div>
      <div style={{ width: 44, height: 24, borderRadius: 12, background: checked ? ruby : "#D1D5DB", padding: 2, transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", transform: checked ? "translateX(20px)" : "translateX(0)", transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
      </div>
    </div>
  );
}

function Checkbox({ checked, onChange, label, sublabel }) {
  return (
    <label style={{ display: "flex", gap: 12, cursor: "pointer", alignItems: "flex-start" }} onClick={onChange}>
      <div style={{ width: 20, height: 20, borderRadius: 6, border: checked ? "none" : `2px solid ${borderColor}`, background: checked ? ruby : surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.15s" }}>
        {checked && <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#fff" }}>check</span>}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: ink }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: slate, marginTop: 2 }}>{sublabel}</div>}
      </div>
    </label>
  );
}

const steps = [
  { icon: "person", label: "Personal Info" },
  { icon: "workspace_premium", label: "Qualifications" },
  { icon: "psychology", label: "Experience" },
  { icon: "medical_services", label: "Equipment" },
  { icon: "location_on", label: "Service Area" },
  { icon: "euro", label: "Pricing" },
  { icon: "checklist", label: "Review" },
];

export default function BCRegistration() {
  const [step, setStep] = useState(0);

  // Step 1: Personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2: Qualifications
  const [profType, setProfType] = useState("");

  // Step 3: Experience
  const [expChildren, setExpChildren] = useState(false);
  const [expElderly, setExpElderly] = useState(false);
  const [expRollvenen, setExpRollvenen] = useState(false);
  const [expObese, setExpObese] = useState(false);

  // Step 4: Equipment
  const [hasCentrifuge, setHasCentrifuge] = useState(false);
  const [hasFreezer, setHasFreezer] = useState(false);

  // Step 5: Service
  const [homeVisits, setHomeVisits] = useState(false);
  const [practiceVisits, setPracticeVisits] = useState(true);
  const [radius, setRadius] = useState(15);

  // Step 6: Pricing
  const [practiceFee, setPracticeFee] = useState("35");
  const [homeVisitFee, setHomeVisitFee] = useState("50");
  const [travelBase, setTravelBase] = useState("25");

  const next = () => setStep(Math.min(step + 1, steps.length - 1));
  const prev = () => setStep(Math.max(step - 1, 0));

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div>
          <h2 style={{ fontFamily: "Manrope", fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: "0 0 4px" }}>Personal Information</h2>
          <p style={{ fontSize: 14, color: slate, margin: "0 0 32px" }}>Tell us about yourself. This information will appear on your public profile.</p>

          {/* Photo upload */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: bg, border: `2px dashed ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = ruby}
              onMouseLeave={e => e.currentTarget.style.borderColor = borderColor}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#D1D5DB" }}>add_a_photo</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Profile Photo</div>
              <div style={{ fontSize: 13, color: slate, marginBottom: 8 }}>A professional photo builds trust with patients. JPG or PNG, max 5MB.</div>
              <button style={{ ...pill, padding: "6px 16px", border: `1px solid ${borderColor}`, background: "transparent", fontSize: 13, fontWeight: 500, color: ink, cursor: "pointer" }}>Upload Photo</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><Label required>First Name</Label><Input placeholder="Your first name" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
            <div><Label required>Last Name</Label><Input placeholder="Your last name" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
            <div><Label required>Email</Label><Input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label required>Phone</Label><Input type="tel" placeholder="+49 xxx xxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div style={{ gridColumn: "1 / -1" }}><Label required>Address</Label><Input placeholder="Street, house number, PLZ, city" /></div>
          </div>
        </div>
      );

      case 1: return (
        <div>
          <h2 style={{ fontFamily: "Manrope", fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: "0 0 4px" }}>Professional Qualifications</h2>
          <p style={{ fontSize: 14, color: slate, margin: "0 0 32px" }}>Verify your credentials. We'll review your documents within 24 hours.</p>

          <div style={{ marginBottom: 24 }}>
            <Label required>Professional Type</Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { val: "doctor", label: "Doctor (Arzt)", icon: "stethoscope" },
                { val: "mfa", label: "Medical Assistant (MFA)", icon: "medical_services" },
                { val: "nurse", label: "Nurse / Pediatric Nurse", icon: "health_and_safety" },
                { val: "heilpraktiker", label: "Alternative Practitioner", icon: "spa" },
              ].map(t => (
                <div key={t.val} onClick={() => setProfType(t.val)} style={{
                  padding: "16px 18px", borderRadius: 12, cursor: "pointer",
                  border: profType === t.val ? `2px solid ${ruby}` : `1px solid ${borderColor}`,
                  background: profType === t.val ? `${ruby}04` : surface, transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: profType === t.val ? ruby : slate }}>{t.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: profType === t.val ? 600 : 500, color: profType === t.val ? ruby : ink }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Label required>Qualification Document</Label>
            <div style={{
              padding: "40px 24px", borderRadius: 12, border: `2px dashed ${borderColor}`, background: bg,
              textAlign: "center", cursor: "pointer", transition: "border-color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = ruby}
              onMouseLeave={e => e.currentTarget.style.borderColor = borderColor}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#D1D5DB", marginBottom: 8, display: "block" }}>cloud_upload</span>
              <div style={{ fontSize: 14, fontWeight: 500, color: ink, marginBottom: 4 }}>Drag and drop your document here</div>
              <div style={{ fontSize: 12, color: slate }}>PDF, JPG or PNG — max 10MB</div>
              <button style={{ ...pill, padding: "8px 20px", border: `1px solid ${borderColor}`, background: surface, fontSize: 13, fontWeight: 500, color: ink, cursor: "pointer", marginTop: 12 }}>Browse Files</button>
            </div>
          </div>

          {profType === "doctor" && (
            <div><Label>Practice Website URL</Label><Input placeholder="https://www.your-practice.de" /></div>
          )}
          {profType === "heilpraktiker" && (
            <div><Label>Practice Website or License Number</Label><Input placeholder="https://... or license number" /></div>
          )}
        </div>
      );

      case 2: return (
        <div>
          <h2 style={{ fontFamily: "Manrope", fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: "0 0 4px" }}>Experience Profile</h2>
          <p style={{ fontSize: 14, color: slate, margin: "0 0 32px" }}>Help us match you with the right patients. Toggle on the areas where you have experience.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Toggle checked={expChildren} onChange={() => setExpChildren(!expChildren)} label="Pediatric blood draws (children)" sublabel="Experience drawing blood from infants, toddlers, and children under 14." />
            <Toggle checked={expElderly} onChange={() => setExpElderly(!expElderly)} label="Elderly patients" sublabel="Experience with older patients who may have fragile veins or mobility limitations." />
            <Toggle checked={expRollvenen} onChange={() => setExpRollvenen(!expRollvenen)} label="Difficult veins (Rollvenen)" sublabel="Experience with veins that are hard to locate or tend to roll during puncture." />
            <Toggle checked={expObese} onChange={() => setExpObese(!expObese)} label="Obese patients" sublabel="Experience with patients where vein access may be more challenging due to body composition." />
          </div>

          <div style={{ marginTop: 24, padding: "16px 18px", borderRadius: 12, background: `${steel}06`, fontSize: 13, color: steel, lineHeight: 1.6 }}>
            <strong>Why does this matter?</strong> Healthcare companies flag cases that need specialized experience. Your experience profile helps our matching algorithm connect you with cases where your skills make a difference — and earns you more bookings.
          </div>
        </div>
      );

      case 3: return (
        <div>
          <h2 style={{ fontFamily: "Manrope", fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: "0 0 4px" }}>Practice Equipment</h2>
          <p style={{ fontSize: 14, color: slate, margin: "0 0 32px" }}>Some tests require specific equipment. Let us know what you have available.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Toggle checked={hasCentrifuge} onChange={() => setHasCentrifuge(!hasCentrifuge)} label="Centrifuge available" sublabel="Required for serum separation. Some specialized labs require centrifuged samples." />
            <Toggle checked={hasFreezer} onChange={() => setHasFreezer(!hasFreezer)} label="Freezer available (-20°C)" sublabel="Required for sample storage when immediate transport isn't possible." />
          </div>

          <div style={{ marginTop: 32 }}>
            <Label>Additional Equipment (optional)</Label>
            <Input placeholder="e.g., Blood gas analyzer, cold chain transport box..." />
            <div style={{ fontSize: 12, color: slate, marginTop: 4 }}>Describe any other relevant equipment you have.</div>
          </div>
        </div>
      );

      case 4: return (
        <div>
          <h2 style={{ fontFamily: "Manrope", fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: "0 0 4px" }}>Service Area</h2>
          <p style={{ fontSize: 14, color: slate, margin: "0 0 32px" }}>Define where and how you're available for blood collection.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            <Toggle checked={practiceVisits} onChange={() => setPracticeVisits(!practiceVisits)} label="Available at practice" sublabel="Patients can come to your location for blood draws." />
            <Toggle checked={homeVisits} onChange={() => setHomeVisits(!homeVisits)} label="Available for home visits" sublabel="You'll travel to the patient's location." />
          </div>

          {homeVisits && (
            <div>
              <Label>Maximum travel radius</Label>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <input type="range" min="5" max="50" value={radius} onChange={e => setRadius(e.target.value)}
                  style={{ flex: 1, accentColor: ruby, height: 6, cursor: "pointer" }} />
                <div style={{ minWidth: 60, textAlign: "center", fontFamily: "Manrope", fontSize: 20, fontWeight: 800, color: ruby }}>{radius} km</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: slate, marginTop: 4 }}>
                <span>5 km</span><span>50 km</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: 32 }}>
            <Label required>Practice / Base Address</Label>
            <Input placeholder="Street, house number, PLZ, city" />
            <div style={{ fontSize: 12, color: slate, marginTop: 4 }}>This is used to calculate distances for matching and travel fees.</div>
          </div>
        </div>
      );

      case 5: return (
        <div>
          <h2 style={{ fontFamily: "Manrope", fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: "0 0 4px" }}>Pricing</h2>
          <p style={{ fontSize: 14, color: slate, margin: "0 0 32px" }}>Set your fees. You can update these anytime from your dashboard.</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            <div style={{ padding: "24px", borderRadius: 14, border: `1px solid ${borderColor}`, background: surface }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: steel }}>local_hospital</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Practice Visit Fee</span>
              </div>
              <Label required>Base fee</Label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: slate }}>€</span>
                <Input type="number" value={practiceFee} onChange={e => setPracticeFee(e.target.value)} style={{ fontSize: 20, fontWeight: 700, fontFamily: "Manrope" }} />
              </div>
              <div style={{ fontSize: 12, color: slate, marginTop: 6 }}>Min €15 — Max €100</div>
            </div>

            {homeVisits && (
              <div style={{ padding: "24px", borderRadius: 14, border: `1px solid ${borderColor}`, background: surface }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: burnt }}>home</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Home Visit Fee</span>
                </div>
                <Label required>Base fee</Label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: slate }}>€</span>
                  <Input type="number" value={homeVisitFee} onChange={e => setHomeVisitFee(e.target.value)} style={{ fontSize: 20, fontWeight: 700, fontFamily: "Manrope" }} />
                </div>
                <div style={{ fontSize: 12, color: slate, marginTop: 6 }}>Min €15 — Max €100</div>

                <div style={{ marginTop: 16 }}>
                  <Label>Travel base fee</Label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: slate }}>€</span>
                    <Input type="number" value={travelBase} onChange={e => setTravelBase(e.target.value)} style={{ fontWeight: 600 }} />
                  </div>
                  <div style={{ fontSize: 12, color: slate, marginTop: 4 }}>Plus €0.40/km calculated by the platform.</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: "16px 18px", borderRadius: 12, background: `${ruby}05`, border: `1px solid ${rubyBorder}` }}>
            <div style={{ fontSize: 13, color: ink, lineHeight: 1.6 }}>
              <strong>How earnings work:</strong> Patients pay through the platform. You receive your fee minus the platform commission (default 17.5%) via credit note, settled bi-weekly. Your net earnings are always visible before you accept a case.
            </div>
          </div>
        </div>
      );

      case 6: return (
        <div>
          <h2 style={{ fontFamily: "Manrope", fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: "0 0 4px" }}>Review & Submit</h2>
          <p style={{ fontSize: 14, color: slate, margin: "0 0 32px" }}>Review your profile before submitting for verification.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Summary cards */}
            {[
              { title: "Personal", icon: "person", items: [
                `${firstName || "—"} ${lastName || "—"}`,
                email || "—",
                phone || "—",
              ]},
              { title: "Qualifications", icon: "workspace_premium", items: [
                profType ? { doctor: "Doctor (Arzt)", mfa: "Medical Assistant (MFA)", nurse: "Nurse", heilpraktiker: "Alternative Practitioner" }[profType] : "—",
                "Document uploaded",
              ]},
              { title: "Experience", icon: "psychology", items: [
                ...(expChildren ? ["Pediatric"] : []),
                ...(expElderly ? ["Elderly"] : []),
                ...(expRollvenen ? ["Difficult veins"] : []),
                ...(expObese ? ["Obese patients"] : []),
              ].join(", ") || "None specified" },
              { title: "Equipment", icon: "medical_services", items: [
                ...(hasCentrifuge ? ["Centrifuge"] : []),
                ...(hasFreezer ? ["Freezer (-20°C)"] : []),
              ].join(", ") || "None" },
              { title: "Service Area", icon: "location_on", items: [
                ...(practiceVisits ? ["Practice visits"] : []),
                ...(homeVisits ? [`Home visits (${radius}km radius)`] : []),
              ].join(" + ") || "—" },
              { title: "Pricing", icon: "euro", items: [
                `Practice: €${practiceFee}`,
                ...(homeVisits ? [`Home visit: €${homeVisitFee} + €${travelBase} travel base`] : []),
              ]},
            ].map((section, i) => (
              <div key={i} style={{ padding: "16px 20px", borderRadius: 12, border: `1px solid ${borderColor}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: rubyLight, border: `1px solid ${rubyBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: ruby }}>{section.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: ink }}>{section.title}</div>
                    <div style={{ fontSize: 12, color: slate, marginTop: 2 }}>{Array.isArray(section.items) ? section.items.join(" · ") : section.items}</div>
                  </div>
                </div>
                <button onClick={() => setStep(i)} style={{ ...pill, padding: "4px 14px", border: `1px solid ${borderColor}`, background: "transparent", fontSize: 12, fontWeight: 500, color: slate, cursor: "pointer" }}>Edit</button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: "16px 18px", borderRadius: 12, background: `${green}08`, border: `1px solid ${green}25` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: green, marginTop: 1 }}>info</span>
              <div style={{ fontSize: 13, color: ink, lineHeight: 1.6 }}>
                After submitting, our team will review your qualifications within <strong>24 hours</strong>. You'll receive an email notification once your profile is approved and you can start receiving blood collection requests.
              </div>
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: ink, background: bg, minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300&display=swap" rel="stylesheet" />

      {/* ════════ HEADER ════════ */}
      <header style={{ background: surface, borderBottom: `1px solid ${borderColor}`, padding: "0 48px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: ruby, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: 18 }}>bloodtype</span>
          </div>
          <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>
            Blutabnahme<span style={{ color: ruby }}>.de</span>
          </span>
        </div>
        <div style={{ fontSize: 13, color: slate }}>
          Already registered? <a href="#" style={{ color: ruby, fontWeight: 600, textDecoration: "none" }}>Sign in</a>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        {/* ════════ STEP INDICATOR ════════ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 48 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div
                onClick={() => i <= step && setStep(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, cursor: i <= step ? "pointer" : "default",
                  opacity: i <= step ? 1 : 0.4, transition: "opacity 0.3s",
                }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: i < step ? ruby : i === step ? ruby : bg,
                  border: i === step ? `2px solid ${ruby}` : i < step ? "none" : `1px solid ${borderColor}`,
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s",
                }}>
                  {i < step ? (
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#fff" }}>check</span>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: i === step ? "#fff" : slate }}>{s.icon}</span>
                  )}
                </div>
                <span style={{ fontSize: 12, fontWeight: i === step ? 600 : 400, color: i === step ? ruby : i < step ? ink : slate, whiteSpace: "nowrap" }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 32, height: 1, background: i < step ? ruby : borderColor, margin: "0 8px", transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* ════════ STEP CONTENT ════════ */}
        <div style={{ background: surface, borderRadius: 20, border: `1px solid ${borderColor}`, padding: "40px 48px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          {renderStep()}
        </div>

        {/* ════════ NAVIGATION ════════ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={prev}
            style={{
              ...pill, padding: "12px 28px", border: `1px solid ${borderColor}`, background: "transparent",
              fontSize: 14, fontWeight: 500, color: slate, cursor: step === 0 ? "default" : "pointer",
              opacity: step === 0 ? 0.3 : 1, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            Previous
          </button>

          <div style={{ fontSize: 13, color: slate }}>Step {step + 1} of {steps.length}</div>

          {step < steps.length - 1 ? (
            <button onClick={next}
              style={{
                ...pill, padding: "12px 28px", border: "none", background: ruby, color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                boxShadow: `0 4px 16px ${ruby}25`, transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#A51A26"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = ruby; e.currentTarget.style.transform = "translateY(0)"; }}>
              Continue
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </button>
          ) : (
            <button
              style={{
                ...pill, padding: "12px 32px", border: "none", background: ruby, color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                boxShadow: `0 4px 16px ${ruby}25`, transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#A51A26"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = ruby; e.currentTarget.style.transform = "translateY(0)"; }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
              Submit for Verification
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
