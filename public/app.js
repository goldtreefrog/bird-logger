"use strict";

const STORE = { isCreate: true };
function showSection(showSection) {
  $("section").css("display", "none");
  let section;
  if (!(showSection.slice(0, 1) === ".")) {
    section = "section." + showSection;
  } else {
    section = "section" + showSection;
  }
  console.log("section: ", section);
  $(section).css("display", "block");

  // Reset message
  resetFeedback();
}

function displayMessage(errText) {
  $("#js-feedback").css("visibility", "visible");
  $("#js-feedback").html(errText);
  console.log(errText);
}

function clearFields() {
  $("input").val("");
}


function resetFeedback() {
  $("#js-feedback").css("visibility", "hidden");
  $("#js-feedback").html("");
}

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
  $.ajax(settings);
}

function updateSighting(sightingRecord) {
  console.log("updating sighting: " + sightingRecord);
  $.ajax({
    method: "PUT",
    url: `/${STORE.updateId}`,
    data: JSON.stringify(sightingRecord),
    success: function(data) {
      console.log("Success!!!");
      displayMessage(sightingRecord.commonName + " record updated successfully.");
    },
    error: function(err) {
      displayMessage(err.responseText);
    },
    dataType: "json",
    contentType: "application/json"
  });
}

function insertList(data) {
  console.log("Inside insertList");
  console.log(data);
  showSection("display-data");
  const listTitleHtml = `<li><span class="sighting-list title-header">Common Name</span> <span class="sighting-list title-header">Scientific Name</span> <span class="sighting-list title-header">Date Sighted</span> <span class="sighting-list title-header time">Time</span> <span class="sighting-list title-header">Location</span> <span class="sighting-list title-header">Comments</span>
</li>
`;
  console.log("before testDate created");
  const listHtml = data.creatureSightings
    .map(sighting => {
      // Ignore the time so split at "T"
      let dateSighted = $.datepicker.formatDate("mm/dd/y", $.datepicker.parseDate("yy-mm-dd", sighting.dateSighted.split("T")[0]));
      return `<li><span class="sighting-list common-name">${sighting.commonName}</span> <span class="sighting-list scientific-name">${sighting.scientificName}</span> <span class="sighting-list">${dateSighted}</span> <span class="sighting-list time">${sighting.timeSighted}</span> <span class="sighting-list">${sighting.location}</span> <span class="sighting-list">${sighting.comments}</span>
  <button class="sighting-list view"  id="js-view" data-id="${sighting._id}">View/Update</button>
  <button class="sighting-list delete" id="js-delete" data-id="${sighting._id}" data-common-name="${sighting.commonName}">Delete</button>
</li>
`;
    })
    .join("");

  $("#js-list").html(listTitleHtml + listHtml);

  // Clear fields in form for adding or updating a single sighting
  clearFields();
}


// 4. Generic call to ITIS API
function getDataFromApi(baseUrl, searchKey, searchTerm, callback) {
  const settings = {
    url: baseUrl + "?" + searchKey + "=" + searchTerm, // But so does this. callback= is being IGNORED.
    type: "GET",
    success: callback
  };
  console.log(settings.url);
  // console.log(baseUrl, searchTerm, callback);
  $.ajax(settings);
}

/**
 * 3. Look up similar common names and Taxonomic Serial Numbers (TSNs) at ITIS from common name input by user
 * @method lookupSimilarNamesAndTsns
 * @param {string} commonName - Common name for bird
 * @return result
 */
// lookupSimilarNamesAndTsns comment for testing
function lookupSimilarNamesAndTsns(commonName) {
  console.log(`Look up similar names for "${commonName}"`);

  getDataFromApi("https://www.itis.gov/ITISWebService/jsonservice/searchByCommonName", "srchKey", commonName, organizeCommonNamesAndTsns);
}

/**
 * 5. Check to see that data for at least one common name was returned. If not, issue error. If so, parse the JSON and store similar common names and TSNs in "namesTsns" array.
 * @method organizeCommonNamesAndTsns
 * @param {object} data - JSON returned by API call in lookupSimilarNamesAndTsns
 * @return
 */
function organizeCommonNamesAndTsns(data) {
  console.log("Inside organizeCommonNamesAndTsns", data);
  console.log(data.commonNames);

  if (data.commonNames.length === 1 && !data.commonNames[0]) {
    console.log(`No matching common names were found.`);
    displayMessage("No match in database for '" + $("#js-common-name").val() + ".'");
    // $("#js-feedback").html("No match for common name entered.");
    // $("#js-feedback").css("visibility", "visible");
    return;
  }

  const namesTsns = [];
  for (let i = 0; i < data.commonNames.length; i++) {
    // for (let i = 10; i < 20; i++) {
    // If you find an exact match, use it unless user WANTS to see the list of alternatives
    if (
      $("#js-common-name")
        .val()
        .trim() === data.commonNames[i].commonName
    ) {
      // Look up scientific name and do not process other common names
      findScientificNameFromTsn(data.commonNames[i].tsn, extractScientificNameAndKingdom);
      console.log("Found exact match: " + data.commonNames[i].commonName);
      return;
    } else {
      // Add to array of name alternatives
      namesTsns.push({ commonName: data.commonNames[i].commonName, tsn: data.commonNames[i].tsn });
    }
  }

  // Since you did not find an exact match (or you would have exited already),
  // process list so you can let user choose.
  displayNameAlternatives(namesTsns);
  return;
}

