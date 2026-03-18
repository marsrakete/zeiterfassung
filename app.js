const STORAGE_KEY = "zeiterfassung-pwa-state-v1";
const APP_VERSION = "1.0.0";
const DATA_SCHEMA_VERSION = 2;

const state = loadState();

let pendingConfirmation = null;
let editingEntryId = null;
let editingProjectId = null;
let roundingNoticeTimeoutId = null;

const elements = {
  settingsButton: document.querySelector("#settingsButton"),
  activeProjectName: document.querySelector("#activeProjectName"),
  activeTimer: document.querySelector("#activeTimer"),
  roundingNotice: document.querySelector("#roundingNotice"),
  projectForm: document.querySelector("#projectForm"),
  projectNameInput: document.querySelector("#projectNameInput"),
  projectNoteInput: document.querySelector("#projectNoteInput"),
  projectSearchInput: document.querySelector("#projectSearchInput"),
  projectFilterSelect: document.querySelector("#projectFilterSelect"),
  projectsList: document.querySelector("#projectsList"),
  manualEntryForm: document.querySelector("#manualEntryForm"),
  manualProjectId: document.querySelector("#manualProjectId"),
  manualStart: document.querySelector("#manualStart"),
  manualEnd: document.querySelector("#manualEnd"),
  manualNote: document.querySelector("#manualNote"),
  chartRangeSelect: document.querySelector("#chartRangeSelect"),
  chartTypeSelect: document.querySelector("#chartTypeSelect"),
  statsChart: document.querySelector("#statsChart"),
  chartLegend: document.querySelector("#chartLegend"),
  chartTooltip: document.querySelector("#chartTooltip"),
  exportForm: document.querySelector("#exportForm"),
  exportFormatSelect: document.querySelector("#exportFormatSelect"),
  exportRangeType: document.querySelector("#exportRangeType"),
  exportDayField: document.querySelector("#exportDayField"),
  exportWeekField: document.querySelector("#exportWeekField"),
  exportMonthField: document.querySelector("#exportMonthField"),
  exportDay: document.querySelector("#exportDay"),
  exportWeek: document.querySelector("#exportWeek"),
  exportMonth: document.querySelector("#exportMonth"),
  entriesTableBody: document.querySelector("#entriesTableBody"),
  deleteAllEntriesButton: document.querySelector("#deleteAllEntriesButton"),
  entrySortSelect: document.querySelector("#entrySortSelect"),
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
  backupStatusText: document.querySelector("#backupStatusText"),
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
    return normalizeState(parsed);
  } catch {
    return createInitialState();
  }
}

