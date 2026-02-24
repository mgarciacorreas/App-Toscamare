export default function Select({ label, options = [], style: ws, ...rest }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...ws }}>
      {label && (
        <label
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-3)",
            letterSpacing: ".02em",
          }}
        >
          {label}
        </label>
      )}
      <select
        {...rest}
        style={{
          padding: "9px 13px",
          background: "var(--bg-1)",
          border: "1px solid var(--border-2)",
          borderRadius: "var(--r2)",
          color: "var(--text-1)",
          fontSize: 13,
          ...(rest.style || {}),
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
