"use strict";

const mongoose = require("mongoose");

// Schema for a creature sighting
const creatureSightingSchema = mongoose.Schema(
  {
    tsn: { type: String },
    commonName: { type: String },
    scientificName: { type: String, required: true },
    kingdom: { type: String },
    dateSighted: { type: Date, required: true },
    timeSighted: String,
    location: { type: String, required: true },
    byWhomSighted: { type: String, required: true },
    comments: String
  },
  {
    timestamps: true
  }
);

// instance methods and virtual properties on our schema must be defined
// *before* we make the call to `.model`.
const CreatureSighting = mongoose.model("CreatureSighting", creatureSightingSchema);

module.exports = { CreatureSighting };
