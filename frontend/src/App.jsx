import { useState, useEffect, useCallback } from "react";
import { api } from "./api";
import "./App.css";

// ── Іконки ──────────────────────────────────────────────────────────────────
const Icon = ({ d }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);
const IconTrash = () => <Icon d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />;
const IconPlus = () => <Icon d="M12 5v14M5 12h14" />;
const IconRun = () => <Icon d="M5 3l14 9-14 9V3z" />;
const IconTrophy = () => (
  <Icon d="M6 2h12v6a6 6 0 01-12 0V2zM6 8c0 6 12 6 12 0M9 22v-4M15 22v-4M7 22h10" />
);

// ── Таб-навігація ────────────────────────────────────────────────────────────
const TABS = [
  { id: "matrix", label: "Матриця оцінок" },
  { id: "alts", label: "Альтернативи" },
  { id: "criteria", label: "Критерії" },
  { id: "result", label: "Результат" },
];

export default function App() {
  const [tab, setTab] = useState("matrix");
  const [alternatives, setAlts] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [evaluations, setEvals] = useState([]);
  const [result, setResult] = useState(null);
  const [method, setMethod] = useState("saw");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const [a, c, e] = await Promise.all([
      api.getAlternatives(),
      api.getCriteria(),
      api.getEvaluations(),
    ]);
    setAlts(a);
    setCriteria(c);
    setEvals(e);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // ── Матриця ────────────────────────────────────────────────────────────────
  const getVal = (altId, critId) => {
    const ev = evaluations.find(
      (e) => e.alternative_id?._id === altId && e.criterion_id === critId,
    );
    return ev ? ev.value : "";
  };

  const handleCell = async (altId, critId, value) => {
    if (value === "" || isNaN(Number(value))) return;
    await api.upsertEvaluation({
      alternative_id: altId,
      criterion_id: critId,
      value: Number(value),
    });
    reload();
  };

  // ── Аналіз ─────────────────────────────────────────────────────────────────
  const runAnalysis = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await api.analyze(method);
      if (r.error) {
        setError(r.error);
      } else {
        setResult(r);
        setTab("result");
      }
    } catch {
      setError("Помилка з'єднання з сервером");
    }
    setLoading(false);
  };

  // ── Форма альтернативи ─────────────────────────────────────────────────────
  const [altForm, setAltForm] = useState({ name: "", description: "" });
  const addAlt = async () => {
    if (!altForm.name) return;
    await api.addAlternative(altForm);
    setAltForm({ name: "", description: "" });
    reload();
  };

  // ── Форма критерію ─────────────────────────────────────────────────────────
  const [critForm, setCritForm] = useState({
    criterion_id: "",
    name: "",
    type: "maximize",
    weight: "",
  });
  const addCrit = async () => {
    if (!critForm.name || !critForm.criterion_id || !critForm.weight) return;
    await api.addCriterion({
      ...critForm,
      criterion_id: Number(critForm.criterion_id),
      weight: Number(critForm.weight),
    });
    setCritForm({ criterion_id: "", name: "", type: "maximize", weight: "" });
    reload();
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🏋️</span>
            <div>
              <h1>GymDSS</h1>
              <p>Система підтримки вибору спортзалу</p>
            </div>
          </div>
          <div className="analyze-bar">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="select"
            >
              <option value="saw">SAW</option>
              <option value="topsis">TOPSIS</option>
            </select>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="btn btn-primary"
            >
              <IconRun /> {loading ? "Обчислення..." : "Аналізувати"}
            </button>
          </div>
        </div>
        {error && <div className="error-bar">{error}</div>}
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {/* ── МАТРИЦЯ ── */}
        {tab === "matrix" && (
          <section className="card">
            <h2 className="card-title">Матриця оцінювання</h2>
            {alternatives.length === 0 || criteria.length === 0 ? (
              <p className="hint">
                Додайте альтернативи та критерії, щоб заповнити матрицю.
              </p>
            ) : (
              <div className="table-wrap">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Альтернатива</th>
                      {criteria.map((c) => (
                        <th key={c.criterion_id}>
                          <div>{c.name}</div>
                          <span className={`badge ${c.type}`}>
                            {c.type === "maximize" ? "↑" : "↓"} w={c.weight}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alternatives.map((alt) => (
                      <tr key={alt._id}>
                        <td className="alt-name">{alt.name}</td>
                        {criteria.map((c) => (
                          <td key={c.criterion_id}>
                            <input
                              type="number"
                              className="cell-input"
                              defaultValue={getVal(alt._id, c.criterion_id)}
                              onBlur={(e) =>
                                handleCell(
                                  alt._id,
                                  c.criterion_id,
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── АЛЬТЕРНАТИВИ ── */}
        {tab === "alts" && (
          <section className="card">
            <h2 className="card-title">Альтернативи</h2>
            <div className="form-row">
              <input
                placeholder="Назва спортзалу"
                value={altForm.name}
                onChange={(e) =>
                  setAltForm((p) => ({ ...p, name: e.target.value }))
                }
                className="input"
              />
              <input
                placeholder="Опис"
                value={altForm.description}
                onChange={(e) =>
                  setAltForm((p) => ({ ...p, description: e.target.value }))
                }
                className="input"
              />
              <button onClick={addAlt} className="btn btn-primary">
                <IconPlus /> Додати
              </button>
            </div>
            <ul className="list">
              {alternatives.map((alt) => (
                <li key={alt._id} className="list-item">
                  <div>
                    <strong>{alt.name}</strong>
                    {alt.description && (
                      <span className="muted"> — {alt.description}</span>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      await api.deleteAlternative(alt._id);
                      reload();
                    }}
                    className="btn btn-ghost"
                  >
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── КРИТЕРІЇ ── */}
        {tab === "criteria" && (
          <section className="card">
            <h2 className="card-title">Критерії</h2>
            <div className="form-row">
              <input
                placeholder="ID (число)"
                type="number"
                value={critForm.criterion_id}
                onChange={(e) =>
                  setCritForm((p) => ({ ...p, criterion_id: e.target.value }))
                }
                className="input input-sm"
              />
              <input
                placeholder="Назва критерію"
                value={critForm.name}
                onChange={(e) =>
                  setCritForm((p) => ({ ...p, name: e.target.value }))
                }
                className="input"
              />
              <select
                value={critForm.type}
                onChange={(e) =>
                  setCritForm((p) => ({ ...p, type: e.target.value }))
                }
                className="select"
              >
                <option value="maximize">Maximize ↑</option>
                <option value="minimize">Minimize ↓</option>
              </select>
              <input
                placeholder="Вага"
                type="number"
                value={critForm.weight}
                onChange={(e) =>
                  setCritForm((p) => ({ ...p, weight: e.target.value }))
                }
                className="input input-sm"
              />
              <button onClick={addCrit} className="btn btn-primary">
                <IconPlus /> Додати
              </button>
            </div>
            <ul className="list">
              {criteria.map((c) => (
                <li key={c._id} className="list-item">
                  <div className="crit-info">
                    <strong>{c.name}</strong>
                    <span className={`badge ${c.type}`}>
                      {c.type === "maximize" ? "Maximize ↑" : "Minimize ↓"}
                    </span>
                    <span className="muted">вага: {c.weight}</span>
                  </div>
                  <button
                    onClick={async () => {
                      await api.deleteCriterion(c._id);
                      reload();
                    }}
                    className="btn btn-ghost"
                  >
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── РЕЗУЛЬТАТ ── */}
        {tab === "result" && (
          <section className="card">
            <h2 className="card-title">Результат аналізу</h2>
            {!result ? (
              <p className="hint">
                Натисніть «Аналізувати» щоб отримати результат.
              </p>
            ) : (
              <>
                <div className="winner-block">
                  <IconTrophy />
                  <div>
                    <div className="winner-label">
                      Найкращий вибір ({result.method.toUpperCase()})
                    </div>
                    <div className="winner-name">{result.winner.name}</div>
                    <div className="winner-score">
                      Інтегральна оцінка: {result.winner.score}
                    </div>
                  </div>
                </div>

                <h3 className="subtitle">Рейтинг</h3>
                <div className="ranking">
                  {result.ranked.map((r, i) => (
                    <div
                      key={r._id}
                      className={`rank-item ${i === 0 ? "rank-first" : ""}`}
                    >
                      <span className="rank-pos">#{i + 1}</span>
                      <span className="rank-name">{r.name}</span>
                      <div className="rank-bar-wrap">
                        <div
                          className="rank-bar"
                          style={{ width: `${r.score * 100}%` }}
                        />
                      </div>
                      <span className="rank-score">{r.score}</span>
                    </div>
                  ))}
                </div>

                {result.ranked[0].breakdown && (
                  <>
                    <h3 className="subtitle">Деталізація переможця</h3>
                    <div className="table-wrap">
                      <table className="matrix-table">
                        <thead>
                          <tr>
                            <th>Критерій</th>
                            <th>Сире значення</th>
                            <th>Нормалізоване</th>
                            <th>Вага</th>
                            <th>Внесок</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.ranked[0].breakdown.map((b) => (
                            <tr key={b.criterion}>
                              <td>{b.criterion}</td>
                              <td>{b.raw}</td>
                              <td>{b.normalized}</td>
                              <td>{b.weight}</td>
                              <td>
                                <strong>{b.contribution}</strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <h3 className="subtitle">Пояснення</h3>
                <pre className="explanation">{result.explanation}</pre>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
