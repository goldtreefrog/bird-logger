"use strict";

const express = require("express");
const router = express.Router();

router.use(express.static("public"));

router.get("/", (req, res) => {
  res.send("Got!");
});

router.get("/show-info/:tsn", (req, res) => {
  res.json({
    host: req.hostname,
    queryParams: req.query,
    params: req.params
  });
});

module.exports = router;
