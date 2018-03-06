"use strict";
//
function handleClicks() {
  $("#js-common-name").on("focusout", function(e) {
    e.preventDefault();
    let commonName = $("#js-common-name").val();
    // console.log("common name entered:" + commonName);
    if (commonName.length > 1) {
      $("#js-scientific-name").val(lookupScientificName(commonName));
    }
  });
}

function lookupScientificName(commonName) {
  console.log(`Look up scientific name for "${commonName}"`);
  const settings = {
    // site: "localhost:8080",
    // url: "https://www.itis.gov/ITISWebService/jsonservice/searchByCommonName?srchKey=american%20robin"
  };
  // var result = $.ajax(settings);
  var result = $.getJSON("https://www.itis.gov/ITISWebService/jsonservice/searchByCommonName?srchKey=" + commonName, settings, myf);
  // return "Some scientific name for " + commonName;
  return result;
}

function myf(data) {
  if (data.commonNames.length === 1 && !data.commonNames[0]) {
    console.log(`No matching common names were found.`);
    return;
  }

  console.log("Common names matching input:");

  for (let i = 0; i < data.commonNames.length; i++) {
    console.log(data.commonNames[i]);
  }

  console.log(`Number of entries returned: ${data.commonNames.length}`);
  return;
}

$(document).ready(function() {
  // console.log("You are running app.js in Bird Logger");
  handleClicks();
});
