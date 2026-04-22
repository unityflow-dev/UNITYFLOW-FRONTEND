import { useState } from 'react';
import NGODashboard from './components/NGODashboard';
import VolunteerApp from './components/VolunteerApp';
import CitizenForm from './components/CitizenForm';

const TABS = [
  { id: 'citizen',   label: '🆘 Citizen Report' },
  { id: 'ngo',       label: '🗺 NGO Dashboard' },
  { id: 'volunteer', label: '👤 Volunteer App' },
];

function App() {
  const [active, setActive] = useState('citizen');
  const mono = "'DM Mono','Fira Code',monospace";

  return (
    <div style={{ background: '#020817', minHeight: '100vh', fontFamily: mono }}>
      <nav style={{
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid #1e293b',
        background: '#0a0f1e',
        position: 'sticky', top: 0, zIndex: 9999,
        height: 56,
      }}>
        <div style={{
          padding: '0 24px', color: '#38bdf8', fontWeight: 700,
          fontSize: 15, borderRight: '1px solid #1e293b',
          letterSpacing: 2, height: '100%', display: 'flex', alignItems: 'center'
        }}>
          ⚡ UNITYFLOW
        </div>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActive(tab.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0 20px', height: '100%',
            color: active === tab.id ? '#38bdf8' : '#64748b',
            borderBottom: active === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
            fontFamily: mono, fontSize: 13,
            fontWeight: active === tab.id ? 700 : 400,
            transition: 'all 0.2s', letterSpacing: 0.5,
          }}>
            {tab.label}
          </button>
        ))}
      </nav>

      {active === 'citizen'   && <CitizenForm />}
      {active === 'ngo'       && <NGODashboard />}
      {active === 'volunteer' && <VolunteerApp />}
    </div>
  );
}

export default App;
