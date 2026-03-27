import { useState } from "react";

const ruby = "#BE1E2D";
const rubyLight = "#BE1E2D08";
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

function Checkbox({ checked, onChange, label, sublabel }) {
  return (
    <div onClick={onChange} style={{ display: "flex", gap: 14, cursor: "pointer", alignItems: "flex-start", padding: "14px 16px", borderRadius: 12, border: `1px solid ${checked ? rubyBorder : borderColor}`, background: checked ? `${ruby}03` : surface, transition: "all 0.15s", marginBottom: 8 }}>
      <div style={{ width: 22, height: 22, borderRadius: 7, border: checked ? "none" : `2px solid #D1D5DB`, background: checked ? ruby : surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.15s" }}>
        {checked && <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#fff" }}>check</span>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: ink, lineHeight: 1.4 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: slate, marginTop: 4, lineHeight: 1.5 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

function Star({ filled, half, onClick, onHover }) {
  return (
    <div onClick={onClick} onMouseEnter={onHover} style={{ cursor: "pointer", padding: 4 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, color: filled ? "#F59E0B" : "#E5E7EB", transition: "color 0.15s" }}>
        {filled ? "star" : "star"}
      </span>
    </div>
  );
}

// Mock data for this patient's case
const shortlistBCs = [
  {
    id: 1, name: "Anna Weber", photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=faces",
    qualification: "Medical Assistant (MFA)", rating: 4.9, ratingCount: 156, collections: 1247,
    distance: 3.2, baseFee: 32, nextSlot: "Tomorrow, 10:00", slotsAvailable: 4, bestMatch: true,
    expChildren: true, expElderly: true, expRollvenen: true,
  },
  {
    id: 2, name: "Dr. Klaus Frey", photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=faces",
    qualification: "Doctor (Arzt)", rating: 4.8, ratingCount: 89, collections: 634,
    distance: 5.7, baseFee: 45, nextSlot: "Tomorrow, 14:30", slotsAvailable: 2, bestMatch: false,
    expChildren: false, expElderly: true, expRollvenen: false,
  },
  {
    id: 3, name: "Sophie Lang", photo: "https://images.unsplash.com/photo-1594824476967-48c8b964f137?w=200&h=200&fit=crop&crop=faces",
    qualification: "Nurse", rating: 4.7, ratingCount: 203, collections: 1891,
    distance: 8.4, baseFee: 28, nextSlot: "Mar 15, 09:00", slotsAvailable: 6, bestMatch: false,
    expChildren: true, expElderly: true, expRollvenen: true,
  },
];

const caseData = {
  hcName: "Berlin Health Lab",
  patientName: "Maria",
  isMinor: false,
  bc: {
    name: "Anna Weber",
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=faces",
    rating: 4.8,
    ratingCount: 124,
    totalCollections: 847,
    qualifications: "Medical Assistant (MFA)",
  },
  appointment: {
    date: "Friday, March 14, 2026",
    time: "09:30",
    type: "Home Visit",
    address: "Friedrichstraße 42, 10117 Berlin",
  },
  fees: {
    baseFee: 45.00,
    travelFee: 37.60,
    urgency: 0,
    materials: 4.85,
    logistics: 0,
    subtotal: 87.45,
    vat: 16.62,
    total: 104.07,
  },
  preparation: [
    "Fast for 12 hours before the appointment (water is fine).",
    "Avoid alcohol for 24 hours before the test.",
    "Take your regular medication unless told otherwise.",
    "Wear a short-sleeved shirt or loose-fitting top.",
    "Stay hydrated — drink water before the appointment.",
  ],
};

export default function PatientPortal() {
  const [step, setStep] = useState(0);

  // Consent
  const [consentBlood, setConsentBlood] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [consentGdpr, setConsentGdpr] = useState(false);
  const allConsented = consentBlood && consentData && consentGdpr;

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("");

  // Rating
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = 6;
  const next = () => setStep(Math.min(step + 1, totalSteps - 1));

  // BC Selection
  const [selectedBC, setSelectedBC] = useState(null);
  const chosenBC = shortlistBCs.find(b => b.id === selectedBC) || shortlistBCs[0];

  // Mobile container
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: ink, background: bg, minHeight: "100vh", display: "flex", justifyContent: "center", padding: "24px 16px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300&display=swap" rel="stylesheet" />

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* ════════ HEADER ════════ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          <div style={{ width: 28, height: 28, background: ruby, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: 16 }}>bloodtype</span>
          </div>
          <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>
            Blutabnahme<span style={{ color: ruby }}>.de</span>
          </span>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{
              width: i === step ? 32 : 8, height: 8, borderRadius: 4,
              background: i < step ? ruby : i === step ? ruby : "#E5E7EB",
              opacity: i <= step ? 1 : 0.5, transition: "all 0.3s",
            }} />
          ))}
        </div>

        {/* ════════ STEP 0: WELCOME ════════ */}
        {step === 0 && (
          <div style={{ background: surface, borderRadius: 20, padding: "36px 28px", border: `1px solid ${borderColor}`, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: rubyLight, border: `1px solid ${rubyBorder}`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: ruby }}>waving_hand</span>
            </div>
            <h1 style={{ fontFamily: "Manrope", fontSize: 26, fontWeight: 800, letterSpacing: -0.5, margin: "0 0 8px" }}>
              Hello, {caseData.patientName}!
            </h1>
            <p style={{ fontSize: 15, color: slate, lineHeight: 1.7, margin: "0 0 24px" }}>
              <strong style={{ color: ink }}>{caseData.hcName}</strong> has arranged a blood collection for you. We just need a few things before we can book your appointment.
            </p>

            <div style={{ background: bg, borderRadius: 14, padding: "20px", textAlign: "left", marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: slate, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>What to expect</div>
              {[
                { icon: "edit_document", text: "Sign consent forms" },
                { icon: "person_search", text: "Choose your blood collector" },
                { icon: "calendar_month", text: "Review your appointment details" },
                { icon: "payment", text: "Complete payment" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ruby}08`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: ruby }}>{item.icon}</span>
                  </div>
                  <span style={{ fontSize: 14, color: ink }}>{item.text}</span>
                </div>
              ))}
            </div>

            <button onClick={next} style={{
              ...pill, width: "100%", padding: "14px", border: "none", background: ruby, color: "#fff",
              fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 16px ${ruby}25`, transition: "all 0.2s",
            }}
              onMouseEnter={e => e.target.style.background = "#A51A26"}
              onMouseLeave={e => e.target.style.background = ruby}>
              Let's get started
            </button>

            <div style={{ fontSize: 12, color: slate, marginTop: 16, lineHeight: 1.5 }}>
              This process takes about 2 minutes. Your data is encrypted and protected under GDPR.
            </div>
          </div>
        )}

        {/* ════════ STEP 1: CONSENT ════════ */}
        {step === 1 && (
          <div style={{ background: surface, borderRadius: 20, padding: "32px 24px", border: `1px solid ${borderColor}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: rubyLight, border: `1px solid ${rubyBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: ruby }}>verified</span>
              </div>
              <h2 style={{ fontFamily: "Manrope", fontSize: 22, fontWeight: 800, letterSpacing: -0.3, margin: 0 }}>Consent</h2>
            </div>
            <p style={{ fontSize: 14, color: slate, margin: "0 0 24px", lineHeight: 1.6 }}>
              Please review and agree to the following before we proceed.
            </p>

            <Checkbox checked={consentBlood} onChange={() => setConsentBlood(!consentBlood)}
              label="Consent for blood collection"
              sublabel="I consent to venous blood sampling and understand the associated risks (minor bruising, discomfort at the puncture site, and in rare cases, dizziness)." />

            <Checkbox checked={consentData} onChange={() => setConsentData(!consentData)}
              label="Consent for data transfer"
              sublabel="I agree that my personal data may be shared with the assigned blood collector for the purpose of performing the blood draw." />

            <Checkbox checked={consentGdpr} onChange={() => setConsentGdpr(!consentGdpr)}
              label="GDPR data processing consent"
              sublabel="I consent to the processing of my health data in accordance with GDPR Art. 6 and Art. 9 for the purpose of organizing and performing this blood collection." />

            <button onClick={allConsented ? next : undefined} style={{
              ...pill, width: "100%", padding: "14px", border: "none",
              background: allConsented ? ruby : "#D1D5DB", color: "#fff",
              fontSize: 15, fontWeight: 600, cursor: allConsented ? "pointer" : "default",
              boxShadow: allConsented ? `0 4px 16px ${ruby}25` : "none",
              marginTop: 16, transition: "all 0.2s",
            }}>
              I agree — continue
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#D1D5DB" }}>lock</span>
              <span style={{ fontSize: 11, color: slate }}>Your consent is stored securely and can be revoked.</span>
            </div>
          </div>
        )}

        {/* ════════ STEP 2: CHOOSE YOUR COLLECTOR ════════ */}
        {step === 2 && (
          <div style={{ background: surface, borderRadius: 20, padding: "32px 24px", border: `1px solid ${borderColor}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: rubyLight, border: `1px solid ${rubyBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: ruby }}>person_search</span>
              </div>
              <h2 style={{ fontFamily: "Manrope", fontSize: 22, fontWeight: 800, letterSpacing: -0.3, margin: 0 }}>Choose Your Collector</h2>
            </div>
            <p style={{ fontSize: 14, color: slate, margin: "0 0 20px", lineHeight: 1.6 }}>
              Your healthcare provider has pre-approved these professionals. Pick the one you prefer.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {shortlistBCs.map(bc => {
                const isSelected = selectedBC === bc.id;
                return (
                  <div key={bc.id} onClick={() => setSelectedBC(bc.id)} style={{
                    padding: "18px", borderRadius: 16, cursor: "pointer",
                    border: isSelected ? `2px solid ${ruby}` : `1px solid ${borderColor}`,
                    background: isSelected ? `${ruby}03` : surface,
                    transition: "all 0.15s", position: "relative",
                  }}>
                    {bc.bestMatch && (
                      <div style={{ ...pill, position: "absolute", top: -8, right: 14, background: ruby, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", letterSpacing: 0.3 }}>
                        RECOMMENDED
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 14, alignItems: "start" }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img src={bc.photo} alt={bc.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: isSelected ? `2px solid ${ruby}` : `2px solid ${borderColor}` }} />
                        {isSelected && (
                          <div style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: "50%", background: ruby, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${surface}` }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 10, color: "#fff" }}>check</span>
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "Manrope", fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{bc.name}</div>
                        <div style={{ fontSize: 12, color: slate, marginBottom: 8 }}>{bc.qualification}</div>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#F59E0B" }}>star</span>
                            <span style={{ fontFamily: "Manrope", fontSize: 13, fontWeight: 800 }}>{bc.rating}</span>
                            <span style={{ fontSize: 11, color: slate }}>({bc.ratingCount})</span>
                          </div>
                          <span style={{ fontSize: 11, color: "#D1D5DB" }}>•</span>
                          <span style={{ fontSize: 12, color: steel, fontWeight: 600 }}>{bc.collections.toLocaleString()} draws</span>
                          <span style={{ fontSize: 11, color: "#D1D5DB" }}>•</span>
                          <span style={{ fontSize: 12, color: slate }}>{bc.distance} km away</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: `1px solid #F3F4F6` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13, color: green }}>event_available</span>
                            <span style={{ fontSize: 12, fontWeight: 500, color: green }}>{bc.nextSlot}</span>
                          </div>
                          <span style={{ fontFamily: "Manrope", fontSize: 18, fontWeight: 800, color: isSelected ? ruby : ink }}>€{bc.baseFee}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={selectedBC ? next : undefined} style={{
              ...pill, width: "100%", padding: "14px", border: "none",
              background: selectedBC ? ruby : "#D1D5DB", color: "#fff",
              fontSize: 15, fontWeight: 600, cursor: selectedBC ? "pointer" : "default",
              boxShadow: selectedBC ? `0 4px 16px ${ruby}25` : "none",
              marginTop: 20, transition: "all 0.2s",
            }}>
              Continue with {selectedBC ? shortlistBCs.find(b => b.id === selectedBC)?.name.split(" ")[0] : "..."}
            </button>
          </div>
        )}

        {/* ════════ STEP 3: APPOINTMENT ════════ */}
        {step === 3 && (
          <div style={{ background: surface, borderRadius: 20, padding: "32px 24px", border: `1px solid ${borderColor}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: rubyLight, border: `1px solid ${rubyBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: ruby }}>calendar_month</span>
              </div>
              <h2 style={{ fontFamily: "Manrope", fontSize: 22, fontWeight: 800, letterSpacing: -0.3, margin: 0 }}>Your Appointment</h2>
            </div>
            <p style={{ fontSize: 14, color: slate, margin: "0 0 24px" }}>Here are your booking details.</p>

            {/* BC Card — shows the patient's chosen collector */}
            <div style={{ background: bg, borderRadius: 16, padding: "20px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <img src={chosenBC.photo} alt={chosenBC.name}
                  style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${borderColor}` }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "Manrope" }}>{chosenBC.name}</div>
                  <div style={{ fontSize: 12, color: slate }}>{chosenBC.qualification}</div>
                  <div style={{ fontSize: 11, color: green, fontWeight: 500, marginTop: 2 }}>Your choice</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1, background: surface, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#F59E0B" }}>star</span>
                    <span style={{ fontFamily: "Manrope", fontSize: 16, fontWeight: 800 }}>{chosenBC.rating}</span>
                  </div>
                  <div style={{ fontSize: 11, color: slate }}>{chosenBC.ratingCount} reviews</div>
                </div>
                <div style={{ flex: 1, background: surface, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontFamily: "Manrope", fontSize: 16, fontWeight: 800, color: steel }}>{chosenBC.collections.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: slate }}>collections</div>
                </div>
              </div>
            </div>

            {/* Appointment details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 20 }}>
              {[
                { icon: "calendar_today", label: "Date", value: caseData.appointment.date },
                { icon: "schedule", label: "Time", value: caseData.appointment.time },
                { icon: "home", label: "Type", value: caseData.appointment.type },
                { icon: "location_on", label: "Address", value: caseData.appointment.address },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < 3 ? `1px solid #F3F4F6` : "none" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: slate }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: slate }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: ink }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Preparation */}
            <div style={{ background: "#FEF3C7", borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#92400E" }}>checklist</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#92400E" }}>Preparation Instructions</span>
              </div>
              {caseData.preparation.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "4px 0" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#FDE68A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#92400E" }}>{i + 1}</span>
                  </div>
                  <span style={{ fontSize: 13, color: "#78350F", lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div style={{ background: bg, borderRadius: 14, padding: "18px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: ink }}>Price Breakdown</div>
              {[
                { label: "Blood draw (home visit)", value: caseData.fees.baseFee },
                { label: "Travel fee (31.5 km)", value: caseData.fees.travelFee },
                ...(caseData.fees.materials > 0 ? [{ label: "Materials", value: caseData.fees.materials }] : []),
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                  <span style={{ fontSize: 13, color: slate }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "Manrope" }}>€{row.value.toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${borderColor}`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: slate }}>VAT (19%)</span>
                <span style={{ fontSize: 13, fontFamily: "Manrope" }}>€{caseData.fees.vat.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${borderColor}` }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "Manrope", color: ruby }}>€{caseData.fees.total.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={next} style={{
              ...pill, width: "100%", padding: "14px", border: "none", background: ruby, color: "#fff",
              fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 16px ${ruby}25`, marginTop: 20, transition: "all 0.2s",
            }}>
              Proceed to Payment
            </button>
          </div>
        )}

        {/* ════════ STEP 4: PAYMENT ════════ */}
        {step === 4 && (
          <div style={{ background: surface, borderRadius: 20, padding: "32px 24px", border: `1px solid ${borderColor}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: rubyLight, border: `1px solid ${rubyBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: ruby }}>payment</span>
              </div>
              <h2 style={{ fontFamily: "Manrope", fontSize: 22, fontWeight: 800, letterSpacing: -0.3, margin: 0 }}>Payment</h2>
            </div>
            <p style={{ fontSize: 14, color: slate, margin: "0 0 24px" }}>Your payment is held securely until the appointment is completed.</p>

            {/* Total */}
            <div style={{ textAlign: "center", padding: "24px", background: bg, borderRadius: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: slate, marginBottom: 4 }}>Amount due</div>
              <div style={{ fontFamily: "Manrope", fontSize: 40, fontWeight: 800, color: ruby }}>€{caseData.fees.total.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: slate }}>Including 19% VAT</div>
            </div>

            {/* Payment methods */}
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Payment Method</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {[
                { val: "card", label: "Credit / Debit Card", icon: "credit_card", sub: "Visa, Mastercard, Amex" },
                { val: "sepa", label: "SEPA Direct Debit", icon: "account_balance", sub: "German bank account" },
                { val: "paypal", label: "PayPal", icon: "account_balance_wallet", sub: "Pay with your PayPal account" },
              ].map(m => (
                <div key={m.val} onClick={() => setPaymentMethod(m.val)} style={{
                  padding: "16px 18px", borderRadius: 14, cursor: "pointer",
                  border: paymentMethod === m.val ? `2px solid ${ruby}` : `1px solid ${borderColor}`,
                  background: paymentMethod === m.val ? `${ruby}03` : surface,
                  display: "flex", alignItems: "center", gap: 14, transition: "all 0.15s",
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: paymentMethod === m.val ? `${ruby}10` : bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: paymentMethod === m.val ? ruby : slate }}>{m.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: paymentMethod === m.val ? ruby : ink }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: slate }}>{m.sub}</div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: paymentMethod === m.val ? `6px solid ${ruby}` : `2px solid #D1D5DB`,
                    transition: "all 0.15s",
                  }} />
                </div>
              ))}
            </div>

            {/* Card fields (shown if card selected) */}
            {paymentMethod === "card" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Card Number</div>
                  <input placeholder="1234 5678 9012 3456" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${borderColor}`, fontSize: 14, outline: "none", boxSizing: "border-box", letterSpacing: 1 }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Expiry</div>
                    <input placeholder="MM/YY" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${borderColor}`, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>CVC</div>
                    <input placeholder="123" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${borderColor}`, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
              </div>
            )}

            <button onClick={paymentMethod ? next : undefined} style={{
              ...pill, width: "100%", padding: "14px", border: "none",
              background: paymentMethod ? ruby : "#D1D5DB", color: "#fff",
              fontSize: 15, fontWeight: 600, cursor: paymentMethod ? "pointer" : "default",
              boxShadow: paymentMethod ? `0 4px 16px ${ruby}25` : "none", transition: "all 0.2s",
            }}>
              Pay €{caseData.fees.total.toFixed(2)}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#D1D5DB" }}>lock</span>
              <span style={{ fontSize: 11, color: slate }}>Payments are encrypted and held in escrow until completion.</span>
            </div>
          </div>
        )}

        {/* ════════ STEP 5: RATING (post-appointment) ════════ */}
        {step === 5 && !submitted && (
          <div style={{ background: surface, borderRadius: 20, padding: "32px 24px", border: `1px solid ${borderColor}` }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 16px", overflow: "hidden", border: `3px solid ${borderColor}` }}>
                <img src={caseData.bc.photo} alt={caseData.bc.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <h2 style={{ fontFamily: "Manrope", fontSize: 22, fontWeight: 800, letterSpacing: -0.3, margin: "0 0 4px" }}>How was your experience?</h2>
              <p style={{ fontSize: 14, color: slate, margin: 0 }}>Rate your blood collection with {caseData.bc.name}.</p>
            </div>

            {/* Stars */}
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} filled={n <= (hoverRating || rating)} onClick={() => setRating(n)} onHover={() => setHoverRating(n)} />
              ))}
            </div>
            {rating > 0 && (
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <span style={{ ...pill, background: rating >= 4 ? `${green}12` : rating >= 3 ? "#FEF3C7" : "#FEE2E2", color: rating >= 4 ? green : rating >= 3 ? "#92400E" : "#991B1B", fontSize: 13, fontWeight: 600, padding: "4px 16px" }}>
                  {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                </span>
              </div>
            )}

            {/* Review text */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Share your feedback (optional)</div>
              <textarea
                value={reviewText} onChange={e => setReviewText(e.target.value)}
                placeholder="Tell us about your experience — was the collector punctual, professional, and gentle?"
                rows={4}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${borderColor}`,
                  fontSize: 14, color: ink, outline: "none", resize: "vertical", fontFamily: "Inter, sans-serif",
                  boxSizing: "border-box", lineHeight: 1.6,
                }}
                onFocus={e => e.target.style.border = `2px solid ${ruby}`}
                onBlur={e => e.target.style.border = `1px solid ${borderColor}`}
              />
            </div>

            <button onClick={() => rating > 0 && setSubmitted(true)} style={{
              ...pill, width: "100%", padding: "14px", border: "none",
              background: rating > 0 ? ruby : "#D1D5DB", color: "#fff",
              fontSize: 15, fontWeight: 600, cursor: rating > 0 ? "pointer" : "default",
              boxShadow: rating > 0 ? `0 4px 16px ${ruby}25` : "none", transition: "all 0.2s",
            }}>
              Submit Rating
            </button>

            <button style={{ width: "100%", padding: "12px", border: "none", background: "transparent", fontSize: 13, color: slate, cursor: "pointer", marginTop: 8 }}>
              Skip for now
            </button>
          </div>
        )}

        {/* ════════ SUBMITTED CONFIRMATION ════════ */}
        {step === 5 && submitted && (
          <div style={{ background: surface, borderRadius: 20, padding: "48px 28px", border: `1px solid ${borderColor}`, textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${green}12`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: green }}>check_circle</span>
            </div>
            <h2 style={{ fontFamily: "Manrope", fontSize: 26, fontWeight: 800, letterSpacing: -0.5, margin: "0 0 8px" }}>Thank you!</h2>
            <p style={{ fontSize: 15, color: slate, lineHeight: 1.7, margin: "0 0 32px" }}>
              Your rating has been submitted. {caseData.bc.name} appreciates your feedback.
              Your blood sample is being processed — your healthcare provider will receive the results.
            </p>

            <div style={{ background: bg, borderRadius: 14, padding: "20px", textAlign: "left", marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: slate, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Your receipt</div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ fontSize: 13, color: slate }}>Amount paid</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "Manrope" }}>€{caseData.fees.total.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ fontSize: 13, color: slate }}>Date</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{caseData.appointment.date}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ fontSize: 13, color: slate }}>Collector</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{caseData.bc.name}</span>
              </div>
            </div>

            <button style={{
              ...pill, width: "100%", padding: "12px", border: `1px solid ${borderColor}`,
              background: "transparent", fontSize: 14, fontWeight: 500, color: ink, cursor: "pointer",
            }}>
              Download Receipt (PDF)
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "24px 0", fontSize: 11, color: "#C0C5CE" }}>
          © 2026 Blutabnahme.de · <a href="#" style={{ color: "#C0C5CE" }}>Datenschutz</a> · <a href="#" style={{ color: "#C0C5CE" }}>Impressum</a>
        </div>
      </div>
    </div>
  );
}
