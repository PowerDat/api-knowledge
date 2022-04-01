const express = require("express");
const router = express.Router();
const piechartimpact = require("../services/piechartimpact.js");

router.get("/get/chart/piechartimpact", async function (req, res, next) {
    try {
      res.json(await piechartimpact.getPieCharimpact());
    } catch (err) {
      console.error(`Error while getting new Knowledge `, err.message);
      next(err);
    }
  });
  
  router.get("/get/chart/piechartimpact/detail", async function (req, res, next) {
    try {
      res.json(await piechartimpact.getDetailimpact(req.query));
    } catch (err) {
      console.error(`Error while getting new Knowledge `, err.message);
      next(err);
    }
  });


module.exports = router;