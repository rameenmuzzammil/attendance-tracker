"use strict";

// The attendance maths lives in C++ (src/attendance.cpp), compiled to
// WebAssembly. This file only handles the page: forms, buttons and display.

var wasm = null;
var subjects = [];
var requiredPercent = 75;
var STORE_KEY = "attendance-tracker-v1";

var banner = document.getElementById("banner");
var requiredInput = document.getElementById("required");
var addForm = document.getElementById("add-form");
var nameInput = document.getElementById("name");
var heldInput = document.getElementById("held");
var attendedInput = document.getElementById("attended");
var formError = document.getElementById("form-error");
var subjectList = document.getElementById("subject-list");
var emptyMessage = document.getElementById("empty");
var themeButton = document.getElementById("theme-toggle");
var THEME_KEY = "attendance-tracker-theme";

// ---------- Light / dark theme ----------

function showTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "dark") {
    themeButton.textContent = "Light mode";
    themeButton.setAttribute("aria-pressed", "true");
  } else {
    themeButton.textContent = "Dark mode";
    themeButton.setAttribute("aria-pressed", "false");
  }
}

themeButton.addEventListener("click", function () {
  var current = document.documentElement.getAttribute("data-theme");
  var next = "dark";
  if (current === "dark") {
    next = "light";
  }
  showTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (error) {
    // Saving is optional.
  }
});

showTheme(document.documentElement.getAttribute("data-theme") || "light");

// ---------- Saving and loading ----------

function saveData() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      subjects: subjects,
      requiredPercent: requiredPercent
    }));
  } catch (error) {
    // Saving is optional; the app still works without it.
  }
}

function loadData() {
  try {
    var text = localStorage.getItem(STORE_KEY);
    if (text) {
      var data = JSON.parse(text);
      if (Array.isArray(data.subjects)) {
        subjects = data.subjects;
      }
      if (data.requiredPercent >= 1 && data.requiredPercent <= 100) {
        requiredPercent = data.requiredPercent;
      }
    }
  } catch (error) {
    subjects = [];
  }
}

// ---------- Loading the C++ (WebAssembly) module ----------

function loadWasm() {
  return fetch("attendance.wasm")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Could not load attendance.wasm");
      }
      return response.arrayBuffer();
    })
    .then(function (bytes) {
      return WebAssembly.instantiate(bytes, {});
    })
    .then(function (result) {
      wasm = result.instance.exports;
    });
}

// ---------- Helpers ----------

function plural(count, word) {
  if (count === 1) {
    return count + " " + word;
  }
  return count + " " + word + "es";
}

function statusFor(subject) {
  var attended = subject.attended;
  var held = subject.held;

  if (held === 0) {
    return { text: "No classes held yet. Log your first class below.", kind: "warn" };
  }

  var meets = attended * 100 >= requiredPercent * held;

  if (meets) {
    var canMiss = wasm.wasm_can_miss(attended, held, requiredPercent);
    if (canMiss === 0) {
      return {
        text: "Right on the line. Missing the next class puts you under " + requiredPercent + "%.",
        kind: "warn"
      };
    }
    return {
      text: "You can miss " + plural(canMiss, "class") + " and stay at " + requiredPercent + "% or above.",
      kind: "good"
    };
  }

  var needed = wasm.wasm_need_recover(attended, held, requiredPercent);
  if (needed === -1) {
    return { text: "With a " + requiredPercent + "% requirement, this can no longer be reached.", kind: "bad" };
  }
  return {
    text: "Attend the next " + plural(needed, "class") + " in a row to reach " + requiredPercent + "%.",
    kind: "bad"
  };
}

function makeButton(label, className, onClick) {
  var button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (className) {
    button.className = className;
  }
  button.addEventListener("click", onClick);
  return button;
}

// ---------- Drawing the page ----------

