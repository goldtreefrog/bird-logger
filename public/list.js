"use strict";

function populateList() {
  const settings = {
    url: "http://localhost:8080/creature-sightings",
    type: "GET",
    success: insertList,
    error: function(xhr) {
      console.log("error", xhr);
    },
    dataType: "json"
  };
  console.log("About to do .ajax with settings: ", settings);
  // console.log(settings.success);
  $.ajax(settings);
}

function insertList(data) {
  console.log("Inside insertList");
  console.log(data);

  const listHtml = data.creatureSightings
    .map(sighting => {
      return `<li>${sighting.commonName}</li>`;
    })
    .join();
  $("#js-list").html(listHtml);
}
/**
 * 2. Handle user action events
 * @method handleUserActions
 * @return
 */
function handleUserActions() {}

// 1. Start when document is ready
$(document).ready(function() {
  console.log("You are running list.js in Bird Logger");
  populateList();
  handleUserActions();
});
