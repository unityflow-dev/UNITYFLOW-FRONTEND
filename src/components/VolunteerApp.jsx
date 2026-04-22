import { useState, useEffect, useCallback } from "react";

const API = "https://unityflow-backend-71bj.onrender.com/api";
const SECTOR_ICONS = { "Flood Relief":"🌊", Healthcare:"🏥", "Women Safety":"🛡️", "Food & Hunger":"🍱", "Food and Hunger":"🍱", Education:"📚" };
const URGENCY_LABEL = ["","MINIMAL","LOW","MEDIUM","HIGH","CRITICAL"];
const URGENCY_COLOR = ["","#64748b","#3b82f6","#f59e0b","#f97316","#ef4444"];

function getInitials(name) {
  return (name || "V").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function UrgencyBadge({ urgency }) {
  const color = URGENCY_COLOR[urgency] || "#64748b";
  return (
    <span style={{
      fontSize: 9, padding: "2px 7px", borderRadius: 10,
      background: `${color}22`, color, border: `1px solid ${color}44`,
      letterSpacing: 1, fontFamily: "inherit"
    }}>
      {URGENCY_LABEL[urgency]}
    </span>
  );
}

function TaskCard({ task, onAccept, onDecline, onComplete, mode }) {
  const [acting, setActing] = useState(false);

  const handleAccept = async () => {
    setActing(true);
    await onAccept(task);
    setActing(false);
  };

  const handleComplete = async () => {
    setActing(true);
    await onComplete(task);
    setActing(false);
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(56,189,248,0.15)",
      borderRadius: 12,
      padding: "14px 16px",
      marginBottom: 12,
      animation: "fadeIn 0.2s ease"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{SECTOR_ICONS[task.sector] || "📍"}</span>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13 }}>{task.sector}</div>
            <div style={{ color: "#475569", fontSize: 10, fontFamily: "monospace" }}>
              📍 {task.latitude?.toFixed(4)}, {task.longitude?.toFixed(4)}
            </div>
          </div>
        </div>
        <UrgencyBadge urgency={task.urgency} />
      </div>

      <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
        {task.description}
      </div>

      {mode === "incoming" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleAccept}
            disabled={acting}
            style={{
              flex: 1, padding: "8px 0",
              background: acting ? "#1e293b" : "linear-gradient(90deg,#0ea5e9,#38bdf8)",
              border: "none", borderRadius: 6, color: "#fff",
              fontWeight: 700, fontSize: 12, cursor: "pointer",
              fontFamily: "inherit", letterSpacing: 1
            }}>
            {acting ? "…" : "✅ ACCEPT"}
          </button>
          <button
            onClick={() => onDecline(task)}
            disabled={acting}
            style={{
              flex: 1, padding: "8px 0",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 6, color: "#ef4444",
              fontWeight: 700, fontSize: 12, cursor: "pointer",
              fontFamily: "inherit", letterSpacing: 1
            }}>
            ❌ DECLINE
          </button>
        </div>
      )}

      {mode === "active" && (
        <button
          onClick={handleComplete}
          disabled={acting}
          style={{
            width: "100%", padding: "10px 0",
            background: acting ? "#1e293b" : "linear-gradient(90deg,#16a34a,#22c55e)",
            border: "none", borderRadius: 6, color: "#fff",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
            fontFamily: "inherit", letterSpacing: 1
          }}>
          {acting ? "UPDATING…" : "✅ MARK COMPLETE"}
        </button>
      )}

      {mode === "history" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          color: "#22c55e", fontSize: 11
        }}>
          <span>✅</span>
          <span>COMPLETED · {task.completedAt ? new Date(task.completedAt).toLocaleString() : "Earlier"}</span>
        </div>
      )}
    </div>
  );
}

