const STORAGE_KEY = "zeiterfassung-pwa-state-v1";
const APP_VERSION = "1.0.0";

const state = loadState();

let pendingConfirmation = null;
let editingEntryId = null;
let editingProjectId = null;

const elements = {
  settingsButton: document.querySelector("#settingsButton"),
  activeProjectName: document.querySelector("#activeProjectName"),
  activeTimer: document.querySelector("#activeTimer"),
  projectForm: document.querySelector("#projectForm"),
  projectNameInput: document.querySelector("#projectNameInput"),
  projectNoteInput: document.querySelector("#projectNoteInput"),
  projectsList: document.querySelector("#projectsList"),
  manualEntryForm: document.querySelector("#manualEntryForm"),
  manualProjectId: document.querySelector("#manualProjectId"),
  manualStart: document.querySelector("#manualStart"),
  manualEnd: document.querySelector("#manualEnd"),
  manualNote: document.querySelector("#manualNote"),
  exportForm: document.querySelector("#exportForm"),
  exportRangeType: document.querySelector("#exportRangeType"),
  exportDayField: document.querySelector("#exportDayField"),
  exportWeekField: document.querySelector("#exportWeekField"),
  exportMonthField: document.querySelector("#exportMonthField"),
  exportDay: document.querySelector("#exportDay"),
  exportWeek: document.querySelector("#exportWeek"),
  exportMonth: document.querySelector("#exportMonth"),
  entriesTableBody: document.querySelector("#entriesTableBody"),
  deleteAllEntriesButton: document.querySelector("#deleteAllEntriesButton"),
  todayTotal: document.querySelector("#todayTotal"),
  weekTotal: document.querySelector("#weekTotal"),
  monthTotal: document.querySelector("#monthTotal"),
  confirmDialog: document.querySelector("#confirmDialog"),
  confirmDialogTitle: document.querySelector("#confirmDialogTitle"),
  confirmDialogText: document.querySelector("#confirmDialogText"),
  confirmYesButton: document.querySelector("#confirmYesButton"),
  entryEditorDialog: document.querySelector("#entryEditorDialog"),
  entryEditorForm: document.querySelector("#entryEditorForm"),
  entryEditorId: document.querySelector("#entryEditorId"),
  entryEditorProjectId: document.querySelector("#entryEditorProjectId"),
  entryEditorStart: document.querySelector("#entryEditorStart"),
  entryEditorEnd: document.querySelector("#entryEditorEnd"),
  entryEditorNote: document.querySelector("#entryEditorNote"),
  entryEditorDeleteButton: document.querySelector("#entryEditorDeleteButton"),
  entryEditorCancelButton: document.querySelector("#entryEditorCancelButton"),
  settingsDialog: document.querySelector("#settingsDialog"),
  closeSettingsButton: document.querySelector("#closeSettingsButton"),
  roundingSelect: document.querySelector("#roundingSelect"),
  exportDataButton: document.querySelector("#exportDataButton"),
  importDataButton: document.querySelector("#importDataButton"),
  importDataInput: document.querySelector("#importDataInput"),
  projectEditorDialog: document.querySelector("#projectEditorDialog"),
  projectEditorForm: document.querySelector("#projectEditorForm"),
  projectEditorId: document.querySelector("#projectEditorId"),
  projectEditorName: document.querySelector("#projectEditorName"),
  projectEditorNote: document.querySelector("#projectEditorNote"),
  projectNoteDialog: document.querySelector("#projectNoteDialog"),
  projectNoteDialogTitle: document.querySelector("#projectNoteDialogTitle"),
  projectNoteDialogText: document.querySelector("#projectNoteDialogText"),
  closeProjectNoteButton: document.querySelector("#closeProjectNoteButton"),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate")
};

initializeDefaults();
bindEvents();
render();
startTicker();
registerServiceWorker();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }

    const parsed = JSON.parse(raw);
    return {
      version: parsed.version || APP_VERSION,
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      activeSession: parsed.activeSession || null,
      settings: {
        roundingMinutes: parsed.settings?.roundingMinutes || 5
      }
    };
  } catch {
    return createInitialState();
  }
}

