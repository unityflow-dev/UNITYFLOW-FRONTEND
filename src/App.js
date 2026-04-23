import { useState, useEffect, useRef, useCallback } from "react";

const API = "https://unityflow-backend-71bj.onrender.com/api";
const SECTORS = ["Flood Relief", "Healthcare", "Food and Hunger", "Education", "Women Safety"];
const SECTOR_ICONS = { "Flood Relief": "🌊", Healthcare: "🏥", "Food and Hunger": "🍱", Education: "📚", "Women Safety": "🛡️" };
const URGENCY_LABELS = ["", "Minimal", "Low", "Medium", "High", "Critical"];
const URGENCY_COLORS = ["", "#4CAF50", "#8BC34A", "#FF9800", "#FF5722", "#E53935"];
const STATUS_COLORS = { open: "#E53935", assigned: "#FF9800", completed: "#4CAF50" };
const NGO_LEADERS = [
  { id: "ngo1", name: "Rajesh Kumar", sector: "Flood Relief", darpan: "KA/2019/0234521", ngoName: "Bengaluru Flood Relief Trust" },
  { id: "ngo2", name: "Dr. Meena Pillai", sector: "Healthcare", darpan: "KA/2020/0198432", ngoName: "City Health Volunteers" },
  { id: "ngo3", name: "Suresh Babu", sector: "Food and Hunger", darpan: "KA/2018/0312876", ngoName: "Namma Food Bank" },
  { id: "ngo4", name: "Prof. Latha Sharma", sector: "Education", darpan: "KA/2017/0456123", ngoName: "Vidya Shakti Foundation" },
  { id: "ngo5", name: "Anita Rao", sector: "Women Safety", darpan: "KA/2021/0567890", ngoName: "Suraksha Women Network" },
];

