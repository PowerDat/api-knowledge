const express = require("express");
const router = express.Router();
const knowledge = require("../services/knowledgeGraphs.js");

/* GET knowledge. */
router.get("/get/chart/newknowledge", async function (req, res, next) {
  try {
    res.json(await knowledge.getNewKnowledgeGraph(req.query.groupName));
  } catch (err) {
    console.error(`Error while getting new Knowledge `, err.message);
    next(err);
  }
});

module.exports = router;
