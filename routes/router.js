"use strict";

const express = require("express");
const router = express.Router();

router.use(express.static("public"));

router.get("/", (req, res) => {
  res.send("Got!");
});

module.exports = router;