function makeSubjectCard(subject, index) {
  var percent = wasm.wasm_percentage(subject.attended, subject.held);
  var status = statusFor(subject);
  var barKind = "good";
  if (subject.attended * 100 < requiredPercent * subject.held) {
    barKind = "bad";
  }

  var item = document.createElement("li");
  item.className = "subject";

  var top = document.createElement("div");
  top.className = "subject-top";

  var name = document.createElement("h3");
  name.className = "subject-name";
  name.textContent = subject.name;

  var percentText = document.createElement("div");
  percentText.className = "subject-percent";
  percentText.textContent = percent.toFixed(1) + "%";

  top.appendChild(name);
  top.appendChild(percentText);

  var counts = document.createElement("p");
  counts.className = "counts";
  counts.textContent = subject.attended + " attended out of " + subject.held + " classes";

  var bar = document.createElement("div");
  bar.className = "bar";
  bar.setAttribute("role", "img");
  bar.setAttribute("aria-label", "Attendance " + percent.toFixed(1) + " percent, requirement " + requiredPercent + " percent");

  var fill = document.createElement("div");
  fill.className = "bar-fill " + barKind;
  fill.style.width = Math.min(100, percent) + "%";

  var tick = document.createElement("div");
  tick.className = "bar-tick";
  tick.style.left = "calc(" + requiredPercent + "% - 1.5px)";

  bar.appendChild(fill);
  bar.appendChild(tick);

  var statusLine = document.createElement("p");
  statusLine.className = "status " + status.kind;
  statusLine.textContent = status.text;

  var actions = document.createElement("div");
  actions.className = "actions";

  actions.appendChild(makeButton("Attended a class", "", function () {
    subjects[index].held = subjects[index].held + 1;
    subjects[index].attended = subjects[index].attended + 1;
    saveData();
    render();
  }));

  actions.appendChild(makeButton("Missed a class", "", function () {
    subjects[index].held = subjects[index].held + 1;
    saveData();
    render();
  }));

  actions.appendChild(makeButton("Remove", "danger", function () {
    subjects.splice(index, 1);
    saveData();
    render();
  }));

  item.appendChild(top);
  item.appendChild(counts);
  item.appendChild(bar);
  item.appendChild(statusLine);
  item.appendChild(actions);
  return item;
}

function render() {
  requiredInput.value = requiredPercent;
  subjectList.innerHTML = "";

  if (subjects.length === 0) {
    emptyMessage.hidden = false;
    return;
  }
  emptyMessage.hidden = true;

  for (var i = 0; i < subjects.length; i++) {
    subjectList.appendChild(makeSubjectCard(subjects[i], i));
  }
}

// ---------- Events ----------

addForm.addEventListener("submit", function (event) {
  event.preventDefault();
  formError.textContent = "";

  var name = nameInput.value.trim();
  var held = parseInt(heldInput.value, 10);
  var attended = parseInt(attendedInput.value, 10);

  if (name === "") {
    formError.textContent = "Enter a subject name.";
    return;
  }
  if (isNaN(held) || isNaN(attended) || held < 0 || attended < 0) {
    formError.textContent = "Classes held and attended must be whole numbers, 0 or more.";
    return;
  }
  if (attended > held) {
    formError.textContent = "Classes attended cannot be more than classes held.";
    return;
  }

  subjects.push({ name: name, held: held, attended: attended });
  saveData();
  render();

  nameInput.value = "";
  heldInput.value = 0;
  attendedInput.value = 0;
  nameInput.focus();
});

requiredInput.addEventListener("change", function () {
  var value = parseInt(requiredInput.value, 10);
  if (isNaN(value) || value < 1 || value > 100) {
    requiredInput.value = requiredPercent;
    return;
  }
  requiredPercent = value;
  saveData();
  render();
});

// ---------- Start ----------

loadData();
loadWasm()
  .then(function () {
    render();
  })
  .catch(function () {
    banner.hidden = false;
    banner.textContent =
      "The calculator could not start. If you opened index.html by double-clicking, " +
      "run it through a local server instead (for example VS Code Live Server).";
  });
