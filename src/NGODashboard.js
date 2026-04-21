import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./NGODashboard.css";

const API = "https://unityflow-backend.onrender.com";

const SECTOR_COLORS = {
  "Flood Relief":  "#3b82f6",
  "Healthcare":    "#ef4444",
  "Food & Hunger": "#f97316",
  "Education":     "#8b5cf6",
  "Women Safety":  "#ec4899",
};

const URGENCY_COLOR = (u) => {
  if (u >= 4) return "#ef4444"; // red
  if (u === 3) return "#f97316"; // orange
  return "#22c55e";              // green
};

const URGENCY_LABEL = (u) => {
  if (u >= 4) return "CRITICAL";
  if (u === 3) return "MEDIUM";
  return "LOW";
};

function RecenterMap({ tasks }) {
  const map = useMap();
  useEffect(() => {
    if (tasks.length > 0) {
      map.setView([tasks[0].latitude, tasks[0].longitude], 12);
    }
  }, [tasks, map]);
  return null;
}

export default function NGODashboard() {
  const [tasks, setTasks]             = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [selected, setSelected]       = useState(null);
  const [matches, setMatches]         = useState([]);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [activeSector, setActiveSector] = useState("All");
  const [assignedTasks, setAssignedTasks] = useState({});
  const pollRef = useRef(null);

  const SECTORS = ["All", "Flood Relief", "Healthcare", "Food & Hunger", "Education", "Women Safety"];

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API}/api/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  // Poll every 10 seconds
  useEffect(() => {
    fetchTasks();
    pollRef.current = setInterval(fetchTasks, 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  // Filter by sector
  useEffect(() => {
    if (activeSector === "All") setFiltered(tasks);
    else setFiltered(tasks.filter(t => t.sector === activeSector));
  }, [tasks, activeSector]);

  const findVolunteers = async (task) => {
    setSelected(task);
    setMatches([]);
    setLoadingMatch(true);
    try {
      const res = await fetch(`${API}/api/match/${task._id}`);
      const data = await res.json();
      setMatches(data);
    } catch (err) {
      console.error("Match failed", err);
    }
    setLoadingMatch(false);
  };

  const assignVolunteer = async (taskId, volunteerId, volunteerName) => {
    try {
      await fetch(`${API}/api/tasks/${taskId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteer_id: volunteerId }),
      });
      setAssignedTasks(prev => ({ ...prev, [taskId]: volunteerName }));
      setMatches([]);
      setSelected(null);
      fetchTasks();
    } catch (err) {
      console.error("Assign failed", err);
    }
  };

  const getMarkerColor = (task) => {
    if (task.status === "completed") return "#22c55e";
    if (task.status === "assigned")  return "#f97316";
    return URGENCY_COLOR(task.urgency);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <span className="logo-dot" />
          <h1>UnityFlow <span>NGO Command</span></h1>
        </div>
        <div className="header-right">
          <span className="live-badge">● LIVE</span>
          <span className="task-count">{tasks.length} Active Tasks</span>
        </div>
      </div>

      <div className="dashboard-body">
        {/* Sidebar */}
        <div className="sidebar">
          {/* Sector filters */}
          <div className="sector-filters">
            {SECTORS.map(s => (
              <button
                key={s}
                className={`sector-btn ${activeSector === s ? "active" : ""}`}
                style={activeSector === s && s !== "All"
                  ? { borderColor: SECTOR_COLORS[s], color: SECTOR_COLORS[s] }
                  : {}}
                onClick={() => setActiveSector(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Task list */}
          <div className="task-list">
            {filtered.length === 0 && (
              <div className="empty">No tasks found</div>
            )}
            {filtered.map(task => (
              <div
                key={task._id}
                className={`task-card ${selected?._id === task._id ? "task-card-active" : ""}`}
                onClick={() => findVolunteers(task)}
              >
                <div className="task-card-top">
                  <span
                    className="sector-badge"
                    style={{ background: SECTOR_COLORS[task.sector] + "22", color: SECTOR_COLORS[task.sector] }}
                  >
                    {task.sector}
                  </span>
                  <span
                    className="urgency-badge"
                    style={{ background: URGENCY_COLOR(task.urgency) + "22", color: URGENCY_COLOR(task.urgency) }}
                  >
                    {URGENCY_LABEL(task.urgency)}
                  </span>
                </div>
                <p className="task-desc">{task.description}</p>
                <div className="task-meta">
                  <span>{task.reporter_name}</span>
                  <span className={`status-dot status-${task.status}`}>{task.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="map-wrapper">
          <MapContainer
            center={[12.9716, 77.5946]}
            zoom={12}
            className="leaflet-map"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap tasks={filtered} />
            {filtered.map(task => (
              <CircleMarker
                key={task._id}
                center={[task.latitude, task.longitude]}
                radius={task.urgency * 3 + 6}
                fillColor={getMarkerColor(task)}
                color={getMarkerColor(task)}
                fillOpacity={0.75}
                weight={2}
                eventHandlers={{ click: () => findVolunteers(task) }}
              >
                <Popup>
                  <strong>{task.sector}</strong><br />
                  {task.description}<br />
                  <em>Urgency: {task.urgency}/5</em>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Legend */}
          <div className="map-legend">
            <div className="legend-item"><span style={{background:"#ef4444"}} />Critical (4-5)</div>
            <div className="legend-item"><span style={{background:"#f97316"}} />Medium (3)</div>
            <div className="legend-item"><span style={{background:"#22c55e"}} />Low (1-2)</div>
          </div>
        </div>
      </div>

      {/* Volunteer Match Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Find Volunteer</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-task-info">
              <span className="sector-badge" style={{ background: SECTOR_COLORS[selected.sector] + "22", color: SECTOR_COLORS[selected.sector] }}>
                {selected.sector}
              </span>
              <p>{selected.description}</p>
            </div>

            {loadingMatch && <div className="loading">Matching volunteers...</div>}

            {!loadingMatch && matches.map((m, i) => (
              <div key={m.volunteer_id} className="match-card">
                <div className="match-rank">#{i + 1}</div>
                <div className="match-info">
                  <div className="match-name">{m.volunteer_name}</div>
                  <div className="match-reason">{m.reason_text}</div>
                </div>
                <div className="match-score-block">
                  <div className="match-score">{m.score}%</div>
                  <button
                    className="assign-btn"
                    onClick={() => assignVolunteer(selected._id, m.volunteer_id, m.volunteer_name)}
                  >
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