function createInitialState() {
  return {
    schemaVersion: DATA_SCHEMA_VERSION,
    version: APP_VERSION,
    projects: [],
    entries: [],
    activeSession: null,
    settings: {
      roundingMinutes: 5,
      lastDataExportAt: null
    }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function replaceState(nextState) {
  const normalized = normalizeState(nextState);
  state.schemaVersion = normalized.schemaVersion;
  state.version = normalized.version;
  state.projects = normalized.projects;
  state.entries = normalized.entries;
  state.activeSession = normalized.activeSession;
  state.settings = normalized.settings;
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
  elements.projectSearchInput.addEventListener("input", renderProjects);
  elements.projectFilterSelect.addEventListener("change", renderProjects);
  elements.manualEntryForm.addEventListener("submit", handleManualEntrySubmit);
  elements.chartRangeSelect.addEventListener("change", renderChart);
  elements.chartTypeSelect.addEventListener("change", renderChart);
  elements.exportForm.addEventListener("submit", handleExportSubmit);
  elements.exportRangeType.addEventListener("change", updateExportFields);
  elements.entrySortSelect.addEventListener("change", renderEntries);
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
  const format = elements.exportFormatSelect.value;

  if (!rows.length) {
    alert("Im gewählten Zeitraum wurden keine abgeschlossenen Zeitblöcke gefunden.");
    return;
  }

  if (format === "csv") {
    const csv = createCsv(rows);
    const fileName = `zeiterfassung-${range.fileStamp}.csv`;
    const file = new File([csv], fileName, { type: "text/csv;charset=utf-8" });
    await shareOrDownloadFile(file, fileName, "Zeiterfassung exportieren");
    return;
  }

  if (format === "report") {
    const report = createMonthlyReportHtml(rows, range.label);
    const fileName = `zeiterfassung-bericht-${range.fileStamp}.html`;
    const file = new File([report], fileName, { type: "text/html;charset=utf-8" });
    await shareOrDownloadFile(file, fileName, "Zeiterfassungsbericht exportieren");
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
  renderBackupStatus();
  renderProjects();
  renderManualProjectOptions();
  renderEntries();
  renderChart();
  renderTotals();
  updateActiveTimer();
  updateExportFields();
  elements.deleteAllEntriesButton.disabled = !state.entries.length;
}

function renderProjects() {
  elements.projectsList.innerHTML = "";
  const filteredProjects = getFilteredProjects();

  if (!state.projects.length) {
    elements.projectsList.appendChild(elements.emptyStateTemplate.content.cloneNode(true));
    return;
  }

  if (!filteredProjects.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = "<strong>Keine Projekte gefunden</strong><p>Die aktuelle Suche oder der Filter liefert keine Treffer.</p>";
    elements.projectsList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const project of filteredProjects) {
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
        <button class="secondary-button move-button" data-action="move-up" data-project-id="${project.id}" title="Projekt nach oben">↑</button>
        <button class="secondary-button move-button" data-action="move-down" data-project-id="${project.id}" title="Projekt nach unten">↓</button>
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

  const sortedEntries = sortEntriesForDisplay(state.entries.filter((entry) => entry.end));

  if (!sortedEntries.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5" class="empty-cell">Noch keine Zeitblöcke gespeichert.</td>`;
    elements.entriesTableBody.appendChild(row);
    return;
  }

  let lastGroupLabel = null;
  for (const entry of sortedEntries) {
    const groupLabel = formatEntryGroupLabel(entry.start);
    if (groupLabel !== lastGroupLabel) {
      const groupRow = document.createElement("tr");
      groupRow.className = "group-row";
      groupRow.innerHTML = `<td colspan="5" class="group-cell">${groupLabel}</td>`;
      elements.entriesTableBody.appendChild(groupRow);
      lastGroupLabel = groupLabel;
    }

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

function renderChart() {
  const data = getChartData();
  elements.statsChart.innerHTML = "";
  elements.chartLegend.innerHTML = "";
  hideChartTooltip();

  if (!data.length) {
    elements.statsChart.innerHTML = '<text x="320" y="160" text-anchor="middle" fill="#6b5c4d" font-size="18">Keine Daten für den gewählten Zeitraum</text>';
    return;
  }

  if (elements.chartTypeSelect.value === "pie") {
    renderPieChart(data);
  } else {
    renderBarChart(data);
  }

  renderChartLegend(data);
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

  if (action === "move-up") {
    moveProject(projectId, -1);
  }

  if (action === "move-down") {
    moveProject(projectId, 1);
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

function moveProject(projectId, direction) {
  const index = state.projects.findIndex((project) => project.id === projectId);
  const nextIndex = index + direction;

  if (index === -1 || nextIndex < 0 || nextIndex >= state.projects.length) {
    return;
  }

  const [project] = state.projects.splice(index, 1);
  state.projects.splice(nextIndex, 0, project);
  saveState();
  render();
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
    const finalized = finalizeActiveSession(nowIso, true);
    nowIso = finalized.endIso;
    maybeShowRoundingNotice(finalized);
  }

  state.activeSession = { projectId, start: nowIso };
  saveState();
  render();
}

function clockOut(projectId) {
  if (!state.activeSession || state.activeSession.projectId !== projectId) {
    return;
  }

  const finalized = finalizeActiveSession(new Date().toISOString(), true);
  maybeShowRoundingNotice(finalized);
  saveState();
  render();
}

function finalizeActiveSession(endIso, shouldRound = false) {
  if (!state.activeSession) {
    return { endIso, rounded: false };
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
  return {
    endIso: end.toISOString(),
    rounded: end.getTime() !== actualEnd.getTime(),
    actualEndIso: actualEnd.toISOString()
  };
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
    schemaVersion: DATA_SCHEMA_VERSION,
    data: {
      schemaVersion: state.schemaVersion,
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
  state.settings.lastDataExportAt = new Date().toISOString();
  saveState();
  renderBackupStatus();
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
      message: buildImportPreviewMessage(importedState),
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

function normalizeState(rawState) {
  const fallback = createInitialState();
  const projects = Array.isArray(rawState.projects) ? rawState.projects : [];
  const entries = Array.isArray(rawState.entries) ? rawState.entries : [];

  return {
    schemaVersion: rawState.schemaVersion || DATA_SCHEMA_VERSION,
    version: rawState.version || APP_VERSION,
    projects: projects.map((project) => ({
      id: project.id || createId(),
      name: project.name || "Unbenanntes Projekt",
      note: project.note || "",
      createdAt: project.createdAt || new Date().toISOString()
    })),
    entries: entries.map((entry) => ({
      id: entry.id || createId(),
      projectId: entry.projectId,
      start: entry.start,
      end: entry.end,
      type: entry.type || "Live",
      note: entry.note || "",
      createdAt: entry.createdAt || new Date().toISOString()
    })),
    activeSession: rawState.activeSession || null,
    settings: {
      roundingMinutes: rawState.settings?.roundingMinutes || fallback.settings.roundingMinutes,
      lastDataExportAt: rawState.settings?.lastDataExportAt || null
    }
  };
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

function renderBackupStatus() {
  const lastExport = state.settings?.lastDataExportAt;

  if (!lastExport) {
    elements.backupStatusText.textContent = "Noch kein App-Daten-Backup erstellt.";
    return;
  }

  const exportDate = new Date(lastExport);
  const ageDays = Math.floor((Date.now() - exportDate.getTime()) / 86400000);
  const prefix = ageDays > 7 ? "Backup älter als 7 Tage" : "Letztes App-Daten-Backup";
  elements.backupStatusText.textContent = `${prefix}: ${formatDateTime(lastExport)}`;
}

function maybeShowRoundingNotice(finalized) {
  if (!finalized?.rounded) {
    return;
  }

  const roundedTo = formatDateTime(finalized.endIso);
  elements.roundingNotice.textContent = `Auf ${getRoundingMinutes()} Minuten gerundet, Ende: ${roundedTo}`;
  elements.roundingNotice.hidden = false;
  clearTimeout(roundingNoticeTimeoutId);
  roundingNoticeTimeoutId = setTimeout(() => {
    elements.roundingNotice.hidden = true;
  }, 5000);
}

function getChartData() {
  const range = elements.chartRangeSelect.value;
  const now = new Date();
  let start;
  let end;

  if (range === "today") {
    start = startOfDay(now);
    end = endOfDay(now);
  } else if (range === "week") {
    start = startOfWeek(now);
    end = endOfWeek(now);
  } else {
    start = startOfMonth(now);
    end = endOfMonth(now);
  }

  const totals = new Map();

  for (const entry of state.entries.filter((item) => item.end)) {
    const clipped = clipEntryToRange(entry, start, end);
    if (!clipped) {
      continue;
    }

    const durationMs = getDurationMs(clipped);
    const project = findProject(clipped.projectId);
    const key = clipped.projectId;
    const current = totals.get(key) || {
      projectId: key,
      name: project?.name || "Unbekanntes Projekt",
      durationMs: 0
    };
    current.durationMs += durationMs;
    totals.set(key, current);
  }

  const palette = ["#0f766e", "#d97706", "#2563eb", "#b45309", "#0f766e", "#be123c", "#4f46e5", "#15803d"];
  return [...totals.values()]
    .sort((left, right) => right.durationMs - left.durationMs)
    .map((item, index) => ({
      ...item,
      color: palette[index % palette.length]
    }));
}

function renderBarChart(data) {
  const width = 640;
  const height = 320;
  const padding = { top: 24, right: 24, bottom: 60, left: 32 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((item) => item.durationMs), 1);
  const barWidth = chartWidth / data.length;

  data.forEach((item, index) => {
    const barHeight = (item.durationMs / max) * chartHeight;
    const x = padding.left + index * barWidth + 12;
    const y = padding.top + (chartHeight - barHeight);
    const rect = createSvgElement("rect", {
      x,
      y,
      width: Math.max(barWidth - 24, 24),
      height: barHeight,
      rx: 10,
      fill: item.color,
      "data-tooltip": `${item.name}\n${formatDuration(item.durationMs)}`
    });
    attachTooltip(rect);
    elements.statsChart.appendChild(rect);

    const label = createSvgElement("text", {
      x: x + Math.max(barWidth - 24, 24) / 2,
      y: height - 24,
      "text-anchor": "middle",
      fill: "#6b5c4d",
      "font-size": 12
    });
    label.textContent = truncateLabel(item.name, 14);
    elements.statsChart.appendChild(label);
  });
}

function renderPieChart(data) {
  const cx = 220;
  const cy = 160;
  const radius = 110;
  const total = data.reduce((sum, item) => sum + item.durationMs, 0) || 1;
  let startAngle = -Math.PI / 2;

  data.forEach((item) => {
    const angle = (item.durationMs / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    const path = createSvgElement("path", {
      d: describeArc(cx, cy, radius, startAngle, endAngle),
      fill: item.color,
      stroke: "#fffaf3",
      "stroke-width": 2,
      "data-tooltip": `${item.name}\n${formatDuration(item.durationMs)}`
    });
    attachTooltip(path);
    elements.statsChart.appendChild(path);
    startAngle = endAngle;
  });

  const centerText = createSvgElement("text", {
    x: cx,
    y: cy - 4,
    "text-anchor": "middle",
    fill: "#2d2218",
    "font-size": 22,
    "font-weight": 700
  });
  centerText.textContent = formatDuration(total);
  elements.statsChart.appendChild(centerText);

  const subText = createSvgElement("text", {
    x: cx,
    y: cy + 22,
    "text-anchor": "middle",
    fill: "#6b5c4d",
    "font-size": 13
  });
  subText.textContent = "Gesamt";
  elements.statsChart.appendChild(subText);
}

function renderChartLegend(data) {
  for (const item of data) {
    const entry = document.createElement("div");
    entry.className = "legend-item";
    entry.innerHTML = `
      <span class="legend-swatch" style="background:${item.color}"></span>
      <span class="legend-text">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${formatDuration(item.durationMs)}</span>
      </span>
    `;
    elements.chartLegend.appendChild(entry);
  }
}

function attachTooltip(element) {
  element.addEventListener("mousemove", (event) => {
    const tooltip = element.getAttribute("data-tooltip");
    if (!tooltip) {
      return;
    }
    elements.chartTooltip.textContent = tooltip;
    elements.chartTooltip.hidden = false;
    elements.chartTooltip.style.left = `${event.offsetX + 24}px`;
    elements.chartTooltip.style.top = `${event.offsetY + 24}px`;
  });
  element.addEventListener("mouseleave", hideChartTooltip);
}

function hideChartTooltip() {
  elements.chartTooltip.hidden = true;
}

function createSvgElement(tagName, attributes) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
}

function truncateLabel(label, maxLength) {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
  return [
    "M", cx, cy,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "Z"
  ].join(" ");
}

function polarToCartesian(cx, cy, radius, angle) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle)
  };
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

function getFilteredProjects() {
  const search = elements.projectSearchInput.value.trim().toLocaleLowerCase("de-DE");
  const filter = elements.projectFilterSelect.value;
  const today = new Date();

  return state.projects.filter((project) => {
    const active = state.activeSession?.projectId === project.id;
    const hasTodayEntries = state.entries.some((entry) => entry.projectId === project.id && isEntryOnDate(entry, today));
    const matchesSearch = !search
      || project.name.toLocaleLowerCase("de-DE").includes(search)
      || (project.note || "").toLocaleLowerCase("de-DE").includes(search);

    if (!matchesSearch) {
      return false;
    }

    if (filter === "active") {
      return active;
    }

    if (filter === "today") {
      return hasTodayEntries;
    }

    if (filter === "empty") {
      return !hasTodayEntries && !active;
    }

    return true;
  });
}

function sortEntriesForDisplay(entries) {
  const sort = elements.entrySortSelect.value;
  const sorted = [...entries];

  sorted.sort((left, right) => {
    const leftProject = findProject(left.projectId)?.name || "";
    const rightProject = findProject(right.projectId)?.name || "";
    const leftDuration = getDurationMs(left);
    const rightDuration = getDurationMs(right);

    if (sort === "startAsc") {
      return new Date(left.start) - new Date(right.start);
    }

    if (sort === "projectAsc") {
      return leftProject.localeCompare(rightProject, "de") || (new Date(right.start) - new Date(left.start));
    }

    if (sort === "durationDesc") {
      return rightDuration - leftDuration || (new Date(right.start) - new Date(left.start));
    }

    return new Date(right.start) - new Date(left.start);
  });

  return sorted;
}

function formatEntryGroupLabel(value) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value));
}

function buildImportPreviewMessage(importedState) {
  const projectCount = importedState.projects.length;
  const entryCount = importedState.entries.length;
  const rounding = importedState.settings?.roundingMinutes || 5;
  return `Sollen die aktuellen Daten ersetzt werden?\n\nImport enthält:\n${projectCount} Projekte\n${entryCount} Zeitblöcke\nRundung: ${rounding} Minuten`;
}

function createCsv(rows) {
  const headers = ["Datum", "Projekt", "Start", "Ende", "Dauer (h)", "Dauer (hh:mm)", "Typ", "Notiz"];
  const lines = [
    headers,
    ...rows.map((row) => [row.date, row.project, row.start, row.end, row.durationHours, row.durationClock, row.type, row.note])
  ];

  return lines
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"))
    .join("\n");
}

function createMonthlyReportHtml(rows, label) {
  const groupedByDay = new Map();
  for (const row of rows) {
    const items = groupedByDay.get(row.date) || [];
    items.push(row);
    groupedByDay.set(row.date, items);
  }

  const daySections = [...groupedByDay.entries()].map(([date, items]) => {
    const totalHours = items.reduce((sum, item) => sum + Number.parseFloat(item.durationHours.replace(",", ".")), 0);
    const list = items.map((item) => `<tr><td>${escapeHtml(item.project)}</td><td>${escapeHtml(item.start)}</td><td>${escapeHtml(item.end)}</td><td>${escapeHtml(item.durationClock)}</td><td>${escapeHtml(item.note || "—")}</td></tr>`).join("");
    return `
      <section>
        <h2>${escapeHtml(date)}</h2>
        <p>Tagessumme: ${escapeHtml(formatDuration(totalHours * 3600000))}</p>
        <table>
          <thead><tr><th>Projekt</th><th>Start</th><th>Ende</th><th>Dauer</th><th>Notiz</th></tr></thead>
          <tbody>${list}</tbody>
        </table>
      </section>
    `;
  }).join("");

  const projectSummary = summarizeRowsByProject(rows).map((item) => `<tr><td>${escapeHtml(item.project)}</td><td>${escapeHtml(item.durationClock)}</td><td>${escapeHtml(item.durationHours)}</td></tr>`).join("");

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Zeiterfassungsbericht</title>
  <style>
    body { font-family: Segoe UI, sans-serif; margin: 32px; color: #2d2218; }
    h1, h2 { margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
    th { text-transform: uppercase; font-size: 12px; letter-spacing: 0.06em; color: #6b5c4d; }
  </style>
</head>
<body>
  <h1>Zeiterfassungsbericht</h1>
  <p>Zeitraum: ${escapeHtml(label)}</p>
  <h2>Summen pro Projekt</h2>
  <table>
    <thead><tr><th>Projekt</th><th>Dauer</th><th>Stunden</th></tr></thead>
    <tbody>${projectSummary}</tbody>
  </table>
  ${daySections}
</body>
</html>`;
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
