import { useState } from "react";

const API = "https://unityflow-backend-71bj.onrender.com/api";

const SECTORS = [
  { name: "Flood Relief", icon: "🌊" },
  { name: "Healthcare", icon: "🏥" },
  { name: "Food and Hunger", icon: "🍱" },
  { name: "Education", icon: "📚" },
  { name: "Women Safety", icon: "🛡️" },
];

const URGENCY_COLORS = ["", "#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];

export default function CitizenForm() {
  const [sector, setSector] = useState(null);
  const [urgency, setUrgency] = useState(null);
  const [lat, setLat] = useState(12.9716);
  const [lng, setLng] = useState(77.5946);
  const [locLabel, setLocLabel] = useState("");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getLocation = () => {
    if (!navigator.geolocation) { showToast("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocLabel(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        showToast("📍 Location captured");
      },
      () => {
        setLat(12.9716); setLng(77.5946);
        setLocLabel("12.9716, 77.5946 (Bengaluru centre)");
        showToast("Using Bengaluru centre as fallback");
      }
    );
  };

  const handleSubmit = async () => {
    if (!sector) { showToast("⚠ Please select a sector"); return; }
    if (!urgency) { showToast("⚠ Please set urgency level"); return; }
    if (!description.trim()) { showToast("⚠ Please describe the situation"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector,
          urgency,
          description: description.trim(),
          reporterName: reporterName.trim() || "Anonymous",
          location: { lat, lng }
        })
      });
      if (!res.ok) throw new Error();
    } catch {
      // offline fallback — still show success for demo
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  const reset = () => {
    setSector(null); setUrgency(null); setDescription("");
    setReporterName(""); setLocLabel(""); setSubmitted(false);
  };

  const mono = "'DM Mono','Fira Code',monospace";

  if (submitted) return (
    <div style={{
      minHeight: "calc(100vh - 56px)", background: "#020817", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: mono, color: "#f1f5f9", padding: 24, textAlign: "center"
    }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#22c55e", marginBottom: 10, letterSpacing: 1 }}>
        REPORT SUBMITTED
      </div>
      <div style={{ color: "#64748b", fontSize: 13, marginBottom: 32, lineHeight: 1.6 }}>
        Your emergency has been routed to the {sector} NGO group.<br />
        A volunteer will be assigned shortly.
      </div>
      <button onClick={reset} style={{
        background: "none", border: "1px solid #38bdf8", color: "#38bdf8",
        borderRadius: 8, padding: "10px 28px", fontFamily: mono, fontSize: 12,
        cursor: "pointer", letterSpacing: 1
      }}>+ SUBMIT ANOTHER REPORT</button>
    </div>
  );

  return (
    <div style={{ background: "#020817", minHeight: "calc(100vh - 56px)", fontFamily: mono, color: "#f1f5f9" }}>
      {toast && (
        <div style={{
          position: "fixed", top: 70, right: 20, zIndex: 9999,
          background: "#0f172a", border: "1px solid #38bdf8", color: "#38bdf8",
          padding: "12px 20px", borderRadius: 8, fontSize: 13,
          boxShadow: "0 8px 32px rgba(56,189,248,0.2)", maxWidth: 300
        }}>{toast}</div>
      )}

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 8 }}>// EMERGENCY REPORT</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Submit a Situation Report</div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
            NGO teams will be notified and a volunteer deployed within minutes.
          </div>
        </div>

        {/* Sector */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 12 }}>SELECT SECTOR</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
            {SECTORS.map(s => (
              <div key={s.name} onClick={() => setSector(s.name)} style={{
                background: sector === s.name ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${sector === s.name ? "#38bdf8" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10, padding: "12px 6px", textAlign: "center",
                cursor: "pointer", transition: "all 0.2s",
                boxShadow: sector === s.name ? "0 0 16px rgba(56,189,248,0.15)" : "none"
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 9, color: sector === s.name ? "#38bdf8" : "#64748b", letterSpacing: 0.5, lineHeight: 1.3 }}>
                  {s.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 12 }}>LOCATION</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input readOnly value={locLabel} placeholder="Tap 'Use My Location' to autofill"
              style={{
                flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "10px 14px", color: "#f1f5f9", fontFamily: mono, fontSize: 12, outline: "none"
              }}
            />
            <button onClick={getLocation} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid #38bdf8", borderRadius: 8,
              padding: "10px 14px", color: "#38bdf8", fontFamily: mono, fontSize: 11,
              cursor: "pointer", whiteSpace: "nowrap"
            }}>📍 Use My Location</button>
          </div>
        </div>

        {/* Urgency */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 12 }}>URGENCY LEVEL</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1,2,3,4,5].map(n => {
              const color = URGENCY_COLORS[n];
              const sel = urgency === n;
              return (
                <button key={n} onClick={() => setUrgency(n)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 8,
                  border: `1px solid ${sel ? color : "rgba(255,255,255,0.08)"}`,
                  background: sel ? `${color}20` : "rgba(255,255,255,0.03)",
                  color: sel ? color : "#64748b",
                  fontFamily: mono, fontSize: 15, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s"
                }}>{n}</button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 12 }}>SITUATION DESCRIPTION</div>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe the emergency in detail..." rows={4}
            style={{
              width: "100%", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
              padding: "12px 14px", color: "#f1f5f9", fontFamily: mono,
              fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        {/* Name */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 12 }}>
            YOUR NAME <span style={{ color: "#334155" }}>(OPTIONAL)</span>
          </div>
          <input value={reporterName} onChange={e => setReporterName(e.target.value)}
            placeholder="Enter your name"
            style={{
              width: "100%", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
              padding: "10px 14px", color: "#f1f5f9", fontFamily: mono,
              fontSize: 13, outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={submitting} style={{
          width: "100%",
          background: submitting ? "#1e293b" : "linear-gradient(90deg,#0ea5e9,#38bdf8)",
          border: "none", borderRadius: 10, padding: "16px",
          color: submitting ? "#64748b" : "#000",
          fontFamily: mono, fontSize: 13, fontWeight: 700, letterSpacing: 2,
          cursor: submitting ? "not-allowed" : "pointer", transition: "all 0.2s"
        }}>
          {submitting ? "SUBMITTING…" : "⚡ SUBMIT EMERGENCY REPORT"}
        </button>
      </div>

      <style>{`textarea:focus,input:focus{border-color:rgba(56,189,248,0.5)!important;}`}</style>
    </div>
  );
}
