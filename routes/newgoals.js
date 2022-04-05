const express = require("express");
const router = express.Router();
const newgoals = require("../services/newgoals.js");

router.get("/get/newgoals", async function (req, res, next) {
  try {
    res.json(await newgoals.getNewGoals(req.query));
  } catch (err) {
    console.error(`Error while getting new newgoals `, err.message);
    next(err);
  }
});

router.get("/get/newgoals/campus", async function (req, res, next) {
  try {
    res.json(await newgoals.getCampusGroup(req.query));
  } catch (err) {
    console.error(`Error while getting campus `, err.message);
    next(err);
  }
});

module.exports = router;
