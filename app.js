(() => {
  "use strict";

  const config = window.PORTAL_CONFIG || {};
  const organization = typeof config.organization === "string" && config.organization
    ? config.organization
    : "IC151Jul2026";
  const assignments = Array.isArray(config.assignments) ? config.assignments : [];
  const assignmentPattern = /^[a-z0-9][a-z0-9._-]*$/;
  const rollPattern = /^[A-Za-z0-9._-]+$/;

  const form = document.getElementById("repository-form");
  const assignmentSelect = document.getElementById("assignment");
  const assignmentHelp = document.getElementById("assignment-help");
  const rollInput = document.getElementById("roll");
  const formStatus = document.getElementById("form-status");
  const confirmation = document.getElementById("confirmation");
  const confirmationCopy = document.getElementById("confirmation-copy");
  const repositoryLink = document.getElementById("repository-link");
  const continueLink = document.getElementById("continue-link");
  const backButton = document.getElementById("back-button");

  function setStatus(message, kind = "") {
    formStatus.textContent = message;
    formStatus.className = kind ? `status ${kind}` : "status";
  }

  function validAssignment(value) {
    return assignmentPattern.test(value);
  }

  function validRoll(value) {
    return rollPattern.test(value) && value.length <= 128;
  }

  function repositoryUrl(assignment, roll) {
    return `https://github.com/${organization}/${assignment}-${roll}`;
  }

  function addAssignments() {
    const queryAssignment = new URLSearchParams(window.location.search).get("assignment");
    let queryMatched = false;

    assignments.forEach((item) => {
      if (!item || typeof item.id !== "string" || typeof item.title !== "string") return;
      if (!validAssignment(item.id) || !item.title.trim()) return;

      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = `${item.id} — ${item.title}`;
      assignmentSelect.appendChild(option);
      if (queryAssignment === item.id) queryMatched = true;
    });

    if (queryMatched) assignmentSelect.value = queryAssignment;
    if (assignmentSelect.options.length === 1) {
      assignmentSelect.disabled = true;
      assignmentHelp.textContent = "No assignments have been published yet.";
    } else {
      assignmentHelp.textContent = "Choose the assignment named in your course announcement.";
    }
  }

  function showForm() {
    confirmation.hidden = true;
    form.closest(".card").hidden = false;
    rollInput.focus();
  }

  function showConfirmation(url, assignment, roll) {
    confirmationCopy.textContent = `This link is for assignment ${assignment} and roll number ${roll}. Check the account you are signed in to before continuing.`;
    repositoryLink.href = url;
    repositoryLink.textContent = url;
    continueLink.href = url;
    form.closest(".card").hidden = true;
    confirmation.hidden = false;
    confirmation.querySelector("#back-button").focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setStatus("");

    const assignment = assignmentSelect.value;
    const roll = rollInput.value.trim();

    if (!assignment || !validAssignment(assignment)) {
      setStatus("Select a valid assignment.", "error");
      assignmentSelect.focus();
      return;
    }
    if (!roll) {
      setStatus("Enter your roll number.", "error");
      rollInput.focus();
      return;
    }
    if (!validRoll(roll)) {
      setStatus("Use only letters, numbers, dot, underscore, or hyphen in the roll number.", "error");
      rollInput.focus();
      return;
    }

    showConfirmation(repositoryUrl(assignment, roll), assignment, roll);
  });

  backButton.addEventListener("click", showForm);
  addAssignments();
})();
