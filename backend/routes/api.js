const router = require("express").Router();
const c = require("../controllers/dssController");

router.get("/alternatives", c.getAlternatives);
router.post("/alternatives", c.createAlternative);
router.delete("/alternatives/:id", c.deleteAlternative);

router.get("/criteria", c.getCriteria);
router.post("/criteria", c.createCriterion);
router.delete("/criteria/:id", c.deleteCriterion);

router.get("/evaluations", c.getEvaluations);
router.post("/evaluations", c.upsertEvaluation);

router.post("/analyze", c.analyze);

module.exports = router;
