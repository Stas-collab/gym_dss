const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema({
  alternative_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Alternative",
    required: true,
  },
  criterion_id: { type: Number, required: true },
  value: { type: Number, required: true },
});

evaluationSchema.index(
  { alternative_id: 1, criterion_id: 1 },
  { unique: true },
);

module.exports = mongoose.model("Evaluation", evaluationSchema);
