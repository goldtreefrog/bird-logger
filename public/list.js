"use strict";

function populateList() {
  const settings = {
    url: "http://squid5test.com:8080/list",
    type: "GET",
    callback: "insertList",
    dataType: "jsonp"
  };
  console.log("About to do .ajax with settings: ", settings);
  console.log(settings.success);
  // $.ajax(settings);
  $.ajax({
    settings,
    success: insertList,
    error: function(xhr) {
      console.log("error", xhr);
    }
  });
}

function insertList(data) {
  console.log("Inside insertList");
  console.log(data);
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
