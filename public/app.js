"use strict";

function getDataFromApi(baseUrl, searchTerm, callback) {
  const settings = {
    url: baseUrl + searchTerm,
    dataType: "json",
    type: "GET",
    success: callback
  };
  console.log(baseUrl + searchTerm);
  $.ajax(settings);
}

/**
 * Look up similar common names and Taxonomic Serial Numbers (TSNs) at ITIS from common name input by user
 * @method lookupSimilarNamesAndTsns
 * @param {string} commonName - Common name for bird
 * @return result
 */
function lookupSimilarNamesAndTsns(commonName) {
  console.log(`Look up similar names for "${commonName}"`);
  // Note: Similar names may point to the SAME or DIFFERENT TSNs. For example, catbird will result in gray catbird and grey catbird, two different spellings (and for some birds, two different common names) for the exact same bird. We want to give the user all the common names but only process the TSN once to see if it is actually a bird.
  getDataFromApi("https://www.itis.gov/ITISWebService/jsonservice/searchByCommonName?srchKey=", commonName, organizeCommonNamesAndTsns);
}

/**
 * Check to see that data for at least one common name was returned. If not, issue error. If so, parse the JSON and store similar common names and TSNs in "namesTsns" array.
 * @method organizeCommonNamesAndTsns
 * @param {object} data - JSON returned by API call in lookupSimilarNamesAndTsns
 * @return
 */
function organizeCommonNamesAndTsns(data) {
  if (data.commonNames.length === 1 && !data.commonNames[0]) {
    console.log(`No matching common names were found.`);
    return;
  }

  const namesTsns = [];
  // for (let i = 0; i < data.commonNames.length; i++) {
  for (let i = 10; i < 20; i++) {
    namesTsns.push({ name: data.commonNames[i].commonName, tsn: data.commonNames[i].tsn });
    findScientificNameFromTsn(data.commonNames[i].tsn, extractScientificNameAndKingdom);
  }
  console.log(`Number of entries returned: ${data.commonNames.length}`);
  console.log("Common names matching input:");
  console.log(namesTsns);
  return;
}

/**
 * For each organism in array, send TSN to getOrganism function to look up details.
 * @method findScientificNameFromTsn
 * @param {} namesTsns
 * @return
 */
function findScientificNameFromTsn(tsn, callback) {
  if (isNaN(tsn)) {
    console.log("TSN " + tsn + " id not a number!!!");
  } else {
    getDataFromApi("https://www.itis.gov/ITISWebService/jsonservice/getScientificNameFromTSN?tsn=", tsn, callback);
  }
  // }
}

/**
 * Extract kingdom and scientific name from API result
 * @method extractScientificNameAndKingdom
 * @param {} data
 * @return
 */
function extractScientificNameAndKingdom(data) {
  const animal = [];
  if (data.kingdom.toLowerCase() === "animalia") {
    console.log("animal in extractScientificNameAndKingdom");
    findParentTsn(data.tsn);
  }
}

function findParentTsn(tsn) {
  console.log(
    "In findParentTsn and about to call getDataFromApi using getParentTSNFromTSN url with callback extractParentTsn and passing TSN: " + tsn
  );
  getDataFromApi("https://www.itis.gov/ITISWebService/jsonservice/getParentTSNFromTSN?tsn=", tsn, extractParentTsn);
}
/**
 * Extract relevant TSN parent data and repeat until it is a bird
 * @method extractParentTsn
 * @param {} data
 * @return
 */
function extractParentTsn(data) {
  console.log("Inside extractParentTsn with the following data: ");
  console.log(data);
  findScientificNameFromTsn(data.parentTsn, isBird);
  // findScientificNameFromTsn(data, isBird);
}

function isBird(data) {
  console.log("Is it a bird?");
  console.log(data);
  if (data.combinedName === "Aves") {
    console.log("combinedName is " + data.combinedName + " - it IS a BIRD!!!");
  } else if (!isNaN(data.tsn)) {
    console.log("CombinedName is " + data.combinedName);
    findParentTsn(data.tsn);
  } else {
    console.log("No TSN in the following data");
    console.log(data);
  }
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
      const ApiLookupResult = lookupSimilarNamesAndTsns(commonName);
    }
  });
}

$(document).ready(function() {
  // console.log("You are running app.js in Bird Logger");
  handleUserActions();
});