function createInitialState() {
  return {
    version: APP_VERSION,
    projects: [],
    entries: [],
    activeSession: null,
    settings: {
      roundingMinutes: 5
    }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function replaceState(nextState) {
  state.version = nextState.version || APP_VERSION;
  state.projects = Array.isArray(nextState.projects) ? nextState.projects : [];
  state.entries = Array.isArray(nextState.entries) ? nextState.entries : [];
  state.activeSession = nextState.activeSession || null;
  state.settings = {
    roundingMinutes: nextState.settings?.roundingMinutes || 5
  };
  saveState();
}

async function shareOrDownloadFile(file, fallbackName, title) {
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        files: [file]
      });
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
    }
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fallbackName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function initializeDefaults() {
  const now = new Date();
  elements.exportDay.value = toDateInputValue(now);
  elements.exportWeek.value = toWeekInputValue(now);
  elements.exportMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  elements.roundingSelect.value = String(getRoundingMinutes());
  applyManualTimeSuggestions();
}

function bindEvents() {
  elements.projectForm.addEventListener("submit", handleProjectSubmit);
  elements.manualEntryForm.addEventListener("submit", handleManualEntrySubmit);
  elements.exportForm.addEventListener("submit", handleExportSubmit);
  elements.exportRangeType.addEventListener("change", updateExportFields);
  elements.deleteAllEntriesButton.addEventListener("click", promptDeleteAllEntries);
  elements.entryEditorForm.addEventListener("submit", handleEntryEditorSubmit);
  elements.entryEditorDeleteButton.addEventListener("click", handleEntryEditorDelete);
  elements.entryEditorCancelButton.addEventListener("click", () => {
    elements.entryEditorDialog.close();
  });
  elements.entryEditorDialog.addEventListener("close", () => {
    editingEntryId = null;
  });
  elements.settingsButton.addEventListener("click", () => {
    elements.settingsDialog.showModal();
  });
  elements.closeSettingsButton.addEventListener("click", () => {
    elements.settingsDialog.close();
  });
  elements.roundingSelect.addEventListener("change", handleRoundingChange);
  elements.exportDataButton.addEventListener("click", exportAppData);
  elements.importDataButton.addEventListener("click", () => {
    elements.importDataInput.click();
  });
  elements.importDataInput.addEventListener("change", handleImportData);
  elements.projectEditorForm.addEventListener("submit", handleProjectEditorSubmit);
  elements.projectEditorDialog.addEventListener("close", () => {
    editingProjectId = null;
  });
  elements.closeProjectNoteButton.addEventListener("click", () => {
    elements.projectNoteDialog.close();
  });
  elements.confirmDialog.addEventListener("close", handleDeleteDialogClose);
}

function handleProjectSubmit(event) {
  event.preventDefault();
  const name = elements.projectNameInput.value.trim();
  const note = elements.projectNoteInput.value.trim();

  if (!name) {
    return;
  }

  if (!isProjectNameUnique(name)) {
    alert("Der Projektname ist bereits vergeben. Bitte wähle einen eindeutigen Namen.");
    return;
  }

  state.projects.push({
    id: createId(),
    name,
    note,
    createdAt: new Date().toISOString()
  });

  elements.projectNameInput.value = "";
  elements.projectNoteInput.value = "";
  saveState();
  render();
}

function handleManualEntrySubmit(event) {
  event.preventDefault();

  const projectId = elements.manualProjectId.value;
  const start = new Date(elements.manualStart.value);
  const end = new Date(elements.manualEnd.value);

  if (!projectId) {
    alert("Bitte zuerst ein Projekt anlegen.");
    return;
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    alert("Der manuelle Zeitblock braucht ein gültiges Start- und Enddatum.");
    return;
  }

  state.entries.unshift({
    id: createId(),
    projectId,
    start: start.toISOString(),
    end: end.toISOString(),
    type: "Manuell",
    note: elements.manualNote.value.trim(),
    createdAt: new Date().toISOString()
  });

  elements.manualNote.value = "";
  saveState();
  render();
}

