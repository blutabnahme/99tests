import { useState } from "react";

const options = [
  {
    name: "Sage & Warmth",
    subtitle: "Earthy, calming, nature-inspired healthcare",
    description:
      "Draws from natural tones — soft sage greens and warm terracotta — to feel grounded and human. This direction avoids the typical clinical blue and instead communicates care, approachability, and trust through organic warmth. Think of a modern family practice, not a hospital.",
    colors: {
      primary: "#5B8C6F",
      primaryName: "Sage Green",
      secondary: "#C0785C",
      secondaryName: "Warm Terracotta",
      accent: "#E8B84B",
      accentName: "Honey Gold",
      bg: "#FAF7F2",
      bgName: "Warm Cream",
      surface: "#FFFFFF",
      surfaceName: "White",
      text: "#2D3A2E",
      textName: "Forest Dark",
      textLight: "#6B7B6E",
      textLightName: "Muted Sage",
    },
    fonts: {
      heading: "'DM Serif Display', serif",
      headingName: "DM Serif Display",
      headingNote: "Warm serif with character — approachable yet authoritative",
      body: "'Plus Jakarta Sans', sans-serif",
      bodyName: "Plus Jakarta Sans",
      bodyNote: "Friendly geometric sans-serif — modern and highly readable",
    },
    buttonRadius: "12px",
    cardRadius: "16px",
    mood: "Warm, organic, trustworthy, grounded",
    bestFor: "Patients and healthcare providers who value a personal, human touch",
  },
  {
    name: "Ocean Calm",
    subtitle: "Soft blue, modern, reassuringly professional",
    description:
      "A refined take on healthcare blue that avoids feeling sterile. Soft teals and warm neutrals create a sense of calm competence. The rounded forms and gentle gradients make the platform feel approachable while maintaining the trust signals people expect from medical services.",
    colors: {
      primary: "#3B8EA5",
      primaryName: "Soft Teal",
      secondary: "#F56A79",
      secondaryName: "Coral Pink",
      accent: "#5CC8A7",
      accentName: "Mint",
      bg: "#F5F8FA",
      bgName: "Ice Blue",
      surface: "#FFFFFF",
      surfaceName: "White",
      text: "#1E3A4F",
      textName: "Deep Navy",
      textLight: "#7A95A8",
      textLightName: "Muted Blue",
    },
    fonts: {
      heading: "'Outfit', sans-serif",
      headingName: "Outfit",
      headingNote: "Rounded geometric — feels modern, friendly, and confident",
      body: "'Source Sans 3', sans-serif",
      bodyName: "Source Sans 3",
      bodyNote: "Clean and open — excellent readability across all sizes",
    },
    buttonRadius: "24px",
    cardRadius: "20px",
    mood: "Calm, professional, modern, reassuring",
    bestFor: "B2B-focused users (labs, health-tech) who want modern and credible",
  },
  {
    name: "Sunrise Care",
    subtitle: "Vibrant, optimistic, human-centered warmth",
    description:
      "The boldest option — uses warm corals, soft purples, and sunlit yellows to feel energetic and deeply human. This direction stands out from every other medical platform and signals that Blutabnahme.de is different: it's built around people, not procedures. Best for a brand that wants to be memorable.",
    colors: {
      primary: "#D16B55",
      primaryName: "Warm Coral",
      secondary: "#7B6AA0",
      secondaryName: "Soft Lavender",
      accent: "#F2B63C",
      accentName: "Sunlit Gold",
      bg: "#FDF8F4",
      bgName: "Warm Linen",
      surface: "#FFFFFF",
      surfaceName: "White",
      text: "#3A2F3D",
      textName: "Plum Dark",
      textLight: "#8E8294",
      textLightName: "Dusty Mauve",
    },
    fonts: {
      heading: "'Fraunces', serif",
      headingName: "Fraunces",
      headingNote: "Expressive variable serif — warm, distinctive, memorable",
      body: "'Nunito', sans-serif",
      bodyName: "Nunito",
      bodyNote: "Soft rounded sans-serif — inviting, friendly, easy to read",
    },
    buttonRadius: "16px",
    cardRadius: "20px",
    mood: "Optimistic, human, energetic, distinctive",
    bestFor: "Standing out from clinical competitors; patient-facing brand recognition",
  },
];

