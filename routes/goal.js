const express = require("express");
const router = express.Router();
const goal = require("../services/goal.js");

router.get("/get/goal/group", async function(req, res, next) {
    try {
        res.json(await goal.getGoalGroup());
    } catch (err) {
        console.error(`Error while getting new goal `, err.message);
        next(err);
    }
});
router.get("/get/goal", async function(req, res, next) {
    try {
        res.json(await goal.getGoal(req.query));
    } catch (err) {
        console.error(`Error while getting new goal `, err.message);
        next(err);
    }
});

router.get("/get/goal/visualize-map", async function(req, res, next) {
    try {
        res.json(await goal.getGoalMap(req.query));
    } catch (err) {
        console.error(`Error while getting new goal `, err.message);
        next(err);
    }
});

router.get("/get/CampusGroupgoal", async function(req, res, next) {
    try {
        res.json(await goal.getCampusGroupgoal(req.query));
    } catch (err) {
        console.error(`Error while getting new goal `, err.message);
        next(err);
    }
});

router.get("/get/indexgoal", async function(req, res, next) {
    try {
        res.json(await goal.getindexgoal(req.query));
    } catch (err) {
        console.error(`Error while getting new goal `, err.message);
        next(err);
    }
});


module.exports = router;