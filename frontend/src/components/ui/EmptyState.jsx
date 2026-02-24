import SVG from "./SVG";

export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div
      className="anim-fade"
      style={{
        textAlign: "center",
        padding: "60px 20px",
        color: "var(--text-3)",
      }}
    >
      <SVG name={icon} size={44} color="var(--text-4)" />
      <p
        style={{
          marginTop: 14,
          fontSize: 15,
          fontWeight: 500,
          color: "var(--text-2)",
        }}
      >
        {title}
      </p>
      {subtitle && <p style={{ marginTop: 4, fontSize: 13 }}>{subtitle}</p>}
    </div>
  );
}
