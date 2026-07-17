"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  status: string;
  createdAt: string;
  user: { fullName: string; email: string; phone: string; tg: string | null; tgLinked: boolean };
  course: string;
  instructor: string;
  amount: number;
  paymentMethod: string;
  certNumber: string | null;
  certUrl: string | null;
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (tk: string) => {
    setErr(null);
    const res = await fetch("/api/admin/enrollments", {
      headers: { Authorization: `Bearer ${tk}` },
    });
    if (res.status === 401) {
      setErr("Невірний токен / Wrong token");
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setRows(data.enrollments);
    setAuthed(true);
  }, []);

  useEffect(() => {
    const saved = sessionStorage_get();
    if (saved) {
      setToken(saved);
      load(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function action(id: string, kind: "confirm" | "complete") {
    setBusy(id + kind);
    try {
      const res = await fetch(`/api/admin/enrollments/${id}/${kind}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("failed");
      await load(token);
    } catch {
      setErr("Дія не вдалася / Action failed");
    } finally {
      setBusy(null);
    }
  }

  if (!authed) {
    return (
      <main style={S.wrap}>
        <div style={S.card}>
          <h1 style={S.h1}>Адмін-панель</h1>
          <p style={S.muted}>Введіть ADMIN_TOKEN</p>
          <input
            style={S.input}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN"
            type="password"
          />
          {err && <div style={S.err}>{err}</div>}
          <button
            style={S.btn}
            onClick={() => {
              sessionStorage_set(token);
              load(token);
            }}
          >
            Увійти
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ ...S.wrap, alignItems: "start", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 1100 }}>
        <h1 style={S.h1}>Заявки ({rows.length})</h1>
        {err && <div style={S.err}>{err}</div>}
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                {["ПІБ", "Курс", "Інструктор", "Сума", "Статус", "TG", "Сертифікат", "Дії"].map((h) => (
                  <th key={h} style={S.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #26362a" }}>
                  <td style={S.td}>
                    <div>{r.user.fullName}</div>
                    <div style={S.sub}>{r.user.email}</div>
                  </td>
                  <td style={S.td}>{r.course}</td>
                  <td style={S.td}>{r.instructor}</td>
                  <td style={S.td}>{r.amount} грн</td>
                  <td style={S.td}>
                    <span style={statusStyle(r.status)}>{r.status}</span>
                  </td>
                  <td style={S.td}>{r.user.tgLinked ? "✅" : r.user.tg || "—"}</td>
                  <td style={S.td}>
                    {r.certUrl ? (
                      <a href={r.certUrl} target="_blank" style={S.link} rel="noreferrer">
                        {r.certNumber}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {r.status === "pending_payment" && (
                        <button
                          style={S.small}
                          disabled={busy === r.id + "confirm"}
                          onClick={() => action(r.id, "confirm")}
                        >
                          Оплату підтв.
                        </button>
                      )}
                      {(r.status === "paid" || r.status === "in_progress") && (
                        <button
                          style={S.small}
                          disabled={busy === r.id + "complete"}
                          onClick={() => action(r.id, "complete")}
                        >
                          Завершити
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

// sessionStorage запрещён в артефактах claude.ai, но это реальное приложение —
// используем его для удобства админа. Обёрнуто в try/catch на случай SSR.
function sessionStorage_get(): string {
  try {
    return sessionStorage.getItem("admin_token") || "";
  } catch {
    return "";
  }
}
function sessionStorage_set(v: string): void {
  try {
    sessionStorage.setItem("admin_token", v);
  } catch {
    /* ignore */
  }
}

function statusStyle(s: string): React.CSSProperties {
  const map: Record<string, string> = {
    pending_payment: "#caa54a",
    paid: "#8fbf4d",
    in_progress: "#5eb1ff",
    completed: "#c6ff5e",
  };
  return {
    color: "#0b0f0c",
    background: map[s] || "#8ba090",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontFamily: "ui-monospace,monospace",
  };
}

const S: Record<string, React.CSSProperties> = {
  wrap: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0f0c", color: "#e9f0ea" },
  card: { width: 360, background: "#121a14", border: "1px solid #26362a", borderRadius: 16, padding: 28 },
  h1: { color: "#c6ff5e", marginTop: 0 },
  muted: { color: "#8ba090", fontSize: 14 },
  input: { width: "100%", marginTop: 10, padding: "10px 12px", background: "#0d130e", border: "1px solid #26362a", borderRadius: 10, color: "#e9f0ea" },
  btn: { marginTop: 12, width: "100%", padding: "10px", background: "#8fbf4d", color: "#0b0f0c", fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer" },
  small: { padding: "6px 10px", background: "#8fbf4d", color: "#0b0f0c", fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "8px 10px", color: "#8ba090", fontSize: 12, textTransform: "uppercase" },
  td: { padding: "10px", verticalAlign: "top" },
  sub: { color: "#6f8574", fontSize: 12 },
  link: { color: "#c6ff5e" },
  err: { color: "#ff8a8a", fontSize: 13, marginTop: 8 },
};
