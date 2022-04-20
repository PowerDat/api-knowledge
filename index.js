const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");

// const authMiddleware = require("./middlewares/auth.js");

const knowledge = require("./routes/knowledge.js");
const piechart = require("./routes/piechart.js");
const goal = require("./routes/goal.js");
const impact = require("./routes/impact.js");
const newgoals = require("./routes/newgoals.js");
const piechartgoal = require("./routes/piechartgoal.js");
const piechartimpact = require("./routes/piechartimpact.js");
const newknowledge = require("./routes/newknowledge.js");
const piechartnewknowledge = require("./routes/piechartnewknowledge.js");

// app.use(authMiddleware);

app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  res.json({ message: "ok" });
});

app.use("/api", knowledge);
app.use("/api", piechart);
app.use("/api", goal);
app.use("/api", impact);
app.use("/api", newgoals);
app.use("/api", piechartgoal);
app.use("/api", piechartimpact);
app.use("/api", newknowledge);
app.use("/api", piechartnewknowledge);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });

  return;
});

app.listen(port, () => {
  console.log(`🚀 app listening on port ${port}`);
});
