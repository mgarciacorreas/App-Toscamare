export default function Badge({ color, bg, border, children, style:s }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:'var(--r1)',
      fontSize:11, fontWeight:600, letterSpacing:'.02em', color, background: bg||color+'14',
      border:'1px solid '+(border||color+'30'), ...s }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:color, boxShadow:'0 0 6px '+color+'50' }} />
      {children}
    </span>
  );
}