async function handleExportSubmit(event) {
  event.preventDefault();

  const range = getSelectedRange();
  const rows = buildExportRows(range.start, range.end);

  if (!rows.length) {
    alert("Im gewählten Zeitraum wurden keine abgeschlossenen Zeitblöcke gefunden.");
    return;
  }

  const workbook = createSpreadsheetXml(rows, range.label);
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel" });
  const fileName = `zeiterfassung-${range.fileStamp}.xls`;
  const file = new File([blob], fileName, { type: blob.type });
  await shareOrDownloadFile(file, fileName, "Zeiterfassung exportieren");
}

function updateExportFields() {
  const type = elements.exportRangeType.value;
  elements.exportDayField.hidden = type !== "day";
  elements.exportWeekField.hidden = type !== "week";
  elements.exportMonthField.hidden = type !== "customMonth";
}

function startTicker() {
  updateActiveTimer();
  setInterval(updateActiveTimer, 1000);
}

function updateActiveTimer() {
  const activeProject = getActiveProject();

  if (!state.activeSession || !activeProject) {
    elements.activeProjectName.textContent = "Kein Projekt eingebucht";
    elements.activeTimer.textContent = "00:00:00";
    return;
  }

  const startedAt = new Date(state.activeSession.start);
  const durationMs = Math.max(Date.now() - startedAt.getTime(), 0);
  elements.activeProjectName.textContent = activeProject.name;
  elements.activeTimer.textContent = formatDuration(durationMs, true);
}

function render() {
  elements.roundingSelect.value = String(getRoundingMinutes());
  renderProjects();
  renderManualProjectOptions();
  renderEntries();
  renderTotals();
  updateActiveTimer();
  updateExportFields();
  elements.deleteAllEntriesButton.disabled = !state.entries.length;
}

function renderProjects() {
  elements.projectsList.innerHTML = "";

  if (!state.projects.length) {
    elements.projectsList.appendChild(elements.emptyStateTemplate.content.cloneNode(true));
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const project of state.projects) {
    const active = state.activeSession?.projectId === project.id;
    const projectEntries = state.entries.filter((entry) => entry.projectId === project.id && isEntryOnDate(entry, new Date()));
    const projectTotalMs = projectEntries.reduce((sum, entry) => sum + getDurationMs(entry), 0);
    const notePreview = project.note
      ? `<button class="project-note-preview" type="button" data-project-note="${project.id}">${escapeHtml(project.note)}</button>`
      : `<span class="project-note-preview">Keine Notiz hinterlegt</span>`;

    const card = document.createElement("article");
    card.className = `project-card${active ? " active" : ""}`;
    card.draggable = true;
    card.dataset.projectId = project.id;
    card.innerHTML = `
      <div class="project-header-row">
        <div class="project-main">
          <div class="project-name">${escapeHtml(project.name)}</div>
          <div class="project-meta">
            <span class="pill">${active ? `Läuft seit ${formatDateTime(state.activeSession.start)}` : `${projectEntries.length} Zeitblock${projectEntries.length === 1 ? "" : "e"} heute`}</span>
            <span class="pill">Heute ${formatDuration(projectTotalMs)}</span>
          </div>
          ${notePreview}
        </div>
        <div class="drag-handle" aria-hidden="true" title="Projekt verschieben">⋮⋮</div>
      </div>
      <div class="project-actions">
        <button class="primary-button project-button" data-action="clock-in" data-project-id="${project.id}" ${active ? "disabled" : ""}>Einbuchen</button>
        <button class="secondary-button project-button" data-action="clock-out" data-project-id="${project.id}" ${active ? "" : "disabled"}>Ausbuchen</button>
      </div>
      <div class="project-secondary-actions">
        <button class="secondary-button project-button" data-action="edit" data-project-id="${project.id}">Bearbeiten</button>
        <button class="danger-button project-button" data-action="delete" data-project-id="${project.id}">Löschen</button>
      </div>
    `;
    fragment.appendChild(card);
  }

  elements.projectsList.appendChild(fragment);
  elements.projectsList.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", handleProjectActionClick);
  });
  elements.projectsList.querySelectorAll("button[data-project-note]").forEach((button) => {
    button.addEventListener("click", handleProjectNoteClick);
  });
  bindProjectSorting();
}

function renderManualProjectOptions() {
  elements.manualProjectId.innerHTML = "";

  if (!state.projects.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Bitte zuerst ein Projekt anlegen";
    elements.manualProjectId.appendChild(option);
    return;
  }

  for (const project of state.projects) {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    elements.manualProjectId.appendChild(option);
  }
}

