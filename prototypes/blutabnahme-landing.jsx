import { useState, useEffect, useRef } from "react";

// ─── Intersection Observer hook for scroll reveals ───
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal(0.12);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Styles ───
const ruby = "#BE1E2D";
const rubyDark = "#A51A26";
const steel = "#2D4A6F";
const ink = "#1A1A2E";
const slate = "#6B7280";
const bg = "#FAFAFA";
const warmBg = "#F9F6F4";

const pill = { borderRadius: 9999 };

export default function BlutabnahmeLanding() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: ink, background: "#fff", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300&display=swap" rel="stylesheet" />

      {/* ════════ NAVBAR ════════ */}
      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid #f0f0f0" : "1px solid transparent",
          transition: "all 0.4s ease",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px", height: 80, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: ruby, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: 18 }}>bloodtype</span>
            </div>
            <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>
              Blutabnahme<span style={{ color: ruby }}>.de</span>
            </span>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 40 }}>
            {["Services", "For Professionals", "About", "FAQ"].map(item => (
              <a key={item} href="#" style={{ fontSize: 14, fontWeight: 500, color: slate, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = ink} onMouseLeave={e => e.target.style.color = slate}>
                {item}
              </a>
            ))}
            <button style={{ ...pill, background: ruby, color: "#fff", border: "none", padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={e => e.target.style.background = rubyDark} onMouseLeave={e => e.target.style.background = ruby}>
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* ════════ HERO ════════ */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "120px 48px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", width: "100%" }}>
          <Reveal>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${ruby}0A`, border: `1px solid ${ruby}20`, ...pill, padding: "6px 16px", marginBottom: 32 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ruby }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: ruby, letterSpacing: 1, textTransform: "uppercase" }}>Nationwide Coverage</span>
              </div>
              <h1 style={{ fontFamily: "Manrope", fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -3, margin: "0 0 24px" }}>
                Blood{" "}
                <span style={{ display: "block" }}>collection,</span>
                <span style={{ color: ruby, fontStyle: "italic", fontWeight: 600 }}>organized.</span>
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.7, color: slate, maxWidth: 460, margin: "0 0 40px" }}>
                We connect healthcare companies with qualified phlebotomists across Germany. Professional, compliant, and built for modern diagnostics.
              </p>
              <div style={{ display: "flex", gap: 16 }}>
                <button style={{ ...pill, background: ruby, color: "#fff", border: "none", padding: "16px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: `0 8px 32px ${ruby}30`, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.target.style.background = rubyDark; e.target.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.target.style.background = ruby; e.target.style.transform = "translateY(0)"; }}>
                  For Healthcare Companies
                </button>
                <button style={{ ...pill, background: "transparent", color: ink, border: `2px solid #E5E7EB`, padding: "16px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.target.style.borderColor = ruby; e.target.style.color = ruby; }}
                  onMouseLeave={e => { e.target.style.borderColor = "#E5E7EB"; e.target.style.color = ink; }}>
                  For Blood Collectors
                </button>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: "100%", aspectRatio: "4/5", borderRadius: 20, overflow: "hidden",
                background: `linear-gradient(135deg, ${warmBg} 0%, #f0e8e4 100%)`,
                boxShadow: "0 32px 64px rgba(0,0,0,0.08)",
              }}>
                <img
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=1000&fit=crop&crop=faces"
                  alt="Healthcare professional"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              {/* Floating stat card */}
              <div style={{
                position: "absolute", bottom: 32, left: -40,
                background: "#fff", borderRadius: 16, padding: "20px 24px",
                boxShadow: "0 16px 48px rgba(0,0,0,0.12)", minWidth: 200,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: slate, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Verified Professionals</div>
                <div style={{ fontFamily: "Manrope", fontSize: 36, fontWeight: 800, color: ink }}>2,400+</div>
                <div style={{ fontSize: 13, color: slate, marginTop: 2 }}>across Germany</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════ TRUST STRIP ════════ */}
      <Reveal>
        <section style={{ borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0", background: bg }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 48px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
            {[
              { icon: "verified_user", label: "Verified Professionals", sub: "Every collector credentialed" },
              { icon: "lock", label: "Secure Payments", sub: "Escrow-protected transactions" },
              { icon: "shield", label: "GDPR Compliant", sub: "German-hosted infrastructure" },
              { icon: "location_on", label: "Nationwide", sub: "Coverage across Germany" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${ruby}08`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: ruby, fontSize: 20 }}>{item.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: ink }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: slate, marginTop: 2 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ════════ EDITORIAL SECTION 1 ════════ */}
      <section style={{ padding: "120px 0", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 80, alignItems: "center" }}>
          <Reveal>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: ruby, letterSpacing: 2, textTransform: "uppercase" }}>For Healthcare Companies</span>
              <h2 style={{ fontFamily: "Manrope", fontSize: 44, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1.5, margin: "16px 0 20px" }}>
                Outsource the logistics. Keep the control.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: slate, marginBottom: 32 }}>
                Upload patient cases, get matched with verified phlebotomists nearby, and track everything from booking to lab delivery. We handle the complexity so your team can focus on diagnostics.
              </p>
              <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: ruby, fontWeight: 600, fontSize: 15, textDecoration: "none" }}
                onMouseEnter={e => e.target.style.gap = "12px"} onMouseLeave={e => e.target.style.gap = "8px"}>
                Explore our platform
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.06)" }}>
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&h=600&fit=crop"
                alt="Medical professional preparing blood sample"
                style={{ width: "100%", height: 480, objectFit: "cover", display: "block" }}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════ EDITORIAL SECTION 2 (reversed) ════════ */}
      <section style={{ padding: "120px 0", background: warmBg }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 80, alignItems: "center" }}>
          <Reveal>
            <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.06)" }}>
              <img
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=900&h=600&fit=crop"
                alt="Blood collector with patient at home"
                style={{ width: "100%", height: 480, objectFit: "cover", display: "block" }}
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: ruby, letterSpacing: 2, textTransform: "uppercase" }}>For Blood Collectors</span>
              <h2 style={{ fontFamily: "Manrope", fontSize: 44, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1.5, margin: "16px 0 20px" }}>
                Set your schedule. Build your reputation.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: slate, marginBottom: 32 }}>
                Join a growing network of qualified phlebotomists earning flexibly. Set your own rates, choose between practice and home visits, and let the platform handle bookings, payments, and logistics.
              </p>
              <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: ruby, fontWeight: 600, fontSize: 15, textDecoration: "none" }}>
                Join the network
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section style={{ padding: "120px 0", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 72px" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: ruby, letterSpacing: 2, textTransform: "uppercase" }}>How It Works</span>
              <h2 style={{ fontFamily: "Manrope", fontSize: 44, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1.5, margin: "16px 0 0" }}>
                Three steps to organized blood collection
              </h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
            {[
              { num: "01", title: "Upload your case", desc: "Healthcare companies submit patient details, test requirements, and preferred schedule through the platform.", icon: "upload_file" },
              { num: "02", title: "Get matched", desc: "Our algorithm finds the best qualified blood collector nearby based on availability, experience, and proximity.", icon: "handshake" },
              { num: "03", title: "Track to completion", desc: "From appointment booking through sample delivery to the lab — full visibility at every step.", icon: "monitoring" },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div style={{ padding: "40px 36px", background: bg, borderRadius: 20, border: "1px solid #f0f0f0", height: "100%", transition: "box-shadow 0.3s, transform 0.3s", cursor: "default" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <span style={{ fontFamily: "Manrope", fontSize: 48, fontWeight: 800, color: `${ruby}15` }}>{step.num}</span>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${ruby}0A`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="material-symbols-outlined" style={{ color: ruby, fontSize: 22 }}>{step.icon}</span>
                    </div>
                  </div>
                  <h3 style={{ fontFamily: "Manrope", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{step.title}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: slate }}>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ STATS BAR ════════ */}
      <Reveal>
        <section style={{ background: ink, padding: "64px 0" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40, textAlign: "center" }}>
            {[
              { val: "2,400+", label: "Verified Professionals" },
              { val: "15,000+", label: "Collections Completed" },
              { val: "98.5%", label: "Success Rate" },
              { val: "250+", label: "Partner Companies" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: "Manrope", fontSize: 40, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{s.val}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ════════ TESTIMONIAL ════════ */}
      <section style={{ padding: "120px 0", background: "#fff" }}>
        <Reveal>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 48px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: `${ruby}0A`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
              <span className="material-symbols-outlined" style={{ color: ruby, fontSize: 28 }}>format_quote</span>
            </div>
            <blockquote style={{ fontFamily: "Manrope", fontSize: 28, fontWeight: 600, lineHeight: 1.5, letterSpacing: -0.5, margin: "0 0 32px" }}>
              Blutabnahme.de has transformed how we handle decentralized blood collection. The reliability and professional standards are unmatched.
            </blockquote>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: warmBg, overflow: "hidden" }}>
                <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=faces" alt="Dr. Schmidt" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Dr. Thomas Mueller</div>
                <div style={{ fontSize: 13, color: slate }}>Medical Director, Berlin Diagnostics</div>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div style={{ maxWidth: 1280, margin: "64px auto 0", padding: "0 48px" }}>
            <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 48, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#bbb", letterSpacing: 2, textTransform: "uppercase", marginBottom: 32 }}>Trusted by leading healthcare providers</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 48, alignItems: "center", opacity: 0.3 }}>
                {["aeon.life", "aware.app", "evi.plus", "nu-dx.com", "zotzklimas.de"].map((name, i) => (
                  <div key={i} style={{ fontFamily: "Manrope", fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>{name}</div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ════════ CTA SECTION ════════ */}
      <Reveal>
        <section style={{ padding: "0 48px 120px" }}>
          <div style={{
            maxWidth: 1280, margin: "0 auto", borderRadius: 24,
            background: `linear-gradient(135deg, ${ink} 0%, #2a2040 100%)`,
            padding: "80px 64px", display: "grid", gridTemplateColumns: "1fr auto", gap: 48, alignItems: "center",
          }}>
            <div>
              <h2 style={{ fontFamily: "Manrope", fontSize: 40, fontWeight: 800, color: "#fff", lineHeight: 1.2, letterSpacing: -1.5, marginBottom: 16 }}>
                Ready to streamline blood collection?
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: 480 }}>
                Join the platform trusted by healthcare companies and blood collectors across Germany. Get started in minutes.
              </p>
            </div>
            <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
              <button style={{ ...pill, background: ruby, color: "#fff", border: "none", padding: "16px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: `0 8px 32px rgba(0,0,0,0.3)`, transition: "all 0.2s" }}
                onMouseEnter={e => { e.target.style.background = "#D42535"; e.target.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.target.style.background = ruby; e.target.style.transform = "translateY(0)"; }}>
                Register Now
              </button>
              <button style={{ ...pill, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", padding: "16px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.15)"}
                onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.1)"}>
                Learn More
              </button>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ════════ FOOTER ════════ */}
      <footer style={{ background: ink, color: "rgba(255,255,255,0.95)", padding: "80px 0 48px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 48, marginBottom: 64 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 28, height: 28, background: ruby, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: 16 }}>bloodtype</span>
                </div>
                <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 17 }}>Blutabnahme.de</span>
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 280 }}>
                Professional blood collection logistics for healthcare companies across Germany. Quality, compliance, reliability.
              </p>
            </div>
            {[
              { title: "Platform", links: ["For Companies", "For Collectors", "Pricing", "How It Works"] },
              { title: "Company", links: ["About Us", "Careers", "Press", "Contact"] },
              { title: "Legal", links: ["Impressum", "Datenschutz", "AGB", "Cookie Policy"] },
            ].map((col, i) => (
              <div key={i}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, letterSpacing: 0.5 }}>{col.title}</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.8)"}
                        onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.4)"}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>&copy; 2026 Blutabnahme.de. All rights reserved.</span>
            <div style={{ display: "flex", gap: 24 }}>
              {["LinkedIn", "Twitter"].map(s => (
                <a key={s} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.7)"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}>
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
