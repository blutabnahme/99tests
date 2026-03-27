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

// ─── Reusable Components ───

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
    <aside style={{
      width: 260, background: surface, borderRight: `1px solid ${borderColor}`,
      display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", position: "sticky", top: 0,
    }}>
      <div style={{ padding: "24px 24px 32px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, background: ruby, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: 18 }}>bloodtype</span>
        </div>
        <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>
          Blutabnahme<span style={{ color: ruby }}>.de</span>
        </span>
      </div>
      <nav style={{ flex: 1, padding: "0 12px" }}>
        {items.map((item, i) => (
          <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10,
              cursor: "pointer", marginBottom: 2,
              background: item.active ? rubyLight : hover === i ? "#F9FAFB" : "transparent",
              color: item.active ? ruby : ink, transition: "all 0.15s",
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: item.active ? ruby : slate }}>{item.icon}</span>
            <span style={{ fontSize: 14, fontWeight: item.active ? 600 : 500 }}>{item.label}</span>
          </div>
        ))}
      </nav>
      <div style={{ padding: "16px 12px", borderTop: `1px solid ${borderColor}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10 }}>
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

function Label({ children, required }) {
  return (
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: ink, marginBottom: 6 }}>
      {children}
      {required && <span style={{ color: ruby, marginLeft: 3 }}>*</span>}
    </label>
  );
}

function Input({ placeholder, type = "text", value, onChange, style: extraStyle }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${borderColor}`,
        fontSize: 14, color: ink, outline: "none", transition: "border 0.2s",
        background: surface, boxSizing: "border-box", ...extraStyle,
      }}
      onFocus={e => e.target.style.border = `2px solid ${ruby}`}
      onBlur={e => e.target.style.border = `1px solid ${borderColor}`}
    />
  );
}

