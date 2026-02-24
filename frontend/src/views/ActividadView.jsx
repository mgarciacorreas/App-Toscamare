import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { formatDateTime } from "@/utils/helpers";
import { SVG } from "@/components/ui";

export default function ActividadView() {
  const { db } = useContext(AppContext);
  return (
    <div style={{ padding: 28 }}>
      <p style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 16 }}>
        {db.log_actividad.length} entradas
      </p>
      <div
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border-1)",
          borderRadius: "var(--r3)",
          overflow: "hidden",
        }}
      >
        {db.log_actividad.map((log, i) => (
          <div
            key={log.id}
            className={"anim-fade d" + Math.min(i + 1, 8)}
            style={{
              padding: "14px 20px",
              borderBottom:
                i < db.log_actividad.length - 1
                  ? "1px solid var(--border-1)"
                  : "none",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                flexShrink: 0,
                background:
                  log.tipo === "estado"
                    ? "var(--accent-dim)"
                    : "var(--info)" + "14",
                border:
                  "1px solid " +
                  (log.tipo === "estado"
                    ? "var(--accent-border)"
                    : "var(--info)30"),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SVG
                name={log.tipo === "estado" ? "activity" : "user"}
                size={15}
                color={log.tipo === "estado" ? "var(--accent)" : "var(--info)"}
              />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{log.usuario}</span>
                <span style={{ color: "var(--text-3)" }}> — {log.accion}</span>
              </p>
              <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>
                {log.detalle}
              </p>
            </div>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-4)",
                whiteSpace: "nowrap",
              }}
            >
              {formatDateTime(log.timestamp)}
            </span>
          </div>
        ))}
        {db.log_actividad.length === 0 && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--text-4)",
              fontSize: 13,
            }}
          >
            Sin actividad
          </div>
        )}
      </div>
    </div>
  );
}