function renderEntries() {
  elements.entriesTableBody.innerHTML = "";

  const sortedEntries = [...state.entries]
    .filter((entry) => entry.end)
    .sort((left, right) => new Date(right.start) - new Date(left.start));

  if (!sortedEntries.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5" class="empty-cell">Noch keine Zeitblöcke gespeichert.</td>`;
    elements.entriesTableBody.appendChild(row);
    return;
  }

  for (const entry of sortedEntries) {
    const project = findProject(entry.projectId);
    const row = document.createElement("tr");
    row.dataset.entryId = entry.id;
    row.innerHTML = `
      <td>${escapeHtml(project?.name || "Unbekanntes Projekt")}</td>
      <td>${formatDateTime(entry.start)}</td>
      <td>${formatDuration(getDurationMs(entry))}</td>
      <td>${escapeHtml(entry.note || "—")}</td>
      <td><button class="secondary-button" type="button" data-entry-action="edit" data-entry-id="${entry.id}">Editor</button></td>
    `;
    elements.entriesTableBody.appendChild(row);
  }

  elements.entriesTableBody.querySelectorAll("button[data-entry-action]").forEach((button) => {
    button.addEventListener("click", handleEntryActionClick);
  });
}

function renderTotals() {
  const now = new Date();
  elements.todayTotal.textContent = formatDuration(sumRangeDuration(startOfDay(now), endOfDay(now)));
  elements.weekTotal.textContent = formatDuration(sumRangeDuration(startOfWeek(now), endOfWeek(now)));
  elements.monthTotal.textContent = formatDuration(sumRangeDuration(startOfMonth(now), endOfMonth(now)));
}

function handleProjectActionClick(event) {
  const { action, projectId } = event.currentTarget.dataset;

  if (action === "clock-in") {
    clockIn(projectId);
  }

  if (action === "clock-out") {
    clockOut(projectId);
  }

  if (action === "delete") {
    promptDeleteProject(projectId);
  }

  if (action === "edit") {
    openProjectEditor(projectId);
  }
}

function handleProjectNoteClick(event) {
  const projectId = event.currentTarget.dataset.projectNote;
  const project = findProject(projectId);

  if (!project?.note) {
    return;
  }

  elements.projectNoteDialogTitle.textContent = project.name;
  elements.projectNoteDialogText.textContent = project.note;
  elements.projectNoteDialog.showModal();
}

function bindProjectSorting() {
  const cards = [...elements.projectsList.querySelectorAll(".project-card[data-project-id]")];

  for (const card of cards) {
    card.addEventListener("dragstart", handleProjectDragStart);
    card.addEventListener("dragover", handleProjectDragOver);
    card.addEventListener("dragleave", handleProjectDragLeave);
    card.addEventListener("drop", handleProjectDrop);
    card.addEventListener("dragend", handleProjectDragEnd);
  }
}

function handleProjectDragStart(event) {
  const projectId = event.currentTarget.dataset.projectId;
  event.dataTransfer.setData("text/plain", projectId);
  event.dataTransfer.effectAllowed = "move";
  event.currentTarget.classList.add("dragging");
}

function handleProjectDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  event.currentTarget.classList.add("drag-over");
}

function handleProjectDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

function handleProjectDrop(event) {
  event.preventDefault();
  const draggedProjectId = event.dataTransfer.getData("text/plain");
  const targetProjectId = event.currentTarget.dataset.projectId;
  event.currentTarget.classList.remove("drag-over");

  if (!draggedProjectId || !targetProjectId || draggedProjectId === targetProjectId) {
    return;
  }

  const fromIndex = state.projects.findIndex((project) => project.id === draggedProjectId);
  const toIndex = state.projects.findIndex((project) => project.id === targetProjectId);

  if (fromIndex === -1 || toIndex === -1) {
    return;
  }

  const [movedProject] = state.projects.splice(fromIndex, 1);
  state.projects.splice(toIndex, 0, movedProject);
  saveState();
  render();
}

function handleProjectDragEnd() {
  elements.projectsList.querySelectorAll(".project-card").forEach((card) => {
    card.classList.remove("dragging", "drag-over");
  });
}

