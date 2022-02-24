const express = require("express");
const router = express.Router();
const goal = require("../services/goal.js");

router.get("/get/goal", async function(req, res, next) {
    try {
        res.json(await goal.getGoal(req.query));
    } catch (err) {
        console.error(`Error while getting new goal `, err.message);
        next(err);
    }
});


module.exports = router;