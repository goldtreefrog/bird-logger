"use strict";
exports.DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost/creature-sightings";
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || "mongodb://localhost/test-creature-sightings";
exports.PORT = process.env.PORT || 8080;