export default function VolunteerApp() {
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("incoming");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/tasks`);
      const data = await res.json();
      setTasks(data.tasks || data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    // Fetch volunteers from backend
    const loadVolunteers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/volunteers`);
        const data = await res.json();
        setVolunteers(data);
      } catch {
        // Fallback demo volunteers if endpoint not available
        setVolunteers([
          { _id: "v1", name: "Arjun Sharma", skills: ["Flood Relief"], available: true },
          { _id: "v2", name: "Priya Nair", skills: ["Healthcare"], available: true },
          { _id: "v3", name: "Nikhil Shetty", skills: ["Flood Relief"], available: true },
          { _id: "v4", name: "Sneha Rao", skills: ["Education"], available: true },
          { _id: "v5", name: "Vikram Das", skills: ["Food & Hunger"], available: false },
        ]);
      }
      setLoading(false);
    };
    loadVolunteers();
  }, []);

  useEffect(() => {
    if (!selectedVolunteer) return;
    fetchTasks();
    const id = setInterval(fetchTasks, 10000);
    return () => clearInterval(id);
  }, [selectedVolunteer, fetchTasks]);

  const incomingTasks = tasks.filter(t => t.status === "open");
  const activeTasks = tasks.filter(t =>
    t.status === "assigned" && (t?.assigned_volunteer_id === selectedVolunteer?._id)
  );
  const historyTasks = tasks.filter(t =>
    t.status === "completed" && (t?.assigned_volunteer_id === selectedVolunteer?._id)
  );

  const handleAccept = async (task) => {
    try {
      const res = await fetch(`${API}/tasks/${task._id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerId: selectedVolunteer._id })
      });
      if (res.ok) {
        showToast(`✅ Task accepted!`);
        fetchTasks();
        setActiveTab("active");
      } else {
        showToast("❌ Failed to accept");
      }
    } catch { showToast("❌ Network error"); }
  };

  const handleDecline = (task) => {
    showToast("Task declined");
  };

  const handleComplete = async (task) => {
    try {
      const res = await fetch(`${API}/tasks/${task._id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        showToast("🎉 Task completed!");
        fetchTasks();
        setActiveTab("history");
      } else {
        showToast("❌ Failed to update");
      }
    } catch { showToast("❌ Network error"); }
  };

  const TABS = [
    { key: "incoming", label: "INCOMING", count: incomingTasks.length, color: "#ef4444" },
    { key: "active",   label: "ACTIVE",   count: activeTasks.length,   color: "#f59e0b" },
    { key: "history",  label: "HISTORY",  count: historyTasks.length,  color: "#22c55e" },
  ];

  const currentTasks = {
    incoming: incomingTasks,
    active: activeTasks,
    history: historyTasks,
  }[activeTab];

  // LOGIN SCREEN
  if (!selectedVolunteer) {
    return (
      <div style={{
        minHeight: "100vh", background: "#020817",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "24px",
        fontFamily: "'DM Mono','Fira Code',monospace", color: "#f1f5f9"
      }}>
        {toast && (
          <div style={{
            position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
            background: "#1e293b", border: "1px solid #38bdf8", color: "#38bdf8",
            padding: "10px 20px", borderRadius: 8, fontFamily: "monospace", zIndex: 10000
          }}>{toast}</div>
        )}

        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 3, color: "#38bdf8" }}>UNITYFLOW</div>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginTop: 4 }}>VOLUNTEER PORTAL</div>
          </div>

          <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 16 }}>
            SELECT YOUR PROFILE
          </div>

          {loading ? (
            <div style={{ color: "#64748b", textAlign: "center", padding: 32 }}>Loading volunteers…</div>
          ) : (
            volunteers.map(v => (
              <div
                key={v._id}
                onClick={() => setSelectedVolunteer(v)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", marginBottom: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(56,189,248,0.15)",
                  borderRadius: 10, cursor: "pointer",
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(56,189,248,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "linear-gradient(135deg,#38bdf8,#818cf8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0
                }}>
                  {getInitials(v.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{v.name}</div>
                  <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                    {(v.skills || []).join(", ")}
                  </div>
                </div>
                <div style={{
                  fontSize: 10, padding: "3px 8px", borderRadius: 10,
                  background: v.available ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)",
                  color: v.available ? "#22c55e" : "#64748b",
                  border: `1px solid ${v.available ? "rgba(34,197,94,0.3)" : "rgba(100,116,139,0.2)"}`,
                  letterSpacing: 1
                }}>
                  {v.available ? "● AVAILABLE" : "○ OFFLINE"}
                </div>
              </div>
            ))
          )}
        </div>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  // MAIN VOLUNTEER APP
  return (
    <div style={{
      minHeight: "100vh", background: "#020817",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'DM Mono','Fira Code',monospace", color: "#f1f5f9"
    }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#1e293b", border: "1px solid #38bdf8", color: "#38bdf8",
          padding: "10px 20px", borderRadius: 8, fontFamily: "monospace", zIndex: 10000,
          animation: "fadeIn 0.2s ease"
        }}>{toast}</div>
      )}

      <div style={{
        width: "100%", maxWidth: 480,
        display: "flex", flexDirection: "column", minHeight: "100vh"
      }}>
        {/* HEADER */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          background: "rgba(15,23,42,0.95)",
          borderBottom: "1px solid rgba(56,189,248,0.15)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg,#38bdf8,#818cf8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 13
            }}>
              {getInitials(selectedVolunteer.name)}
            </div>
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>{selectedVolunteer.name}</div>
              <div style={{ color: "#22c55e", fontSize: 10, letterSpacing: 1 }}>● ACTIVE</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 1 }}>⚡ UNITYFLOW</div>
            <button
              onClick={() => setSelectedVolunteer(null)}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.1)",
                color: "#64748b", fontSize: 11, cursor: "pointer",
                padding: "4px 10px", borderRadius: 6, fontFamily: "inherit"
              }}>
              LOGOUT
            </button>
          </div>
        </div>

        {/* TABS */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid rgba(56,189,248,0.08)",
          background: "rgba(15,23,42,0.8)"
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: "12px 8px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : "2px solid transparent",
                color: activeTab === tab.key ? tab.color : "#64748b",
                fontSize: 10, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", letterSpacing: 1,
                transition: "all 0.15s"
              }}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  marginLeft: 6, background: `${tab.color}22`,
                  color: tab.color, border: `1px solid ${tab.color}44`,
                  borderRadius: 10, padding: "1px 6px", fontSize: 9
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TASK LIST */}
        <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
          {currentTasks.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "60px 20px",
              color: "#475569", textAlign: "center"
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>
                {activeTab === "incoming" ? "🎉" : activeTab === "active" ? "✅" : "📋"}
              </div>
              <div style={{ fontSize: 12, letterSpacing: 1 }}>
                {activeTab === "incoming" ? "NO OPEN TASKS" :
                 activeTab === "active" ? "NO ACTIVE TASKS" :
                 "NO COMPLETED TASKS YET"}
              </div>
            </div>
          ) : (
            currentTasks.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                mode={activeTab === "history" ? "history" : activeTab}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onComplete={handleComplete}
              />
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px }
      `}</style>
    </div>
  );
}
