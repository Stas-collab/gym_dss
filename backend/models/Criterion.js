const mongoose = require("mongoose");

const criterionSchema = new mongoose.Schema({
  criterion_id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ["maximize", "minimize"], required: true },
  weight: { type: Number, required: true, min: 0 },
});

module.exports = mongoose.model("Criterion", criterionSchema);
