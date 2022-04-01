const express = require("express");
const router = express.Router();
const piechartgoal = require("../services/piechartgoal.js");

router.get("/get/chart/piechartgoal", async function (req, res, next) {
    try {
      res.json(await piechartgoal.getPieChargoal());
    } catch (err) {
      console.error(`Error while getting new Goal `, err.message);
      next(err);
    }
  });
  
  router.get("/get/chart/piechartgoal/detail", async function (req, res, next) {
    try {
      res.json(await piechartgoal.getDetailgoal(req.query));
    } catch (err) {
      console.error(`Error while getting new Goal `, err.message);
      next(err);
    }
  });


module.exports = router;