function ColorSwatch({ color, name, size = "large" }) {
  const isLarge = size === "large";
  return (
    <div className="flex items-center gap-2">
      <div
        style={{
          backgroundColor: color,
          width: isLarge ? 48 : 32,
          height: isLarge ? 48 : 32,
          borderRadius: 10,
          border: color === "#FFFFFF" ? "1.5px solid #E0E0E0" : "none",
          flexShrink: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      />
      <div>
        <div style={{ fontSize: isLarge ? 13 : 12, fontWeight: 600, color: "#333" }}>
          {name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#999",
            fontFamily: "monospace",
            letterSpacing: 0.3,
          }}
        >
          {color}
        </div>
      </div>
    </div>
  );
}

function MiniCard({ opt }) {
  return (
    <div
      style={{
        backgroundColor: opt.colors.surface,
        borderRadius: opt.cardRadius,
        padding: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: `1px solid ${opt.colors.bg}`,
      }}
    >
      <div
        style={{
          fontFamily: opt.fonts.heading,
          fontSize: 18,
          fontWeight: 700,
          color: opt.colors.text,
          marginBottom: 6,
        }}
      >
        Find a Blood Collector
      </div>
      <div
        style={{
          fontFamily: opt.fonts.body,
          fontSize: 13,
          color: opt.colors.textLight,
          marginBottom: 16,
          lineHeight: 1.5,
        }}
      >
        Connect with verified phlebotomists near your patient for reliable, convenient blood
        sampling.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div
          style={{
            backgroundColor: opt.colors.primary,
            color: "#fff",
            fontFamily: opt.fonts.body,
            fontSize: 13,
            fontWeight: 600,
            padding: "10px 20px",
            borderRadius: opt.buttonRadius,
            cursor: "pointer",
          }}
        >
          Create New Case
        </div>
        <div
          style={{
            backgroundColor: "transparent",
            color: opt.colors.primary,
            fontFamily: opt.fonts.body,
            fontSize: 13,
            fontWeight: 600,
            padding: "10px 20px",
            borderRadius: opt.buttonRadius,
            border: `1.5px solid ${opt.colors.primary}`,
            cursor: "pointer",
          }}
        >
          View Dashboard
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ opt, label, value }) {
  return (
    <div
      style={{
        backgroundColor: opt.colors.bg,
        borderRadius: 12,
        padding: "12px 16px",
        flex: 1,
      }}
    >
      <div
        style={{
          fontFamily: opt.fonts.heading,
          fontSize: 22,
          fontWeight: 700,
          color: opt.colors.primary,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: opt.fonts.body,
          fontSize: 11,
          color: opt.colors.textLight,
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function OptionPanel({ opt, index, selected, onSelect }) {
  const isSelected = selected === index;
  return (
    <div
      onClick={() => onSelect(index)}
      style={{
        border: isSelected ? `3px solid ${opt.colors.primary}` : "2px solid #E8E8E8",
        borderRadius: 20,
        padding: 28,
        cursor: "pointer",
        backgroundColor: "#fff",
        transition: "all 0.25s ease",
        boxShadow: isSelected
          ? `0 4px 24px ${opt.colors.primary}22`
          : "0 1px 4px rgba(0,0,0,0.04)",
        position: "relative",
      }}
    >
      {isSelected && (
        <div
          style={{
            position: "absolute",
            top: -12,
            right: 16,
            backgroundColor: opt.colors.primary,
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 14px",
            borderRadius: 20,
            letterSpacing: 0.5,
          }}
        >
          SELECTED
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: opt.colors.primary,
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}
        >
          Option {index + 1}
        </span>
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "#1a1a1a",
          marginBottom: 2,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {opt.name}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#888",
          marginBottom: 16,
          fontStyle: "italic",
        }}
      >
        {opt.subtitle}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#555",
          lineHeight: 1.65,
          marginBottom: 24,
        }}
      >
        {opt.description}
      </div>

      {/* Color Palette */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#aaa",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 12,
          }}
        >
          Color Palette
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <ColorSwatch color={opt.colors.primary} name={opt.colors.primaryName} />
          <ColorSwatch color={opt.colors.secondary} name={opt.colors.secondaryName} />
          <ColorSwatch color={opt.colors.accent} name={opt.colors.accentName} />
          <ColorSwatch color={opt.colors.bg} name={opt.colors.bgName} />
          <ColorSwatch color={opt.colors.text} name={opt.colors.textName} size="small" />
          <ColorSwatch
            color={opt.colors.textLight}
            name={opt.colors.textLightName}
            size="small"
          />
        </div>
      </div>

      {/* Typography */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#aaa",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 12,
          }}
        >
          Typography
        </div>
        <div
          style={{
            backgroundColor: "#FAFAFA",
            borderRadius: 12,
            padding: 16,
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 4 }}>
            Headings: {opt.fonts.headingName}
          </div>
          <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>
            {opt.fonts.headingNote}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 4 }}>
            Body: {opt.fonts.bodyName}
          </div>
          <div style={{ fontSize: 11, color: "#999" }}>{opt.fonts.bodyNote}</div>
        </div>
      </div>

      {/* UI Preview */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#aaa",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 12,
          }}
        >
          UI Preview
        </div>
        <div
          style={{
            backgroundColor: opt.colors.bg,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <MiniMetric opt={opt} label="Active Cases" value="24" />
            <MiniMetric opt={opt} label="This Month" value="87" />
          </div>
          <MiniCard opt={opt} />
        </div>
      </div>

      {/* Mood & Fit */}
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#aaa",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              marginBottom: 6,
            }}
          >
            Mood
          </div>
          <div style={{ fontSize: 13, color: "#555" }}>{opt.mood}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#aaa",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              marginBottom: 6,
            }}
          >
            Best For
          </div>
          <div style={{ fontSize: 13, color: "#555" }}>{opt.bestFor}</div>
        </div>
      </div>
    </div>
  );
}

export default function StyleExplorer() {
  const [selected, setSelected] = useState(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F4F3F1",
        padding: "40px 24px",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600&family=Fraunces:wght@400;500;700&family=Nunito:wght@400;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#bbb",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            Blutabnahme.de
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#1a1a1a",
              marginBottom: 8,
            }}
          >
            Visual Direction
          </div>
          <div style={{ fontSize: 15, color: "#888", lineHeight: 1.6 }}>
            Three warm, accessible design directions for your platform.
            <br />
            Tap any option to select it.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {options.map((opt, i) => (
            <OptionPanel
              key={i}
              opt={opt}
              index={i}
              selected={selected}
              onSelect={setSelected}
            />
          ))}
        </div>

        {selected !== null && (
          <div
            style={{
              marginTop: 32,
              padding: 24,
              backgroundColor: "#fff",
              borderRadius: 16,
              border: `2px solid ${options[selected].colors.primary}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
              You selected: {options[selected].name}
            </div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
              Share this choice with your partner and let me know — I'll generate
              a complete Stitch-ready style brief and update all the design prompts
              in your PRD to use these exact colors and fonts.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
