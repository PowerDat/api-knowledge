const express = require("express");
const router = express.Router();
const newknowledge = require("../services/newknowledge.js");

/* GET newknowledge. */

// router.get("/get/newknowledge", async function(req, res, next) {
//     try {
//         res.json(await newknowledge.g());
//     } catch (err) {
//         console.error(`Error while getting new Knowledge `, err.message);
//         next(err);
//     }
// });

router.get("/get/newknowledge/campusgroup", async function(req, res, next) {
    try {
        res.json(await newknowledge.getCampusGroup(req.query));
    } catch (err) {
        console.error(`Error while getting  Knowledge `, err.message);
        next(err);
    }
});

module.exports = router;