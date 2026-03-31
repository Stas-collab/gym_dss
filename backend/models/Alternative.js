const mongoose = require("mongoose");

const alternativeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
});

module.exports = mongoose.model("Alternative", alternativeSchema);
