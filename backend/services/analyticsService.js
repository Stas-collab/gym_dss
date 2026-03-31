/**
 * Аналітичний блок СППР
 * Реалізує два методи згортки:
 *   1. SAW  — Simple Additive Weighting
 *   2. TOPSIS — Technique for Order Preference by Similarity to Ideal Solution
 */

// ── Спільні утиліти ──────────────────────────────────────────────────────────

/**
 * Нормалізація значення за мінімаксом з урахуванням типу критерію.
 * maximize → (v - min) / (max - min)
 * minimize → (max - v) / (max - min)
 */
function normalizeMinMax(value, min, max, type) {
  if (max === min) return 1;
  return type === "maximize"
    ? (value - min) / (max - min)
    : (max - value) / (max - min);
}

// ── SAW ──────────────────────────────────────────────────────────────────────

/**
 * @param {Array} alternatives  [{ _id, name, description }]
 * @param {Array} criteria      [{ criterion_id, name, type, weight }]
 * @param {Array} evaluations   [{ alternative_id, criterion_id, value }]
 * @returns {Array} ranked results
 */
function saw(alternatives, criteria, evaluations) {
  // Загальна сума ваг для нормалізації ваг
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);

  // Побудова матриці: matrix[altId][critId] = value
  const matrix = {};
  for (const alt of alternatives) matrix[alt._id.toString()] = {};
  for (const ev of evaluations) {
    matrix[ev.alternative_id.toString()][ev.criterion_id] = ev.value;
  }

  // Мін/макс по кожному критерію
  const stats = {};
  for (const c of criteria) {
    const vals = alternatives.map(
      (a) => matrix[a._id.toString()][c.criterion_id] ?? 0,
    );
    stats[c.criterion_id] = { min: Math.min(...vals), max: Math.max(...vals) };
  }

  const results = alternatives.map((alt) => {
    const id = alt._id.toString();
    let score = 0;
    const breakdown = [];

    for (const c of criteria) {
      const raw = matrix[id][c.criterion_id] ?? 0;
      const { min, max } = stats[c.criterion_id];
      const norm = normalizeMinMax(raw, min, max, c.type);
      const w = c.weight / totalWeight;
      const contrib = norm * w;
      score += contrib;
      breakdown.push({
        criterion: c.name,
        raw,
        normalized: +norm.toFixed(4),
        weight: +w.toFixed(4),
        contribution: +contrib.toFixed(4),
      });
    }

    return {
      _id: alt._id,
      name: alt.name,
      description: alt.description,
      score: +score.toFixed(4),
      breakdown,
    };
  });

  return results.sort((a, b) => b.score - a.score);
}

// ── TOPSIS ───────────────────────────────────────────────────────────────────

/**
 * Векторна нормалізація + зважена матриця + ідеальні рішення
 */
function topsis(alternatives, criteria, evaluations) {
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);

  const matrix = {};
  for (const alt of alternatives) matrix[alt._id.toString()] = {};
  for (const ev of evaluations) {
    matrix[ev.alternative_id.toString()][ev.criterion_id] = ev.value;
  }

  // Векторна нормалізація: v_ij / sqrt(sum(v_ij^2))
  const normFactors = {};
  for (const c of criteria) {
    const vals = alternatives.map(
      (a) => matrix[a._id.toString()][c.criterion_id] ?? 0,
    );
    normFactors[c.criterion_id] =
      Math.sqrt(vals.reduce((s, v) => s + v * v, 0)) || 1;
  }

  // Зважена нормалізована матриця
  const weighted = {};
  for (const alt of alternatives) {
    const id = alt._id.toString();
    weighted[id] = {};
    for (const c of criteria) {
      const raw = matrix[id][c.criterion_id] ?? 0;
      const w = c.weight / totalWeight;
      weighted[id][c.criterion_id] = (raw / normFactors[c.criterion_id]) * w;
    }
  }

  // Ідеальне позитивне (A+) та негативне (A-) рішення
  const ideal = {},
    antiIdeal = {};
  for (const c of criteria) {
    const vals = alternatives.map(
      (a) => weighted[a._id.toString()][c.criterion_id],
    );
    ideal[c.criterion_id] =
      c.type === "maximize" ? Math.max(...vals) : Math.min(...vals);
    antiIdeal[c.criterion_id] =
      c.type === "maximize" ? Math.min(...vals) : Math.max(...vals);
  }

  const results = alternatives.map((alt) => {
    const id = alt._id.toString();
    let dPlus = 0,
      dMinus = 0;

    for (const c of criteria) {
      const v = weighted[id][c.criterion_id];
      dPlus += Math.pow(v - ideal[c.criterion_id], 2);
      dMinus += Math.pow(v - antiIdeal[c.criterion_id], 2);
    }

    dPlus = Math.sqrt(dPlus);
    dMinus = Math.sqrt(dMinus);
    const score = dMinus / (dPlus + dMinus) || 0;

    return {
      _id: alt._id,
      name: alt.name,
      description: alt.description,
      score: +score.toFixed(4),
      dPlus: +dPlus.toFixed(4),
      dMinus: +dMinus.toFixed(4),
    };
  });

  return results.sort((a, b) => b.score - a.score);
}

// ── Пояснення рішення ────────────────────────────────────────────────────────

function explainResult(ranked, method) {
  const winner = ranked[0];
  const lines = [
    `Метод: ${method.toUpperCase()}`,
    `Найкращий вибір: ${winner.name} (оцінка: ${winner.score})`,
    ``,
    `Рейтинг альтернатив:`,
    ...ranked.map((r, i) => `  ${i + 1}. ${r.name} — ${r.score}`),
    ``,
    `${winner.name} отримав найвищу інтегральну оцінку з урахуванням ваг усіх критеріїв.`,
  ];
  return lines.join("\n");
}

module.exports = { saw, topsis, explainResult };
