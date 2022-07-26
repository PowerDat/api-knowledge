const express = require("express");
const router = express.Router();
const piechart = require("../services/piechart.js");

/* GET knowledge. */
router.get("/get/chart/piechart", async function (req, res, next) {
  try {
    res.json(await piechart.getPieChart());
  } catch (err) {
    console.error(`Error while getting new Knowledge `, err.message);
    next(err);
  }
});

router.get("/get/chart/piechart/detail", async function (req, res, next) {
  try {
    res.json(await piechart.getDetail(req.query));
  } catch (err) {
    console.error(`Error while getting new Knowledge `, err.message);
    next(err);
  }
});

router.get("/get/chart/piechart/knowledge", async function (req, res, next) {
  try {
    res.json(await piechart.getKnowledge(req.query));
  } catch (err) {
    console.error(`Error while getting new Knowledge `, err.message);
    next(err);
  }
});

module.exports = router;