function getInitials(name) { return (name || "V").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return "Just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
    @keyframes sosPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.07);opacity:0.6} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes popIn { from{transform:scale(0)} to{transform:scale(1)} }
    @keyframes trackPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,152,0,0.4)} 50%{box-shadow:0 0 0 8px rgba(255,152,0,0)} }
    .leaflet-container { z-index:1; }
  `}</style>
);

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ setPortal }) {
  const [hovered, setHovered] = useState(null);
  const portals = [
    { key: "citizen", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/></svg>, title: "Citizen", subtitle: "Report an emergency in your area", color: "#E53935", light: "#FFEBEE" },
    { key: "ngo", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2"/></svg>, title: "NGO Dashboard", subtitle: "Manage tasks and deploy volunteers", color: "#1565C0", light: "#E3F2FD" },
    { key: "volunteer", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>, title: "Volunteer", subtitle: "Register, get approved and take action", color: "#2E7D32", light: "#E8F5E9" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#fff 60%,#FFEBEE 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -120, right: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(229,57,53,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(229,57,53,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(145deg,#E53935,#B71C1C)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 32px rgba(229,57,53,0.3)" }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="6" fill="white" opacity="0.9"/><circle cx="6" cy="10" r="4" fill="white" opacity="0.6"/><circle cx="26" cy="10" r="4" fill="white" opacity="0.6"/><circle cx="6" cy="22" r="4" fill="white" opacity="0.6"/><circle cx="26" cy="22" r="4" fill="white" opacity="0.6"/><line x1="16" y1="16" x2="6" y2="10" stroke="white" strokeWidth="1.5" opacity="0.5"/><line x1="16" y1="16" x2="26" y2="10" stroke="white" strokeWidth="1.5" opacity="0.5"/><line x1="16" y1="16" x2="6" y2="22" stroke="white" strokeWidth="1.5" opacity="0.5"/><line x1="16" y1="16" x2="26" y2="22" stroke="white" strokeWidth="1.5" opacity="0.5"/></svg>
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1A1A2E", letterSpacing: -1, margin: 0 }}>UnityFlow</h1>
        <p style={{ fontSize: 13, color: "#E53935", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginTop: 6 }}>NGO Volunteer Coordination</p>
        <p style={{ fontSize: 14, color: "#9E9E9E", marginTop: 10, maxWidth: 300, lineHeight: 1.6 }}>Connecting citizens, NGOs and volunteers — when every second counts.</p>
      </div>
      <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 14 }}>
        {portals.map(p => (
          <button key={p.key} onClick={() => setPortal(p.key)} onMouseEnter={() => setHovered(p.key)} onMouseLeave={() => setHovered(null)}
            style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 22px", background: hovered === p.key ? p.light : "#fff", border: `2px solid ${hovered === p.key ? p.color : "#F0F0F0"}`, borderRadius: 18, cursor: "pointer", transition: "all 0.2s", transform: hovered === p.key ? "translateY(-2px)" : "none", boxShadow: hovered === p.key ? `0 8px 24px ${p.color}22` : "0 2px 8px rgba(0,0,0,0.05)", textAlign: "left" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: hovered === p.key ? p.color : p.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s", color: hovered === p.key ? "#fff" : p.color }}>{p.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>{p.title}</div>
              <div style={{ fontSize: 13, color: "#9E9E9E", marginTop: 2 }}>{p.subtitle}</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 10h6M10 7l3 3-3 3" stroke={p.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        ))}
      </div>
      <p style={{ marginTop: 40, fontSize: 12, color: "#BDBDBD" }}>3.3M+ NGOs in India · Real-time coordination</p>
    </div>
  );
}

// ─── CITIZEN APP ──────────────────────────────────────────────────────────────
function CitizenApp({ onBack }) {
  const [screen, setScreen] = useState("home");
  const [sector, setSector] = useState(null);
  const [urgency, setUrgency] = useState(3);
  const [desc, setDesc] = useState("");
  const [name, setName] = useState("");
  const [lat, setLat] = useState(12.9716); const [lng, setLng] = useState(77.5946);
  const [locText, setLocText] = useState("Bengaluru, Karnataka");
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [sosActive, setSosActive] = useState(false);

  const getLocation = () => {
    setLocLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocText(`${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`); setLocLoading(false); }, () => setLocLoading(false));
    } else setLocLoading(false);
  };

  const handleSOS = async () => {
    setSosActive(true); getLocation();
    setTimeout(async () => {
      try {
        const res = await fetch(`${API}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sector: "Healthcare", urgency: 5, description: "SOS EMERGENCY — immediate help required", reporterName: "Anonymous", location: { lat, lng } }) });
        const data = await res.json();
        setTicketId("#UF-" + (data.task?._id || Date.now()).toString().slice(-4).toUpperCase());
      } catch { setTicketId("#UF-" + Math.floor(Math.random() * 9000 + 1000)); }
      setSosActive(false); setScreen("submitted");
    }, 1500);
  };

  const handleSubmit = async () => {
    if (!sector || !desc.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sector, urgency, description: desc, reporterName: name.trim() || "Anonymous", location: { lat, lng } }) });
      const data = await res.json();
      setTicketId("#UF-" + (data.task?._id || Date.now()).toString().slice(-4).toUpperCase());
    } catch { setTicketId("#UF-" + Math.floor(Math.random() * 9000 + 1000)); }
    setSubmitting(false); setScreen("submitted");
  };

  const reset = () => { setSector(null); setUrgency(3); setDesc(""); setName(""); setLocText("Bengaluru, Karnataka"); setSosActive(false); setScreen("home"); };

  const RedHeader = ({ children, noBack }) => (
    <div style={{ background: "linear-gradient(145deg,#E53935,#B71C1C)", padding: "52px 22px 32px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
      {!noBack && <button onClick={onBack} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 12, padding: "7px 14px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", marginBottom: 18, display: "flex", alignItems: "center", gap: 5 }}><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>Back</button>}
      {children}
    </div>
  );

  if (screen === "home") return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
      <RedHeader noBack>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: "0 0 3px" }}>Welcome to</p>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>UnityFlow Citizen</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "5px 0 0" }}>Emergency reporting · Bengaluru</p>
      </RedHeader>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 22px" }}>
        <button onClick={onBack} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#9E9E9E", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 20 }}>← Back</button>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", margin: "0 0 6px" }}>Are you in an emergency?</p>
        <p style={{ fontSize: 13, color: "#9E9E9E", textAlign: "center", maxWidth: 220, lineHeight: 1.6, margin: "0 0 36px" }}>Press the SOS button and help will reach you soon.</p>
        <div style={{ position: "relative", width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 36 }}>
          {[140, 165, 190].map((size, i) => <div key={i} style={{ position: "absolute", width: size, height: size, borderRadius: "50%", background: `rgba(229,57,53,${0.07 - i * 0.02})`, animation: `sosPulse ${1.4 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />)}
          <button onClick={handleSOS} disabled={sosActive} style={{ width: 116, height: 116, borderRadius: "50%", background: sosActive ? "#ccc" : "linear-gradient(145deg,#E53935,#B71C1C)", border: "none", cursor: sosActive ? "default" : "pointer", color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: 3, boxShadow: "0 8px 32px rgba(229,57,53,0.4)", zIndex: 1, fontFamily: "inherit" }}>{sosActive ? "..." : "SOS"}</button>
        </div>
        <div style={{ width: "100%", background: "#fff", border: "1px solid #F0F0F0", borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FFEBEE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#E53935"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>
          </div>
          <div><p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", margin: 0 }}>Your location</p><p style={{ fontSize: 11, color: "#9E9E9E", margin: "2px 0 0" }}>Bengaluru, Karnataka, India</p></div>
        </div>
        <button onClick={() => { getLocation(); setScreen("form"); }} style={{ width: "100%", background: "#fff", border: "2px solid #E53935", borderRadius: 13, padding: "14px", fontSize: 14, fontWeight: 700, color: "#E53935", cursor: "pointer", fontFamily: "inherit" }}>Report a Situation →</button>
      </div>
    </div>
  );

  if (screen === "form") return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#F8F9FA", display: "flex", flexDirection: "column" }}>
      <RedHeader>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 3px" }}>Submit a Report</h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: 0 }}>NGO teams will be notified immediately</p>
      </RedHeader>
      <div style={{ flex: 1, padding: "18px 16px 110px", overflowY: "auto" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#9E9E9E", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>What kind of help?</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 18 }}>
          {SECTORS.map(s => <button key={s} onClick={() => setSector(s)} style={{ background: sector === s ? "#FFEBEE" : "#fff", border: `2px solid ${sector === s ? "#E53935" : "#F0F0F0"}`, borderRadius: 13, padding: "14px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, fontFamily: "inherit", transition: "all 0.15s" }}>
            <span style={{ fontSize: 24 }}>{SECTOR_ICONS[s]}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: sector === s ? "#E53935" : "#666", textAlign: "center", lineHeight: 1.2 }}>{s}</span>
          </button>)}
        </div>

        <p style={{ fontSize: 10, fontWeight: 700, color: "#9E9E9E", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Location</p>
        <div onClick={getLocation} style={{ background: "#fff", borderRadius: 13, padding: "13px 15px", border: "1.5px solid #F0F0F0", display: "flex", alignItems: "center", gap: 12, marginBottom: 16, cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: locText.includes("°") ? "#E8F5E9" : "#FFEBEE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {locLoading ? <div style={{ width: 16, height: 16, border: "2px solid #E53935", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={locText.includes("°") ? "#4CAF50" : "#E53935"}/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>}
          </div>
          <div style={{ flex: 1 }}><p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", margin: 0 }}>{locLoading ? "Detecting..." : locText.includes("°") ? locText : "Use My Current Location"}</p><p style={{ fontSize: 11, color: "#9E9E9E", margin: "2px 0 0" }}>{locText.includes("°") ? "Location detected ✓" : "Tap to detect GPS"}</p></div>
        </div>

        <p style={{ fontSize: 10, fontWeight: 700, color: "#9E9E9E", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Urgency Level</p>
        <div style={{ background: "#fff", borderRadius: 13, padding: "14px 15px", border: "1.5px solid #F0F0F0", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>Level {urgency}/5</span>
            <span style={{ background: URGENCY_COLORS[urgency] + "22", color: URGENCY_COLORS[urgency], border: `1px solid ${URGENCY_COLORS[urgency]}44`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{URGENCY_LABELS[urgency]}</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3,4,5].map(n => <button key={n} onClick={() => setUrgency(n)} style={{ flex: 1, height: 30, borderRadius: 8, border: "none", background: n <= urgency ? URGENCY_COLORS[n] : "#F0F0F0", cursor: "pointer" }} />)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: "#BDBDBD", fontWeight: 600 }}>
            {["MIN","LOW","MED","HIGH","CRIT"].map(l => <span key={l}>{l}</span>)}
          </div>
        </div>

        <p style={{ fontSize: 10, fontWeight: 700, color: "#9E9E9E", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>What's happening?</p>
        <div style={{ background: "#fff", borderRadius: 13, padding: "13px 15px", border: "1.5px solid #F0F0F0" }}>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe the situation — how many people, what's needed…" rows={4} style={{ width: "100%", border: "none", outline: "none", fontSize: 13, color: "#1A1A2E", resize: "none", lineHeight: 1.6, background: "transparent", fontFamily: "inherit" }} />
          <div style={{ borderTop: "1px solid #F5F5F5", paddingTop: 10, marginTop: 4 }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name (optional)" style={{ width: "100%", border: "none", outline: "none", fontSize: 13, color: "#1A1A2E", background: "transparent", fontFamily: "inherit" }} />
          </div>
        </div>
      </div>
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", padding: "12px 16px", borderTop: "1px solid #F0F0F0" }}>
        <button onClick={handleSubmit} disabled={!sector || !desc.trim() || submitting} style={{ width: "100%", padding: "15px", background: sector && desc.trim() ? "linear-gradient(135deg,#E53935,#B71C1C)" : "#E0E0E0", color: "#fff", border: "none", borderRadius: 13, fontSize: 15, fontWeight: 700, cursor: sector && desc.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
          {submitting ? "Sending..." : "Send Emergency Report"}
        </button>
      </div>
    </div>
  );

  if (screen === "submitted") return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(145deg,#E53935,#B71C1C)", padding: "56px 22px 80px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 14px", animation: "popIn 0.4s ease" }}>✅</div>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Report Received!</h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, maxWidth: 220, margin: "0 auto" }}>Help is being dispatched. A volunteer will reach you shortly.</p>
      </div>
      <div style={{ flex: 1, padding: "0 18px 20px", marginTop: -36, overflowY: "auto" }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: 14 }}>
          {[["Ticket ID", ticketId], ["Sector", sector || "SOS Emergency"], ["Urgency", URGENCY_LABELS[urgency] || "Critical"], ["Status", "Finding Volunteer..."]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid #F5F5F5" }}>
              <span style={{ fontSize: 12, color: "#9E9E9E" }}>{k}</span><span style={{ fontSize: 12, fontWeight: 700, color: "#E53935" }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "linear-gradient(135deg,#E53935,#B71C1C)", borderRadius: 13, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🙋</div>
          <div><p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>Responder Being Assigned</p><p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", margin: "2px 0 0" }}>ETA: 5–10 minutes</p></div>
        </div>
        <button onClick={() => setScreen("tracking")} style={{ width: "100%", background: "#E53935", color: "#fff", border: "none", borderRadius: 13, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>Track My Report</button>
        <button onClick={reset} style={{ width: "100%", background: "none", border: "2px solid #E53935", color: "#E53935", borderRadius: 13, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Submit Another Report</button>
      </div>
    </div>
  );

  if (screen === "tracking") {
    const steps = [
      { label: "Report Submitted", time: "Just now", detail: "Your report has been received.", done: true },
      { label: "Volunteer Assigned", time: "2 min ago", detail: "A trained volunteer is on the way.", done: true },
      { label: "Responder En Route", time: "In progress", detail: "ETA 5–10 minutes to your location.", current: true },
      { label: "Help Arrived", time: "Pending", detail: "Volunteer will check in on arrival.", done: false },
      { label: "Resolved", time: "Pending", detail: "Situation resolved and closed.", done: false },
    ];
    return (
      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#F8F9FA", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "linear-gradient(145deg,#E53935,#B71C1C)", padding: "52px 22px 24px", flexShrink: 0 }}>
          <button onClick={() => setScreen("submitted")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, padding: "7px 14px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", marginBottom: 16, display: "flex", alignItems: "center", gap: 5 }}><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>Back</button>
          <p style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: 1 }}>{ticketId}</p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "4px 0 0" }}>Emergency Report · Live Tracking</p>
        </div>
        <div style={{ margin: "16px 16px 0", background: "#fff", borderRadius: 14, padding: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#E53935,#B71C1C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🙋</div>
          <div style={{ flex: 1 }}><p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", margin: 0 }}>Arjun Sharma</p><p style={{ fontSize: 11, color: "#9E9E9E", margin: "2px 0 0" }}>1st Responder · 5 min away</p></div>
          <button style={{ background: "#E53935", color: "#fff", border: "none", borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Call</button>
        </div>
        <div style={{ flex: 1, padding: "18px 16px", overflowY: "auto" }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, background: step.done ? "#E53935" : step.current ? "#FF9800" : "#F0F0F0", color: step.done || step.current ? "#fff" : "#BDBDBD", animation: step.current ? "trackPulse 1.5s infinite" : "none" }}>{step.done ? "✓" : i + 1}</div>
                {i < steps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 24, background: step.done ? "#E53935" : "#F0F0F0", margin: "3px 0" }} />}
              </div>
              <div style={{ paddingBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: step.done || step.current ? "#1A1A2E" : "#BDBDBD", margin: 0 }}>{step.label}</p>
                <p style={{ fontSize: 11, color: step.current ? "#FF9800" : "#9E9E9E", margin: "2px 0", fontWeight: step.current ? 600 : 400 }}>{step.time}</p>
                <p style={{ fontSize: 11, color: "#9E9E9E", margin: 0 }}>{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

// ─── VOLUNTEER APP ────────────────────────────────────────────────────────────
function VolunteerApp({ onBack }) {
  const [screen, setScreen] = useState("welcome");
  const [volunteer, setVolunteer] = useState(null);
  const [phone, setPhone] = useState(""); const [phoneError, setPhoneError] = useState(""); const [loginLoading, setLoginLoading] = useState(false);

  const handlePhoneLogin = async () => {
    if (phone.length < 10) { setPhoneError("Enter a valid 10-digit phone number"); return; }
    setLoginLoading(true); setPhoneError("");
    try {
      const res = await fetch(`${API}/volunteers/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const data = await res.json();
      if (data.volunteer) {
        if (!data.volunteer.approved) setPhoneError("Your application is pending NGO approval.");
        else { setVolunteer(data.volunteer); setScreen("app"); }
      } else setPhoneError("No account found. Please register first.");
    } catch { setPhoneError("Network error. Please try again."); }
    setLoginLoading(false);
  };

  if (screen === "app" && volunteer) return <VolunteerMainApp volunteer={volunteer} onLogout={() => { setVolunteer(null); setPhone(""); setScreen("welcome"); }} />;
  if (screen === "register") return <VolunteerRegister onBack={() => setScreen("welcome")} onSuccess={() => setScreen("welcome")} />;

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(145deg,#E53935,#B71C1C)", padding: "52px 22px 36px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, padding: "7px 14px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", marginBottom: 18, display: "flex", alignItems: "center", gap: 5 }}><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>Back</button>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>Volunteer Portal</h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: 0 }}>Make a difference in your community</p>
      </div>
      <div style={{ flex: 1, padding: "28px 22px" }}>
        <h2 style={{ fontSize: 19, fontWeight: 800, color: "#1A1A2E", margin: "0 0 6px" }}>Welcome back</h2>
        <p style={{ fontSize: 13, color: "#9E9E9E", margin: "0 0 24px", lineHeight: 1.6 }}>Already registered? Sign in with your phone number.</p>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#9E9E9E", letterSpacing: 1, display: "block", marginBottom: 8 }}>PHONE NUMBER</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          <div style={{ background: "#F8F9FA", border: "2px solid #F0F0F0", borderRadius: 11, padding: "12px 13px", fontSize: 14, fontWeight: 600, color: "#1A1A2E", flexShrink: 0 }}>+91</div>
          <input value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setPhoneError(""); }} onKeyDown={e => e.key === "Enter" && handlePhoneLogin()} placeholder="10-digit number" style={{ flex: 1, padding: "12px 15px", border: `2px solid ${phoneError ? "#E53935" : "#F0F0F0"}`, borderRadius: 11, fontSize: 14, color: "#1A1A2E", outline: "none", fontFamily: "inherit", background: "#F8F9FA" }} />
        </div>
        {phoneError && <p style={{ fontSize: 12, color: "#E53935", margin: "0 0 14px" }}>{phoneError}</p>}
        <button onClick={handlePhoneLogin} disabled={loginLoading || phone.length < 10} style={{ width: "100%", padding: "14px", background: phone.length >= 10 ? "linear-gradient(135deg,#E53935,#B71C1C)" : "#E0E0E0", color: "#fff", border: "none", borderRadius: 13, fontSize: 15, fontWeight: 700, cursor: phone.length >= 10 ? "pointer" : "not-allowed", fontFamily: "inherit", marginBottom: 20 }}>{loginLoading ? "Signing in..." : "Sign In"}</button>
        <div style={{ textAlign: "center", position: "relative", marginBottom: 20 }}>
          <div style={{ height: 1, background: "#F0F0F0", position: "absolute", top: "50%", left: 0, right: 0 }} />
          <span style={{ background: "#fff", padding: "0 16px", fontSize: 13, color: "#BDBDBD", position: "relative" }}>or</span>
        </div>
        <button onClick={() => setScreen("register")} style={{ width: "100%", padding: "14px", background: "#fff", border: "2px solid #E53935", borderRadius: 13, fontSize: 15, fontWeight: 700, color: "#E53935", cursor: "pointer", fontFamily: "inherit" }}>Register as New Volunteer</button>
        <p style={{ fontSize: 11, color: "#BDBDBD", textAlign: "center", marginTop: 18, lineHeight: 1.6 }}>After registration, your profile will be reviewed by the NGO leader before you can accept tasks.</p>
      </div>
    </div>
  );
}

