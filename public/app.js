"use strict";

const STORE = { isCreate: true };
/**
 * Show a different section and hide the others.
 * @method showSection
 * @param {} showSection
 * @return
 */
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

/**
 * Display feedback and error messages to user. Called from many places.
 * @method displayMessage
 * @param {} errText
 * @return
 */
function displayMessage(errText) {
  $("#js-feedback").css("visibility", "visible");
  $("#js-feedback").html(errText);
  console.log(errText);
}

/**
 * Clear all input field data
 * @method clearFields
 * @return
 */
function clearFields() {
  $("input").val("");
}

/**
 * Remove text from feedback field and hide the field (since the background color would otherwise show)
 * @method resetFeedback
 * @return
 */
function resetFeedback() {
  $("#js-feedback").css("visibility", "hidden");
  $("#js-feedback").html("");
}

/**
 * Retrieve records from database vis AJAX call.
 * @method populateList
 * @callback insertList
 */
function populateList() {
  const settings = {
    url: "/creature-sightings",
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

/**
 * Update a record on database via AJAX call.
 * NOTE: Fields retain their values, so user could decide to update again without retrieving a record again.
 * @method updateSighting
 * @param {} sightingRecord
 * @callback displayMessage
 */
function updateSighting(sightingRecord) {
  console.log("updating sighting: " + sightingRecord);
  $.ajax({
    method: "PUT",
    url: `/${STORE.updateId}`,
    data: JSON.stringify(sightingRecord),
    success: function(data) {
      displayMessage(sightingRecord.commonName + " record updated successfully.");
    },
    error: function(err) {
      displayMessage(err.responseText);
    },
    dataType: "json",
    contentType: "application/json"
  });
}

/**
 * Create and display the list of database records.
 * @method insertList
 * @param {} data
 * @return
 */
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
      return `<li><span class="sighting-list common-name">${sighting.commonName}</span> <span class="sighting-list scientific-name">${
        sighting.scientificName
      }</span> <span class="sighting-list">${dateSighted}</span> <span class="sighting-list time">${
        sighting.timeSighted
      }</span>  <span class="sighting-list">${sighting.location}</span> <span class="sighting-list">${sighting.comments}</span>
  <div class="sighting-list-buttons">
    <button class="view" id="js-view" data-id="${sighting._id}">View/Update</button>
    <button class="delete" id="js-delete" data-id="${sighting._id}" data-common-name="${sighting.commonName}">Delete</button>
  </div>
  <span class="tsn no-display">${sighting.tsn}</span>
</li>`;
    })
    .join("");

  $("#js-list").html(listTitleHtml + listHtml);

  // Clear fields in form for adding or updating a single sighting
  clearFields();
}

/**
 * Send common name to ITIS database to get list of similar common names (from which user will select one)
 * @method getDataFromApi
 * @param {} baseUrl
 * @param {} searchKey
 * @param {} searchTerm
 * @param {} callback
 * @return
 */
function getDataFromApi(baseUrl, searchKey, searchTerm, callback) {
  const settings = {
    url: baseUrl + "?" + searchKey + "=" + searchTerm,
    type: "GET",
    cache: true,
    jsonp: "jsonp",
    dataType: "jsonp",
    success: callback
  };
  console.log(settings.url);
  $.ajax(settings);
}

/**
 * 3.
 * @method lookupSimilarNamesAndTsns
 * @param {string} commonName - Common name for bird
 * @return result
 */
/**
 * Check to be sure common name entered is at least two characters. If so, call getDataFromApi to show similar names or handle exact match.
 * @method lookupSimilarNamesAndTsns
 * @param {} commonName
 * @return
 */
function lookupSimilarNamesAndTsns(commonName) {
  console.log(`Look up similar names for "${commonName}"`);
  console.log("commonName.length: ", commonName.length);
  if (commonName.length < 2) {
    displayMessage("Organism name must be at least 2 characters long.");
    return;
  }
  getDataFromApi("https://www.itis.gov/ITISWebService/jsonservice/searchByCommonName", "srchKey", commonName, organizeCommonNamesAndTsns);
}

/**
 * 5. Check to see that data for at least one common name was returned. If not, issue error. If so, parse the JSON and store similar common names and TSNs in "namesTsns" array.
 * @method organizeCommonNamesAndTsns
 * @param {object} data - JSON returned by API call in lookupSimilarNamesAndTsns
 * @return
 */
