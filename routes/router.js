"use strict";

const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

const { CreatureSighting } = require("./../models/models.js");

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

// Make sure the new CreatureSighting has the required fields (values in 'requiredFields' below).
// If not, log an error and return a 400 status code.
// If okay, add new item to CreatureSightings and return code 201.
router.post("/", jsonParser, (req, res) => {
  const requiredFields = ["tsn", "scientificName", "dateSighted", "Location", "byWhomSighted"];
  for (let i = 0; i < requiredFields.length; i++) {
    // const field = requiredFields[i];
    if (!(requiredFields[i] in req.body)) {
      const message = `Missing \`${requiredFields[i]}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  const item = CreatureSighting.create({
    tsn: req.body.tsn,
    commonName: req.body.commonName,
    scientificName: req.body.scientificName,
    dateSighted: req.body.dateSighted,
    timeSighted: req.body.timeSighted,
    Location: req.body.Location,
    byWhomSighted: req.body.byWhomSighted,
    Comments: req.body.Comments
  })
    .then(function(blog) {
      res.status(201).json(item);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error. Record not created." });
    });
});

module.exports = router;