function handleEntryActionClick(event) {
  const { entryAction, entryId } = event.currentTarget.dataset;

  if (entryAction === "edit") {
    openEntryEditor(entryId);
  }
}

function clockIn(projectId) {
  let nowIso = new Date().toISOString();

  if (state.activeSession?.projectId === projectId) {
    return;
  }

  if (state.activeSession) {
    nowIso = finalizeActiveSession(nowIso, true);
  }

  state.activeSession = { projectId, start: nowIso };
  saveState();
  render();
}

function clockOut(projectId) {
  if (!state.activeSession || state.activeSession.projectId !== projectId) {
    return;
  }

  finalizeActiveSession(new Date().toISOString(), true);
  saveState();
  render();
}

function finalizeActiveSession(endIso, shouldRound = false) {
  if (!state.activeSession) {
    return endIso;
  }

  const start = new Date(state.activeSession.start);
  const actualEnd = new Date(endIso);
  const end = shouldRound
    ? roundSessionEndUp(start, actualEnd, getRoundingMinutes())
    : actualEnd;

  if (end > start) {
    state.entries.unshift({
      id: createId(),
      projectId: state.activeSession.projectId,
      start: start.toISOString(),
      end: end.toISOString(),
      type: "Live",
      note: "",
      createdAt: new Date().toISOString()
    });
  }

  state.activeSession = null;
  return end.toISOString();
}

function promptDeleteProject(projectId) {
  const project = findProject(projectId);
  if (!project) {
    return;
  }

  const entryCount = state.entries.filter((entry) => entry.projectId === projectId).length;
  openConfirmation({
    title: "Projekt löschen?",
    message: `Soll "${project.name}" wirklich gelöscht werden? Alle ${entryCount} gespeicherten Zeitblöcke dieses Projekts werden ebenfalls entfernt.`,
    confirmLabel: "Ja, löschen",
    onConfirm: () => {
      if (state.activeSession?.projectId === projectId) {
        finalizeActiveSession(new Date().toISOString());
      }

      state.projects = state.projects.filter((entryProject) => entryProject.id !== projectId);
      state.entries = state.entries.filter((entry) => entry.projectId !== projectId);
      saveState();
      render();
    }
  });
}

function handleDeleteDialogClose() {
  if (elements.confirmDialog.returnValue !== "confirm" || !pendingConfirmation) {
    pendingConfirmation = null;
    return;
  }

  const { onConfirm } = pendingConfirmation;
  pendingConfirmation = null;
  onConfirm();
}

function openEntryEditor(entryId) {
  const entry = state.entries.find((currentEntry) => currentEntry.id === entryId);
  if (!entry) {
    return;
  }

  editingEntryId = entryId;
  elements.entryEditorId.value = entry.id;
  elements.entryEditorProjectId.innerHTML = buildProjectOptions(entry.projectId);
  elements.entryEditorStart.value = toDateTimeLocalValue(new Date(entry.start));
  elements.entryEditorEnd.value = toDateTimeLocalValue(new Date(entry.end));
  elements.entryEditorNote.value = entry.note || "";
  elements.entryEditorDialog.showModal();
}

function handleEntryEditorSubmit(event) {
  event.preventDefault();
  if (!editingEntryId) {
    return;
  }

  saveEntryFromRow(editingEntryId);
  editingEntryId = null;
}

function handleEntryEditorDelete() {
  if (!editingEntryId) {
    return;
  }

  promptDeleteEntry(editingEntryId);
}

function handleProjectEditorSubmit(event) {
  event.preventDefault();

  if (!editingProjectId) {
    return;
  }

  const project = findProject(editingProjectId);
  const name = elements.projectEditorName.value.trim();
  const note = elements.projectEditorNote.value.trim();

  if (!project || !name) {
    return;
  }

  if (!isProjectNameUnique(name, editingProjectId)) {
    alert("Der Projektname ist bereits vergeben. Bitte wähle einen eindeutigen Namen.");
    return;
  }

  project.name = name;
  project.note = note;
  saveState();
  elements.projectEditorDialog.close();
  render();
}

function openProjectEditor(projectId) {
  const project = findProject(projectId);
  if (!project) {
    return;
  }

  editingProjectId = projectId;
  elements.projectEditorId.value = project.id;
  elements.projectEditorName.value = project.name;
  elements.projectEditorNote.value = project.note || "";
  elements.projectEditorDialog.showModal();
}

