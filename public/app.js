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
  $.ajax(settings);
}

function insertList(data) {
  console.log("Inside insertList");
  console.log(data);

  const listHtml = data.creatureSightings
    .map(sighting => {
      return `<li><span class="sighting-list">${sighting.commonName}</span> <span class="sighting-list">${sighting.scientificName}</span> <span class="sighting-list">${sighting.dateSighted}</span> <span class="sighting-list">${sighting.timeSighted}</span> <span class="sighting-list">${sighting.location}</span> <span class="sighting-list">${sighting.byWhomSighted}</span>
  <button class="sighting-list view" id="js-view" data-id="${sighting._id}">View/Update</button>
  <button class="sighting-list delete" id="js-delete" data-id="${sighting._id}">Delete</button>
</li>
`;
    })
    .join("");
  $("#js-list").html(listHtml);
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
  let maxEntries = 20; // Arbitrary number than can be changed.
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
    },
    dataType: "json",
    contentType: "application/json"
  });
}

function findSingleSighting(Id) {
  // window.test = Id;
  console.log("Found sighting: " + Id);
  $.ajax({
    method: "GET",
    url: "http://localhost:8080/find/" + Id,
    success: function(data) {
      console.log("Found Id: ", Id, data);
    },
    dataType: "json",
    contentType: "application/json"
  });
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

  $("#js-show-list").on("click", function(e) {
  e.preventDefault();
  console.log("Inside #js-show-list click event.");
  populateList();
});


  $("#js-save").on("click", function(e) {
    e.preventDefault();
    addSighting({
      tsn: $("#js-tsn").val(),
      commonName: $("#js-common-name").val(),
      scientificName: $("#js-scientific-name").val(),
      dateSighted: $("#js-date-sighted").val(),
      timeSighted: $("#js-time-sighted").val(),
      location: $("#js-location").val(),
      byWhomSighted: $("#js-by-whom").val(),
      comments: $("#js-comments").val()
    });
  });

  $("#js-list").on("click", "#js-view", e => {
  e.preventDefault();
  console.log("Inside click event for View/Update with data-id: ", e.target.getAttribute("data-id"));
  findSingleSighting(e.target.getAttribute("data-id"));
});


}

// 1. Start when document is ready
$(document).ready(function() {
  // console.log("You are running app.js in Bird Logger");
  handleUserActions();
});
