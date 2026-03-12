import SVG from './SVG';

export default function Modal({ open, onClose, title, wide, fullScreen, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.6)',
      backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding: fullScreen ? 0 : 20 }}>
      <div className="anim-scale" onClick={e=>e.stopPropagation()} style={{ background:'var(--bg-2)',
        border: fullScreen ? 'none' : '1px solid var(--border-2)', borderRadius: fullScreen ? 0 : 'var(--r3)', width:'100%',
        maxWidth: fullScreen ? '100vw' : (wide?720:520), maxHeight: fullScreen ? '100vh' : '85vh', height: fullScreen ? '100vh' : 'auto',
        display:'flex', flexDirection:'column', boxShadow:'0 8px 48px rgba(0,0,0,.5)' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border-1)', display:'flex',
          alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <h3 style={{ fontSize:16, fontWeight:600 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text-3)' }}>
            <SVG name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: fullScreen ? '20px' : '20px 22px', overflowY:'auto', flex:1, display: 'flex', flexDirection: 'column' }}>{children}</div>
      </div>
    </div>
  );
}