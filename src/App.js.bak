import { useState } from "react";
import NGODashboard from "./NGODashboard";
import VolunteerApp from "./VolunteerApp";

// Simple portal selector — no react-router needed
// Rishikesh: add CitizenForm import here when ready

const PORTALS = [
  {
    id: "citizen",
    label: "Citizen",
    icon: "📢",
    desc: "Report a problem in your area",
    color: "#8b5cf6",
  },
  {
    id: "ngo",
    label: "NGO Dashboard",
    icon: "🗺️",
    desc: "Command center for NGO leaders",
    color: "#1b9aaa",
  },
  {
    id: "volunteer",
    label: "Volunteer",
    icon: "🤝",
    desc: "Accept and complete field tasks",
    color: "#22c55e",
  },
];

function PortalSelector({ onSelect }) {
  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <span style={styles.dot} />
          <h1 style={styles.title}>UnityFlow</h1>
        </div>
        <p style={styles.sub}>NGO Volunteer Coordination Platform</p>
        <p style={styles.hint}>Select your portal to continue</p>
        <div style={styles.portalList}>
          {PORTALS.map((p) => (
            <button
              key={p.id}
              style={{ ...styles.portalBtn, borderColor: p.color }}
              onClick={() => onSelect(p.id)}
            >
              <span style={styles.portalIcon}>{p.icon}</span>
              <div>
                <div style={{ ...styles.portalLabel, color: p.color }}>{p.label}</div>
                <div style={styles.portalDesc}>{p.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [portal, setPortal] = useState(null);

  if (portal === "ngo")       return <NGODashboard onBack={() => setPortal(null)} />;
  if (portal === "volunteer") return <VolunteerApp onBack={() => setPortal(null)} />;

  // Citizen portal — Rishikesh connects CitizenForm here
  if (portal === "citizen") {
    return (
      <div style={styles.root}>
        <div style={styles.card}>
          <p style={{ color: "#8b9eb0", marginBottom: 16 }}>
            Citizen form — Rishikesh connects this screen here.
          </p>
          <button style={styles.backBtn} onClick={() => setPortal(null)}>← Back</button>
        </div>
      </div>
    );
  }

  return <PortalSelector onSelect={setPortal} />;
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0d1b2a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    background: "#162535",
    borderRadius: 16,
    padding: "32px 24px",
    width: "100%",
    maxWidth: 400,
    border: "1px solid #1e3a52",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    marginBottom: 4,
  },
  dot: {
    width: 10,
    height: 10,
    background: "#1b9aaa",
    borderRadius: "50%",
    display: "inline-block",
  },
  title: { color: "#fff", fontSize: 22, fontWeight: 700 },
  sub: {
    color: "#1b9aaa",
    fontSize: 11,
    fontWeight: 600,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 24,
  },
  hint: { color: "#8b9eb0", fontSize: 13, textAlign: "center", marginBottom: 16 },
  portalList: { display: "flex", flexDirection: "column", gap: 10 },
  portalBtn: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 16px",
    background: "#1e3a52",
    border: "1.5px solid",
    borderRadius: 10,
    cursor: "pointer",
    textAlign: "left",
    transition: "opacity 0.15s",
  },
  portalIcon: { fontSize: 24 },
  portalLabel: { fontWeight: 700, fontSize: 14, marginBottom: 2 },
  portalDesc: { color: "#8b9eb0", fontSize: 12 },
  backBtn: {
    padding: "10px 20px",
    background: "#1b9aaa",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
  },
};
