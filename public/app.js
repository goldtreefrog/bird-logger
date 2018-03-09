"use strict";
//
function handleClicks() {
  $("#js-common-name").on("focusout", function(e) {
    e.preventDefault();
    let commonName = $("#js-common-name").val();
    // console.log("common name entered:" + commonName);
    if (commonName.length > 1) {
      const ApiLookupResult = lookupScientificNames(commonName);
      console.log("ApiLookupResult");
      console.log(ApiLookupResult);
    }
  });
}

function lookupScientificNames(commonName) {
  console.log(`Look up scientific name for "${commonName}"`);
  const settings = {
    // url: "https://www.itis.gov/ITISWebService/jsonservice/searchByCommonName?srchKey=american%20robin"
  };
  // var result = $.ajax(settings);
  var result = $.getJSON("https://www.itis.gov/ITISWebService/jsonservice/searchByCommonName?srchKey=" + commonName, settings, parseTSNs);
  return result;
}

function parseTSNs(data) {
  // console.log("data");
  // console.log(data);
  if (data.commonNames.length === 1 && !data.commonNames[0]) {
    console.log(`No matching common names were found.`);
    return;
  }

  const namesTsns = [];
  console.log("Common names matching input:");
  for (let i = 0; i < data.commonNames.length; i++) {
    // console.log(data.commonNames[i].commonName);
    // console.log(data.commonNames[i].tsn);
    namesTsns.push({ name: data.commonNames[i].commonName, tsn: data.commonNames[i].tsn });
    // console.log(namesTsns[i]);
  }

  console.log(`Number of entries returned: ${data.commonNames.length}`);
  console.log(namesTsns);
  const tsns = [];
  $.each(namesTsns, function(dataKey, dataValue) {
    // console.log("TSN: " + dataValue.tsn);
    tsns.push(dataValue.tsn);
  });
  console.log(tsns);
  const birdScientificNames = findBirdScientificNameFromTsn(tsns);
  $("#js-scientific-name").val("Scientific name goes here");
  return;
}

function findBirdScientificNameFromTsn(tsns) {
  // https://www.itis.gov/ITISWebService/jsonservice/getScientificNameFromTSN?tsn=179759 // Robin
  let tsn = 179759; // Test with Robin
  const settings = {};
  console.log("Limit to bird names");
  var result = $.getJSON("https://www.itis.gov/ITISWebService/jsonservice/getScientificNameFromTSN?tsn=" + tsn, settings, parseScientificNames);
  return result;
}

function parseScientificNames(data) {
  console.log("Parse scientific names");
  console.log(data);
}

$(document).ready(function() {
  // console.log("You are running app.js in Bird Logger");
  handleClicks();
});
