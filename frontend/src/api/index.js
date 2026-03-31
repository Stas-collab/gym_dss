const BASE = "http://localhost:5000/api";

const get = (url) => fetch(BASE + url).then((r) => r.json());
const post = (url, body) =>
  fetch(BASE + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());
const del = (url) =>
  fetch(BASE + url, { method: "DELETE" }).then((r) => r.json());

export const api = {
  getAlternatives: () => get("/alternatives"),
  addAlternative: (data) => post("/alternatives", data),
  deleteAlternative: (id) => del(`/alternatives/${id}`),

  getCriteria: () => get("/criteria"),
  addCriterion: (data) => post("/criteria", data),
  deleteCriterion: (id) => del(`/criteria/${id}`),

  getEvaluations: () => get("/evaluations"),
  upsertEvaluation: (data) => post("/evaluations", data),

  analyze: (method) => post("/analyze", { method }),
};