function VolunteerRegister({ onBack, onSuccess }) {
  const [form, setForm] = useState({ name: "", age: "", phone: "", skills: [], location: "", available: true });
  const [errors, setErrors] = useState({}); const [submitting, setSubmitting] = useState(false); const [done, setDone] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSkill = s => setForm(f => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s] }));
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.age || form.age < 18 || form.age > 65) e.age = "Must be 18–65";
    if (!form.phone || form.phone.length < 10) e.phone = "Valid 10-digit number required";
    if (form.skills.length === 0) e.skills = "Select at least one sector";
    if (!form.location.trim()) e.location = "Required";
    return e;
  };
  const handleSubmit = async () => {
    const e = validate(); if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSubmitting(true);
    try { await fetch(`${API}/volunteers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name.trim(), age: parseInt(form.age), phone: form.phone, skills: form.skills, location: { lat: 12.9716, lng: 77.5946 }, available: form.available, approved: false }) }); }
    catch { }
    setSubmitting(false); setDone(true);
  };

  if (done) return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#E53935,#B71C1C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 24, boxShadow: "0 8px 24px rgba(229,57,53,0.3)" }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E", margin: "0 0 12px" }}>Application Submitted!</h2>
      <p style={{ fontSize: 13, color: "#9E9E9E", lineHeight: 1.7, maxWidth: 280, margin: "0 0 28px" }}>Your profile is under review by the sector NGO leader. You'll be able to log in once approved.</p>
      <button onClick={onSuccess} style={{ background: "linear-gradient(135deg,#E53935,#B71C1C)", color: "#fff", border: "none", borderRadius: 13, padding: "14px 36px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Back to Login</button>
    </div>
  );

  const inp = (err) => ({ width: "100%", padding: "12px 15px", border: `2px solid ${err ? "#E53935" : "#F0F0F0"}`, borderRadius: 11, fontSize: 14, color: "#1A1A2E", outline: "none", fontFamily: "inherit", background: "#F8F9FA", boxSizing: "border-box" });

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#F8F9FA", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(145deg,#E53935,#B71C1C)", padding: "52px 22px 26px", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, padding: "7px 14px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", marginBottom: 14, display: "flex", alignItems: "center", gap: 5 }}><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>Back</button>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 3px" }}>Create Profile</h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: 0 }}>Join the volunteer network</p>
      </div>
      <div style={{ flex: 1, padding: "18px 16px 110px", overflowY: "auto" }}>
        <div style={{ background: "#fff", borderRadius: 13, padding: 15, marginBottom: 12, border: "1.5px solid #F0F0F0" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#9E9E9E", letterSpacing: 1, display: "block", marginBottom: 7 }}>FULL NAME</label>
          <input value={form.name} onChange={e => { set("name", e.target.value); setErrors(er => ({ ...er, name: "" })); }} placeholder="e.g. Arjun Sharma" style={inp(errors.name)} />
          {errors.name && <p style={{ fontSize: 11, color: "#E53935", margin: "5px 0 0" }}>{errors.name}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10, marginTop: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#9E9E9E", letterSpacing: 1, display: "block", marginBottom: 7 }}>AGE</label>
              <input type="number" value={form.age} onChange={e => { set("age", e.target.value); setErrors(er => ({ ...er, age: "" })); }} placeholder="18–65" style={inp(errors.age)} />
              {errors.age && <p style={{ fontSize: 11, color: "#E53935", margin: "5px 0 0" }}>{errors.age}</p>}
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#9E9E9E", letterSpacing: 1, display: "block", marginBottom: 7 }}>PHONE</label>
              <input value={form.phone} onChange={e => { set("phone", e.target.value.replace(/\D/g, "").slice(0, 10)); setErrors(er => ({ ...er, phone: "" })); }} placeholder="10-digit" style={inp(errors.phone)} />
              {errors.phone && <p style={{ fontSize: 11, color: "#E53935", margin: "5px 0 0" }}>{errors.phone}</p>}
            </div>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 13, padding: 15, marginBottom: 12, border: "1.5px solid #F0F0F0" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#9E9E9E", letterSpacing: 1, display: "block", marginBottom: 12 }}>SECTORS YOU CAN HELP IN</label>
          {errors.skills && <p style={{ fontSize: 11, color: "#E53935", margin: "-6px 0 8px" }}>{errors.skills}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {SECTORS.map(s => <button key={s} onClick={() => { toggleSkill(s); setErrors(er => ({ ...er, skills: "" })); }} style={{ padding: "11px 12px", borderRadius: 10, border: `2px solid ${form.skills.includes(s) ? "#E53935" : "#F0F0F0"}`, background: form.skills.includes(s) ? "#FFEBEE" : "#fff", color: form.skills.includes(s) ? "#E53935" : "#666", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>{s}</button>)}
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 13, padding: 15, marginBottom: 12, border: "1.5px solid #F0F0F0" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#9E9E9E", letterSpacing: 1, display: "block", marginBottom: 7 }}>YOUR AREA / LOCALITY</label>
          <input value={form.location} onChange={e => { set("location", e.target.value); setErrors(er => ({ ...er, location: "" })); }} placeholder="e.g. Indiranagar, Bengaluru" style={inp(errors.location)} />
          {errors.location && <p style={{ fontSize: 11, color: "#E53935", margin: "5px 0 0" }}>{errors.location}</p>}
        </div>
        <div style={{ background: "#fff", borderRadius: 13, padding: "13px 15px", border: "1.5px solid #F0F0F0", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div><p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", margin: 0 }}>Available for tasks</p><p style={{ fontSize: 11, color: "#9E9E9E", margin: "2px 0 0" }}>Toggle off if unavailable right now</p></div>
          <div onClick={() => set("available", !form.available)} style={{ width: 44, height: 24, borderRadius: 12, background: form.available ? "#E53935" : "#E0E0E0", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 2, left: form.available ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </div>
        </div>
      </div>
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", padding: "12px 16px", borderTop: "1px solid #F0F0F0" }}>
        <button onClick={handleSubmit} disabled={submitting} style={{ width: "100%", padding: "15px", background: submitting ? "#E0E0E0" : "linear-gradient(135deg,#E53935,#B71C1C)", color: "#fff", border: "none", borderRadius: 13, fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit" }}>{submitting ? "Submitting..." : "Submit Application"}</button>
      </div>
    </div>
  );
}

function VolunteerMainApp({ volunteer, onLogout }) {
  const [tasks, setTasks] = useState([]); const [activeTab, setActiveTab] = useState("incoming"); const [toast, setToast] = useState(null);
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const fetchTasks = useCallback(async () => { try { const res = await fetch(`${API}/tasks`); const data = await res.json(); setTasks(Array.isArray(data) ? data : data.tasks ?? []); } catch {} }, []);
  useEffect(() => { fetchTasks(); const id = setInterval(fetchTasks, 10000); return () => clearInterval(id); }, [fetchTasks]);

  const incoming = tasks.filter(t => t.status === "open" && (t.sector === volunteer.skills || t.sector === volunteer.sector));
  const active = tasks.filter(t => t.status === "assigned" && t.assignedVolunteer === volunteer._id);
  const history = tasks.filter(t => t.status === "completed" && t.assignedVolunteer === volunteer._id);

  const handleAccept = async task => {
    try { const res = await fetch(`${API}/tasks/${task._id}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ volunteerId: volunteer._id }) }); if (res.ok) { showToast("Task accepted!"); fetchTasks(); setActiveTab("active"); } else showToast("Failed"); } catch { showToast("Network error"); }
  };
  const handleComplete = async task => {
    try { const res = await fetch(`${API}/tasks/${task._id}/complete`, { method: "POST", headers: { "Content-Type": "application/json" } }); if (res.ok) { showToast("Task completed!"); fetchTasks(); setActiveTab("history"); } else showToast("Failed"); } catch { showToast("Network error"); }
  };

  const TABS = [{ key: "incoming", label: "Incoming", count: incoming.length, color: "#E53935" }, { key: "active", label: "Active", count: active.length, color: "#FF9800" }, { key: "history", label: "History", count: history.length, color: "#4CAF50" }];
  const current = { incoming, active, history }[activeTab];

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#F8F9FA", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#fff", padding: "48px 18px 14px", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#E53935,#B71C1C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>{getInitials(volunteer.name)}</div>
          <div><p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", margin: 0 }}>{volunteer.name}</p><p style={{ fontSize: 11, color: "#4CAF50", fontWeight: 600, margin: 0 }}>● Active</p></div>
        </div>
        <button onClick={onLogout} style={{ background: "#F8F9FA", border: "1px solid #F0F0F0", borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: 600, color: "#9E9E9E", cursor: "pointer", fontFamily: "inherit" }}>Sign Out</button>
      </div>
      <div style={{ background: "#fff", display: "flex", borderBottom: "1px solid #F0F0F0", flexShrink: 0 }}>
        {TABS.map(tab => <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, padding: "13px 6px", background: "none", border: "none", borderBottom: activeTab === tab.key ? `3px solid ${tab.color}` : "3px solid transparent", color: activeTab === tab.key ? tab.color : "#9E9E9E", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {tab.label}{tab.count > 0 && <span style={{ marginLeft: 5, background: tab.color + "22", color: tab.color, border: `1px solid ${tab.color}44`, borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>{tab.count}</span>}
        </button>)}
      </div>
      <div style={{ flex: 1, padding: 14, overflowY: "auto" }}>
        {current.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "#BDBDBD", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>{activeTab === "incoming" ? "🎉" : activeTab === "active" ? "✅" : "📋"}</div>
            <p style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>{activeTab === "incoming" ? "No open tasks matching your skills" : activeTab === "active" ? "No active tasks" : "No completed tasks yet"}</p>
          </div>
        ) : current.map(task => {
          const urgColor = URGENCY_COLORS[task.urgency] || "#E53935";
          return (
            <div key={task._id} style={{ background: "#fff", borderRadius: 13, padding: 14, marginBottom: 10, border: "1.5px solid #F0F0F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div><p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", margin: "0 0 2px" }}>{task.sector}</p><p style={{ fontSize: 11, color: "#9E9E9E", margin: 0 }}>{task.location?.lat?.toFixed(4)}, {task.location?.lng?.toFixed(4)}</p></div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 7, background: urgColor + "18", color: urgColor, border: `1px solid ${urgColor}33` }}>{URGENCY_LABELS[task.urgency]}</span>
              </div>
              <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5, margin: "0 0 12px" }}>{task.description}</p>
              {activeTab === "incoming" && <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleAccept(task)} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#E53935,#B71C1C)", border: "none", borderRadius: 9, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Accept Task</button>
                <button style={{ flex: 1, padding: "10px", background: "#F8F9FA", border: "1.5px solid #F0F0F0", borderRadius: 9, color: "#9E9E9E", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Decline</button>
              </div>}
              {activeTab === "active" && <button onClick={() => handleComplete(task)} style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg,#2E7D32,#4CAF50)", border: "none", borderRadius: 9, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Mark Complete</button>}
              {activeTab === "history" && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#4CAF50", fontSize: 12, fontWeight: 600 }}>✓ Completed {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : "earlier"}</div>}
            </div>
          );
        })}
      </div>
      {toast && <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", background: "#1A1A2E", color: "#fff", borderRadius: 10, padding: "12px 22px", fontSize: 13, fontWeight: 600, zIndex: 2000, whiteSpace: "nowrap" }}>{toast}</div>}
    </div>
  );
}

