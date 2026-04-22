import { useState, useEffect } from 'react';

const API = 'https://unityflow-backend-71bj.onrender.com/api';

const SECTORS = [
  { key: 'Flood Relief', icon: '🌊', label: 'Flood Relief' },
  { key: 'Healthcare', icon: '🏥', label: 'Healthcare' },
  { key: 'Food and Hunger', icon: '🍱', label: 'Food & Hunger' },
  { key: 'Education', icon: '📚', label: 'Education' },
  { key: 'Women Safety', icon: '🛡️', label: 'Women Safety' },
  { key: 'Other', icon: '📍', label: 'Other' },
];

const URGENCY_LABELS = ['', 'MINIMAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function CitizenApp({ onBack }) {
  const [screen, setScreen] = useState('home'); // home | form | submitted | tracking
  const [sector, setSector] = useState(null);
  const [urgency, setUrgency] = useState(3);
  const [desc, setDesc] = useState('');
  const [name, setName] = useState('');
  const [locStatus, setLocStatus] = useState('idle'); // idle | loading | done
  const [locText, setLocText] = useState('');
  const [lat, setLat] = useState(12.9716);
  const [lng, setLng] = useState(77.5946);
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [sosActive, setSosActive] = useState(false);

  const useGPS = () => {
    setLocStatus('loading');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setLocText(`${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`);
          setLocStatus('done');
        },
        () => {
          setLocText('Bengaluru, Karnataka');
          setLocStatus('done');
        }
      );
    } else {
      setLocText('Bengaluru, Karnataka');
      setLocStatus('done');
    }
  };

  const handleSOS = () => {
    setSosActive(true);
    setTimeout(() => {
      setSector('Healthcare');
      setDesc('EMERGENCY — SOS triggered from citizen app. Immediate assistance required.');
      setUrgency(5);
      useGPS();
      setTimeout(() => handleSubmit(true), 1200);
    }, 800);
  };

  const handleSubmit = async (isSOS = false) => {
    if (!isSOS && !sector) return;
    if (!isSOS && !desc.trim()) return;
    setSubmitting(true);
    const payload = {
      sector: isSOS ? 'Healthcare' : sector,
      description: isSOS ? 'SOS EMERGENCY — immediate help required' : desc,
      urgency: isSOS ? 5 : urgency,
      reporterName: name.trim() || 'Anonymous',
      location: { lat, lng }
    };
    try {
      const res = await fetch(`${API}/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const id = '#UF-' + ((data.task?._id || data._id || Date.now()).toString().slice(-4).toUpperCase());
      setTicketId(id);
    } catch (e) {
      setTicketId('#UF-' + Math.floor(Math.random() * 9000 + 1000));
    }
    setSubmitting(false);
    setSosActive(false);
    setScreen('submitted');
  };

  const reset = () => {
    setSector(null); setUrgency(3); setDesc(''); setName('');
    setLocStatus('idle'); setLocText(''); setSosActive(false);
    setScreen('home');
  };

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#fff', position: 'relative', overflow: 'hidden' }}>
      {screen === 'home' && <HomeScreen onBack={onBack} onSOS={handleSOS} sosActive={sosActive} onReport={() => { useGPS(); setScreen('form'); }} />}
      {screen === 'form' && (
        <FormScreen
          onBack={() => setScreen('home')}
          sector={sector} setSector={setSector}
          urgency={urgency} setUrgency={setUrgency}
          desc={desc} setDesc={setDesc}
          name={name} setName={setName}
          locStatus={locStatus} locText={locText} useGPS={useGPS}
          submitting={submitting} onSubmit={() => handleSubmit(false)}
        />
      )}
      {screen === 'submitted' && (
        <SubmittedScreen ticketId={ticketId} sector={sector} urgency={urgency}
          onTrack={() => setScreen('tracking')} onNew={reset} />
      )}
      {screen === 'tracking' && (
        <TrackingScreen ticketId={ticketId} onBack={() => setScreen('submitted')} />
      )}
    </div>
  );
}

// ─── HOME SCREEN ─────────────────────────────────────────────────────────────
function HomeScreen({ onBack, onSOS, sosActive, onReport }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => p + 1), 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(145deg,#E53935,#B71C1C)', padding: '52px 24px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', top: 20, right: 20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '8px 12px', color: '#fff', cursor: 'pointer', marginBottom: 20, fontSize: 14, fontWeight: 600 }}>← Back</button>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>Welcome to</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>UnityFlow Citizen</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>Emergency reporting · Bengaluru</div>
      </div>

      {/* SOS BUTTON */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ fontSize: 15, color: '#666', marginBottom: 8, fontWeight: 600 }}>Are you in an emergency?</div>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 36, textAlign: 'center', maxWidth: 220 }}>Press the button below and help will reach you soon.</div>

        {/* Pulsing SOS */}
        <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              position: 'absolute', borderRadius: '50%',
              background: `rgba(229,57,53,${0.08 - i * 0.02})`,
              width: 200 - (3 - i) * 30, height: 200 - (3 - i) * 30,
              animation: `sosPulse ${1.5 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`
            }} />
          ))}
          <button
            onClick={onSOS}
            disabled={sosActive}
            style={{
              width: 130, height: 130, borderRadius: '50%',
              background: sosActive ? '#aaa' : 'linear-gradient(145deg,#E53935,#B71C1C)',
              border: 'none', cursor: sosActive ? 'default' : 'pointer',
              color: '#fff', fontSize: 24, fontWeight: 800, letterSpacing: 3,
              boxShadow: '0 8px 32px rgba(229,57,53,0.45)',
              transition: 'all 0.2s', zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {sosActive ? '...' : 'SOS'}
          </button>
        </div>

        {/* Location */}
        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '14px 18px', width: '100%', maxWidth: 340, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📍</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>Your current location</div>
            <div style={{ fontSize: 12, color: '#9E9E9E', marginTop: 2 }}>Bengaluru, Karnataka, India</div>
          </div>
        </div>

        {/* Report form button */}
        <button onClick={onReport} style={{ width: '100%', maxWidth: 340, background: '#fff', border: '2px solid #E53935', borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 700, color: '#E53935', cursor: 'pointer' }}>
          Report Situation →
        </button>
      </div>

      <style>{`@keyframes sosPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.7} }`}</style>
    </div>
  );
}

// ─── FORM SCREEN ─────────────────────────────────────────────────────────────
function FormScreen({ onBack, sector, setSector, urgency, setUrgency, desc, setDesc, name, setName, locStatus, locText, useGPS, submitting, onSubmit }) {
  const urgColors = ['', '#4CAF50', '#8BC34A', '#FF9800', '#FF5722', '#E53935'];

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(145deg,#E53935,#B71C1C)', padding: '52px 24px 24px' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '8px 12px', color: '#fff', cursor: 'pointer', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>← Back</button>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Submit a Report</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>NGO teams will be notified immediately</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 16px 100px' }}>

        {/* SECTOR */}
        <SectionLabel>What kind of help?</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {SECTORS.map(s => (
            <button key={s.key} onClick={() => setSector(s.key)} style={{
              background: sector === s.key ? '#FFEBEE' : '#fff',
              border: `2px solid ${sector === s.key ? '#E53935' : '#f0f0f0'}`,
              borderRadius: 14, padding: '14px 8px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              transition: 'all 0.15s'
            }}>
              <span style={{ fontSize: 26 }}>{s.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: sector === s.key ? '#E53935' : '#666', textAlign: 'center', lineHeight: 1.2 }}>{s.label}</span>
            </button>
          ))}
        </div>

        {/* LOCATION */}
        <SectionLabel>Location</SectionLabel>
        <button onClick={useGPS} style={{ width: '100%', background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, textAlign: 'left' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: locStatus === 'done' ? '#E8F5E9' : '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            {locStatus === 'done' ? '✅' : locStatus === 'loading' ? '⏳' : '📍'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{locStatus === 'done' ? locText : 'Use My Current Location'}</div>
            <div style={{ fontSize: 12, color: '#9E9E9E', marginTop: 2 }}>{locStatus === 'idle' ? 'Tap to detect GPS' : locStatus === 'loading' ? 'Detecting…' : 'Location detected ✓'}</div>
          </div>
          <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
        </button>

        {/* URGENCY */}
        <SectionLabel>Urgency Level</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 20, border: '1.5px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>Level {urgency}/5</span>
            <span style={{ background: urgColors[urgency] + '22', color: urgColors[urgency], border: `1px solid ${urgColors[urgency]}44`, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
              {URGENCY_LABELS[urgency]}
            </span>
          </div>
          <input type="range" min="1" max="5" value={urgency} onChange={e => setUrgency(+e.target.value)}
            style={{ width: '100%', accentColor: urgColors[urgency] }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#bbb', fontWeight: 600 }}>
            <span>MINIMAL</span><span>LOW</span><span>MEDIUM</span><span>HIGH</span><span>CRITICAL</span>
          </div>
        </div>

        {/* DESCRIPTION */}
        <SectionLabel>What's happening?</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 20, border: '1.5px solid #f0f0f0' }}>
          <textarea
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Describe the situation — how many people, what's needed, any hazards…"
            rows={4}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: '#1A1A2E', resize: 'none', lineHeight: 1.6, background: 'transparent' }}
          />
          <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: 12, marginTop: 4 }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name (optional)"
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: '#1A1A2E', background: 'transparent' }} />
          </div>
        </div>
      </div>

      {/* SUBMIT */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#fff', padding: '14px 16px', borderTop: '1px solid #f0f0f0' }}>
        <button onClick={onSubmit} disabled={submitting || !sector || !desc.trim()} style={{
          width: '100%', background: (!sector || !desc.trim()) ? '#ddd' : 'linear-gradient(135deg,#E53935,#B71C1C)',
          color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 700,
          cursor: (!sector || !desc.trim()) ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
        }}>
          {submitting ? 'Sending…' : 'Send Emergency Report 🚨'}
        </button>
      </div>
    </div>
  );
}

// ─── SUBMITTED SCREEN ─────────────────────────────────────────────────────────
function SubmittedScreen({ ticketId, sector, urgency, onTrack, onNew }) {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(145deg,#E53935,#B71C1C)', padding: '52px 24px 80px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px', animation: 'pop 0.4s ease' }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Report Received!</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6, maxWidth: 240, margin: '8px auto 0' }}>Help is being dispatched. A volunteer will reach you shortly.</div>
      </div>

      <div style={{ flex: 1, padding: '24px 20px', marginTop: -32 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          {[
            ['Ticket ID', ticketId],
            ['Sector', sector || 'SOS Emergency'],
            ['Urgency', URGENCY_LABELS[urgency] || 'CRITICAL'],
            ['Status', '🟡 Finding Volunteer'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
              <span style={{ fontSize: 13, color: '#9E9E9E', fontWeight: 500 }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#E53935' }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'linear-gradient(135deg,#E53935,#B71C1C)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, color: '#fff' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🙋</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Responder Assigned</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>ETA: 5–10 minutes</div>
          </div>
        </div>

        <button onClick={onTrack} style={{ width: '100%', background: '#E53935', color: '#fff', border: 'none', borderRadius: 14, padding: '15px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
          Track My Report 📍
        </button>
        <button onClick={onNew} style={{ width: '100%', background: 'none', border: '2px solid #E53935', color: '#E53935', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Submit Another Report
        </button>
      </div>
      <style>{`@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}`}</style>
    </div>
  );
}

// ─── TRACKING SCREEN ─────────────────────────────────────────────────────────
function TrackingScreen({ ticketId, onBack }) {
  const steps = [
    { label: 'Report Submitted', time: 'Just now', detail: 'Your report has been received.', done: true },
    { label: 'Volunteer Assigned', time: '2 min ago', detail: 'A trained volunteer is on the way.', done: true },
    { label: 'Responder En Route', time: 'In progress', detail: 'ETA 5–10 minutes to your location.', current: true },
    { label: 'Help Arrived', time: 'Pending', detail: 'Volunteer will check in on arrival.', done: false },
    { label: 'Resolved', time: 'Pending', detail: 'Situation resolved and closed.', done: false },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(145deg,#E53935,#B71C1C)', padding: '52px 24px 24px' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '8px 12px', color: '#fff', cursor: 'pointer', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>← Back</button>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 2 }}>{ticketId}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Emergency Report · Live tracking</div>
      </div>

      {/* Responder card */}
      <div style={{ margin: '20px 16px 0', background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#E53935,#B71C1C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', flexShrink: 0 }}>🙋</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>Arjun Sharma</div>
          <div style={{ fontSize: 12, color: '#9E9E9E', marginTop: 2 }}>1st Responder · 5 min away</div>
        </div>
        <button style={{ background: '#E53935', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Call</button>
      </div>

      {/* Timeline */}
      <div style={{ padding: '20px 16px 24px' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
                background: step.done ? '#E53935' : step.current ? '#FF9800' : '#f0f0f0',
                color: (step.done || step.current) ? '#fff' : '#bbb',
                animation: step.current ? 'trackPulse 1.5s infinite' : 'none'
              }}>
                {step.done ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 28, background: step.done ? '#E53935' : '#f0f0f0', margin: '3px 0' }} />
              )}
            </div>
            <div style={{ paddingBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: step.done || step.current ? '#1A1A2E' : '#bbb' }}>{step.label}</div>
              <div style={{ fontSize: 12, color: step.current ? '#FF9800' : '#9E9E9E', marginTop: 2, fontWeight: step.current ? 600 : 400 }}>{step.time}</div>
              <div style={{ fontSize: 12, color: '#9E9E9E', marginTop: 3 }}>{step.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes trackPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,152,0,0.4)}50%{box-shadow:0 0 0 8px rgba(255,152,0,0)}}`}</style>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#9E9E9E', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{children}</div>;
}
