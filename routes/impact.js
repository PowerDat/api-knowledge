const express = require("express");
const router = express.Router();
const impact = require("../services/impact.js");

router.get("/get/impact", async function(req, res, next) {
    try {
        res.json(await impact.getImpact(req.query));
    } catch (err) {
        console.error(`Error while getting new Knowledge `, err.message);
        next(err);
    }
});




module.exports = router;