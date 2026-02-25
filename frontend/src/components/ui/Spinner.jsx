export default function Spinner() {
  return <div style={{ display:'inline-block', width:18, height:18, border:'2px solid var(--border-2)',
    borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .6s linear infinite' }} />;
}