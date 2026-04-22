import { useState, useEffect, useRef, useCallback } from "react";

const API = "https://unityflow-backend.onrender.com/api";
const SECTOR_ICONS = { "Flood Relief":"🌊", Healthcare:"🏥", "Women Safety":"🛡️", "Food & Hunger":"🍱", "Food and Hunger":"🍱", Education:"📚" };
const URGENCY_LABEL = ["","MINIMAL","LOW","MEDIUM","HIGH","CRITICAL"];
const URGENCY_COLOR = ["","#64748b","#3b82f6","#f59e0b","#f97316","#ef4444"];
const STATUS_COLOR = { open:"#ef4444", assigned:"#f59e0b", completed:"#22c55e" };

function LeafletMap({ tasks, selectedTask, onTaskClick }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef({});
  useEffect(() => {
    if (leafletMap.current || !mapRef.current) return;
    const L = window.L;
    leafletMap.current = L.map(mapRef.current, { center:[12.9716,77.5946], zoom:12 });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { attribution:"©OpenStreetMap ©CartoDB", subdomains:"abcd", maxZoom:19 }
    ).addTo(leafletMap.current);
  }, []);
  useEffect(() => {
    if (!leafletMap.current || !window.L) return;
    const L = window.L;
    tasks.forEach((task) => {
      const isSelected = selectedTask?._id === task._id;
      const color = STATUS_COLOR[task.status] || "#64748b";
      const size = isSelected ? 22 : 16;
      const icon = L.divIcon({
        className:"",
        html:`<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${isSelected?"3px solid #38bdf8":"2px solid rgba(255,255,255,0.4)"};box-shadow:0 0 ${isSelected?16:8}px ${color}88;"></div>`,
        iconSize:[size,size], iconAnchor:[size/2,size/2],
      });
      const lat = task.latitude ?? 12.9716;
      const lng = task.longitude ?? 77.5946;
      if (markersRef.current[task._id]) {
        markersRef.current[task._id].setIcon(icon);
        markersRef.current[task._id].setLatLng([lat,lng]);
      } else {
        const marker = L.marker([lat,lng],{icon})
          .addTo(leafletMap.current)
          .bindPopup(`<b>${task.sector}</b><br/>Urgency: ${task.urgency}/5<br/>Status: ${task.status}`)
          .on("click",()=>onTaskClick(task));
        markersRef.current[task._id] = marker;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, selectedTask]);
  return <div ref={mapRef} style={{width:"100%",height:"100%"}} />;
}

function MatchModal({ task, onClose, onAssigned }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [toast, setToast] = useState(null);
  useEffect(() => {
    fetch(`${API}/match/${task._id}`).then(r=>r.json()).then(d=>{setMatches(d);setLoading(false);}).catch(()=>setLoading(false));
  }, [task._id]);
  const assign = async (vid, vname) => {
    setAssigning(vid);
    try {
      const res = await fetch(`${API}/assign`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({task_id:task._id,volunteer_id:vid})});
      if (res.ok) { setToast(`✅ Assigned to ${vname}`); setTimeout(()=>{setToast(null);onAssigned();onClose();},1800); }
      else { setToast("❌ Failed"); setTimeout(()=>setToast(null),2000); }
    } catch { setToast("❌ Network error"); setTimeout(()=>setToast(null),2000); }
    setAssigning(null);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:9999}} onClick={onClose}>
      <div style={{background:"#0f172a",border:"1px solid rgba(56,189,248,0.25)",borderRadius:"16px 16px 0 0",width:"100%",maxWidth:520,padding:"24px 24px 32px",animation:"slideUp 0.22s ease",maxHeight:"70vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        {toast && <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:"#1e293b",border:"1px solid #38bdf8",color:"#38bdf8",padding:"10px 20px",borderRadius:8,fontFamily:"monospace",zIndex:10000}}>{toast}</div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{color:"#94a3b8",fontSize:11,fontFamily:"monospace",letterSpacing:2,marginBottom:4}}>VOLUNTEER MATCH</div>
            <div style={{color:"#f1f5f9",fontSize:16,fontWeight:700}}>{SECTOR_ICONS[task.sector]} {task.sector} · URGENCY {task.urgency}/5</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#64748b",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        {loading ? <div style={{color:"#64748b",textAlign:"center",padding:32}}>Finding matches…</div>
        : matches.length===0 ? <div style={{color:"#64748b",textAlign:"center",padding:32}}>No volunteers available</div>
        : matches.map((m,i) => {
          const pct = Math.min(100, Math.round(m.score ?? 0));
          const initials = (m.volunteer_name||"V").split(" ").map(w=>w[0]).join("").slice(0,2);
          return (
            <div key={m.volunteer_id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:10,padding:"14px 16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#38bdf8,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:13}}>{initials}</div>
                  <div>
                    <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{m.volunteer_name} {i===0&&<span style={{color:"#fbbf24",fontSize:12}}>⭐ TOP</span>}</div>
                    <div style={{color:"#64748b",fontSize:12,fontFamily:"monospace"}}>{m.reason_text||`${m.distance_km?.toFixed(1)} km away`}</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{color:"#38bdf8",fontWeight:700,fontSize:16,fontFamily:"monospace"}}>{pct}%</div>
                  <div style={{color:"#64748b",fontSize:10}}>MATCH</div>
                </div>
              </div>
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:4,height:4,marginBottom:10}}>
                <div style={{height:"100%",borderRadius:4,background:"linear-gradient(90deg,#38bdf8,#22c55e)",width:`${pct}%`}} />
              </div>
              <button onClick={()=>assign(m.volunteer_id,m.volunteer_name)} disabled={assigning===m.volunteer_id} style={{width:"100%",padding:"8px 0",background:assigning===m.volunteer_id?"#1e293b":"linear-gradient(90deg,#0ea5e9,#38bdf8)",border:"none",borderRadius:6,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"monospace",letterSpacing:1}}>
                {assigning===m.volunteer_id?"ASSIGNING…":"ASSIGN VOLUNTEER"}
              </button>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

export default function NGODashboard() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [matchTask, setMatchTask] = useState(null);
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/tasks`);
      const data = await res.json();
      setTasks(data);
      setLastRefresh(new Date());
    } catch(e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchTasks();
    const id = setInterval(fetchTasks, 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sectors = ["ALL",...new Set(tasks.map(t=>t.sector))];
  const filtered = sectorFilter==="ALL" ? tasks : tasks.filter(t=>t.sector===sectorFilter);
  const sorted = [...filtered].sort((a,b)=>b.urgency-a.urgency);
  const counts = { open:tasks.filter(t=>t.status==="open").length, assigned:tasks.filter(t=>t.status==="assigned").length, completed:tasks.filter(t=>t.status==="completed").length };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#020817",color:"#f1f5f9",fontFamily:"'DM Mono','Fira Code',monospace"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 24px",background:"rgba(15,23,42,0.95)",borderBottom:"1px solid rgba(56,189,248,0.15)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20}}>⚡</span>
          <div>
            <div style={{fontSize:14,fontWeight:700,letterSpacing:3,color:"#38bdf8"}}>UNITYFLOW</div>
            <div style={{fontSize:10,color:"#64748b",letterSpacing:2}}>NGO OPERATIONS DASHBOARD</div>
          </div>
        </div>
        <div style={{display:"flex",gap:24,alignItems:"center"}}>
          {[["OPEN",counts.open,"#ef4444"],["ASSIGNED",counts.assigned,"#f59e0b"],["DONE",counts.completed,"#22c55e"]].map(([label,count,color])=>(
            <div key={label} style={{textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:700,color}}>{count}</div>
              <div style={{fontSize:9,color:"#64748b",letterSpacing:2}}>{label}</div>
            </div>
          ))}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:20}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",animation:"pulse 2s infinite"}} />
            <span style={{fontSize:11,color:"#22c55e"}}>LIVE · {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,padding:"10px 24px",background:"rgba(15,23,42,0.8)",borderBottom:"1px solid rgba(56,189,248,0.08)",overflowX:"auto"}}>
        {sectors.map(s=>(
          <button key={s} onClick={()=>setSectorFilter(s)} style={{padding:"4px 14px",borderRadius:20,border:`1px solid ${sectorFilter===s?"#38bdf8":"rgba(255,255,255,0.1)"}`,background:sectorFilter===s?"rgba(56,189,248,0.15)":"transparent",color:sectorFilter===s?"#38bdf8":"#64748b",fontSize:11,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",letterSpacing:1}}>
            {s==="ALL"?"ALL SECTORS":`${SECTOR_ICONS[s]||""} ${s}`}
          </button>
        ))}
      </div>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div style={{flex:1,position:"relative"}}>
          {leafletReady ? <LeafletMap tasks={filtered} selectedTask={selectedTask} onTaskClick={setSelectedTask} />
          : <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#64748b"}}>Loading map…</div>}
        </div>
        <div style={{width:320,overflowY:"auto",borderLeft:"1px solid rgba(56,189,248,0.12)",background:"rgba(15,23,42,0.95)"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(56,189,248,0.08)",fontSize:10,color:"#64748b",letterSpacing:2}}>TASKS BY URGENCY — {sorted.length}</div>
          {sorted.map(task=>{
            const isSelected = selectedTask?._id===task._id;
            const urgColor = URGENCY_COLOR[task.urgency]||"#64748b";
            return (
              <div key={task._id} onClick={()=>setSelectedTask(isSelected?null:task)}
                style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer",background:isSelected?"rgba(56,189,248,0.08)":"transparent",borderLeft:isSelected?"2px solid #38bdf8":"2px solid transparent",transition:"all 0.15s"}}
                onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.transform="translateX(3px)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{SECTOR_ICONS[task.sector]||"📍"} {task.sector}</div>
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:`${urgColor}22`,color:urgColor,border:`1px solid ${urgColor}44`,letterSpacing:1}}>{URGENCY_LABEL[task.urgency]}</span>
                </div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:6,lineHeight:1.4}}>{task.description?.slice(0,60)}{task.description?.length>60?"…":""}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:10,color:"#475569"}}>📍 {task.latitude?.toFixed(4)}, {task.longitude?.toFixed(4)}</span>
                  <span style={{fontSize:10,color:STATUS_COLOR[task.status]||"#64748b",letterSpacing:1}}>● {task.status?.toUpperCase()}</span>
                </div>
                {isSelected && task.status==="open" && (
                  <button onClick={e=>{e.stopPropagation();setMatchTask(task);}} style={{marginTop:10,width:"100%",padding:"7px 0",background:"linear-gradient(90deg,#0ea5e9,#38bdf8)",border:"none",borderRadius:6,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1,fontFamily:"inherit"}}>
                    FIND VOLUNTEER · URGENCY {task.urgency}/5
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {matchTask && <MatchModal task={matchTask} onClose={()=>setMatchTask(null)} onAssigned={fetchTasks} />}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}`}</style>
    </div>
  );
}