// ─── NGO DASHBOARD ────────────────────────────────────────────────────────────
function LeafletMap({ tasks, selectedTask, onTaskClick }) {
  const mapRef = useRef(null); const leafletMap = useRef(null); const markersRef = useRef({});
  useEffect(() => {
    if (leafletMap.current) return;
    const L = window.L; if (!L) return;
    const map = L.map(mapRef.current, { center: [12.9716, 77.5946], zoom: 12 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "©OpenStreetMap", maxZoom: 19 }).addTo(map);
    leafletMap.current = map;
    return () => { map.remove(); leafletMap.current = null; };
  }, []);
  useEffect(() => {
    const L = window.L; if (!L || !leafletMap.current) return;
    Object.keys(markersRef.current).forEach(id => { if (!tasks.find(t => t._id === id)) { markersRef.current[id].remove(); delete markersRef.current[id]; } });
    tasks.forEach(task => {
      const color = STATUS_COLORS[task.status] || "#E53935"; const isSel = selectedTask?._id === task._id;
      const icon = L.divIcon({ className: "", html: `<div style="width:${isSel ? 20 : 14}px;height:${isSel ? 20 : 14}px;border-radius:50%;background:${color};border:${isSel ? "3px solid #B71C1C" : "2px solid white"};box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;"></div>`, iconSize: [isSel ? 20 : 14, isSel ? 20 : 14], iconAnchor: [isSel ? 10 : 7, isSel ? 10 : 7] });
      const lat = task.location?.lat ?? 12.9716; const lng = task.location?.lng ?? 77.5946;
      if (markersRef.current[task._id]) { markersRef.current[task._id].setIcon(icon); markersRef.current[task._id].setLatLng([lat, lng]); }
      else { const m = L.marker([lat, lng], { icon }).addTo(leafletMap.current).bindPopup(`<b>${task.sector}</b><br/>Urgency: ${task.urgency}/5<br/>Status: ${task.status}`).on("click", () => onTaskClick(task)); markersRef.current[task._id] = m; }
    });
  }, [tasks, selectedTask, onTaskClick]);
  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}

