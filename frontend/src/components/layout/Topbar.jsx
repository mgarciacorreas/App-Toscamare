import { useContext, useState, useEffect } from 'react';
import { AppContext } from '@/context/AppContext';
import { SVG } from '@/components/ui';

function getInitialTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return 'dark';
}

export default function Topbar({ title, subtitle }) {
  const { logout, pedidos } = useContext(AppContext);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const pendingCount = pedidos.length;

  const btnStyle = { width: 36, height: 36, borderRadius: 'var(--r2)', background: 'var(--bg-2)',
    border: '1px solid var(--border-2)', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: 'var(--text-3)', transition: '.15s var(--ease)' };

  return (
    <header style={{ padding: '16px 28px', background: 'var(--bg-1)', borderBottom: '1px solid var(--border-1)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme} className="tooltip" data-tip={theme === 'dark' ? 'Modo día' : 'Modo noche'} style={btnStyle}>
          <SVG name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>

        <div style={{ position: 'relative' }}>
          <button style={btnStyle}>
            <SVG name="bell" size={16} />
          </button>
          {pendingCount > 0 && <span style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16,
            borderRadius: '50%', background: 'var(--accent)', color: '#0A0C10', fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingCount}</span>}
        </div>
        <button onClick={logout} className="tooltip" data-tip="Cerrar sesión" style={btnStyle}>
          <SVG name="logout" size={16} />
        </button>
      </div>
    </header>
  );
}
