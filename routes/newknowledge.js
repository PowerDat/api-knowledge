const express = require("express");
const router = express.Router();
const newknowledge = require("../services/newknowledge.js");

/* GET knowledge. */
router.get("/get/newknowledge", async function(req, res, next) {
    try {
        res.json(await newknowledge.getNewKnowledge());
    } catch (err) {
        console.error(`Error while getting new Knowledge `, err.message);
        next(err);
    }
});

router.get("/get/campusgroup", async function(req, res, next) {
    try {
        res.json(await knowledge.getCampusGroup(req.query));
    } catch (err) {
        console.error(`Error while getting  Knowledge `, err.message);
        next(err);
    }
});

module.exports = router;