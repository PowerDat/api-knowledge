const express = require("express");
const router = express.Router();
const impact = require("../services/impact.js");

router.get("/get/impact", async function(req, res, next) {
    try {
        res.json(await impact.getImpact(req.query));
    } catch (err) {
        console.error(`Error while getting new Impact `, err.message);
        next(err);
    }
});

router.get("/get/impact/visualize-map", async function (req, res, next) {
    try {
      res.json(await impact.getimpactMap(req.query));
    } catch (err) {
      console.error(`Error while getting Knowledge `, err.message);
      next(err);
    }
  });

router.get("/get/impact/groups", async function(req, res, next) {
    try {
        res.json(await impact.getImpactGroup());
    } catch (err) {
        console.error(`Error while getting new Impact `, err.message);
        next(err);
    }
});

router.get("/get/CampusGroupimpact", async function(req, res, next) {
    try {
        res.json(await impact.getCampusGroupimpact(req.query));
    } catch (err) {
        console.error(`Error while getting new Impact `, err.message);
        next(err);
    }
});

router.get("/get/Research", async function(req, res, next) {
    try {
        res.json(await impact.getResearch(req.query));
    } catch (err) {
        console.error(`Error while getting new Impact `, err.message);
        next(err);
    }
});







module.exports = router;