// 6. Display multiple names that are similar to the one the user entered.
// This function gets called if the common name the user entered does not precisely match any in the ITIS database or if the user clicks the ___ button to show similar names.
function displayNameAlternatives(namesTsns) {
  console.log("Common names matching input:");
  console.log(namesTsns);
  showSection("name-choices");
  let maxEntries = 20; // Arbitrary number that can be changed.
  if (namesTsns.length < maxEntries) {
    maxEntries = namesTsns.length;
  }
  console.log(`Number of ITIS entries available: ${namesTsns.length}`);
  console.log("maxEntries: " + maxEntries);

  // Show alternative common names to user
  // Create the alternative name suggestions in backwards order on the screen so they end up in forward order.
  for (let i = maxEntries - 1; i >= 0; i--) {
    $("#name-choices").prepend('<li><a class="name-choice" href="#" data="' + namesTsns[i].tsn + '">' + namesTsns[i].commonName + " " + "</a></li>");

    // Add the TSN to the data attribute so we can access it later but user never sees it.
    $("#name-choices")
      .first()
      .data("tsn", namesTsns[i].tsn);
  }
}

/**
 * 7. Call ITIS API to look up scientific name.
 * Note: Callback function is extractScientificNameAndKingdom. I pass it here because I may end up calling this function from more than one other function, in which case the callback would change.
 * @method findScientificNameFromTsn
 * @param {} namesTsns
 * @return
 */
function findScientificNameFromTsn(tsn, callback) {
  if (isNaN(tsn)) {
    console.log("TSN " + tsn + " id not a number!!!");
  } else {
    // getDataFromApi("https://www.itis.gov/ITISWebService/jsonservice/getScientificNameFromTSN?tsn=", tsn, callback);
    getDataFromApi("https://www.itis.gov/ITISWebService/jsonservice/getScientificNameFromTSN", "tsn", tsn, callback);
  }
}


/**
 * 8. Extract kingdom and scientific name from API result
 * @method extractScientificNameAndKingdom
 * @param {} data
 * @return
 */
function extractScientificNameAndKingdom(data) {
  console.log("Inside extractScientificNameAndKingdom");
  console.log(data);
  console.log(data.combinedName);
  showSection("enter-data");
  $("#js-scientific-name").val(data.combinedName);
  console.log(data.kingdom);
  $("#js-kingdom").val(data.kingdom);
  $("#js-kingdom").prop("readonly", true);
}

/**
 * Extract relevant TSN parent data and repeat until it is a bird
 * @method extractParentTsn
 * @param {} data
 * @return
 */

function addSighting(sightingRecord) {
  window.test = sightingRecord;
  console.log("Adding sighting: " + sightingRecord);
  $.ajax({
    method: "POST",
    url: "http://localhost:8080/",
    data: JSON.stringify(sightingRecord),
    success: function(data) {
      console.log("Success!!!");
      displayMessage(sightingRecord.commonName + " record saved successfully.");
      $("input").val("");
    },
    error: function(data) {
      console.log(data.responseText);
      displayMessage(data.responseText);
    },
    // error: function(data) {
    //   console.log("error in addSighting");
    //   console.log(data.responseText);
    // },
    dataType: "json",
    contentType: "application/json"
  });
}

function findSingleSighting(id) {
  // window.test = id;
  showSection("enter-data");
  console.log("Found sighting: " + id);
  $.ajax({
    method: "GET",
    url: "http://localhost:8080/find/" + id, // Change this URL
    success: populateViewForm,
    dataType: "json",
    contentType: "application/json"
  });
}

function populateViewForm(data) {
  console.log("Inside populateViewForm with data: ", data);
  toggleSaveUpdate("update");
  showSection("enter-data");
  $("#js-common-name").val(data.creatureSightings.commonName);
  $("#js-scientific-name").val(data.creatureSightings.scientificName);
  $("#js-kingdom").val(data.creatureSightings.kingdom);
  // $(".js-date-sighted").val(data.creatureSightings.dateSighted);
  $(".js-date-sighted").val(
    $.datepicker.formatDate("mm/dd/yy", $.datepicker.parseDate("yy-mm-dd", data.creatureSightings.dateSighted.split("T")[0]))
  );
  $("#js-time-sighted").val(data.creatureSightings.timeSighted);
  $("#js-location").val(data.creatureSightings.location);
  $("#js-by-whom").val(data.creatureSightings.byWhomSighted);
  $("#js-comments").val(data.creatureSightings.comments);
}

