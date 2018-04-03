"use strict";

const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;

const { CreatureSighting } = require("../models/models");
const { app, runServer, closeServer } = require("../server");
const { TEST_DATABASE_URL } = require("../config");

chai.use(chaiHttp);

// put randomish documents in db for tests.
// use the Faker library to automatically
// generate placeholder values
function seedCreatureSightingData() {
  console.info("seeding creature sighting data");
  const seedData = [];

  for (let i = 1; i <= 10; i++) {
    seedData.push(generateCreatureSightingData());
  }
  // this will return a promise
  return CreatureSighting.insertMany(seedData);
}

// Return a random integer from 0 to max for randomly choosing from an array, randomly generating a time, etc.
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// used to generate data to put in db
function generateCommonName() {
  const creatures = ["robin", "catbird", "turtle", "crow", "sparrow", "redwood", "dandelion", "tulip", "persimmon", "almond"];
  // return creatures[Math.floor(Math.random() * creatures.length)];
  return creatures[getRandomInt(creatures.length)];
}

// used to generate data to put in db
function generateLocation() {
  const locations = ["Italy", "back porch", "William Cir & Wallace Ln"];
  let location = locations[getRandomInt(locations.length)];
  return location + ", " + faker.streetAddress;
}

// used to generate data to put in db
function generateKingdom() {
  const kingdom = ["Animalia", "Plantae"];
  return kingdom[getRandomInt(kingdom.length)];
}

// used to generate data to put in db
function generateDate() {
  return faker.date.past();
}

function generateTime() {
  // 0-12 for hours
  // 0-59 for minutes
  const amPm = ["AM", "PM"];
  return getRandomInt(12) + ":" + getRandomInt(59) + " " + amPm[getRandomInt(1)];
}

// generate an object represnting a creature sighting.
// can be used to generate seed data for db
// or request.body data
function generateCreatureSightingData() {
  return {
    tsn: "",
    commonName: generateCommonName(),
    scientificName: faker.lorem.word(),
    kingdom: generateKingdom(),
    dateSighted: generateDate(),
    timeSighted: generateTime(),
    location: generateLocation(),
    byWhomSighted: faker.internet.userName(),
    comments: faker.lorem.paragraph(),
    createdAt: "",
    updatedAt: ""
  };
}

// Deletes test database.
// call it in `afterEach` block below
// to ensure data from one test is gone
// before the next test.
function tearDownDb() {
  console.warn("Deleting database");
  return mongoose.connection.dropDatabase();
}