function handleRoundingChange() {
  state.settings.roundingMinutes = Number(elements.roundingSelect.value) || 5;
  saveState();
  applyManualTimeSuggestions();
}

async function exportAppData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "Projekt-Zeiterfassung",
    version: APP_VERSION,
    data: {
      version: state.version,
      projects: state.projects,
      entries: state.entries,
      activeSession: state.activeSession,
      settings: state.settings
    }
  };

  const file = new File(
    [JSON.stringify(payload, null, 2)],
    `zeiterfassung-daten-${toDateInputValue(new Date())}.json`,
    { type: "application/json" }
  );

  await shareOrDownloadFile(file, file.name, "Zeiterfassungsdaten exportieren");
}

async function handleImportData(event) {
  const [file] = event.target.files || [];
  event.target.value = "";

  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const importedState = parsed.data || parsed;

    if (!isValidImportedState(importedState)) {
      alert("Die ausgewählte Datei enthält keine gültigen Zeiterfassungsdaten.");
      return;
    }

    openConfirmation({
      title: "Daten importieren?",
      message: "Sollen die aktuell gespeicherten Daten durch die importierten Daten ersetzt werden?",
      confirmLabel: "Ja, importieren",
      onConfirm: () => {
        replaceState(importedState);
        elements.settingsDialog.close();
        applyManualTimeSuggestions();
        render();
      }
    });
  } catch {
    alert("Die Datei konnte nicht importiert werden. Bitte verwende eine gültige JSON-Exportdatei.");
  }
}

function saveEntryFromRow(entryId) {
  const entry = state.entries.find((currentEntry) => currentEntry.id === entryId);
  if (!entry) {
    return;
  }

  const projectId = elements.entryEditorProjectId.value;
  const start = new Date(elements.entryEditorStart.value);
  const end = new Date(elements.entryEditorEnd.value);
  const note = elements.entryEditorNote.value.trim();

  if (!findProject(projectId)) {
    alert("Bitte ein gültiges Projekt auswählen.");
    return;
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    alert("Start und Ende des Blocks müssen gültig sein und Ende muss nach Start liegen.");
    return;
  }

  entry.projectId = projectId;
  entry.start = start.toISOString();
  entry.end = end.toISOString();
  entry.note = note;

  saveState();
  elements.entryEditorDialog.close();
  render();
}

function promptDeleteEntry(entryId) {
  const entry = state.entries.find((currentEntry) => currentEntry.id === entryId);
  if (!entry) {
    return;
  }

  const project = findProject(entry.projectId);
  openConfirmation({
    title: "Zeitblock löschen?",
    message: `Soll der Zeitblock von "${project?.name || "Unbekanntes Projekt"}" wirklich gelöscht werden?`,
    confirmLabel: "Ja, löschen",
    onConfirm: () => {
      state.entries = state.entries.filter((currentEntry) => currentEntry.id !== entryId);
      if (editingEntryId === entryId) {
        editingEntryId = null;
        elements.entryEditorDialog.close();
      }
      saveState();
      render();
    }
  });
}

function promptDeleteAllEntries() {
  openConfirmation({
    title: "Alle Zeitblöcke löschen?",
    message: `Sollen wirklich alle ${state.entries.length} gespeicherten Zeitblöcke gelöscht werden?`,
    confirmLabel: "Ja, alle löschen",
    onConfirm: () => {
      state.entries = [];
      saveState();
      render();
    }
  });
}

function openConfirmation({ title, message, confirmLabel, onConfirm }) {
  pendingConfirmation = { onConfirm };
  elements.confirmDialogTitle.textContent = title;
  elements.confirmDialogText.textContent = message;
  elements.confirmYesButton.textContent = confirmLabel;
  elements.confirmDialog.showModal();
}

function buildProjectOptions(selectedProjectId) {
  return state.projects.map((project) => `
    <option value="${project.id}" ${project.id === selectedProjectId ? "selected" : ""}>${escapeHtml(project.name)}</option>
  `).join("");
}