function Select({ options, value, onChange, placeholder }) {
  return (
    <select value={value} onChange={onChange}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${borderColor}`,
        fontSize: 14, color: value ? ink : slate, outline: "none", background: surface,
        cursor: "pointer", appearance: "auto", boxSizing: "border-box",
      }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Checkbox({ checked, onChange, label, sublabel }) {
  return (
    <label style={{ display: "flex", gap: 12, cursor: "pointer", alignItems: "flex-start" }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6, border: checked ? "none" : `2px solid ${borderColor}`,
        background: checked ? ruby : surface, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 1, transition: "all 0.15s",
      }}>
        {checked && <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#fff" }}>check</span>}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: ink }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: slate, marginTop: 2 }}>{sublabel}</div>}
      </div>
    </label>
  );
}

function RadioOption({ selected, onSelect, label, sublabel, icon, tag }) {
  return (
    <div onClick={onSelect} style={{
      padding: "16px 18px", borderRadius: 12, cursor: "pointer",
      border: selected ? `2px solid ${ruby}` : `1px solid ${borderColor}`,
      background: selected ? `${ruby}04` : surface, transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: sublabel ? 4 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon && <span className="material-symbols-outlined" style={{ fontSize: 18, color: selected ? ruby : slate }}>{icon}</span>}
          <span style={{ fontSize: 14, fontWeight: 600, color: selected ? ruby : ink }}>{label}</span>
        </div>
        {tag && <span style={{ ...pill, fontSize: 11, fontWeight: 600, padding: "2px 10px", background: `${burnt}15`, color: burnt }}>{tag}</span>}
        <div style={{
          width: 18, height: 18, borderRadius: "50%", border: selected ? `5px solid ${ruby}` : `2px solid #D1D5DB`,
          transition: "all 0.15s", flexShrink: 0,
        }} />
      </div>
      {sublabel && <div style={{ fontSize: 12, color: slate, marginLeft: icon ? 28 : 0 }}>{sublabel}</div>}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24, paddingTop: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: rubyLight, border: `1px solid ${rubyBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: ruby }}>{icon}</span>
      </div>
      <div>
        <h3 style={{ fontFamily: "Manrope", fontSize: 17, fontWeight: 700, margin: 0, color: ink }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 13, color: slate, margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Material catalog ───
const materialCatalog = [
  { name: "EDTA Tube (2.7ml)", price: 0.85 },
  { name: "EDTA Tube (4.9ml)", price: 0.95 },
  { name: "Serum Tube (4.9ml)", price: 0.90 },
  { name: "Lithium Heparin Tube", price: 1.10 },
  { name: "Citrate Tube (3.2ml)", price: 1.20 },
  { name: "Butterfly Needle 21G", price: 0.65 },
  { name: "Standard Needle 21G", price: 0.30 },
  { name: "Alcohol Swab Pack (10)", price: 0.50 },
  { name: "Gauze Pad Pack (5)", price: 0.35 },
  { name: "Shipping Container (Ambient)", price: 3.50 },
  { name: "Shipping Container (Cold Chain)", price: 7.20 },
  { name: "Ice Pack", price: 1.80 },
];

// ─── Main Component ───
export default function NewCaseForm() {
  // Patient data
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [guardianName, setGuardianName] = useState("");

  // Auto-detect minor from DOB
  const isMinor = (() => {
    if (!dob) return false;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age < 18;
  })();
  const [mobility, setMobility] = useState("");

  // Case details
  const [urgency, setUrgency] = useState("Normal");
  const [specialFlags, setSpecialFlags] = useState({ minor: false, elderly: false, rollvenen: false });

  // Materials
  const [materials, setMaterials] = useState([{ item: "", qty: 1 }]);

  // Logistics
  const [materialLogistics, setMaterialLogistics] = useState("");
  const [returnLogistics, setReturnLogistics] = useState("");

  // Consent
  const [therapeutic, setTherapeutic] = useState(false);

  const addMaterial = () => setMaterials([...materials, { item: "", qty: 1 }]);
  const removeMaterial = (idx) => setMaterials(materials.filter((_, i) => i !== idx));
  const updateMaterial = (idx, field, val) => {
    const m = [...materials];
    m[idx][field] = val;
    setMaterials(m);
  };

  // Fee calculation
  const baseFee = mobility === "home" ? 45 : 30;
  const travelFee = mobility === "home" ? 37.60 : 0;
  const urgencySurcharge = urgency === "Urgent" ? baseFee * 0.25 : urgency === "Emergency" ? baseFee * 0.50 : 0;
  const materialCost = materials.reduce((sum, m) => {
    const cat = materialCatalog.find(c => c.name === m.item);
    return sum + (cat ? cat.price * (m.qty || 0) : 0);
  }, 0);
  const logisticsFee = materialLogistics === "platform" ? 8.50 : 0;
  const returnFee = returnLogistics === "platform" ? 12.00 : 0;
  const orgFee = mobility === "home" ? 35 : 20;
  const subtotal = baseFee + travelFee + urgencySurcharge + materialCost + logisticsFee + returnFee;
  const vat = subtotal * 0.19;
  const total = subtotal + vat;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: ink, background: bg, minHeight: "100vh", display: "flex" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300&display=swap" rel="stylesheet" />

      <SidebarNav />

      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 1200, minWidth: 0 }}>
        {/* Breadcrumb + Header */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: slate, marginBottom: 8 }}>
            <a href="#" style={{ color: slate, textDecoration: "none" }}>Dashboard</a>
            <span style={{ margin: "0 8px" }}>›</span>
            <a href="#" style={{ color: slate, textDecoration: "none" }}>Cases</a>
            <span style={{ margin: "0 8px" }}>›</span>
            <span style={{ color: ink, fontWeight: 500 }}>New Case</span>
          </div>
          <h1 style={{ fontFamily: "Manrope", fontSize: 28, fontWeight: 800, letterSpacing: -0.8, margin: "0 0 4px" }}>Create New Case</h1>
          <p style={{ fontSize: 14, color: slate, margin: 0 }}>Submit a blood collection request for your patient.</p>
        </div>

        {/* Content Grid: Form + Fee Panel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, marginTop: 24, alignItems: "start" }}>

          {/* ════════ FORM ════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Section 1: Patient Information */}
            <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "28px 28px 24px" }}>
              <SectionHeader icon="person" title="Patient Information" subtitle="Enter the patient's personal and contact details." />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <Label required>First Name</Label>
                  <Input placeholder="Patient first name" />
                </div>
                <div>
                  <Label required>Last Name</Label>
                  <Input placeholder="Patient last name" />
                </div>
                <div>
                  <Label required>Date of Birth</Label>
                  <Input type="date" placeholder="" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
                <div>
                  <Label required>Gender</Label>
                  <Select options={["Male", "Female", "Diverse"]} value={gender} onChange={e => setGender(e.target.value)} placeholder="Select gender" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <Label required>Address</Label>
                  <Input placeholder="Street, house number, PLZ, city" />
                </div>
                <div>
                  <Label required>Email</Label>
                  <Input type="email" placeholder="patient@email.com" />
                </div>
                <div>
                  <Label required>Phone</Label>
                  <Input type="tel" placeholder="+49 xxx xxxxxxxx" />
                </div>
                <div>
                  <Label>Insurance Type</Label>
                  <Select options={["Gesetzlich (GKV)", "Privat (PKV)", "Selbstzahler"]} value="" onChange={() => {}} placeholder="Select type" />
                </div>
              </div>

              {/* Minor auto-detection from DOB */}
              {isMinor && (
                <div style={{ marginTop: 20, padding: "16px 18px", borderRadius: 12, background: "#FEF3C7", border: "1px solid #FDE68A" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#92400E" }}>warning</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#92400E" }}>Patient is under 18 — guardian information required</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#78350F", marginBottom: 14 }}>A legal guardian must be present during the blood draw.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <Label required>Guardian Name</Label>
                      <Input placeholder="Legal guardian full name" value={guardianName} onChange={e => setGuardianName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Second Guardian (optional)</Label>
                      <Input placeholder="Second guardian name" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Test Requirements */}
            <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "28px 28px 24px" }}>
              <SectionHeader icon="science" title="Test Requirements" subtitle="Specify the tests and preferred laboratory." />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <Label required>Test Type(s)</Label>
                  <Input placeholder="e.g., Complete Blood Count, Thyroid Panel, Vitamin D..." />
                  <div style={{ fontSize: 11, color: slate, marginTop: 4 }}>Separate multiple tests with commas.</div>
                </div>
                <div>
                  <Label>Preferred Laboratory</Label>
                  <Select options={["Labor Berlin", "Synlab", "Sonic Healthcare", "MVZ Labor Augsburg", "IMD Berlin", "Other"]} value="" onChange={() => {}} placeholder="Select laboratory" />
                </div>
                <div>
                  <Label required>Patient Mobility</Label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <RadioOption selected={mobility === "practice"} onSelect={() => setMobility("practice")} label="Can travel to practice" icon="local_hospital" />
                    <RadioOption selected={mobility === "home"} onSelect={() => setMobility("home")} label="Home visit required" icon="home" tag="+Travel fee" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Urgency & Special Cases */}
            <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "28px 28px 24px" }}>
              <SectionHeader icon="priority_high" title="Urgency & Special Cases" subtitle="Set urgency level and flag any special requirements." />

              <Label required>Urgency Level</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
                {[
                  { val: "Normal", label: "Normal", sub: "Standard scheduling", surcharge: null },
                  { val: "Urgent", label: "Urgent", sub: "Within 48 hours", surcharge: "+25%" },
                  { val: "Emergency", label: "Emergency", sub: "Same day", surcharge: "+50%" },
                ].map(u => (
                  <div key={u.val} onClick={() => setUrgency(u.val)} style={{
                    padding: "16px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                    border: urgency === u.val ? `2px solid ${u.val === "Emergency" ? ruby : u.val === "Urgent" ? burnt : steel}` : `1px solid ${borderColor}`,
                    background: urgency === u.val ? (u.val === "Emergency" ? `${ruby}05` : u.val === "Urgent" ? `${burnt}05` : `${steel}05`) : surface,
                    transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: urgency === u.val ? (u.val === "Emergency" ? ruby : u.val === "Urgent" ? burnt : steel) : ink }}>{u.label}</div>
                    <div style={{ fontSize: 12, color: slate, marginTop: 2 }}>{u.sub}</div>
                    {u.surcharge && <div style={{ ...pill, display: "inline-block", fontSize: 11, fontWeight: 600, padding: "2px 10px", marginTop: 8, background: u.val === "Emergency" ? `${ruby}12` : `${burnt}12`, color: u.val === "Emergency" ? ruby : burnt }}>{u.surcharge}</div>}
                  </div>
                ))}
              </div>

              <Label>Special Case Flags</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Checkbox checked={specialFlags.minor} onChange={() => setSpecialFlags({ ...specialFlags, minor: !specialFlags.minor })} label="Minor (pediatric blood draw)" sublabel="Prioritize BCs with pediatric experience." />
                <Checkbox checked={specialFlags.elderly} onChange={() => setSpecialFlags({ ...specialFlags, elderly: !specialFlags.elderly })} label="Elderly patient" sublabel="Prioritize BCs with elderly care experience." />
                <Checkbox checked={specialFlags.rollvenen} onChange={() => setSpecialFlags({ ...specialFlags, rollvenen: !specialFlags.rollvenen })} label="Difficult veins (Rollvenen)" sublabel="Prioritize BCs experienced with difficult vein access." />
              </div>
            </div>

            {/* Section 4: Materials */}
            <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "28px 28px 24px" }}>
              <SectionHeader icon="inventory_2" title="Materials Required" subtitle="Specify tubes, needles, and other materials needed." />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {materials.map((m, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 36px", gap: 10, alignItems: "end" }}>
                    <div>
                      {i === 0 && <Label>Item</Label>}
                      <Select options={materialCatalog.map(c => c.name)} value={m.item} onChange={e => updateMaterial(i, "item", e.target.value)} placeholder="Select material" />
                    </div>
                    <div>
                      {i === 0 && <Label>Qty</Label>}
                      <Input type="number" value={m.qty} onChange={e => updateMaterial(i, "qty", parseInt(e.target.value) || 0)} style={{ textAlign: "center" }} />
                    </div>
                    <div>
                      {i === 0 && <Label>Cost</Label>}
                      <div style={{ padding: "10px 14px", fontSize: 14, color: ink, fontWeight: 600, fontFamily: "Manrope" }}>
                        €{((materialCatalog.find(c => c.name === m.item)?.price || 0) * (m.qty || 0)).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      {i === 0 && <div style={{ height: 24 }} />}
                      {materials.length > 1 && (
                        <button onClick={() => removeMaterial(i)} style={{ width: 36, height: 42, borderRadius: 8, border: `1px solid ${borderColor}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: slate }}>close</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addMaterial} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, border: `1px dashed ${borderColor}`, background: "transparent", fontSize: 13, fontWeight: 500, color: ruby, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                Add material
              </button>
            </div>

            {/* Section 5: Logistics */}
            <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "28px 28px 24px" }}>
              <SectionHeader icon="local_shipping" title="Logistics" subtitle="Choose who handles materials and sample return." />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <Label required>Who provides materials?</Label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <RadioOption selected={materialLogistics === "hc"} onSelect={() => setMaterialLogistics("hc")} label="We provide materials" sublabel="HC sends materials to patient or BC directly." icon="business" />
                    <RadioOption selected={materialLogistics === "platform"} onSelect={() => setMaterialLogistics("platform")} label="Platform provides" sublabel="Blutabnahme.de ships materials." icon="package_2" tag="+€8.50" />
                  </div>
                </div>
                <div>
                  <Label required>Who organizes return shipping?</Label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <RadioOption selected={returnLogistics === "hc"} onSelect={() => setReturnLogistics("hc")} label="We organize return" sublabel="HC handles sample return to lab." icon="business" />
                    <RadioOption selected={returnLogistics === "platform"} onSelect={() => setReturnLogistics("platform")} label="Platform organizes" sublabel="Blutabnahme.de handles pick-up and delivery." icon="package_2" tag="+€12.00" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: Confirmation */}
            <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "28px 28px 24px" }}>
              <SectionHeader icon="verified" title="Confirmation" subtitle="Confirm the therapeutic relationship and submit." />
              <div style={{
                padding: "20px", borderRadius: 12, background: therapeutic ? `${ruby}04` : "#FFFBEB",
                border: `1px solid ${therapeutic ? rubyBorder : "#FDE68A"}`, marginBottom: 20, transition: "all 0.2s",
              }}>
                <Checkbox checked={therapeutic} onChange={() => setTherapeutic(!therapeutic)}
                  label="I confirm an active therapeutic relationship"
                  sublabel="I hereby confirm that the patient named above is currently under active therapeutic care by our practice/company, and that this blood collection is medically indicated as part of their ongoing treatment. I understand that Blutabnahme.de acts solely as an intermediary and does not provide medical advice." />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button style={{ ...pill, padding: "12px 28px", border: `1px solid ${borderColor}`, background: "transparent", fontSize: 14, fontWeight: 500, color: slate, cursor: "pointer" }}>
                  Save Draft
                </button>
                <button style={{
                  ...pill, padding: "12px 32px", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  background: therapeutic ? ruby : "#D1D5DB", color: "#fff",
                  boxShadow: therapeutic ? `0 4px 16px ${ruby}25` : "none",
                  transition: "all 0.2s", pointerEvents: therapeutic ? "auto" : "none",
                }}
                  onMouseEnter={e => { if (therapeutic) e.target.style.background = "#A51A26"; }}
                  onMouseLeave={e => { if (therapeutic) e.target.style.background = ruby; }}>
                  Submit Case
                </button>
              </div>
            </div>
          </div>

          {/* ════════ FEE ESTIMATE PANEL ════════ */}
          <div style={{ position: "sticky", top: 24 }}>
            <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "24px", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "Manrope", fontSize: 16, fontWeight: 700, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: ruby }}>calculate</span>
                Fee Estimate
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: `Base fee (${mobility === "home" ? "home visit" : "practice"})`, value: baseFee },
                  ...(travelFee > 0 ? [{ label: "Travel fee (est. 31.5 km)", value: travelFee }] : []),
                  ...(urgencySurcharge > 0 ? [{ label: `Urgency surcharge (${urgency})`, value: urgencySurcharge, highlight: true }] : []),
                  ...(materialCost > 0 ? [{ label: "Material costs", value: materialCost }] : []),
                  ...(logisticsFee > 0 ? [{ label: "Material shipping", value: logisticsFee }] : []),
                  ...(returnFee > 0 ? [{ label: "Return shipping", value: returnFee }] : []),
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid #F3F4F6` }}>
                    <span style={{ fontSize: 13, color: row.highlight ? burnt : slate }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "Manrope", color: row.highlight ? burnt : ink }}>€{row.value.toFixed(2)}</span>
                  </div>
                ))}

                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                  <span style={{ fontSize: 13, color: slate }}>Subtotal</span>
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "Manrope" }}>€{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${borderColor}` }}>
                  <span style={{ fontSize: 13, color: slate }}>VAT (19%)</span>
                  <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "Manrope", color: slate }}>€{vat.toFixed(2)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Patient Total</span>
                  <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "Manrope", color: ruby }}>€{total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: `${steel}06`, fontSize: 12, color: steel, lineHeight: 1.6 }}>
                <strong>HC Organization Fee:</strong> €{orgFee.toFixed(2)} (excl. VAT) — billed monthly.
              </div>
            </div>

            {/* Info card */}
            <div style={{ background: surface, borderRadius: 16, border: `1px solid ${borderColor}`, padding: "20px 24px" }}>
              <h4 style={{ fontFamily: "Manrope", fontSize: 13, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: steel }}>info</span>
                What happens next?
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { step: "1", text: "Patient receives a consent link via email/SMS" },
                  { step: "2", text: "Platform matches with nearby qualified blood collectors" },
                  { step: "3", text: "You review matched BCs and confirm" },
                  { step: "4", text: "Appointment is booked and both parties are notified" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: rubyLight, border: `1px solid ${rubyBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: ruby }}>{s.step}</span>
                    </div>
                    <span style={{ fontSize: 13, color: slate, lineHeight: 1.5 }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
