const Alternative = require("../models/Alternative");
const Criterion = require("../models/Criterion");
const Evaluation = require("../models/Evaluation");
const { saw, topsis, explainResult } = require("../services/analyticsService");

// GET /api/alternatives
exports.getAlternatives = async (req, res) => {
  try {
    const alts = await Alternative.find();
    res.json(alts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /api/alternatives
exports.createAlternative = async (req, res) => {
  try {
    const alt = await Alternative.create(req.body);
    res.status(201).json(alt);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// DELETE /api/alternatives/:id
exports.deleteAlternative = async (req, res) => {
  try {
    await Alternative.findByIdAndDelete(req.params.id);
    await Evaluation.deleteMany({ alternative_id: req.params.id });
    res.json({ message: "Видалено" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET /api/criteria
exports.getCriteria = async (req, res) => {
  try {
    const criteria = await Criterion.find().sort("criterion_id");
    res.json(criteria);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /api/criteria
exports.createCriterion = async (req, res) => {
  try {
    const c = await Criterion.create(req.body);
    res.status(201).json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// DELETE /api/criteria/:id
exports.deleteCriterion = async (req, res) => {
  try {
    await Criterion.findByIdAndDelete(req.params.id);
    res.json({ message: "Видалено" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET /api/evaluations
exports.getEvaluations = async (req, res) => {
  try {
    const evs = await Evaluation.find().populate("alternative_id", "name");
    res.json(evs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /api/evaluations
exports.upsertEvaluation = async (req, res) => {
  try {
    const { alternative_id, criterion_id, value } = req.body;
    const ev = await Evaluation.findOneAndUpdate(
      { alternative_id, criterion_id },
      { value },
      { upsert: true, new: true },
    );
    res.status(201).json(ev);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// POST /api/analyze  body: { method: 'saw' | 'topsis' }
exports.analyze = async (req, res) => {
  try {
    const method = (req.body.method || "saw").toLowerCase();
    const [alternatives, criteria, evaluations] = await Promise.all([
      Alternative.find(),
      Criterion.find().sort("criterion_id"),
      Evaluation.find(),
    ]);

    if (alternatives.length < 2)
      return res.status(400).json({ error: "Потрібно мінімум 2 альтернативи" });
    if (criteria.length < 1)
      return res.status(400).json({ error: "Потрібен хоча б 1 критерій" });

    let ranked;
    if (method === "topsis") {
      ranked = topsis(alternatives, criteria, evaluations);
    } else {
      ranked = saw(alternatives, criteria, evaluations);
    }

    const explanation = explainResult(ranked, method);
    res.json({ method, ranked, explanation, winner: ranked[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
