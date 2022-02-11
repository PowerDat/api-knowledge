const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const knowledge = require("./routes/knowledge.js");
const piechart = require("./routes/piechart.js");

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

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error(err.message, err.stack);
    res.status(statusCode).json({ message: err.message });

    return;
});

app.listen(port, () => {
    console.log(`🚀 app listening on port ${port}`);
});