/**
 * If exact match, put scientific name and kingdom into the input fields for the new record.
 * If there is no exact match, display a list of similar common names.
 * Notes: 1. This function could be expanded to handle multiple pages.
 *        2. Sometimes a user might want to see similar common names even though
 *           an exact match was found. In that case, it would be good to have a button
 *           next to the commonName input field which, when clicked, would show those
 *           similar names even though the exact match was found.
 * @method organizeCommonNamesAndTsns
 * @param {} data
 * @return
 */
function organizeCommonNamesAndTsns(data) {
  console.log("Inside organizeCommonNamesAndTsns", data);
  console.log(data.commonNames);

  if (data.commonNames.length === 1 && !data.commonNames[0]) {
    console.log(`No matching common names were found.`);
    displayMessage("No match in database for '" + $("#js-common-name").val() + ".'");
    return;
  }

  const namesTsns = [];
  for (let i = 0; i < data.commonNames.length; i++) {
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
/**
 * Display common names retrieved from ITIS database
 * @method displayNameAlternatives
 * @param {} namesTsns
 * @return
 */
function displayNameAlternatives(namesTsns) {
  console.log("Common names matching input:");
  console.log(namesTsns);
  showSection("name-choices");
  let maxEntries = 20; // Arbitrary number that should be changed or else use pagination.
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
/**
 * Check to be sure TSN is valid and then pass it to getDataFromApi function to retrieve scientific name.
 * @method findScientificNameFromTsn
 * @param {} tsn
 * @param {} callback
 * @return
 */
function findScientificNameFromTsn(tsn, callback) {
  if (isNaN(tsn)) {
    console.log("TSN " + tsn + " id not a number!!!");
  } else {
    getDataFromApi("https://www.itis.gov/ITISWebService/jsonservice/getScientificNameFromTSN", "tsn", tsn, callback);
  }
}

/**
 * 8. Extract kingdom and scientific name from API result
 * @method extractScientificNameAndKingdom
 * @param {} data
 * @return
 */
/**
 * Show scientific name and kingdom for organism chosen by user.
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
  // $("#js-kingdom").prop("readonly", true);
  $("#js-tsn").val(data.tsn);
}

/**
 * Extract relevant TSN parent data and repeat until it is a bird
 * @method extractParentTsn
 * @param {} data
 * @return
 */

/**
 * Save the sighting record to the database.
 * @method addSighting
 * @param {} sightingRecord
 * @return
 */
function addSighting(sightingRecord) {
  window.test = sightingRecord;
  console.log("Adding sighting: " + sightingRecord);
  $.ajax({
    method: "POST",
    url: "/",
    data: JSON.stringify(sightingRecord),
    /**
     * Description
     * @method success
     * @param {} data
     * @return
     */
    success: function(data) {
      console.log("Success!!!");
      displayMessage(sightingRecord.commonName + " record saved successfully.");
      $("input").val("");
    },
    /**
     * Description
     * @method error
     * @param {} data
     * @return
     */
    error: function(data) {
      console.log(data.responseText);
      displayMessage(data.responseText);
    },
    dataType: "json",
    contentType: "application/json"
  });
}

/**
 * Look up the details of the database record chosen by user.
 * @method findSingleSighting
 * @param {} id
 * @return
 */
function findSingleSighting(id) {
  showSection("enter-data");
  console.log("Found sighting: " + id);
  $.ajax({
    method: "GET",
    url: "/find/" + id,
    success: populateViewForm,
    dataType: "json",
    contentType: "application/json"
  });
}

/**
 * Put database values into update form.
 * @method populateViewForm
 * @param {} data
 * @return
 */
function populateViewForm(data) {
  console.log("Inside populateViewForm with data: ", data);
  toggleSaveUpdate("update");
  showSection("enter-data");
  $("#js-common-name").val(data.creatureSightings.commonName);
  $("#js-scientific-name").val(data.creatureSightings.scientificName);
  $("#js-kingdom").val(data.creatureSightings.kingdom);
  $(".js-date-sighted").val(
    $.datepicker.formatDate("mm/dd/yy", $.datepicker.parseDate("yy-mm-dd", data.creatureSightings.dateSighted.split("T")[0]))
  );
  $("#js-time-sighted").val(data.creatureSightings.timeSighted);
  $("#js-location").val(data.creatureSightings.location);
  $("#js-by-whom").val(data.creatureSightings.byWhomSighted);
  $("#js-comments").val(data.creatureSightings.comments);
  $("#js-tsn").val(data.creatureSightings.tsn);
}

/**
 * Delete the item so chosen by user
 * @method removeItem
 * @param {} id
 * @param {} screenObjToRemove
 * @return
 */
function removeItem(id, screenObjToRemove) {
  screenObjToRemove.parent().remove();
}

/**
 * Change flag STORE.isCreate and text on 'Save'/'Update' button so we know if we are saving a new record or updating an old one.
 * @method toggleSaveUpdate
 * @param {} outcome
 * @return
 */
function toggleSaveUpdate(outcome) {
  let outcomeL = outcome.toLowerCase();
  let outcomeC = outcomeL.substr(0, 1).toUpperCase() + outcomeL.substr(1);

  $("#js-save").text(outcomeC);
  $("#js-save").attr("name", outcomeL);
  $("#js-save").attr("value", outcomeL);

  STORE.isCreate = outcomeL === "save";
}

/**
 * Behavior for date picker. In this case, only allow current/past dates, not future.
 * @method datePickerSetup
 * @return
 */
function datePickerSetup() {
  $("#datepicker").datepicker({ maxDate: "0" });
}

/**
 * 2. Handle user action events
 * @method handleUserActions
 * @return
 */
function handleUserActions() {
  $("#js-common-name").on("change", function(e) {
    e.preventDefault();
    $("#js-scientific-name").val("");
    $("#js-kingdom").val("");
    $("#name-choices").html("");

    let commonName = $("#js-common-name").val();
    if (commonName.length > 0) {
      const ApiLookupResult = lookupSimilarNamesAndTsns(commonName);
    }
  });

  $("#name-choices").on("click", function(e) {
    e.preventDefault();
    let tsn = e.target.getAttribute("data");
    $("#js-common-name").val($(e.target).text());
    findScientificNameFromTsn(tsn, extractScientificNameAndKingdom);
  });

  // User clicked the 'Save' button
  $("#js-add-sighting").on("click", e => {
    e.preventDefault();
    clearFields();
    toggleSaveUpdate("save");
    showSection("enter-data");
  });

  // User clicked 'Show All' link. Call populateList().
  $("#js-show-list").on("click", function(e) {
    e.preventDefault();
    populateList();
  });

  // User clicked 'Save'/'Update' button. Call addSighting or updateSighting function.
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

    if (STORE.isCreate) {
      addSighting(record);
    } else {
      updateSighting(record);
    }
  });

  // User clicked 'View/Update' button on list of records. Call findSingleSighting() to show desired one.
  $("#js-list").on("click", "#js-view", e => {
    e.preventDefault();
    console.log("Inside click event for View/Update with data-id: ", e.target.getAttribute("data-id"));
    const id = e.target.getAttribute("data-id");
    findSingleSighting(id);
    STORE.updateId = id;
  });

  // User clicked delete, so remove record from both database and screen.
  $("#js-list").on("click", "#js-delete", function(e) {
    e.preventDefault();
    console.log("Delete: ", $(this));
    if (confirm("Delete record for " + e.target.getAttribute("data-common-name") + "?")) {
      let id = e.target.getAttribute("data-id");
      let commonName = e.target.getAttribute("data-common-name");
      const screenObj = $(this);
      $.ajax({
        method: "DELETE",
        url: "/" + id,
        /**
         * Description
         * @method success
         * @param {} data
         * @return
         */
        success: function(data) {
          removeItem(e.target.getAttribute("data-id"), screenObj.parent());
        },
        dataType: "json",
        contentType: "application/json"
      });
    }
  });

  // User clicked the 'Clear' button
  $("#js-clear").on("click", e => {
    clearFields();
    toggleSaveUpdate("save");
  });

  // For links and buttons that open a new section where previous section data should be cleared
  $(".common-events").on("click", e => {
    resetFeedback();
  });
}

// 1. Start when document is ready
$(document).ready(function() {
  datePickerSetup();
  handleUserActions();
});
