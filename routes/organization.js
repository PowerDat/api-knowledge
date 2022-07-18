const express = require("express");
const router = express.Router();
const organization = require("../services/organization.js");

router.get("/get/organization/group", async function (req, res, next) {
  try {
    res.json(await organization.getOrganizationGroup());
  } catch (err) {
    console.error(`Error while getting organization`, err.message);
    next(err);
  }
});

module.exports = router;
