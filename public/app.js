"use strict";
//
function handleClicks() {
  $("#js-common-name").on("focusout", function(e) {
    e.preventDefault();
    let commonName = $("#js-common-name").val();
    console.log("common name:");
    console.log(commonName);
    if (commonName.length > 1) {
      $("#js-scientific-name").val(lookupScientificName(commonName));
    }
  });
}

function lookupScientificName(commonName) {
  console.log("Look up scientific name for " + commonName);
  return "Some scientific name for " + commonName;
}

$(document).ready(function() {
  console.log("You are running app.js in Bird Logger");
  handleClicks();
});
