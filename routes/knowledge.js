const express = require("express");
const router = express.Router();
const knowledge = require("../services/knowledge.js");

/* GET knowledge. */
router.get("/get/knowledge/groups", async function (req, res, next) {
  try {
    res.json(await knowledge.getKnowledgeGroup());
  } catch (err) {
    console.error(`Error while getting Knowledge `, err.message);
    next(err);
  }
});


router.get("/get/knowledge/visualize-map", async function (req, res, next) {
  try {
    res.json(await knowledge.getKnowledgeMap(req.query));
  } catch (err) {
    console.error(`Error while getting Knowledge `, err.message);
    next(err);
  }
});

router.get("/get/newknowledge/visualize-map", async function (req, res, next) {
  try {
    res.json(await knowledge.getnewKnowledgeMap(req.query));
  } catch (err) {
    console.error(`Error while getting Knowledge `, err.message);
    next(err);
  }
});


router.get("/get/newknowledge", async function (req, res, next) {
  try {
    res.json(await knowledge.getNewKnowledge(req.query));
  } catch (err) {
    console.error(`Error while getting new Knowledge `, err.message);
    next(err);
  }
});

router.get("/get/knowledge", async function (req, res, next) {
  try {
    res.json(await knowledge.getKnowledge());
  } catch (err) {
    console.error(`Error while getting new Knowledge `, err.message);
    next(err);
  }
});

router.get("/get/innovations", async function (req, res, next) {
  try {
    res.json(await knowledge.getOutput(req.query));
  } catch (err) {
    console.error(`Error while getting new Knowledge `, err.message);
    next(err);
  }
});

router.get("/get/knowledgegroup", async function (req, res, next) {
  try {
    res.json(await knowledge.getKnowledgeByGrouup(req.query));
  } catch (err) {
    console.error(`Error while getting  Knowledge `, err.message);
    next(err);
  }
});

router.get("/get/newknowledgegroup", async function (req, res, next) {
  try {
    res.json(await knowledge.getnewknowledgegroup(req.query));
  } catch (err) {
    console.error(`Error while getting  Knowledge `, err.message);
    next(err);
  }
});

router.get("/get/campusgroup", async function (req, res, next) {
  try {
    res.json(await knowledge.getCampusGroup(req.query));
  } catch (err) {
    console.error(`Error while getting  Knowledge `, err.message);
    next(err);
  }
});

module.exports = router;
