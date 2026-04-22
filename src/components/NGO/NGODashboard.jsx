import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = "https://unityflow-backend-71bj.onrender.com";

const SECTORS = ["All", "Healthcare", "Flood Relief", "Food and Hunger", "Education", "Women Safety"];

const SECTOR_ICONS = {
  Healthcare: "🏥",
  "Flood Relief": "🌊",
  "Food and Hunger": "🍱",
  Education: "📚",
  "Women Safety": "🛡️",
};

const URGENCY_COLORS = {
  1: "#22c55e",
  2: "#84cc16",
  3: "#eab308",
  4: "#f97316",
  5: "#ef4444",
};

const URGENCY_LABELS = {
  1: "LOW",
  2: "MODERATE",
  3: "MEDIUM",
  4: "HIGH",
  5: "CRITICAL",
};

const STATUS_COLORS = {
  open: "#ef4444",
  assigned: "#f97316",
  completed: "#22c55e",
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Leaflet map rendered into a plain div via useEffect ──────────────────────
function LeafletMap({ tasks, selectedTask, onTaskClick }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef({});

  // Boot Leaflet once
  useEffect(() => {
    if (leafletMap.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "©OpenStreetMap ©CartoDB",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Sync markers whenever tasks change
  useEffect(() => {
    const L = window.L;
    if (!L || !leafletMap.current) return;

    // Remove stale markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!tasks.find((t) => t._id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    tasks.forEach((task) => {
      const color = STATUS_COLORS[task.status] || "#ef4444";
      const urgColor = URGENCY_COLORS[task.urgency] || "#ef4444";
      const isSelected = selectedTask?._id === task._id;

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:${isSelected ? 22 : 16}px;
          height:${isSelected ? 22 : 16}px;
          border-radius:50%;
          background:${color};
          border:${isSelected ? "3px solid #38bdf8" : "2px solid rgba(255,255,255,0.4)"};
          box-shadow:0 0 ${isSelected ? 12 : 6}px ${urgColor}99;
          transition:all 0.2s ease;
          cursor:pointer;
        "></div>`,
        iconSize: [isSelected ? 22 : 16, isSelected ? 22 : 16],
        iconAnchor: [isSelected ? 11 : 8, isSelected ? 11 : 8],
      });

      const lat = task.location?.coordinates?.[1] ?? task.location?.lat ?? 12.9716;
      const lng = task.location?.coordinates?.[0] ?? task.location?.lng ?? 77.5946;

      if (markersRef.current[task._id]) {
        markersRef.current[task._id].setIcon(icon);
        markersRef.current[task._id].setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon })
          .addTo(leafletMap.current)
          .bindPopup(
            `<div style="font-family:'DM Mono',monospace;color:#0f172a;font-size:12px;">
              <b>${SECTOR_ICONS[task.sector] || "📍"} ${task.sector}</b><br/>
              Urgency: ${task.urgency}/5<br/>
              Status: ${task.status}
            </div>`,
            { className: "uf-popup" }
          )
          .on("click", () => onTaskClick(task));
        markersRef.current[task._id] = marker;
      }
    });
  }, [tasks, selectedTask, onTaskClick]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}

