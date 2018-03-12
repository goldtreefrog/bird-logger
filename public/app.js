"use strict";

function getDataFromApi(baseUrl, searchTerm, callback) {
  const settings = {
    url: baseUrl + searchTerm,
    dataType: "json",
    type: "GET",
    success: callback
  };

  $.ajax(settings);
}

/**
 * Look up similar common names and Taxonomic Serial Numbers (TSNs) at ITIS from common name input by user
 * @method lookupScientificNames
 * @param {string} commonName - Common name for bird
 * @return result
 */
function lookupScientificNames(commonName) {
  console.log(`Look up scientific name for "${commonName}"`);
  getDataFromApi("https://www.itis.gov/ITISWebService/jsonservice/searchByCommonName?srchKey=", commonName, parseTSNs);
}

/**
 * Parse the JSON and store similar common names and TSNs in "namesTsns" array
 * @method parseTSNs
 * @param {object} data - JSON returned by API call in lookupScientificNames
 * @return
 */
function parseTSNs(data) {
  if (data.commonNames.length === 1 && !data.commonNames[0]) {
    console.log(`No matching common names were found.`);
    return;
  }

  const namesTsns = [];
  console.log("Common names matching input:");
  for (let i = 0; i < data.commonNames.length; i++) {
    namesTsns.push({ name: data.commonNames[i].commonName, tsn: data.commonNames[i].tsn });
  }

  console.log(`Number of entries returned: ${data.commonNames.length}`);
  console.log(namesTsns);
  const animalResults = findScientificNameFromTsn(namesTsns);
  $("#js-scientific-name").val("Scientific name goes here");
  return;
}

/**
 * For each organism in array, send TSN to getOrganism function to look up details.
 * @method findScientificNameFromTsn
 * @param {} namesTsns
 * @return
 */
function findScientificNameFromTsn(namesTsns) {
  // https://www.itis.gov/ITISWebService/jsonservice/getScientificNameFromTSN?tsn=179759 // Robin
  for (let i = 0; i < namesTsns.length; i++) {
    // const res = getOrganism(namesTsns[i].tsn);
    getDataFromApi("https://www.itis.gov/ITISWebService/jsonservice/getScientificNameFromTSN?tsn=", namesTsns[i].tsn, parseOrganism);
  }
}

/**
 * Extract kingdom and scientific name from API result
 * @method parseOrganism
 * @param {} data
 * @return
 */
function parseOrganism(data) {
  const animal = [];
  if (data.kingdom.toLowerCase() === "animalia") {
    animal.push({ kingdom: data.kingdom, tsn: data.tsn, scientificName: data.combinedName });
    console.log("animal in parseOrganism");
    console.log(animal);
    getDataFromApi("https://www.itis.gov/ITISWebService/jsonservice/getParentTSNFromTSN?tsn=", data.tsn, parseParent);
    // return animal;
  }
}

/**
 * Extract relevant TSN parent data
 * @method parseParent
 * @param {} data
 * @return
 */
function parseParent(data) {
  console.log("Inside parseParent");
  console.log(data);
}

/**
 * Handle user events
 * @method handleUserActions
 * @return
 */
function handleUserActions() {
  $("#js-common-name").on("focusout", function(e) {
    e.preventDefault();
    let commonName = $("#js-common-name").val();
    if (commonName.length > 1) {
      const ApiLookupResult = lookupScientificNames(commonName);
    }
  });
}

$(document).ready(function() {
  // console.log("You are running app.js in Bird Logger");
  handleUserActions();
});