function isEntryOnDate(entry, date) {
  const start = new Date(entry.start);
  return start.getFullYear() === date.getFullYear()
    && start.getMonth() === date.getMonth()
    && start.getDate() === date.getDate();
}

function isValidImportedState(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }

  if (!Array.isArray(candidate.projects) || !Array.isArray(candidate.entries)) {
    return false;
  }

  return true;
}

function isProjectNameUnique(name, ignoreProjectId = null) {
  const normalized = normalizeProjectName(name);
  return !state.projects.some((project) => {
    if (ignoreProjectId && project.id === ignoreProjectId) {
      return false;
    }
    return normalizeProjectName(project.name) === normalized;
  });
}

function normalizeProjectName(name) {
  return name.trim().toLocaleLowerCase("de-DE");
}

function getRoundingMinutes() {
  return Number(state.settings?.roundingMinutes) || 5;
}

function roundDateUp(date, minutes) {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const stepMs = minutes * 60 * 1000;
  rounded.setTime(Math.ceil(rounded.getTime() / stepMs) * stepMs);
  return rounded;
}

function roundDateDown(date, minutes) {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const stepMs = minutes * 60 * 1000;
  rounded.setTime(Math.floor(rounded.getTime() / stepMs) * stepMs);
  return rounded;
}

function roundSessionEndUp(start, end, minutes) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const stepMs = minutes * 60 * 1000;
  const durationMs = Math.max(endMs - startMs, 0);
  const roundedDurationMs = Math.ceil(durationMs / stepMs) * stepMs;
  return new Date(startMs + roundedDurationMs);
}

function applyManualTimeSuggestions() {
  const minutes = getRoundingMinutes();
  const now = new Date();
  const roundedEnd = roundDateUp(now, minutes);
  const roundedStart = new Date(roundedEnd.getTime() - minutes * 60 * 1000);
  const stepSeconds = minutes * 60;

  elements.manualStart.step = String(stepSeconds);
  elements.manualEnd.step = String(stepSeconds);

  elements.manualStart.value = toDateTimeLocalValue(roundedStart);
  elements.manualEnd.value = toDateTimeLocalValue(roundedEnd);
}

