import { useState, useEffect, useRef } from "react";

const API = "https://unityflow-backend.onrender.com/api";

const SECTOR_CONFIG = {
  "Healthcare":     { icon: "🏥", color: "#f43f5e" },
  "Flood Relief":   { icon: "🌊", color: "#38bdf8" },
  "Food & Hunger":  { icon: "🍱", color: "#fb923c" },
  "Food and Hunger":{ icon: "🍱", color: "#fb923c" },
  "Education":      { icon: "📚", color: "#a78bfa" },
  "Women Safety":   { icon: "🛡️", color: "#f472b6" },
};

const URGENCY_COLOR = {
  5: "#ef4444",
  4: "#f97316",
  3: "#eab308",
  2: "#22c55e",
  1: "#6b7280",
};

const URGENCY_LABEL = {
  5: "CRITICAL",
  4: "HIGH",
  3: "MEDIUM",
  2: "LOW",
  1: "MINIMAL",
};

const STATUS_COLOR = {
  open: "#ef4444",
  assigned: "#f97316",
  completed: "#22c55e",
};

export default function NGODashboard() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState("All");
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});

  // Load Leaflet from CDN
  useEffect(() => {
    if (window.L) { initMap(); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = initMap;
    document.head.appendChild(script);
  }, []);

  function initMap() {
    if (leafletMapRef.current || !mapRef.current) return;
    const map = window.L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: false,
    });
    window.L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "©OpenStreetMap ©CartoDB",
      maxZoom: 19,
    }).addTo(map);
    window.L.control.zoom({ position: "bottomright" }).addTo(map);
    leafletMapRef.current = map;
  }

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API}/tasks`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.tasks || [];
      setTasks(list);
      setLastRefresh(new Date());
      setLoading(false);
      updateMarkers(list);
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, []);

  function updateMarkers(taskList) {
    if (!leafletMapRef.current || !window.L) return;
    // Remove old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    taskList.forEach(task => {
      const lat = task.location?.lat || task.lat;
      const lng = task.location?.lng || task.lng;
      if (!lat || !lng) return;
      const color = STATUS_COLOR[task.status] || "#ef4444";
      const icon = window.L.divIcon({
        className: "",
        html: `<div style="
          width:18px;height:18px;border-radius:50%;
          background:${color};
          border:2px solid rgba(255,255,255,0.8);
          box-shadow:0 0 10px ${color}aa;
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const sector = task.sector || "";
      const cfg = SECTOR_CONFIG[sector] || { icon: "📌" };
      const marker = window.L.marker([lat, lng], { icon })
        .addTo(leafletMapRef.current)
        .bindPopup(`
          <div style="font-family:monospace;min-width:160px">
            <div style="font-weight:bold">${cfg.icon} ${sector}</div>
            <div style="font-size:11px;margin-top:4px;opacity:0.8">${task.description?.slice(0, 60) || ""}...</div>
            <div style="margin-top:6px;font-size:11px">
              <span style="color:${URGENCY_COLOR[task.urgency] || '#888'}">URGENCY ${task.urgency}/5</span>
              &nbsp;·&nbsp;
              <span style="text-transform:uppercase">${task.status}</span>
            </div>
          </div>
        `);
      markersRef.current[task._id] = marker;
    });
  }

  // Highlight selected marker
  useEffect(() => {
    if (!window.L || !leafletMapRef.current) return;
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const isSelected = selectedTask && id === (selectedTask._id || selectedTask.id);
      const task = tasks.find(t => (t._id || t.id) === id);
      if (!task) return;
      const color = STATUS_COLOR[task.status] || "#ef4444";
      const size = isSelected ? 26 : 18;
      const icon = window.L.divIcon({
        className: "",
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};
          border:${isSelected ? "3px solid #38bdf8" : "2px solid rgba(255,255,255,0.8)"};
          box-shadow:0 0 ${isSelected ? 20 : 10}px ${color}aa;
          transition:all 0.2s;
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      marker.setIcon(icon);
    });
  }, [selectedTask]);

  const openMatch = async (task) => {
    setSelectedTask(task);
    setModalOpen(true);
    setMatches([]);
    setMatchLoading(true);
    const id = task._id || task.id;
    try {
      const res = await fetch(`${API}/match/${id}`);
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : data.matches || []);
    } catch (e) {}
    setMatchLoading(false);
    // Pan map to task
    const lat = task.location?.lat || task.lat;
    const lng = task.location?.lng || task.lng;
    if (lat && lng && leafletMapRef.current) {
      leafletMapRef.current.setView([lat, lng], 14, { animate: true });
    }
  };

  const assignVolunteer = async (volunteer) => {
    const id = selectedTask?._id || selectedTask?.id;
    const vid = volunteer._id || volunteer.id || volunteer.volunteerId;
    try {
      await fetch(`${API}/tasks/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerId: vid }),
      });
      showToast(`✅ ${volunteer.name} assigned successfully`);
      setModalOpen(false);
      fetchTasks();
    } catch (e) {
      showToast("❌ Assignment failed");
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const sectors = ["All", ...Object.keys(SECTOR_CONFIG).filter(s => !s.includes("and"))];
  const filteredTasks = sectorFilter === "All"
    ? tasks
    : tasks.filter(t => t.sector === sectorFilter || t.sector === sectorFilter.replace("& ", "and "));

  const sortedTasks = [...filteredTasks].sort((a, b) => (b.urgency || 0) - (a.urgency || 0));

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'DM Mono', 'Courier New', monospace",
      overflow: "hidden",
    }}>
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        .task-card:hover { transform: translateX(3px); border-color: #38bdf8 !important; box-shadow: 0 0 12px #38bdf820; }
        .assign-btn:hover { background: #0ea5e9 !important; }
        @keyframes slideUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes scoreBar { from { width: 0 } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", borderBottom: "1px solid #1e293b",
        background: "#070d1a", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg,#38bdf8,#0ea5e9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: 2, color: "#38bdf8" }}>UNITYFLOW</div>
            <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1 }}>NGO LEADER DASHBOARD</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 10, color: "#475569" }}>
            <span style={{ animation: "pulse 2s infinite", display: "inline-block", color: "#22c55e", marginRight: 6 }}>●</span>
            LIVE · {lastRefresh.toLocaleTimeString()}
          </div>
          <div style={{
            fontSize: 11, color: "#38bdf8", background: "#0f172a",
            border: "1px solid #1e293b", borderRadius: 6, padding: "4px 10px",
          }}>
            {tasks.length} TASKS
          </div>
        </div>
      </div>

      {/* Sector filter bar */}
      <div style={{
        display: "flex", gap: 8, padding: "10px 20px",
        borderBottom: "1px solid #1e293b", background: "#070d1a",
        flexShrink: 0, overflowX: "auto",
      }}>
        {sectors.map(s => {
          const cfg = SECTOR_CONFIG[s];
          const active = sectorFilter === s;
          return (
            <button key={s} onClick={() => setSectorFilter(s)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 20, fontSize: 11,
              border: `1px solid ${active ? "#38bdf8" : "#1e293b"}`,
              background: active ? "#0f172a" : "transparent",
              color: active ? "#38bdf8" : "#64748b",
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}>
              {cfg ? cfg.icon : "🗂️"} {s}
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Map */}
        <div ref={mapRef} style={{ flex: 1, position: "relative", minWidth: 0 }}>
          {loading && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "#0a0f1e", zIndex: 999, flexDirection: "column", gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, border: "3px solid #1e293b",
                borderTop: "3px solid #38bdf8", borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }} />
              <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2 }}>LOADING MAP...</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
          {/* Legend */}
          <div style={{
            position: "absolute", bottom: 40, left: 12, zIndex: 1000,
            background: "#070d1aee", border: "1px solid #1e293b",
            borderRadius: 8, padding: "10px 14px", fontSize: 10,
            backdropFilter: "blur(8px)",
          }}>
            {[["open","#ef4444","OPEN"],["assigned","#f97316","ASSIGNED"],["completed","#22c55e","DONE"]].map(([,c,l]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <div style={{ width:10,height:10,borderRadius:"50%",background:c,boxShadow:`0 0 6px ${c}` }} />
                <span style={{ color:"#64748b" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{
          width: 320, borderLeft: "1px solid #1e293b",
          background: "#070d1a", display: "flex", flexDirection: "column",
          overflow: "hidden", flexShrink: 0,
        }}>
          <div style={{
            padding: "12px 16px", borderBottom: "1px solid #1e293b",
            fontSize: 10, color: "#475569", letterSpacing: 2,
            display: "flex", justifyContent: "space-between",
          }}>
            <span>TASKS BY URGENCY</span>
            <span style={{ color: "#38bdf8" }}>{sortedTasks.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {sortedTasks.length === 0 && !loading && (
              <div style={{ padding: 24, textAlign: "center", color: "#475569", fontSize: 12 }}>
                No tasks found
              </div>
            )}
            {sortedTasks.map(task => {
              const sector = task.sector || "";
              const cfg = SECTOR_CONFIG[sector] || { icon: "📌", color: "#64748b" };
              const urg = task.urgency || 1;
              const isSelected = selectedTask && (selectedTask._id || selectedTask.id) === (task._id || task.id);
              return (
                <div
                  key={task._id || task.id}
                  className="task-card"
                  onClick={() => openMatch(task)}
                  style={{
                    padding: "12px", marginBottom: 6, borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${isSelected ? "#38bdf8" : "#1e293b"}`,
                    background: isSelected ? "#0f172a" : "#0a0f1e",
                    transition: "all 0.15s",
                    boxShadow: isSelected ? "0 0 12px #38bdf820" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                      <span style={{ fontSize: 11, color: cfg.color, fontWeight: 500 }}>{sector}</span>
                    </div>
                    <span style={{
                      fontSize: 9, padding: "2px 6px", borderRadius: 4,
                      background: `${URGENCY_COLOR[urg]}22`,
                      color: URGENCY_COLOR[urg], fontWeight: 500, letterSpacing: 1,
                    }}>
                      {URGENCY_LABEL[urg]}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, lineHeight: 1.4 }}>
                    {(task.description || "").slice(0, 70)}...
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: "#475569" }}>
                      📍 {(task.location?.lat || task.lat || 0).toFixed(4)}, {(task.location?.lng || task.lng || 0).toFixed(4)}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: STATUS_COLOR[task.status] || "#6b7280",
                        boxShadow: `0 0 4px ${STATUS_COLOR[task.status] || "#6b7280"}`,
                      }} />
                      <span style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>{task.status}</span>
                    </div>
                  </div>
                  <button style={{
                    marginTop: 8, width: "100%", padding: "7px",
                    background: "#0f172a", border: "1px solid #1e293b",
                    borderRadius: 6, color: "#38bdf8", fontSize: 10,
                    cursor: "pointer", letterSpacing: 1, transition: "all 0.15s",
                  }}
                  onMouseEnter={e => e.target.style.background="#38bdf820"}
                  onMouseLeave={e => e.target.style.background="#0f172a"}
                  >
                    🎯 FIND VOLUNTEER
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Match Modal */}
      {modalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 2000,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          background: "#00000088",
        }} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div style={{
            width: "100%", maxWidth: 520,
            background: "#070d1a", borderRadius: "16px 16px 0 0",
            border: "1px solid #1e293b", borderBottom: "none",
            animation: "slideUp 0.2s ease",
            maxHeight: "70vh", display: "flex", flexDirection: "column",
          }}>
            {/* Modal header */}
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid #1e293b",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 500 }}>
                  {SECTOR_CONFIG[selectedTask?.sector]?.icon} VOLUNTEER MATCH
                </div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                  {selectedTask?.sector} · URGENCY {selectedTask?.urgency}/5
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} style={{
                background: "none", border: "none", color: "#475569",
                cursor: "pointer", fontSize: 18, lineHeight: 1,
              }}>×</button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
              {matchLoading && (
                <div style={{ textAlign: "center", padding: 32, color: "#475569", fontSize: 12 }}>
                  <div style={{
                    width: 28, height: 28, border: "2px solid #1e293b",
                    borderTop: "2px solid #38bdf8", borderRadius: "50%",
                    animation: "spin 1s linear infinite", margin: "0 auto 12px",
                  }} />
                  FINDING BEST MATCHES...
                </div>
              )}
              {!matchLoading && matches.length === 0 && (
                <div style={{ textAlign: "center", padding: 24, color: "#475569", fontSize: 12 }}>
                  No volunteers available
                </div>
              )}
              {matches.map((m, i) => {
                const pct = Math.round((m.score || m.totalScore || 0) * 100);
                const name = m.name || m.volunteer?.name || "Volunteer";
                const dist = m.distance || m.distanceKm || "?";
                const reason = m.reason || m.matchReason || `Skill match + ${dist}km away`;
                return (
                  <div key={i} style={{
                    padding: "14px", marginBottom: 10, borderRadius: 10,
                    border: `1px solid ${i === 0 ? "#38bdf8" : "#1e293b"}`,
                    background: i === 0 ? "#0f172a" : "#0a0f1e",
                    animation: "fadeIn 0.3s ease",
                    animationDelay: `${i * 0.08}s`, animationFillMode: "both",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "linear-gradient(135deg,#38bdf8,#0ea5e9)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 500, color: "#fff",
                          }}>{name[0]}</div>
                          <span style={{ fontSize: 13, color: "#e2e8f0" }}>{name}</span>
                          {i === 0 && <span style={{ fontSize: 9, color: "#fbbf24", letterSpacing: 1 }}>⭐ TOP</span>}
                        </div>
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 4, marginLeft: 34 }}>
                          {typeof dist === "number" ? `${dist.toFixed(1)} km away` : dist} · {reason}
                        </div>
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 500, color: "#38bdf8" }}>{pct}%</span>
                    </div>
                    {/* Score bar */}
                    <div style={{
                      height: 4, background: "#1e293b", borderRadius: 2,
                      marginBottom: 10, overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        background: `linear-gradient(90deg, #38bdf8, #22c55e)`,
                        width: `${pct}%`,
                        animation: "scoreBar 0.6s ease",
                        animationDelay: `${i * 0.08}s`,
                        animationFillMode: "both",
                      }} />
                    </div>
                    <button
                      className="assign-btn"
                      onClick={() => assignVolunteer(m.volunteer || m)}
                      style={{
                        width: "100%", padding: "8px", borderRadius: 6,
                        background: "#38bdf8", border: "none", color: "#0a0f1e",
                        fontSize: 11, fontWeight: 500, cursor: "pointer",
                        letterSpacing: 1, transition: "background 0.15s",
                      }}
                    >
                      ASSIGN {name.toUpperCase()}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#0f172a", border: "1px solid #22c55e",
          color: "#22c55e", padding: "10px 20px", borderRadius: 8,
          fontSize: 12, zIndex: 3000, animation: "fadeIn 0.2s ease",
          boxShadow: "0 0 20px #22c55e30",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
