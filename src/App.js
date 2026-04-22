import { useState } from 'react';
import NGODashboard from './components/NGODashboard';
import VolunteerApp from './components/VolunteerApp';

const tabs = ['🏛️ NGO Dashboard', '🙋 Volunteer App'];

function App() {
  const [active, setActive] = useState(0);

  return (
    <div style={{ background: '#020817', minHeight: '100vh', fontFamily: 'monospace' }}>
      <nav style={{
        display: 'flex', gap: 0, borderBottom: '1px solid #1e293b',
        background: '#0a0f1e', position: 'sticky', top: 0, zIndex: 9999
      }}>
        <div style={{ padding: '12px 24px', color: '#38bdf8', fontWeight: 700, fontSize: 16, borderRight: '1px solid #1e293b' }}>
          ⚡ UnityFlow
        </div>
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '12px 24px', color: active === i ? '#38bdf8' : '#64748b',
            borderBottom: active === i ? '2px solid #38bdf8' : '2px solid transparent',
            fontFamily: 'monospace', fontSize: 13, fontWeight: active === i ? 700 : 400,
            transition: 'all 0.2s'
          }}>
            {tab}
          </button>
        ))}
      </nav>
      <div>
        {active === 0 && <NGODashboard />}
        {active === 1 && <VolunteerApp />}
      </div>
    </div>
  );
}

export default App;
