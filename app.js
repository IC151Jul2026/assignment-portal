(() => {
  "use strict";

  const config = window.PORTAL_CONFIG || {};
  const organization = typeof config.organization === "string" && config.organization
    ? config.organization
    : "IC151Jul2026";
  const assignments = Array.isArray(config.assignments) ? config.assignments : [];
  const assignmentPattern = /^[a-z0-9][a-z0-9._-]*$/;
  const rollPattern = /^[A-Za-z0-9._-]+$/;
  // Comes from course.repository_pattern so this always matches what the release
  // script actually created. Never hardcode the repository name shape here.
  const repositoryPattern = typeof config.repositoryPattern === "string" && config.repositoryPattern
    ? config.repositoryPattern
    : "{assignment}-{roll}";
  const needsBatch = repositoryPattern.includes("{batch}");
  // Comes from course.team_pattern. Access is granted through the student's team, so
  // the team page is the one link that keeps working across every assignment.
  const teamPattern = typeof config.teamPattern === "string" && config.teamPattern
    ? config.teamPattern
    : "student-{batch}-{roll}";

  const form = document.getElementById("repository-form");
  const assignmentSelect = document.getElementById("assignment");
  const assignmentHelp = document.getElementById("assignment-help");
  const rollInput = document.getElementById("roll");
  const batchSelect = document.getElementById("batch");
  const formStatus = document.getElementById("form-status");
  const confirmation = document.getElementById("confirmation");
  const confirmationCopy = document.getElementById("confirmation-copy");
  const repositoryLink = document.getElementById("repository-link");
  const teamLink = document.getElementById("team-link");
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

  function repositoryUrl(assignment, roll, batch) {
    const name = repositoryPattern
      .replace(/\{assignment\}/g, assignment)
      .replace(/\{batch\}/g, batch)
      .replace(/\{roll\}/g, roll);
    return `https://github.com/${organization}/${name}`;
  }

  function teamUrl(roll, batch) {
    // GitHub lowercases team slugs, matching team_name() in the release tooling.
    const slug = teamPattern
      .replace(/\{batch\}/g, batch)
      .replace(/\{roll\}/g, roll)
      .toLowerCase();
    return `https://github.com/orgs/${organization}/teams/${slug}/repositories`;
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

  function showConfirmation(url, team, assignment, roll) {
    confirmationCopy.textContent = `Roll number ${roll}. Your team page lists every assignment you have been given, so it keeps working even before ${assignment} is released. Check the account you are signed in to before continuing.`;
    teamLink.href = team;
    teamLink.textContent = team;
    repositoryLink.href = url;
    repositoryLink.textContent = url;
    continueLink.href = team;
    form.closest(".card").hidden = true;
    confirmation.hidden = false;
    confirmation.querySelector("#back-button").focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setStatus("");

    const assignment = assignmentSelect.value;
    const roll = rollInput.value.trim();
    const batch = batchSelect ? batchSelect.value : "";

    if (!assignment || !validAssignment(assignment)) {
      setStatus("Select a valid assignment.", "error");
      assignmentSelect.focus();
      return;
    }
    if (needsBatch && !batch) {
      setStatus("Select your lab batch.", "error");
      if (batchSelect) batchSelect.focus();
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

    showConfirmation(repositoryUrl(assignment, roll, batch), teamUrl(roll, batch), assignment, roll);
  });

  backButton.addEventListener("click", showForm);
  addAssignments();
})();

(() => {
  "use strict";

  // Copy only the commands. Prompts and program output must never reach the
  // clipboard, or pasting the block straight back into a shell breaks.
  function extract(code) {
    const clone = code.cloneNode(true);
    clone.querySelectorAll(".p, .o, .ok").forEach((node) => node.remove());
    return clone.textContent.replace(/\n{3,}/g, "\n\n").trim();
  }

  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    document.body.removeChild(area);
    return copied;
  }

  document.querySelectorAll(".terminal").forEach((terminal) => {
    const button = terminal.querySelector("[data-copy]");
    const code = terminal.querySelector("code");
    if (!button || !code) return;

    button.addEventListener("click", () => {
      const text = extract(code);

      const finish = (copied) => {
        button.textContent = copied ? "Copied" : "Copy failed";
        button.classList.toggle("copied", copied);
        window.setTimeout(() => {
          button.textContent = "Copy";
          button.classList.remove("copied");
        }, 1600);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          () => finish(true),
          () => finish(fallbackCopy(text)),
        );
      } else {
        finish(fallbackCopy(text));
      }
    });
  });
})();
