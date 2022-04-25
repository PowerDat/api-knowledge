const express = require("express");
const router = express.Router();
const piechart = require("../services/piechartnewknowledge.js");

/* GET knowledge. */
router.get("/get/chart/piechartnew", async function (req, res, next) {
  try {
    res.json(await piechart.getpiechartnewknowledge());
  } catch (err) {
    console.error(`Error while getting new Knowledge `, err.message);
    next(err);
  }
});

router.get("/get/chart/piechartnew/detail", async function (req, res, next) {
  try {
    res.json(await piechart.getDetailnewknowledge(req.query));
  } catch (err) {
    console.error(`Error while getting new Knowledge `, err.message);
    next(err);
  }
});

module.exports = router;