// ── Match card inside the modal ───────────────────────────────────────────────
function MatchCard({ match, rank, onAssign, assigning }) {
  const pct = Math.round((match.score ?? match.totalScore ?? 0) * 100);
  const gradient = `linear-gradient(90deg, #38bdf8 0%, #22c55e ${pct}%)`;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(56,189,248,0.2)",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 10,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateX(3px)";
        e.currentTarget.style.boxShadow = "0 0 12px rgba(56,189,248,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#38bdf8,#0ea5e9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              color: "#0a0f1e",
            }}
          >
            {(match.volunteer?.name || match.name || "V")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>
              {match.volunteer?.name || match.name || "Volunteer"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {match.distanceKm != null ? `${match.distanceKm.toFixed(1)} km away` : ""}
              {match.reason ? ` · ${match.reason}` : ""}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#38bdf8", fontFamily: "'DM Mono', monospace" }}>
            {pct}%
          </div>
          <div style={{ fontSize: 10, color: "#475569" }}>MATCH</div>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginBottom: 10, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: gradient,
            borderRadius: 4,
            transition: "width 0.6s ease",
          }}
        />
      </div>

      <button
        onClick={() => onAssign(match.volunteer?._id || match._id)}
        disabled={assigning}
        style={{
          width: "100%",
          padding: "8px 0",
          background: assigning ? "rgba(56,189,248,0.15)" : "rgba(56,189,248,0.12)",
          border: "1px solid rgba(56,189,248,0.4)",
          borderRadius: 7,
          color: "#38bdf8",
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.05em",
          cursor: assigning ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => !assigning && (e.currentTarget.style.background = "rgba(56,189,248,0.25)")}
        onMouseLeave={(e) => !assigning && (e.currentTarget.style.background = "rgba(56,189,248,0.12)")}
      >
        {assigning ? "ASSIGNING..." : `ASSIGN ${rank === 1 ? "⭐ TOP MATCH" : ""}`}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NGODashboard() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedSector, setSelectedSector] = useState("All");
  const [selectedTask, setSelectedTask] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet CSS + JS once
  useEffect(() => {
    if (window.L) { setLeafletLoaded(true); return; }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const url = selectedSector === "All"
        ? `${API_BASE}/api/tasks`
        : `${API_BASE}/api/tasks?sector=${encodeURIComponent(selectedSector)}`;
      const res = await fetch(url);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.tasks ?? [];
      setTasks(list);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("fetchTasks failed:", e);
    }
  }, [selectedSector]);

  // Initial load + 10s polling
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // Apply sector filter locally too (belt + suspenders)
  useEffect(() => {
    setFilteredTasks(
      selectedSector === "All" ? tasks : tasks.filter((t) => t.sector === selectedSector)
    );
  }, [tasks, selectedSector]);

  const handleTaskClick = useCallback(async (task) => {
    setSelectedTask(task);
    setMatches([]);
    setMatchLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/match/${task._id}`);
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : data.matches ?? []);
    } catch (e) {
      console.error("match fetch failed:", e);
    } finally {
      setMatchLoading(false);
    }
  }, []);

  const handleAssign = async (volunteerId) => {
    if (!selectedTask) return;
    setAssigning(true);
    try {
      await fetch(`${API_BASE}/api/tasks/${selectedTask._id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerId }),
      });
      const volunteerName = matches.find(
        (m) => (m.volunteer?._id || m._id) === volunteerId
      )?.volunteer?.name || "Volunteer";
      showToast(`✅ ${volunteerName} assigned successfully`);
      setSelectedTask(null);
      fetchTasks();
    } catch (e) {
      showToast("❌ Assignment failed — try again");
    } finally {
      setAssigning(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openCount = filteredTasks.filter((t) => t.status === "open").length;
  const assignedCount = filteredTasks.filter((t) => t.status === "assigned").length;

  return (
    <>
      {/* Load DM Mono font */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Leaflet popup override */}
      <style>{`
        .uf-popup .leaflet-popup-content-wrapper {
          background: #1e293b;
          border: 1px solid rgba(56,189,248,0.3);
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .uf-popup .leaflet-popup-tip { background: #1e293b; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 4px; }
      `}</style>

      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#0a0f1e",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'DM Mono', monospace",
          color: "#e2e8f0",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            padding: "12px 24px",
            borderBottom: "1px solid rgba(56,189,248,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(10,15,30,0.95)",
            backdropFilter: "blur(8px)",
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "linear-gradient(135deg,#38bdf8,#0ea5e9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🌐
            </div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "0.02em", color: "#f1f5f9" }}>
                UNITYFLOW
              </div>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em" }}>NGO OPERATIONS DASHBOARD</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Stats */}
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "OPEN", value: openCount, color: "#ef4444" },
                { label: "ASSIGNED", value: assignedCount, color: "#f97316" },
                { label: "TOTAL", value: filteredTasks.length, color: "#38bdf8" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "'Syne',sans-serif" }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.08em" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Pulse indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#475569" }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22c55e",
                  animation: "pulse 2s infinite",
                }}
              />
              LIVE · {lastRefresh ? lastRefresh.toLocaleTimeString() : "—"}
            </div>
          </div>
        </header>

        {/* ── Sector filter strip ── */}
        <div
          style={{
            padding: "8px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            gap: 8,
            overflowX: "auto",
          }}
        >
          {SECTORS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSector(s)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: `1px solid ${selectedSector === s ? "#38bdf8" : "rgba(255,255,255,0.1)"}`,
                background: selectedSector === s ? "rgba(56,189,248,0.15)" : "transparent",
                color: selectedSector === s ? "#38bdf8" : "#64748b",
                fontSize: 11,
                fontFamily: "'DM Mono',monospace",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                letterSpacing: "0.04em",
              }}
            >
              {s !== "All" ? `${SECTOR_ICONS[s]} ` : ""}{s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── Body: map + sidebar ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Map (70%) */}
          <div style={{ flex: "0 0 70%", position: "relative" }}>
            {leafletLoaded ? (
              <LeafletMap
                tasks={filteredTasks}
                selectedTask={selectedTask}
                onTaskClick={handleTaskClick}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#475569",
                  fontSize: 13,
                  gap: 10,
                }}
              >
                <div style={{ width: 18, height: 18, border: "2px solid #38bdf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Loading map...
              </div>
            )}
          </div>

          {/* Sidebar (30%) */}
          <div
            style={{
              flex: "0 0 30%",
              borderLeft: "1px solid rgba(56,189,248,0.1)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "rgba(10,15,30,0.8)",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontSize: 10,
                color: "#475569",
                letterSpacing: "0.1em",
              }}
            >
              TASK QUEUE — {filteredTasks.length} ITEMS
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {filteredTasks.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#334155", fontSize: 12 }}>
                  No tasks found
                </div>
              ) : (
                filteredTasks
                  .slice()
                  .sort((a, b) => (b.urgency || 0) - (a.urgency || 0))
                  .map((task) => {
                    const isSelected = selectedTask?._id === task._id;
                    return (
                      <div
                        key={task._id}
                        onClick={() => handleTaskClick(task)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          marginBottom: 6,
                          cursor: "pointer",
                          border: `1px solid ${isSelected ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.06)"}`,
                          background: isSelected ? "rgba(56,189,248,0.08)" : "rgba(255,255,255,0.02)",
                          transition: "all 0.15s",
                          transform: isSelected ? "translateX(3px)" : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                            e.currentTarget.style.transform = "translateX(2px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                            e.currentTarget.style.transform = "none";
                          }
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>
                            {SECTOR_ICONS[task.sector] || "📍"} {task.sector}
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              color: URGENCY_COLORS[task.urgency] || "#94a3b8",
                              background: `${URGENCY_COLORS[task.urgency]}18`,
                              padding: "2px 6px",
                              borderRadius: 4,
                              border: `1px solid ${URGENCY_COLORS[task.urgency]}44`,
                            }}
                          >
                            {URGENCY_LABELS[task.urgency] || `U${task.urgency}`}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, lineHeight: 1.4 }}>
                          {(task.description || "No description").slice(0, 60)}
                          {(task.description || "").length > 60 ? "…" : ""}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div
                            style={{
                              fontSize: 9,
                              color: STATUS_COLORS[task.status] || "#64748b",
                              letterSpacing: "0.06em",
                              fontWeight: 600,
                            }}
                          >
                            ● {(task.status || "open").toUpperCase()}
                          </div>
                          <div style={{ fontSize: 9, color: "#334155" }}>
                            {task.createdAt ? timeAgo(task.createdAt) : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Match modal ── */}
      {selectedTask && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 1000,
            padding: "0 0 0 0",
          }}
          onClick={(e) => e.target === e.currentTarget && setSelectedTask(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#0f172a",
              border: "1px solid rgba(56,189,248,0.2)",
              borderBottom: "none",
              borderRadius: "16px 16px 0 0",
              padding: "20px 20px 32px",
              animation: "slideUp 0.2s ease",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "#f1f5f9", marginBottom: 2 }}>
                  {SECTOR_ICONS[selectedTask.sector]} {selectedTask.sector}
                </div>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.06em" }}>
                  FIND VOLUNTEER · URGENCY {selectedTask.urgency}/5
                </div>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#475569",
                  fontSize: 20,
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                {selectedTask.description}
              </div>
            )}

            {/* Matches */}
            {matchLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, color: "#475569", fontSize: 12 }}>
                <div style={{ width: 16, height: 16, border: "2px solid #38bdf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Scoring volunteers...
              </div>
            ) : matches.length === 0 ? (
              <div style={{ textAlign: "center", color: "#334155", padding: 24, fontSize: 12 }}>
                No matches found for this task.
              </div>
            ) : (
              matches.map((m, i) => (
                <MatchCard
                  key={m.volunteer?._id || m._id || i}
                  match={m}
                  rank={i + 1}
                  onAssign={handleAssign}
                  assigning={assigning}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 70,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0f172a",
            border: "1px solid rgba(56,189,248,0.4)",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: 13,
            color: "#e2e8f0",
            fontFamily: "'DM Mono',monospace",
            zIndex: 2000,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            animation: "fadeIn 0.2s ease",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
