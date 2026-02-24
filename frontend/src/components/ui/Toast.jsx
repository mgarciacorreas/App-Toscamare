import SVG from './SVG';

export default function Toast({ toast }) {
  if (!toast) return null;
  const colors = { success:'var(--success)', error:'var(--danger)', info:'var(--info)' };
  const icon = toast.type === 'error' ? 'alert' : toast.type === 'info' ? 'info' : 'checkCirc';
  return (
    <div className="anim-slide" style={{ position:'fixed', bottom:24, right:24, padding:'12px 20px', zIndex:300,
      background:'var(--bg-3)', border:'1px solid '+(colors[toast.type]||'var(--border-2)'),
      borderRadius:'var(--r2)', boxShadow:'var(--shadow)', display:'flex', alignItems:'center', gap:10, maxWidth:400 }}>
      <SVG name={icon} size={18} color={colors[toast.type]} />
      <span style={{ fontSize:13, fontWeight:500 }}>{toast.msg}</span>
    </div>
  );
}