function NGODashboard({ onBack }) {
  const [leader, setLeader] = useState(null);
  const [darpan, setDarpan] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true); setError("");
    setTimeout(() => {
      const l = NGO_LEADERS.find(x => x.darpan === darpan.trim());
      if (l) setLeader(l); else setError("Invalid Darpan registration number.");
      setLoading(false);
    }, 800);
  };

  if (leader) return <NGOMain leader={leader} onLogout={() => setLeader(null)} />;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#fff 60%,#FFEBEE 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9E9E9E", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 24 }}>← Back</button>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 58, height: 58, borderRadius: 16, background: "linear-gradient(145deg,#E53935,#B71C1C)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 8px 24px rgba(229,57,53,0.3)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="2" stroke="white" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="white" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="white" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="white" strokeWidth="2"/></svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1A1A2E", margin: "0 0 4px" }}>NGO Dashboard</h1>
          <p style={{ fontSize: 13, color: "#9E9E9E", margin: 0 }}>Sign in with your Darpan registration number</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 20, padding: 26, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#9E9E9E", letterSpacing: 1, display: "block", marginBottom: 8 }}>DARPAN REGISTRATION NUMBER</label>
          <input value={darpan} onChange={e => { setDarpan(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="e.g. KA/2019/0234521" style={{ width: "100%", padding: "13px 15px", border: `2px solid ${error ? "#E53935" : "#F0F0F0"}`, borderRadius: 11, fontSize: 14, color: "#1A1A2E", outline: "none", fontFamily: "inherit", background: "#F8F9FA", boxSizing: "border-box" }} />
          {error && <p style={{ fontSize: 12, color: "#E53935", margin: "8px 0 0" }}>{error}</p>}
          <div style={{ background: "#FFF8F8", border: "1px solid #FFCDD2", borderRadius: 10, padding: "11px 13px", margin: "14px 0" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#E53935", margin: "0 0 8px", letterSpacing: 0.5 }}>DEMO CREDENTIALS</p>
            {NGO_LEADERS.map(l => <div key={l.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 11, color: "#666" }}>{l.sector}</span><button onClick={() => setDarpan(l.darpan)} style={{ background: "none", border: "none", fontSize: 11, color: "#E53935", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, padding: 0 }}>{l.darpan}</button></div>)}
          </div>
          <button onClick={handleLogin} disabled={!darpan.trim() || loading} style={{ width: "100%", padding: "14px", background: darpan.trim() ? "linear-gradient(135deg,#E53935,#B71C1C)" : "#E0E0E0", color: "#fff", border: "none", borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: darpan.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>{loading ? "Verifying..." : "Sign In"}</button>
        </div>
      </div>
    </div>
  );
}

function NGOMain({ leader, onLogout }) {
  const [tasks, setTasks] = useState([]); const [volunteers, setVolunteers] = useState([]); const [pending, setPending] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null); const [matches, setMatches] = useState([]); const [matchLoading, setMatchLoading] = useState(false);
  const [assigning, setAssigning] = useState(false); const [toast, setToast] = useState(null); const [lastRefresh, setLastRefresh] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false); const [activeTab, setActiveTab] = useState("tasks");

  useEffect(() => {
    if (window.L) { setLeafletLoaded(true); return; }
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(link);
    const script = document.createElement("script"); script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"; script.onload = () => setLeafletLoaded(true); document.head.appendChild(script);
  }, []);

  const fetchTasks = useCallback(async () => { try { const res = await fetch(`${API}/tasks?sector=${encodeURIComponent(leader.sector)}`); const data = await res.json(); setTasks(Array.isArray(data) ? data : data.tasks ?? []); setLastRefresh(new Date()); } catch {} }, [leader.sector]);
  const fetchVolunteers = useCallback(async () => { try { const res = await fetch(`${API}/volunteers?sector=${encodeURIComponent(leader.sector)}`); const data = await res.json(); const list = Array.isArray(data) ? data : (data.volunteers ?? data.data ?? []); setVolunteers(list.filter(v => v.approved)); setPending(list.filter(v => !v.approved && !v.rejected)); } catch {} }, [leader.sector]);
  useEffect(() => { fetchTasks(); fetchVolunteers(); const id = setInterval(() => { fetchTasks(); fetchVolunteers(); }, 10000); return () => clearInterval(id); }, [fetchTasks, fetchVolunteers]);

  const handleTaskClick = useCallback(async task => {
    setSelectedTask(task); setMatches([]); setMatchLoading(true);
    try { const res = await fetch(`${API}/match/${task._id}`); const data = await res.json(); setMatches((Array.isArray(data) ? data : data.matches ?? []).slice(0, 3)); } catch {}
    setMatchLoading(false);
  }, []);

  const handleAssign = async vId => {
    if (!selectedTask) return; setAssigning(true);
    try { await fetch(`${API}/tasks/${selectedTask._id}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ volunteerId: vId }) }); const v = matches.find(m => (m.volunteer?._id || m._id) === vId); showToast(`${v?.volunteer?.name || "Volunteer"} assigned!`); setSelectedTask(null); fetchTasks(); } catch { showToast("Assignment failed"); }
    setAssigning(false);
  };
  const handleApprove = async id => { try { await fetch(`${API}/volunteers/${id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved: true }) }); showToast("Volunteer approved!"); fetchVolunteers(); } catch { showToast("Failed"); } };
  const handleReject = async id => { try { await fetch(`${API}/volunteers/${id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved: false, rejected: true }) }); showToast("Volunteer rejected."); fetchVolunteers(); } catch { showToast("Failed"); } };
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const open = tasks.filter(t => t.status === "open").length;
  const assigned = tasks.filter(t => t.status === "assigned").length;
  const done = tasks.filter(t => t.status === "completed").length;

  return (
    <div style={{ width: "100%", height: "100vh", background: "#F8F9FA", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <header style={{ background: "#fff", padding: "12px 22px", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#E53935,#B71C1C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{SECTOR_ICONS[leader.sector]}</div>
          <div><h1 style={{ fontSize: 15, fontWeight: 800, color: "#1A1A2E", margin: 0 }}>{leader.ngoName}</h1><p style={{ fontSize: 11, color: "#9E9E9E", margin: 0 }}>{leader.name} · {leader.sector}</p></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {[{ l: "Open", v: open, c: "#E53935" }, { l: "Assigned", v: assigned, c: "#FF9800" }, { l: "Done", v: done, c: "#4CAF50" }].map(s => <div key={s.l} style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div><div style={{ fontSize: 9, color: "#9E9E9E", fontWeight: 600 }}>{s.l}</div></div>)}
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9E9E9E" }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4CAF50", animation: "pulse 2s infinite" }} />Live · {lastRefresh?.toLocaleTimeString() || "—"}</div>
          {pending.length > 0 && <button onClick={() => setActiveTab("pending")} style={{ background: "#FFEBEE", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 17, height: 17, borderRadius: "50%", background: "#E53935", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{pending.length}</div><span style={{ fontSize: 11, fontWeight: 600, color: "#E53935" }}>Pending</span></button>}
          <button onClick={onLogout} style={{ background: "#F8F9FA", border: "1px solid #F0F0F0", borderRadius: 8, padding: "7px 13px", fontSize: 11, fontWeight: 600, color: "#666", cursor: "pointer", fontFamily: "inherit" }}>Sign Out</button>
        </div>
      </header>

      <div style={{ background: "#fff", borderBottom: "1px solid #F0F0F0", display: "flex", padding: "0 22px", flexShrink: 0 }}>
        {[{ k: "tasks", l: "Task Map" }, { k: "volunteers", l: `Volunteers (${volunteers.length})` }, { k: "pending", l: `Pending (${pending.length})` }].map(t => <button key={t.k} onClick={() => setActiveTab(t.k)} style={{ padding: "11px 14px", background: "none", border: "none", borderBottom: activeTab === t.k ? "3px solid #E53935" : "3px solid transparent", color: activeTab === t.k ? "#E53935" : "#9E9E9E", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t.l}</button>)}
      </div>

      {activeTab === "tasks" && (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: "0 0 68%", position: "relative" }}>
            {leafletLoaded ? <LeafletMap tasks={tasks} selectedTask={selectedTask} onTaskClick={handleTaskClick} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9E9E9E", gap: 8 }}><div style={{ width: 18, height: 18, border: "2px solid #E53935", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Loading map...</div>}
          </div>
          <div style={{ flex: "0 0 32%", borderLeft: "1px solid #F0F0F0", display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #F0F0F0", fontSize: 10, fontWeight: 700, color: "#9E9E9E", letterSpacing: 1 }}>TASKS BY URGENCY — {tasks.length}</div>
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              {tasks.length === 0 ? <div style={{ padding: 24, textAlign: "center", color: "#BDBDBD", fontSize: 13 }}>No tasks found</div> :
                tasks.slice().sort((a, b) => (b.urgency || 0) - (a.urgency || 0)).map(task => {
                  const isSel = selectedTask?._id === task._id;
                  return <div key={task._id} onClick={() => handleTaskClick(task)} style={{ padding: "11px 13px", borderRadius: 10, marginBottom: 6, cursor: "pointer", border: `1.5px solid ${isSel ? "#E53935" : "#F0F0F0"}`, background: isSel ? "#FFF8F8" : "#fff", transition: "all 0.15s", transform: isSel ? "translateX(3px)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E" }}>{SECTOR_ICONS[task.sector]} {task.sector}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: (URGENCY_COLORS[task.urgency] || "#E53935") + "18", color: URGENCY_COLORS[task.urgency] || "#E53935", border: `1px solid ${(URGENCY_COLORS[task.urgency] || "#E53935")}33` }}>{URGENCY_LABELS[task.urgency]}</span>
                    </div>
                    <p style={{ fontSize: 10, color: "#9E9E9E", margin: "0 0 5px", lineHeight: 1.4 }}>{(task.description || "").slice(0, 55)}{(task.description?.length || 0) > 55 ? "…" : ""}</p>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: STATUS_COLORS[task.status] }}>● {(task.status || "open").toUpperCase()}</span>
                      <span style={{ fontSize: 9, color: "#BDBDBD" }}>{task.createdAt ? timeAgo(task.createdAt) : ""}</span>
                    </div>
                  </div>;
                })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "volunteers" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1A1A2E", marginBottom: 14 }}>Approved Volunteers — {leader.sector}</h2>
            {volunteers.length === 0 ? <div style={{ textAlign: "center", color: "#BDBDBD", padding: 48, background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0" }}><p style={{ fontSize: 32, margin: "0 0 10px" }}>👥</p><p style={{ fontSize: 13, margin: 0 }}>No approved volunteers yet</p></div> :
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
                {volunteers.map(v => <div key={v._id} style={{ background: "#fff", borderRadius: 13, padding: "14px 16px", border: "1px solid #F0F0F0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#E53935,#B71C1C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{(v.name || "V")[0]}</div>
                    <div style={{ flex: 1 }}><p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", margin: 0 }}>{v.name}</p><p style={{ fontSize: 11, color: "#9E9E9E", margin: "2px 0 0" }}>Age {v.age} · {v.phone}</p></div>
                    <div style={{ fontSize: 10, padding: "3px 9px", borderRadius: 10, background: v.available ? "#E8F5E9" : "#F5F5F5", color: v.available ? "#2E7D32" : "#9E9E9E", fontWeight: 600 }}>{v.available ? "● Available" : "○ Offline"}</div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{(Array.isArray(v.skills) ? v.skills : [v.skills]).map(s => <span key={s} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 7, background: "#FFEBEE", color: "#E53935", fontWeight: 600 }}>{s}</span>)}</div>
                </div>)}
              </div>}
          </div>
        </div>
      )}

      {activeTab === "pending" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1A1A2E", marginBottom: 14 }}>Pending Approval — {pending.length} volunteer{pending.length !== 1 ? "s" : ""}</h2>
            {pending.length === 0 ? <div style={{ textAlign: "center", color: "#BDBDBD", padding: 48, background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0" }}><p style={{ fontSize: 32, margin: "0 0 10px" }}>✅</p><p style={{ fontSize: 13, margin: 0 }}>No pending approvals</p></div> :
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pending.map(v => <div key={v._id} style={{ background: "#fff", borderRadius: 15, padding: "16px 18px", border: "1.5px solid #FFCDD2", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#E53935,#B71C1C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>{(v.name || "V")[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}><p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", margin: 0 }}>{v.name}</p><p style={{ fontSize: 12, color: "#9E9E9E", margin: "3px 0 0" }}>Age {v.age} · {(Array.isArray(v.skills) ? v.skills : [v.skills]).join(", ")} · {v.phone}</p></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleApprove(v._id)} style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#2E7D32", cursor: "pointer", fontFamily: "inherit" }}>Approve</button>
                    <button onClick={() => handleReject(v._id)} style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#E53935", cursor: "pointer", fontFamily: "inherit" }}>Reject</button>
                  </div>
                </div>)}
              </div>}
          </div>
        </div>
      )}

      {selectedTask && activeTab === "tasks" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setSelectedTask(null)}>
          <div style={{ width: "100%", maxWidth: 500, background: "#fff", borderRadius: "20px 20px 0 0", padding: "22px 22px 36px", animation: "slideUp 0.2s ease", maxHeight: "75vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div><h3 style={{ fontSize: 17, fontWeight: 800, color: "#1A1A2E", margin: "0 0 3px" }}>{SECTOR_ICONS[selectedTask.sector]} {selectedTask.sector}</h3><p style={{ fontSize: 11, color: "#9E9E9E", margin: 0 }}>Find Volunteer · Urgency {selectedTask.urgency}/5</p></div>
              <button onClick={() => setSelectedTask(null)} style={{ background: "#F8F9FA", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: "#9E9E9E" }}>×</button>
            </div>
            {selectedTask.description && <div style={{ background: "#F8F9FA", borderRadius: 9, padding: "9px 13px", fontSize: 12, color: "#666", marginBottom: 14, lineHeight: 1.5 }}>{selectedTask.description}</div>}
            {matchLoading ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 28, color: "#9E9E9E" }}><div style={{ width: 16, height: 16, border: "2px solid #E53935", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Scoring volunteers...</div> :
              matches.length === 0 ? <div style={{ textAlign: "center", color: "#BDBDBD", padding: 28, fontSize: 13 }}>No matching volunteers available</div> :
              matches.map((m, i) => {
                const pct = Math.round((m.score ?? 0) * 100);
                return <div key={m.volunteer?._id || i} style={{ background: "#F8F9FA", borderRadius: 11, padding: "13px 15px", marginBottom: 10, border: "1.5px solid #F0F0F0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#E53935,#B71C1C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>{(m.volunteer?.name || "V")[0].toUpperCase()}</div>
                      <div><p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", margin: 0 }}>{m.volunteer?.name || "Volunteer"}</p><p style={{ fontSize: 11, color: "#9E9E9E", margin: 0 }}>{m.distanceKm != null ? `${m.distanceKm.toFixed(1)} km away` : ""}{m.reason ? ` · ${m.reason}` : ""}</p></div>
                    </div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 800, color: "#E53935" }}>{pct}%</div><div style={{ fontSize: 9, color: "#9E9E9E" }}>MATCH</div></div>
                  </div>
                  <div style={{ height: 4, background: "#F0F0F0", borderRadius: 4, marginBottom: 10, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#E53935,#FF9800)", borderRadius: 4 }} /></div>
                  <button onClick={() => handleAssign(m.volunteer?._id || m._id)} disabled={assigning} style={{ width: "100%", padding: "10px", background: assigning ? "#E0E0E0" : "linear-gradient(135deg,#E53935,#B71C1C)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: assigning ? "not-allowed" : "pointer", fontFamily: "inherit" }}>{assigning ? "Assigning..." : i === 0 ? "★ Assign Top Match" : "Assign"}</button>
                </div>;
              })}
          </div>
        </div>
      )}
      {toast && <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: "#1A1A2E", color: "#fff", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 600, zIndex: 2000, animation: "fadeIn 0.2s ease", whiteSpace: "nowrap" }}>{toast}</div>}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [portal, setPortal] = useState(null);
  return (
    <>
      <GlobalStyles />
      {!portal && <LandingPage setPortal={setPortal} />}
      {portal === "citizen" && <CitizenApp onBack={() => setPortal(null)} />}
      {portal === "ngo" && <NGODashboard onBack={() => setPortal(null)} />}
      {portal === "volunteer" && <VolunteerApp onBack={() => setPortal(null)} />}
    </>
  );
}