function removeItem(id, screenObjToRemove) {
  console.log("Inside removeItem. Here we need to call delete and also remove the item from the screen.");
  console.log("data: ", screenObjToRemove);
  console.log("id: ", id);
  screenObjToRemove.parent().remove();
}

function toggleSaveUpdate(outcome) {
  let outcomeL = outcome.toLowerCase();
  let outcomeC = outcomeL.substr(0, 1).toUpperCase() + outcomeL.substr(1);

  $("#js-save").text(outcomeC);
  $("#js-save").attr("name", outcomeL);
  $("#js-save").attr("value", outcomeL);

  STORE.isCreate = outcomeL === "save";
}

function datePickerSetup() {
  // $.datepicker.setDefaults($.extend($.datepicker.regional[""]));
  $("#datepicker").datepicker({ maxDate: "0" });
}

/**
 * 2. Handle user action events
 * @method handleUserActions
 * @return
 */
function handleUserActions() {
  // On change?
  // $("#js-common-name").on("focusout", function(e) {
  $("#js-common-name").on("change", function(e) {
    e.preventDefault();
    $("#js-scientific-name").val("");
    $("#js-kingdom").val("");
    $("#name-choices").html("");

    let commonName = $("#js-common-name").val();
    if (commonName.length > 1) {
      const ApiLookupResult = lookupSimilarNamesAndTsns(commonName);
    }
  });

  $("#name-choices").on("click", function(e) {
    e.preventDefault();
    // let tsn = $(e.target).data("tsn");
    let tsn = e.target.getAttribute("data");
    console.log(tsn);
    $("#js-common-name").val($(e.target).text());
    findScientificNameFromTsn(tsn, extractScientificNameAndKingdom);
  });

  $("#js-add-sighting").on("click", e => {
  e.preventDefault();
  clearFields();
  toggleSaveUpdate("save");
  showSection("enter-data");
  // STORE.isCreate = true;
});


  $("#js-show-list").on("click", function(e) {
  e.preventDefault();
  console.log("Inside #js-show-list click event.");
  populateList();
});


  // $("#js-save").on("click", function(e) { // < Don't do. Bypasses HTML-level forms validation.
$("form").on("submit", function(e) {
  e.preventDefault();
  const record = {
    tsn: $("#js-tsn").val(),
    commonName: $("#js-common-name").val(),
    scientificName: $("#js-scientific-name").val(),
    kingdom: $("#js-kingdom").val(),
    dateSighted: $(".js-date-sighted").val(),
    timeSighted: $("#js-time-sighted").val(),
    location: $("#js-location").val(),
    byWhomSighted: $("#js-by-whom").val(),
    comments: $("#js-comments").val()
  };
  const required = ["scientificName", "location", "dateSighted", "location", "byWhomSighted"];
  if (STORE.isCreate) {
    addSighting(record);
  } else {
    console.log("About to call updateSighting");
    console.log(record);
    updateSighting(record);
  }
});


  $("#js-list").on("click", "#js-view", e => {
  e.preventDefault();
  console.log("Inside click event for View/Update with data-id: ", e.target.getAttribute("data-id"));
  const id = e.target.getAttribute("data-id");
  findSingleSighting(id);
  // STORE.isCreate = false;
  STORE.updateId = id;
});


  $("#js-list").on("click", "#js-delete", function(e) {
  e.preventDefault();
  console.log("Delete: ", $(this));
  if (confirm("Delete record for " + e.target.getAttribute("data-common-name") + "?")) {
    let id = e.target.getAttribute("data-id");
    let commonName = e.target.getAttribute("data-common-name");
    const screenObj = $(this);
    $.ajax({
      method: "DELETE",
      url: "http://localhost:8080/" + id, // Change this URL
      success: function(data) {
        removeItem(e.target.getAttribute("data-id"), screenObj);
        // displayMessage(commonName + " record deleted successfully.");
      },
      dataType: "json",
      contentType: "application/json"
    });
  }
});


  $("#js-clear").on("click", e => {
  // e.preventDefault();
  clearFields();
  toggleSaveUpdate("save");
  // STORE.isCreate = true;
});


  $(".common-events").on("click", e => {
  // e.preventDefault();
  resetFeedback();
});


  // include('./../jsPartials/_dateFocus.js')

  // include('./../jsPartials/_dateClick.js')

  // include('./../jsPartials/_dateFocusout.js')
}

// 1. Start when document is ready
$(document).ready(function() {
  // console.log("You are running app.js in Bird Logger");
    datePickerSetup();
    handleUserActions();
});
