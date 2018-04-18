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
  showSection("display-data");
  const listHtml = data.creatureSightings
    .map(sighting => {
      // Ignore the time so split at "T"
      let dateSighted = $.datepicker.formatDate("mm/dd/y", $.datepicker.parseDate("yy-mm-dd", sighting.dateSighted.split("T")[0]));
      return `<li class="sighting-record">
  <header>
    <h3 class="m0">
        ${sighting.commonName}
      </h3>
  </header>
  <ul class="sighting-row-2 m0">
    <li class="sighting-element scientific-name"><em>${sighting.scientificName}</em></li>
    <li class="sighting-element date-sighted">${dateSighted}</li>
    <li class="sighting-element-buttons">
      <button class="view" id="js-view" data-id="${sighting._id}">View/Update</button>
      <button class="delete" id="js-delete" data-id="${sighting._id}" data-common-name="${sighting.commonName}">Delete</button>
    </li>
  </ul>
</li>`;
    })
    .join("");

  $("#js-list").html(listHtml);

  // Clear fields in form for adding or updating a single sighting
  clearFields();
}


/**
 * Send common name to ITIS database to get list of similar common names (from which user will select one)
 * NOTE: This function could be used for other searches of ITIS data, such as to get parent taxonomic category, which we would need to do repetitively in order to find out if the organism belongs to the bird ("Aves") class (a feature saved for another phase...)
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

  $.ajax(settings);
}

/**
 * Check to be sure common name entered is at least two characters. If so, call getDataFromApi to show similar names or handle exact match.
 * @method lookupSimilarNamesAndTsns
 * @param {} commonName
 * @return
 */
function lookupSimilarNamesAndTsns(commonName) {
  if (commonName.length < 2) {
    displayMessage("Organism name must be at least 2 characters long.");
    return;
  }
  getDataFromApi("https://www.itis.gov/ITISWebService/jsonservice/searchByCommonName", "srchKey", commonName, organizeCommonNamesAndTsns);
}

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
  if (data.commonNames.length === 1 && !data.commonNames[0]) {
    displayMessage("No match in database for '" + $("#js-common-name").val() + ".'");
    return;
  }

  const namesTsns = [];
  for (let i = 0; i < data.commonNames.length; i++) {
    // If you find an exact match, use it. Look up scientific name and do not process other common names.
    if (
      $("#js-common-name")
        .val()
        .trim() === data.commonNames[i].commonName
    ) {
      findScientificNameFromTsn(data.commonNames[i].tsn, extractScientificNameAndKingdom);
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

/**
 * Display common names retrieved from ITIS database
 * @method displayNameAlternatives
 * @param {} namesTsns
 * @return
 */
function displayNameAlternatives(namesTsns) {
  showSection("name-choices");
  let maxEntries = 20; // Arbitrary number that should be changed or else use pagination.
  if (namesTsns.length < maxEntries) {
    maxEntries = namesTsns.length;
  }

  // Show alternative common names to user
  // Create the alternative name suggestions in backwards order on the screen so they end up in forward order.
  for (let i = maxEntries - 1; i >= 0; i--) {
    $("#name-choices").prepend('<li><a class="name-choice" href="#" data="' + namesTsns[i].tsn + '">' + namesTsns[i].commonName + " " + "</a></li>");

    // Add the TSN to the data attribute so we can access it later (but user never sees it).
    $("#name-choices")
      .first()
      .data("tsn", namesTsns[i].tsn);
  }
}

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
 * Show scientific name and kingdom for organism chosen by user.
 * @method extractScientificNameAndKingdom
 * @param {} data
 * @return
 */
function extractScientificNameAndKingdom(data) {
  showSection("enter-data");
  $("#js-scientific-name").val(data.combinedName);
  $("#js-kingdom").val(data.kingdom);
  $("#js-tsn").val(data.tsn);
}


/**
 * Save the sighting record to the database.
 * @method addSighting
 * @param {} sightingRecord
 * @return
 */
function addSighting(sightingRecord) {
  $.ajax({
    method: "POST",
    url: "/",
    data: JSON.stringify(sightingRecord),
    success: function(data) {
      displayMessage(sightingRecord.commonName + " record saved successfully.");
      $("input").val("");
    },
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
 * Handle user action events
 * @method handleUserActions
 * @return
 */
function handleUserActions() {
  // User clicked the 'Enter Here' button
$("#js-enter").on("click", e => {
  e.preventDefault();
  showSection("enter-data");
});

  // User clicked the 'Home' link
$("#js-home").on("click", e => {
  e.preventDefault();
  showSection("lead-in");
});

  //
// User clicked 'Read Wikipedia' so open Wikipedia for that organism
// NOTE: In a later phase, would change to use ebiard (Cornell University) website for birds.
$("#js-read-description").on("click", e => {
  let url = "";
  let organism = $("#js-scientific-name").val();

  // If there is no scientific name, use the common name if there is one.
  if (!organism) {
    organism = $("#js-common-name").val();
  }

  // If scientific and common names are blank, ask user if wants to visit home page.
  if (organism.trim() === "") {
    if (confirm("There is no scientific or common name entered. Do you want to open Wikipedia's home page?")) {
      url = "https://en.wikipedia.org/";
    }
  } else {
    url = "https://en.wikipedia.org/wiki/" + organism.split(" ").join("_");
  }

  // Open Wikipedia in a new window
  if (!(url === "")) {
    window.open(url);
  }
});


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

  // User clicked the 'Contact' button
$("#js-contact").on("click", e => {
  clearFields();
  toggleSaveUpdate("save");
  showSection("contact");
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
  $("#js-common-name").focus();
});

  // User clicked 'View/Update' button on list of records. Call findSingleSighting() to show desired one.
$("#js-list").on("click", "#js-view", e => {
  e.preventDefault();
  const id = e.target.getAttribute("data-id");
  findSingleSighting(id);
  STORE.updateId = id;
});

  // User clicked delete, so remove record from both database and screen.
$("#js-list").on("click", "#js-delete", function(e) {
  e.preventDefault();
  if (confirm("Delete record for " + e.target.getAttribute("data-common-name") + "?")) {
    let id = e.target.getAttribute("data-id");
    let commonName = e.target.getAttribute("data-common-name");
    const screenObj = $(this);
    $.ajax({
      method: "DELETE",
      url: "/" + id,
      success: function(data) {
        removeItem(e.target.getAttribute("data-id"), screenObj.parent().parent());
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
  $("#js-common-name").focus();
});

  // For links and buttons that open a new section where previous section data should be cleared
$(".common-events").on("click", e => {
  resetFeedback();
});


}

// When document is ready, set up datepicker and await user actions.
$(document).ready(function() {
    datePickerSetup();
    handleUserActions();
});
