"use strict";
//
function handleClicks() {
  $("#js-common-name").on("focusout", function(e) {
    e.preventDefault();
    let commonName = $("#js-common-name").val();
    if (commonName.length > 1) {
      const ApiLookupResult = lookupScientificNames(commonName);
    }
  });
}

function lookupScientificNames(commonName) {
  console.log(`Look up scientific name for "${commonName}"`);
  const settings = {};
  var result = $.getJSON("https://www.itis.gov/ITISWebService/jsonservice/searchByCommonName?srchKey=" + commonName, settings, parseTSNs);
  return result;
}

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
  const tsns = [];
  $.each(namesTsns, function(dataKey, dataValue) {
    // console.log("TSN: " + dataValue.tsn);
    tsns.push(dataValue.tsn);
  });
  console.log(tsns);
  const birdScientificNames = findScientificNameFromTsn(tsns);
  $("#js-scientific-name").val("Scientific name goes here");
  return;
}

function findScientificNameFromTsn(tsns) {
  // https://www.itis.gov/ITISWebService/jsonservice/getScientificNameFromTSN?tsn=179759 // Robin
  const animals = [];
  for (let i = 0; i < tsns.length; i++) {
    // for (let i = 0; i < 1; i++) {
    const res = getOrganism(tsns[i]);
  }

  function getOrganism(tsn) {
    // let tsn = 179759; // Test with Robin
    const settings = {};
    var result = $.getJSON("https://www.itis.gov/ITISWebService/jsonservice/getScientificNameFromTSN?tsn=" + tsn, settings, parseScientificNames);
    return result;
  }

  function parseScientificNames(data) {
    const sciNamesTsns = [];
    console.log("parseScientificNames");
    // console.log(data);
    if (data.kingdom.toLowerCase() === "animalia") {
      animals.push({ kingdom: data.kingdom, tsn: data.tsn, scientificName: data.combinedName });
      return;
    }
  }
  console.log(animals);
}

$(document).ready(function() {
  // console.log("You are running app.js in Bird Logger");
  handleClicks();
});