function getSelectedRange() {
  const type = elements.exportRangeType.value;
  const now = new Date();

  if (type === "day") {
    const date = new Date(elements.exportDay.value || now);
    return {
      start: startOfDay(date),
      end: endOfDay(date),
      label: `Tag ${toDateInputValue(date)}`,
      fileStamp: toDateInputValue(date)
    };
  }

  if (type === "week") {
    const [year, week] = (elements.exportWeek.value || toWeekInputValue(now)).split("-W").map(Number);
    const start = isoWeekToDate(year, week);
    return {
      start,
      end: endOfWeek(start),
      label: `Woche ${year}-W${String(week).padStart(2, "0")}`,
      fileStamp: `${year}-W${String(week).padStart(2, "0")}`
    };
  }

  if (type === "customMonth") {
    const [year, month] = (elements.exportMonth.value || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).split("-").map(Number);
    const customMonthDate = new Date(year, month - 1, 1);
    return {
      start: startOfMonth(customMonthDate),
      end: endOfMonth(customMonthDate),
      label: `Monat ${customMonthDate.getFullYear()}-${String(customMonthDate.getMonth() + 1).padStart(2, "0")}`,
      fileStamp: `${customMonthDate.getFullYear()}-${String(customMonthDate.getMonth() + 1).padStart(2, "0")}`
    };
  }

  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
    label: `Monat ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    fileStamp: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  };
}

function buildExportRows(rangeStart, rangeEnd) {
  return state.entries
    .filter((entry) => entry.end)
    .map((entry) => clipEntryToRange(entry, rangeStart, rangeEnd))
    .filter(Boolean)
    .sort((left, right) => new Date(left.start) - new Date(right.start))
    .map((entry) => {
      const project = findProject(entry.projectId);
      const durationMs = getDurationMs(entry);
      return {
        date: toDateInputValue(new Date(entry.start)),
        project: project?.name || "Unbekanntes Projekt",
        start: formatDateTime(entry.start),
        end: formatDateTime(entry.end),
        durationHours: (durationMs / 3600000).toFixed(2).replace(".", ","),
        durationClock: formatDuration(durationMs),
        type: entry.type,
        note: entry.note || ""
      };
    });
}

function clipEntryToRange(entry, rangeStart, rangeEnd) {
  const entryStart = new Date(entry.start);
  const entryEnd = new Date(entry.end);
  const clippedStart = new Date(Math.max(entryStart.getTime(), rangeStart.getTime()));
  const clippedEnd = new Date(Math.min(entryEnd.getTime(), rangeEnd.getTime()));

  if (clippedEnd <= clippedStart) {
    return null;
  }

  return {
    ...entry,
    start: clippedStart.toISOString(),
    end: clippedEnd.toISOString()
  };
}

function createSpreadsheetXml(rows, label) {
  const totalHours = rows.reduce((sum, row) => sum + Number.parseFloat(row.durationHours.replace(",", ".")), 0);
  const dataRows = rows.map((row) => `
    <Row>
      <Cell><Data ss:Type="String">${escapeXml(row.date)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(row.project)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(row.start)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(row.end)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(row.durationHours)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(row.durationClock)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(row.type)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(row.note)}</Data></Cell>
    </Row>`).join("");

  const summaryRows = summarizeRowsByProject(rows).map((item) => `
    <Row>
      <Cell><Data ss:Type="String">${escapeXml(item.project)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(item.durationClock)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(item.durationHours)}</Data></Cell>
    </Row>`).join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Zeiten">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Export</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(label)}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Datum</Data></Cell>
        <Cell><Data ss:Type="String">Projekt</Data></Cell>
        <Cell><Data ss:Type="String">Start</Data></Cell>
        <Cell><Data ss:Type="String">Ende</Data></Cell>
        <Cell><Data ss:Type="String">Dauer (h)</Data></Cell>
        <Cell><Data ss:Type="String">Dauer (hh:mm)</Data></Cell>
        <Cell><Data ss:Type="String">Typ</Data></Cell>
        <Cell><Data ss:Type="String">Notiz</Data></Cell>
      </Row>
      ${dataRows}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Summen">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Projekt</Data></Cell>
        <Cell><Data ss:Type="String">Dauer (hh:mm)</Data></Cell>
        <Cell><Data ss:Type="String">Dauer (h)</Data></Cell>
      </Row>
      ${summaryRows}
      <Row>
        <Cell><Data ss:Type="String">Gesamt</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(formatDuration(totalHours * 3600000))}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(totalHours.toFixed(2).replace(".", ","))}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
</Workbook>`;
}

function summarizeRowsByProject(rows) {
  const totals = new Map();

  for (const row of rows) {
    const hours = Number.parseFloat(row.durationHours.replace(",", "."));
    totals.set(row.project, (totals.get(row.project) || 0) + hours);
  }

  return [...totals.entries()]
    .sort((left, right) => left[0].localeCompare(right[0], "de"))
    .map(([project, hours]) => ({
      project,
      durationHours: hours.toFixed(2).replace(".", ","),
      durationClock: formatDuration(hours * 3600000)
    }));
}

function sumRangeDuration(rangeStart, rangeEnd) {
  return state.entries
    .filter((entry) => entry.end)
    .map((entry) => clipEntryToRange(entry, rangeStart, rangeEnd))
    .filter(Boolean)
    .reduce((sum, entry) => sum + getDurationMs(entry), 0);
}

function getDurationMs(entry) {
  return Math.max(new Date(entry.end).getTime() - new Date(entry.start).getTime(), 0);
}

function getActiveProject() {
  return state.activeSession ? findProject(state.activeSession.projectId) : null;
}

function findProject(projectId) {
  return state.projects.find((project) => project.id === projectId) || null;
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDuration(durationMs, withSeconds = false) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (withSeconds) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toDateTimeLocalValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toWeekInputValue(date) {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
  return `${temp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function isoWeekToDate(year, week) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay() || 7;
  if (dayOfWeek <= 4) {
    simple.setDate(simple.getDate() - dayOfWeek + 1);
  } else {
    simple.setDate(simple.getDate() + 8 - dayOfWeek);
  }
  simple.setHours(0, 0, 0, 0);
  return simple;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfWeek(date) {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeXml(value) {
  return escapeHtml(value);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // Registrierung darf die App nicht blockieren.
    });
  });
}
