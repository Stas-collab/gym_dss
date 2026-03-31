require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", require("./routes/api"));

const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/gym-dss";

mongoose
  .connect(MONGO)
  .then(() => {
    console.log("MongoDB підключено");
    app.listen(PORT, () => console.log(`Сервер: http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
