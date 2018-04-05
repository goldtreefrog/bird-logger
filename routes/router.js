"use strict";

const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

const { CreatureSighting } = require("./../models/models");

router.use(express.static("public"));

function getRequiredFields() {
  return {
    commonName: "Common Name",
    scientificName: "Scientific Name",
    dateSighted: "Date Sighted",
    location: "Location",
    byWhomSighted: "By Whom"
  };
}

function checkForBadData(req) {
  // const requiredFields = ["scientificName", "dateSighted", "location", "byWhomSighted"];
  const requiredFields = getRequiredFields();
  console.log("Got required fields: ooooooooooooooooooooooooooooooooo oo");
  console.log(requiredFields);

  let message = "";

  for (var k in requiredFields) {
    if (requiredFields.hasOwnProperty(k)) {
      // alert("Key is " + k + ", value is" + target[k]);
      if (!(k in req.body)) {
        message = `Missing \`${k}\` in request body`;
        // return res.status(400).send(message);
      } else {
        if (req.body[k].trim() === "") {
          message += requiredFields[k] + ", ";
        }
      }
    }
  }

  if (message > "") {
    message = message.slice(0, -2); // remove last comma and space
    message = "Please fill in required fields: " + message;
    console.log(message);
    // return res.status(400).send(message);
  }
  return message;
} // End of checkForBadData

router.get("/creature-sightings", jsonParser, (req, res) => {
  CreatureSighting.find()
    .limit(50)
    .then(creatureSightings => {
      console.log("Retrieving creature sightings list");
      res.json({ creatureSightings });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Internal server error. Unable to display data." });
    });
});

router.get("/find/:id", jsonParser, (req, res) => {
  console.log("In GET for one ID: ", req.params.id);
  CreatureSighting.findOne({ _id: req.params.id })
    .then(creatureSightings => {
      res.json({ creatureSightings });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Internal server error. Unable to display record." });
    });
});

router.get("/show-info", (req, res) => {
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
  let message = checkForBadData(req);
  if (!(message === "")) {
    return res.status(400).send(message);
  }
  const item = CreatureSighting.create({
    tsn: req.body.tsn,
    commonName: req.body.commonName,
    scientificName: req.body.scientificName,
    kingdom: req.body.kingdom,
    dateSighted: req.body.dateSighted,
    timeSighted: req.body.timeSighted,
    location: req.body.location,
    byWhomSighted: req.body.byWhomSighted,
    comments: req.body.comments
  })
    .then(sighting => {
      res.status(201).json(sighting);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({ message: `Internal server error. Record not created. Error: ${err}` });
    });
});

router.put("/:id", jsonParser, (req, res) => {
  let message = "";
  const requiredFields = getRequiredFields();
  console.log("req.body is: ");
  console.log(req.body);
  console.log("Inside put. Key, values are: iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii---!!!");
  // Works in ES2016 and later:
  Object.keys(req.body).forEach(function(key) {
    console.log(key, req.body[key]);
    if (req.body[key].trim() === "" && key in requiredFields) {
      message += key + ", ";
    } else {
      console.log("Value: vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv");
      console.log(req.body[key]);
    }
  });

  if (message.length > 0) {
    message = "Please fill in required fields: " + message;
    return res.status(400).send(message);
  }

  // const item = CreatureSighting.findByIdAndUpdate(req.params.id, req.body, function(err, record) {
  // if (err) return handleError(err);
  // res.send(record);
  // res.status(204);
  //   console.log("record: ", record);
  //   return record;
  // })
  //
  // Changed to promise by removing optional function. Then .then becomes the optional function??
  // Anyway, the test totally worked except, again, for saying Error: Timeout of 2000 ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, be sure it resolves.
  const item = CreatureSighting.findByIdAndUpdate(req.params.id, req.body)
    .then(record => {
      res.status(204).end();
      // res.status(204).json({ message: "Success!" });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        message: `Internal server error. Record not updated. Error: ${err}`
      });
      // done(err);
    });
});

router.delete("/:id", (req, res) => {
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.log(req.params.id);
  console.log(`Deleted item ${req.params.id}`);
  let id = req.params.id;
  // CreatureSighting.remove({ _id: id }, function(err) {
  //   if (err) return handleError(err);
  //   // removed!
  // });
  // res.status(204).end();

  CreatureSighting.remove({ _id: id })
    .then(function() {
      res.status(204).end();
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({ message: `Internal server error. Record not deleted. Error: ${err}` });
    });
});

module.exports = router;