describe("Creature Sighting API resource", function() {
  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedCreatureSightingData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedCreatureSightingData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  // nested `describe` blocks.
  describe("GET endpoint", function() {
    it("should return all existing creature sightings", function() {
      // strategy:
      //    1. get back all creature sightings returned by GET request to `/`
      //    2. prove res has right status, data type
      //    3. prove the number of creature sightings we got back is equal to number
      //       in db.
      //
      // need to change and access `res` across `.then()` calls below,
      // so declare it here and modify in place
      let res;
      return chai
        .request(app)
        .get("/creature-sightings")
        .then(function(_res) {
          // so subsequent .then blocks can access response object
          res = _res;
          expect(res).to.have.status(200);
          // otherwise our db seeding didn't work
          expect(res.body.creatureSightings).to.have.length.of.at.least(1);
          return CreatureSighting.count();
        })
        .then(function(count) {
          console.log("*******************Count: ");
          console.log(count);
          expect(res.body.creatureSightings).to.have.length(count);
        });
    });

    it("should return creature sightings with right fields", function() {
      // Strategy: Get back all creature sightingss, and ensure they have expected keys

      let resSighting;
      return chai
        .request(app)
        .get("/creature-sightings")
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.creatureSightings).to.be.a("array");
          expect(res.body.creatureSightings).to.have.length.of.at.least(1);

          res.body.creatureSightings.forEach(function(sighting) {
            expect(sighting).to.be.a("object");
            expect(sighting).to.include.keys(
              "_id",
              "tsn",
              "commonName",
              "scientificName",
              "kingdom",
              "location",
              "dateSighted",
              "timeSighted",
              "byWhomSighted",
              "comments",
              "createdAt",
              "updatedAt"
            );
          });
          resSighting = res.body.creatureSightings[0];
          return CreatureSighting.findById(resSighting._id);
        })
        .then(function(creatureSighting) {
          console.log("*******************!!!!!!!!!!!************");
          console.log(creatureSighting);
          expect(resSighting._id).to.equal(creatureSighting._id.toString());
          // expect(resSighting.tsn).to.equal(creatureSighting.tsn);
          // expect(resSighting.commonName).to.equal(creatureSighting.commonName);
          // expect(resSighting.scientificName).to.equal(creatureSighting.scientificName);
          // expect(resSighting.kingdom).to.equal(creatureSighting.kingdom);
          // expect(resSighting.location).to.equal(creatureSighting.location);
          expect(resSighting.dateSighted).to.equal(creatureSighting.dateSighted);
          // expect(resSighting.timeSighted).to.equal(creatureSighting.timeSighted);
          // expect(resSighting.byWhomSighted).to.equal(creatureSighting.byWhomSighted);
          // expect(resSighting.comments).to.equal(creatureSighting.comments);
        });
    });
  });

  describe("POST endpoint", function() {
    // strategy: make a POST request with data,
    // then prove that the creature sighting we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it("should add a new creature sighting", function() {
      const newSighting = generateCreatureSightingData();

      return chai
        .request(app)
        .post("/")
        .send(newSighting)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a("object");
          expect(res.body).to.include.keys(
            "id",
            "tsn",
            "commonName",
            "scientificName",
            "kingdom",
            "location",
            "dateSighted",
            "timeSighted",
            "byWhomSighted",
            "comments"
          );
          // cMongo should have created id on insertion
          expect(res.body.id).to.not.be.null;
          expect(res.body.commonName).to.equal(newSighting.commonName);
          expect(res.body.scientificName).to.equal(newSighting.scientificName);
          expect(res.body.kingdom).to.equal(newSighting.kingdom);
          expect(res.body.location).to.equal(newSighting.location);
          expect(res.body.dateSighted).to.equal(newSighting.dateSighted);
          expect(res.body.timeSighted).to.equal(newSighting.timeSighted);
          expect(res.body.byWhomSighted).to.equal(newSighting.byWhomSighted);
          expect(res.body.comments).to.equal(newSighting.comments);
          return CreatureSighting.findById(res.body.id);
        })
        .then(function(sighting) {
          expect(sighting.commonName).to.equal(newSighting.commonName);
          expect(sighting.scientificName).to.equal(newSighting.scientificName);
          expect(sighting.kingdom).to.equal(newSighting.kingdom);
          expect(sighting.location).to.equal(newSighting.location);
          expect(sighting.dateSighted).to.equal(newSighting.dateSighted);
          expect(sighting.timeSighted).to.equal(newSighting.timeSighted);
          expect(sighting.byWhomSighted).to.equal(newSighting.byWhomSighted);
          expect(sighting.comments).to.equal(newSighting.comments);
          expect(sighting.name).to.equal(newSighting.name);
        });
    });
  });

  describe("PUT endpoint", function() {
    // strategy:
    //  1. Get an existing creature sighting from db
    //  2. Make a PUT request to update that creature sighting
    //  3. Prove creature sighting returned by request contains data we sent
    //  4. Prove creature sighting in db is correctly updated
    it("should update fields you send it", function() {
      const updateData = {
        commonName: "blue bugsy critter",
        byWhomSighted: "lololala"
      };

      return CreatureSighting.findOne()
        .then(function(sighting) {
          updateData.id = sighting.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai
            .request(app)
            .put(`/${sighting.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);

          return CreatureSighting.findById(updateData.id);
        })
        .then(function(sighting) {
          expect(sighting.commonName).to.equal(updateData.name);
          expect(sighting.byWhomSighted).to.equal(updateData.byWhomSighted);
        });
    });
  });

  describe("DELETE endpoint", function() {
    // strategy:
    //  1. get a creature sighting
    //  2. make a DELETE request for that creature sighting's id
    //  3. assert that response has right status code
    //  4. prove that creature sighting with the id doesn't exist in db anymore
    it("delete a creature sighting by id", function() {
      let sighting;

      return CreatureSighting.findOne()
        .then(function(_sighting) {
          sighting = _sighting;
          return chai.request(app).delete(`/${sighting.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return CreatureSighting.findById(sighting.id);
        })
        .then(function(_sighting) {
          expect(_sighting).to.be.null;
        });
    });
  });
});
