export default function Input({ label, error, style:ws, ...rest }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, ...ws }}>
      {label && <label style={{ fontSize:12, fontWeight:500, color:'var(--text-3)', letterSpacing:'.02em' }}>{label}</label>}
      <input {...rest} style={{ padding:'9px 13px', background:'var(--bg-1)', border:'1px solid '+(error?'var(--danger)':'var(--border-2)'),
        borderRadius:'var(--r2)', color:'var(--text-1)', fontSize:13, transition:'.15s var(--ease)', ...(rest.style||{}) }}
        onFocus={e=>e.target.style.borderColor='var(--accent)'}
        onBlur={e=>e.target.style.borderColor=error?'var(--danger)':'var(--border-2)'} />
      {error && <span style={{ fontSize:11, color:'var(--danger)' }}>{error}</span>}
    </div>
  );
}