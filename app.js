const STORAGE_KEY = "zeiterfassung-pwa-state-v1";
const INTERNAL_BACKUPS_KEY = "zeiterfassung-pwa-state-backups-v1";
const MAX_INTERNAL_BACKUPS = 20;
const FILE_BACKUP_WARNING_AGE_DAYS = 7;
const LAST_SEEN_BUILD_KEY = "zeiterfassung-last-seen-build";
const LANGUAGE_STORAGE_KEY = "zeiterfassung-language";
const APP_SHARE_URL = "https://marsrakete.github.io/zeiterfassung/";
const DATA_SCHEMA_VERSION = 3;
const APP_BUILD_INFO = Object.freeze({
  appVersion: "1.1.24",
  cacheVersion: "v58",
  label: "Aktueller Stand"
});
const DEFAULT_VERSION_INFO = Object.freeze({
  appVersion: "unbekannt",
  cacheVersion: "offline",
  label: "Lokaler Stand"
});
const SUPPORTED_LANGUAGES = ["de", "en", "fr"];
const LANGUAGE_FALLBACK = "de";
const TRANSLATIONS = window.ZEITERFASSUNG_TRANSLATIONS || {};
const PROJECT_COLOR_PALETTE = [
  "#011a27",
  "#4cb5f5",
  "#4d648d",
  "#5bc8ac",
  "#a1d6e2",
  "#a11f0c",
  "#b7b8b6",
  "#b6452c",
  "#d09683",
  "#e6d72a",
  "#ed5752",
  "#f18d9e",
  "#f1f3ce",
  "#f4cc70",
  "#f69454",
  "#ff2b94"
];

let pendingConfirmation = null;
let editingEntryId = null;
let editingProjectId = null;
let roundingNoticeTimeoutId = null;
let touchDragProjectId = null;
let touchDragTargetId = null;
let serviceWorkerRegistration = null;
let fileBackupNoticeShown = false;
let versionInfo = { ...APP_BUILD_INFO };
const state = loadState();

const elements = {
  settingsButton: document.querySelector("#settingsButton"),
  exportButton: document.querySelector("#exportButton"),
  activeProjectName: document.querySelector("#activeProjectName"),
  activeTimer: document.querySelector("#activeTimer"),
  versionLabel: document.querySelector("#versionLabel"),
  roundingNotice: document.querySelector("#roundingNotice"),
  editActiveSessionButton: document.querySelector("#editActiveSessionButton"),
  pauseActiveSessionButton: document.querySelector("#pauseActiveSessionButton"),
  resumeLastProjectButton: document.querySelector("#resumeLastProjectButton"),
  newProjectButton: document.querySelector("#newProjectButton"),
  projectForm: document.querySelector("#projectForm"),
  projectNameInput: document.querySelector("#projectNameInput"),
  projectNoteInput: document.querySelector("#projectNoteInput"),
  projectColorInput: document.querySelector("#projectColorInput"),
  projectColorPalette: document.querySelector("#projectColorPalette"),
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
  dailyGoalStatus: document.querySelector("#dailyGoalStatus"),
  weeklyGoalStatus: document.querySelector("#weeklyGoalStatus"),
  calendarDetails: document.querySelector("#calendarDetails"),
  calendarViewSelect: document.querySelector("#calendarViewSelect"),
  calendarDateInput: document.querySelector("#calendarDateInput"),
  calendarLegend: document.querySelector("#calendarLegend"),
  calendarView: document.querySelector("#calendarView"),
  confirmDialog: document.querySelector("#confirmDialog"),
  confirmDialogTitle: document.querySelector("#confirmDialogTitle"),
  confirmDialogText: document.querySelector("#confirmDialogText"),
  confirmAlternateButton: document.querySelector("#confirmAlternateButton"),
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
  activeSessionDialog: document.querySelector("#activeSessionDialog"),
  activeSessionForm: document.querySelector("#activeSessionForm"),
  activeSessionProjectId: document.querySelector("#activeSessionProjectId"),
  activeSessionStart: document.querySelector("#activeSessionStart"),
  activeSessionCancelButton: document.querySelector("#activeSessionCancelButton"),
  settingsDialog: document.querySelector("#settingsDialog"),
  closeSettingsButton: document.querySelector("#closeSettingsButton"),
  exportDialog: document.querySelector("#exportDialog"),
  closeExportButton: document.querySelector("#closeExportButton"),
  languageSelect: document.querySelector("#languageSelect"),
  checkForUpdatesButton: document.querySelector("#checkForUpdatesButton"),
  updateCheckStatus: document.querySelector("#updateCheckStatus"),
  reloadAppButton: document.querySelector("#reloadAppButton"),
  roundingSelect: document.querySelector("#roundingSelect"),
  timerReminderCheckbox: document.querySelector("#timerReminderCheckbox"),
  dailyGoalInput: document.querySelector("#dailyGoalInput"),
  weeklyGoalInput: document.querySelector("#weeklyGoalInput"),
  exportScopeSelect: document.querySelector("#exportScopeSelect"),
  exportProjectField: document.querySelector("#exportProjectField"),
  exportProjectSelect: document.querySelector("#exportProjectSelect"),
  backupStatusText: document.querySelector("#backupStatusText"),
  exportDataButton: document.querySelector("#exportDataButton"),
  importDataButton: document.querySelector("#importDataButton"),
  importDataInput: document.querySelector("#importDataInput"),
  recommendAppButton: document.querySelector("#recommendAppButton"),
  recommendQrImage: document.querySelector("#recommendQrImage"),
  recommendUrl: document.querySelector("#recommendUrl"),
  recommendStatus: document.querySelector("#recommendStatus"),
  projectEditorDialog: document.querySelector("#projectEditorDialog"),
  projectEditorForm: document.querySelector("#projectEditorForm"),
  projectEditorId: document.querySelector("#projectEditorId"),
  projectEditorName: document.querySelector("#projectEditorName"),
  projectEditorNote: document.querySelector("#projectEditorNote"),
  projectEditorColor: document.querySelector("#projectEditorColor"),
  projectEditorColorPalette: document.querySelector("#projectEditorColorPalette"),
  projectNoteDialog: document.querySelector("#projectNoteDialog"),
  projectNoteDialogTitle: document.querySelector("#projectNoteDialogTitle"),
  projectNoteDialogText: document.querySelector("#projectNoteDialogText"),
  closeProjectNoteButton: document.querySelector("#closeProjectNoteButton"),
  projectCreateDialog: document.querySelector("#projectCreateDialog"),
  projectCreateCancelButton: document.querySelector("#projectCreateCancelButton"),
  helpDetails: document.querySelector("#helpDetails"),
  helpContent: document.querySelector("#helpContent"),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate")
};

initializeDefaults();
renderVersionLabel();
applyTranslations();
bindEvents();
render();
maybeOfferInternalBackupRestore();
maybeShowFileBackupNotice();
startTicker();
registerServiceWorker();
loadVersionInfo({ showUpdateNotice: true });

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
    version: null,
    projects: [],
    entries: [],
    activeSession: null,
    lastStoppedSession: null,
    settings: {
      roundingMinutes: 5,
      timerReminderEnabled: false,
      language: "auto",
      lastDataExportAt: null,
      dailyGoalHours: 8,
      weeklyGoalHours: 40
    }
  };
}

function saveState() {
  const previousRaw = localStorage.getItem(STORAGE_KEY);
  storeInternalBackup(previousRaw);

  const nextRaw = JSON.stringify(state);
  localStorage.setItem(STORAGE_KEY, nextRaw);
  storeInternalBackup(nextRaw);
}

function loadInternalBackups() {
  try {
    const raw = localStorage.getItem(INTERNAL_BACKUPS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((backup) => backup?.state) : [];
  } catch {
    return [];
  }
}

function saveInternalBackups(backups) {
  try {
    localStorage.setItem(INTERNAL_BACKUPS_KEY, JSON.stringify(backups.slice(0, MAX_INTERNAL_BACKUPS)));
  } catch {
    try {
      localStorage.setItem(INTERNAL_BACKUPS_KEY, JSON.stringify(backups.slice(0, Math.floor(MAX_INTERNAL_BACKUPS / 2))));
    } catch {
      // Interne Backups sind ein Sicherheitsnetz; die Hauptspeicherung darf daran nicht scheitern.
    }
  }
}

function storeInternalBackup(rawState) {
  if (!rawState) {
    return;
  }

  try {
    const parsed = JSON.parse(rawState);
    const normalized = normalizeState(parsed);
    if (!hasRecoverableData(normalized)) {
      return;
    }

    const backups = loadInternalBackups();
    const fingerprint = createStateBackupFingerprint(normalized);
    if (backups.some((backup) => backup.fingerprint === fingerprint)) {
      return;
    }

    backups.unshift({
      id: createId(),
      createdAt: new Date().toISOString(),
      fingerprint,
      projectCount: normalized.projects.length,
      entryCount: normalized.entries.length,
      hasActiveSession: Boolean(normalized.activeSession),
      state: normalized
    });
    saveInternalBackups(backups);
  } catch {
    // Ungültige oder ältere Zwischenstände werden ignoriert.
  }
}

function hasRecoverableData(candidate) {
  return Boolean(candidate?.projects?.length || candidate?.entries?.length || candidate?.activeSession);
}

function createStateBackupFingerprint(candidate) {
  return JSON.stringify({
    projects: candidate.projects,
    entries: candidate.entries,
    activeSession: candidate.activeSession,
    lastStoppedSession: candidate.lastStoppedSession,
    settings: candidate.settings
  });
}

function getBestInternalBackup() {
  return loadInternalBackups()
    .map((backup) => ({
      ...backup,
      state: normalizeState(backup.state)
    }))
    .filter((backup) => hasRecoverableData(backup.state))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0] || null;
}

function maybeOfferInternalBackupRestore() {
  if (hasRecoverableData(state)) {
    return;
  }

  const backup = getBestInternalBackup();
  if (!backup) {
    return;
  }

  openConfirmation({
    title: t("restoreBackupTitle"),
    message: t("restoreBackupMessage", {
      date: formatDateTime(backup.createdAt),
      projects: backup.projectCount,
      entries: backup.entryCount
    }),
    confirmLabel: t("restoreBackupConfirm"),
    onConfirm: () => {
      replaceState(backup.state);
      render();
    }
  });
}

function replaceState(nextState) {
  const normalized = normalizeState(nextState);
  state.schemaVersion = normalized.schemaVersion;
  state.version = normalized.version;
  state.projects = normalized.projects;
  state.entries = normalized.entries;
  state.activeSession = normalized.activeSession;
  state.lastStoppedSession = normalized.lastStoppedSession;
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

function setRecommendStatus(message, isError = false) {
  if (!elements.recommendStatus) {
    return;
  }
  elements.recommendStatus.textContent = message || "";
  elements.recommendStatus.hidden = !message;
  elements.recommendStatus.classList.toggle("is-error", Boolean(isError && message));
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "readonly");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  helper.style.pointerEvents = "none";
  document.body.append(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
}

async function shareAppRecommendation() {
  const payload = {
    title: t("appTitle"),
    text: t("recommendAppText"),
    url: APP_SHARE_URL
  };

  try {
    if (navigator.share) {
      await navigator.share(payload);
      return;
    }

    await copyTextToClipboard(`${payload.text}\n${payload.url}`);
    setRecommendStatus(t("recommendCopied"));
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }
    setRecommendStatus(t("recommendUnavailable"), true);
  }
}

function initializeDefaults() {
  const now = new Date();
  elements.exportDay.value = toDateInputValue(now);
  elements.exportWeek.value = toWeekInputValue(now);
  elements.exportMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  elements.roundingSelect.value = String(getRoundingMinutes());
  elements.languageSelect.value = getLanguageSetting();
  elements.timerReminderCheckbox.checked = getTimerReminderEnabled();
  elements.timerReminderCheckbox.disabled = !supportsNotificationApi();
  elements.dailyGoalInput.value = String(getDailyGoalHours());
  elements.weeklyGoalInput.value = String(getWeeklyGoalHours());
  elements.calendarDateInput.value = toDateInputValue(now);
  applyManualTimeSuggestions();
}

function renderVersionLabel() {
  const info = getVersionInfo();
  elements.versionLabel.textContent = `${t("version")} ${info.appVersion} · ${t("offlineVersion")} ${info.cacheVersion}`;
}

async function checkForUpdates() {
  setUpdateCheckStatus(t("checkingUpdates"));
  elements.checkForUpdatesButton.disabled = true;

  try {
    await serviceWorkerRegistration?.update();
    const remoteVersion = await fetchVersionInfo();
    const remoteAppVersion = String(remoteVersion.appVersion || "");
    const remoteCacheVersion = String(remoteVersion.cacheVersion || "");
    const remoteLabel = remoteVersion.label ? String(remoteVersion.label) : "";
    const localBuild = getBuildSignature(APP_BUILD_INFO);
    const remoteBuild = getBuildSignature(remoteVersion);

    if (!remoteAppVersion || !remoteCacheVersion) {
      setUpdateCheckStatus(t("updateVersionIncomplete"));
      return;
    }

    if (localBuild === remoteBuild) {
      setUpdateCheckStatus(t("updateNoChange"));
      return;
    }

    const suffix = remoteLabel ? ` (${remoteLabel})` : "";
    setUpdateCheckStatus(`${t("updateAvailablePrefix")}: ${remoteAppVersion} · ${remoteCacheVersion}${suffix}. ${t("updateAvailableAction")}`, true);
  } catch {
    setUpdateCheckStatus(t("updateCheckFailed"));
  } finally {
    elements.checkForUpdatesButton.disabled = false;
  }
}

function setUpdateCheckStatus(message, showReloadButton = false) {
  elements.updateCheckStatus.textContent = message;
  elements.updateCheckStatus.hidden = !message;
  elements.reloadAppButton.hidden = !showReloadButton;
}

function waitForServiceWorkerState(worker, expectedState, timeout = 4000) {
  if (!worker || worker.state === expectedState) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeoutId = setTimeout(resolve, timeout);
    worker.addEventListener("statechange", () => {
      if (worker.state === expectedState) {
        clearTimeout(timeoutId);
        resolve();
      }
    });
  });
}

function waitForControllerChange(timeout = 4000) {
  if (!("serviceWorker" in navigator)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeoutId = setTimeout(resolve, timeout);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      clearTimeout(timeoutId);
      resolve();
    }, { once: true });
  });
}

async function reloadAppAfterUpdate() {
  elements.reloadAppButton.disabled = true;
  setUpdateCheckStatus(t("checkingUpdates"), true);

  try {
    const registration = serviceWorkerRegistration || await navigator.serviceWorker?.getRegistration?.();
    const updatedRegistration = await registration?.update?.() || registration;
    const nextWorker = updatedRegistration?.installing || updatedRegistration?.waiting;

    if (nextWorker) {
      await Promise.race([
        waitForServiceWorkerState(nextWorker, "activated"),
        waitForControllerChange()
      ]);
    }
  } catch {
    // Ein normaler Reload bleibt der beste Fallback, wenn die SW-Aktualisierung nicht sauber meldet.
  } finally {
    window.location.reload();
  }
}

function showUpdateNoticeIfNeeded(nextVersionInfo = getVersionInfo()) {
  const currentBuild = getBuildSignature(APP_BUILD_INFO);
  const availableBuild = getBuildSignature(nextVersionInfo);
  const lastSeenBuild = localStorage.getItem(LAST_SEEN_BUILD_KEY);

  if (availableBuild !== currentBuild) {
    const suffix = nextVersionInfo.label ? ` (${nextVersionInfo.label})` : "";
    elements.roundingNotice.textContent = `${t("updateAvailablePrefix")}: ${nextVersionInfo.appVersion} · ${nextVersionInfo.cacheVersion}${suffix}. ${t("updateAvailableAction")}`;
    elements.roundingNotice.hidden = false;
    clearTimeout(roundingNoticeTimeoutId);
    void serviceWorkerRegistration?.update?.();
    return;
  }

  if (!lastSeenBuild) {
    localStorage.setItem(LAST_SEEN_BUILD_KEY, currentBuild);
    return;
  }

  if (lastSeenBuild === currentBuild) {
    return;
  }

  elements.roundingNotice.textContent = t("roundingNoticeUpdated");
  elements.roundingNotice.hidden = false;
  clearTimeout(roundingNoticeTimeoutId);
  roundingNoticeTimeoutId = setTimeout(() => {
    elements.roundingNotice.hidden = true;
  }, 5000);
  localStorage.setItem(LAST_SEEN_BUILD_KEY, currentBuild);
}

function getVersionInfo() {
  return versionInfo;
}

function getBuildSignature(info = getVersionInfo()) {
  return `${info.appVersion}|${info.cacheVersion}`;
}

async function fetchVersionInfo() {
  const response = await fetch("./version.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error("Version konnte nicht geladen werden.");
  }
  const remoteVersion = await response.json();
  return {
    appVersion: String(remoteVersion.appVersion || DEFAULT_VERSION_INFO.appVersion),
    cacheVersion: String(remoteVersion.cacheVersion || DEFAULT_VERSION_INFO.cacheVersion),
    label: remoteVersion.label ? String(remoteVersion.label) : DEFAULT_VERSION_INFO.label
  };
}

async function loadVersionInfo({ showUpdateNotice = false } = {}) {
  let remoteVersion = null;
  let versionLoaded = false;
  try {
    remoteVersion = await fetchVersionInfo();
    versionInfo = getBuildSignature(remoteVersion) === getBuildSignature(APP_BUILD_INFO)
      ? remoteVersion
      : { ...APP_BUILD_INFO };
    versionLoaded = true;
  } catch {
    versionInfo = { ...APP_BUILD_INFO };
  }

  renderVersionLabel();
  if (showUpdateNotice && versionLoaded) {
    showUpdateNoticeIfNeeded(remoteVersion);
  }
}

function t(key, params = {}) {
  const language = getEffectiveLanguage();
  const dict = TRANSLATIONS[language] || TRANSLATIONS[LANGUAGE_FALLBACK];
  const fallbackDict = TRANSLATIONS[LANGUAGE_FALLBACK];
  const value = dict[key] ?? fallbackDict[key] ?? key;
  return String(value).replace(/\{(\w+)\}/g, (_match, token) => params[token] ?? "");
}

function getLanguageSetting() {
  return normalizeLanguageSetting(state.settings?.language || localStorage.getItem(LANGUAGE_STORAGE_KEY) || "auto");
}

function setLanguage(language) {
  const normalized = normalizeLanguageSetting(language);
  state.settings.language = normalized;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  saveState();
  applyTranslations();
  render();
}

function normalizeLanguageSetting(value) {
  if (value === "auto") {
    return "auto";
  }

  const normalized = String(value || "").slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : LANGUAGE_FALLBACK;
}

function getEffectiveLanguage() {
  const setting = getLanguageSetting();
  return setting === "auto" ? detectPreferredLanguage() : setting;
}

function detectPreferredLanguage() {
  const browserLanguages = Array.isArray(navigator.languages) ? navigator.languages : [];
  const candidates = [navigator.language, ...browserLanguages];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const normalized = candidate.slice(0, 2).toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(normalized)) {
      return normalized;
    }
  }

  return LANGUAGE_FALLBACK;
}

function syncLocalizedState() {
  const locale = getLocaleForFormatting();
  document.documentElement.lang = getEffectiveLanguage();
  const localizedInputs = [
    elements.calendarDateInput,
    elements.exportDay,
    elements.exportWeek,
    elements.exportMonth,
    elements.manualStart,
    elements.manualEnd,
    elements.entryEditorStart,
    elements.entryEditorEnd,
    elements.activeSessionStart
  ];
  for (const input of localizedInputs) {
    if (input) {
      input.lang = locale;
    }
  }
  if (elements.languageSelect) {
    elements.languageSelect.value = getLanguageSetting();
  }
}

function applyTranslations() {
  syncLocalizedState();
  document.title = t("appTitle");
  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  };
  const setAttr = (selector, attribute, value) => {
    const element = document.querySelector(selector);
    if (element) {
      element.setAttribute(attribute, value);
    }
  };

  setText(".hero-headline .eyebrow", t("appEyebrow"));
  setAttr("#settingsButton", "aria-label", t("settingsOpen"));
  setAttr("#settingsButton", "title", t("settingsOpen"));
  setAttr("#exportButton", "aria-label", t("exportOpen"));
  setAttr("#exportButton", "title", t("exportOpen"));
  setText("#editActiveSessionButton", t("editLive"));
  setText("#pauseActiveSessionButton", t("stop"));
  setText("#resumeLastProjectButton", t("resumeLast"));
  setText("#newProjectButton", t("newProject"));
  setText("#deleteAllEntriesButton", t("deleteAllBlocks"));
  setText("#checkForUpdatesButton", t("checkUpdates"));
  setText("#reloadAppButton", t("reload"));
  setText("#entryEditorDeleteButton", t("deleteBlock"));
  setText("#entryEditorCancelButton", t("cancel"));
  setText("#activeSessionCancelButton", t("cancel"));
  setText("#projectCreateCancelButton", t("cancel"));
  setText("#confirmNoButton", t("deleteConfirmNo"));
  setText("#confirmYesButton", t("deleteConfirmYes"));
  setText("#helpDetails summary", t("helpSummary"));
  setText("#calendarDetails summary", t("showCalendar"));
  setText("#settingsForm h3", t("settingsDialogTitle"));
  setText("#dataExportTitle", t("dataExportGroup"));
  setText("#projectCreateDialog h3", t("projectCreateTitle"));
  setText("#projectEditorDialog h3", t("projectEditorTitle"));
  setText("#entryEditorDialog h3", t("entryEditorHeading"));
  setText("#activeSessionDialog h3", t("activeSessionHeading"));
  setText("#projectNoteDialogTitle", t("projectNoteTitle"));
  setText("#closeProjectNoteButton", t("close"));

  const sectionTexts = [
    [t("projectsSection"), t("projectsHeading")],
    [t("timesSection"), t("manualHeading")],
    [t("statsSection"), t("statsHeading")],
    [t("calendarSection"), t("calendarHeading")],
    [t("overviewSection"), t("overviewHeading")]
  ];
  document.querySelectorAll(".panel-header .section-kicker").forEach((element, index) => {
    if (sectionTexts[index]) {
      element.textContent = sectionTexts[index][0];
    }
  });
  document.querySelectorAll(".panel-header h2").forEach((element, index) => {
    if (sectionTexts[index]) {
      element.textContent = sectionTexts[index][1];
    }
  });

  const projectToolbarLabels = document.querySelectorAll(".project-toolbar label span");
  if (projectToolbarLabels[0]) projectToolbarLabels[0].textContent = t("projectSearch");
  if (projectToolbarLabels[1]) projectToolbarLabels[1].textContent = t("filter");
  elements.projectSearchInput.placeholder = t("projectSearch");

  const projectFilterOptions = elements.projectFilterSelect.querySelectorAll("option");
  if (projectFilterOptions[0]) projectFilterOptions[0].textContent = t("filterAll");
  if (projectFilterOptions[1]) projectFilterOptions[1].textContent = t("filterActive");
  if (projectFilterOptions[2]) projectFilterOptions[2].textContent = t("filterToday");
  if (projectFilterOptions[3]) projectFilterOptions[3].textContent = t("filterEmpty");

  const chartLabels = document.querySelectorAll(".chart-toolbar label span");
  if (chartLabels[0]) chartLabels[0].textContent = t("period");
  if (chartLabels[1]) chartLabels[1].textContent = t("chart");
  const chartTypeOptions = elements.chartTypeSelect.querySelectorAll("option");
  if (chartTypeOptions[0]) chartTypeOptions[0].textContent = t("barChart");
  if (chartTypeOptions[1]) chartTypeOptions[1].textContent = t("pieChart");
  const chartRangeOptions = elements.chartRangeSelect.querySelectorAll("option");
  if (chartRangeOptions[0]) chartRangeOptions[0].textContent = t("today");
  if (chartRangeOptions[1]) chartRangeOptions[1].textContent = t("thisWeek");
  if (chartRangeOptions[2]) chartRangeOptions[2].textContent = t("thisMonth");

  const calendarLabels = document.querySelectorAll("#calendarDetails .chart-toolbar label span");
  if (calendarLabels[0]) calendarLabels[0].textContent = t("view");
  if (calendarLabels[1]) calendarLabels[1].textContent = t("date");
  const calendarViewOptions = elements.calendarViewSelect.querySelectorAll("option");
  if (calendarViewOptions[0]) calendarViewOptions[0].textContent = t("day");
  if (calendarViewOptions[1]) calendarViewOptions[1].textContent = t("week");
  if (calendarViewOptions[2]) calendarViewOptions[2].textContent = t("month");

  const overviewLabels = document.querySelectorAll(".overview-actions label span");
  if (overviewLabels[0]) overviewLabels[0].textContent = t("sort");
  const sortOptions = elements.entrySortSelect.querySelectorAll("option");
  if (sortOptions[0]) sortOptions[0].textContent = t("newestFirst");
  if (sortOptions[1]) sortOptions[1].textContent = t("oldestFirst");
  if (sortOptions[2]) sortOptions[2].textContent = t("projectAZ");
  if (sortOptions[3]) sortOptions[3].textContent = t("longestDuration");

  setText("#dataStorageTitle", t("dataStorageTitle"));
  setText("#dataStorageText1", t("dataStorageText1"));
  setText("#dataStorageText2", t("dataStorageText2"));
  setText("#updateGroupTitle", t("updateGroupTitle"));
  setText("#updateGroupDescription", t("updateGroupDescription"));
  setText("#settingsGroupTitle", t("settingsGroup"));
  setText("#backupGroupTitle", t("backupGroupTitle"));
  setText("#backupGroupText", t("backupGroupText"));
  setText("#deviceTransferTitle", t("deviceTransferTitle"));
  setText("#deviceTransferText", t("deviceTransferText"));
  setText("#exportDataButton", t("exportAppData"));
  setText("#importDataButton", t("importAppData"));
  setText("#supportTitle", t("supportTitle"));
  setText("#supportIntro", t("supportIntro"));
  setText("#recommendTitle", t("recommendTitle"));
  setText("#recommendDescription", t("recommendDescription"));
  setText("#recommendAppButton", t("recommendAppButton"));
  setText("#recommendScanHint", t("recommendScanHint"));
  setText("#recommendUrl", APP_SHARE_URL);
  setAttr("#recommendQrImage", "alt", t("recommendQrAlt"));
  const settingsLabels = document.querySelectorAll(".settings-actions label span");
  if (settingsLabels[0]) settingsLabels[0].textContent = t("language");
  if (settingsLabels[1]) settingsLabels[1].textContent = t("rounding");
  if (settingsLabels[2]) settingsLabels[2].textContent = t("timerReminder");
  if (settingsLabels[3]) settingsLabels[3].textContent = t("dailyGoalHours");
  if (settingsLabels[4]) settingsLabels[4].textContent = t("weeklyGoalHours");

  const languageOptions = elements.languageSelect.querySelectorAll("option");
  if (languageOptions[0]) languageOptions[0].textContent = t("languageAuto");
  if (languageOptions[1]) languageOptions[1].textContent = t("languageGerman");
  if (languageOptions[2]) languageOptions[2].textContent = t("languageEnglish");
  if (languageOptions[3]) languageOptions[3].textContent = t("languageFrench");

  const exportFormLabels = document.querySelectorAll("#exportForm > label > span");
  if (exportFormLabels[0]) exportFormLabels[0].textContent = t("exportFormat");
  if (exportFormLabels[1]) exportFormLabels[1].textContent = t("exportPeriod");
  setText("#exportDayLabel", t("exportDay"));
  setText("#exportWeekLabel", t("exportWeek"));
  setText("#exportMonthLabel", t("month"));
  if (exportFormLabels[5]) exportFormLabels[5].textContent = t("exportProjectScope");
  if (exportFormLabels[6]) exportFormLabels[6].textContent = t("exportSingleProject");
  const exportFormatOptions = elements.exportFormatSelect.querySelectorAll("option");
  if (exportFormatOptions[0]) exportFormatOptions[0].textContent = t("exportExcel");
  if (exportFormatOptions[1]) exportFormatOptions[1].textContent = t("exportCsv");
  if (exportFormatOptions[2]) exportFormatOptions[2].textContent = t("exportHtmlReport");
  const exportRangeOptions = elements.exportRangeType.querySelectorAll("option");
  if (exportRangeOptions[0]) exportRangeOptions[0].textContent = t("exportDay");
  if (exportRangeOptions[1]) exportRangeOptions[1].textContent = t("exportWeek");
  if (exportRangeOptions[2]) exportRangeOptions[2].textContent = t("exportCurrentMonth");
  if (exportRangeOptions[3]) exportRangeOptions[3].textContent = t("exportCustomMonth");
  const exportScopeOptions = elements.exportScopeSelect.querySelectorAll("option");
  if (exportScopeOptions[0]) exportScopeOptions[0].textContent = t("exportAll");
  if (exportScopeOptions[1]) exportScopeOptions[1].textContent = t("exportSingle");
  setText("#exportForm button[type=\"submit\"]", t("exportButton"));
  setText("#closeExportButton", t("close"));

  const roundingOptions = elements.roundingSelect.querySelectorAll("option");
  if (roundingOptions[0]) roundingOptions[0].textContent = t("noRounding");
  if (roundingOptions[1]) roundingOptions[1].textContent = t("rounding5");
  if (roundingOptions[2]) roundingOptions[2].textContent = t("rounding10");
  if (roundingOptions[3]) roundingOptions[3].textContent = t("rounding15");

  elements.projectNameInput.placeholder = t("projectNamePlaceholder");
  elements.projectNoteInput.placeholder = t("projectNotePlaceholder");
  elements.projectEditorNote.placeholder = t("projectNotePlaceholder");
  elements.manualNote.placeholder = t("projectNotePlaceholder");
  setText("#manualEntryForm button[type=\"submit\"]", t("saveBlock"));
  setText("#projectForm .primary-button", t("save"));
  setText("#projectEditorForm .primary-button", t("save"));
  setText("#activeSessionForm .primary-button", t("save"));
  setText("#entryEditorForm .primary-button", t("save"));
  setText(".table-wrapper th:nth-child(1)", t("overviewProject"));
  setText(".table-wrapper th:nth-child(2)", t("overviewPeriod"));
  setText(".table-wrapper th:nth-child(3)", t("overviewDuration"));
  setText(".table-wrapper th:nth-child(4)", t("note"));
  setText(".table-wrapper th:nth-child(5)", t("overviewEditor"));
}

function bindEvents() {
  elements.projectForm.addEventListener("submit", handleProjectSubmit);
  elements.newProjectButton.addEventListener("click", openProjectCreateDialog);
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
  elements.activeSessionForm.addEventListener("submit", handleActiveSessionSubmit);
  elements.activeSessionCancelButton.addEventListener("click", () => {
    elements.activeSessionDialog.close();
  });
  elements.entryEditorDialog.addEventListener("close", () => {
    editingEntryId = null;
  });
  elements.editActiveSessionButton.addEventListener("click", openActiveSessionEditor);
  elements.pauseActiveSessionButton.addEventListener("click", pauseActiveSession);
  elements.resumeLastProjectButton.addEventListener("click", resumeLastStoppedProject);
  elements.settingsButton.addEventListener("click", () => {
    setRecommendStatus("");
    elements.settingsDialog.showModal();
  });
  elements.exportButton.addEventListener("click", () => {
    elements.exportDialog.showModal();
  });
  elements.closeSettingsButton.addEventListener("click", () => {
    elements.settingsDialog.close();
  });
  elements.closeExportButton.addEventListener("click", () => {
    elements.exportDialog.close();
  });
  elements.checkForUpdatesButton.addEventListener("click", checkForUpdates);
  elements.reloadAppButton.addEventListener("click", reloadAppAfterUpdate);
  elements.languageSelect.addEventListener("change", handleLanguageChange);
  elements.roundingSelect.addEventListener("change", handleRoundingChange);
  elements.timerReminderCheckbox.addEventListener("change", handleTimerReminderToggle);
  elements.dailyGoalInput.addEventListener("change", handleGoalChange);
  elements.weeklyGoalInput.addEventListener("change", handleGoalChange);
  elements.exportScopeSelect.addEventListener("change", updateExportFields);
  elements.exportDataButton.addEventListener("click", exportAppData);
  elements.importDataButton.addEventListener("click", () => {
    elements.importDataInput.click();
  });
  elements.importDataInput.addEventListener("change", handleImportData);
  elements.recommendAppButton?.addEventListener("click", () => {
    void shareAppRecommendation();
  });
  elements.projectCreateCancelButton.addEventListener("click", () => {
    elements.projectCreateDialog.close();
  });
  elements.projectCreateDialog.addEventListener("close", resetProjectCreateForm);
  elements.calendarViewSelect.addEventListener("change", renderCalendar);
  elements.calendarDateInput.addEventListener("change", renderCalendar);
  elements.calendarDetails.addEventListener("toggle", handleCalendarToggle);
  elements.projectEditorForm.addEventListener("submit", handleProjectEditorSubmit);
  elements.projectEditorDialog.addEventListener("close", () => {
    editingProjectId = null;
  });
  elements.helpDetails.addEventListener("toggle", handleHelpToggle);
  elements.closeProjectNoteButton.addEventListener("click", () => {
    elements.projectNoteDialog.close();
  });
  elements.confirmDialog.addEventListener("close", handleDeleteDialogClose);
}

function handleProjectSubmit(event) {
  event.preventDefault();
  const name = elements.projectNameInput.value.trim();
  const note = elements.projectNoteInput.value.trim();
  const color = normalizeHexColor(elements.projectColorInput.value) || createProjectColor();

  if (!name) {
    return;
  }

  if (!isProjectNameUnique(name)) {
    alert(t("invalidProjectName"));
    return;
  }

  state.projects.push({
    id: createId(),
    name,
    note,
    color,
    createdAt: new Date().toISOString()
  });

  resetProjectCreateForm();
  saveState();
  elements.projectCreateDialog.close();
  render();
}

function openProjectCreateDialog() {
  resetProjectCreateForm();
  elements.projectCreateDialog.showModal();
  window.requestAnimationFrame(() => {
    elements.projectNameInput.focus();
  });
}

function resetProjectCreateForm() {
  elements.projectNameInput.value = "";
  elements.projectNoteInput.value = "";
  const color = createProjectColor();
  elements.projectColorInput.value = color;
  renderColorPalette(elements.projectColorPalette, elements.projectColorInput, color);
}

function handleManualEntrySubmit(event) {
  event.preventDefault();

  const projectId = elements.manualProjectId.value;
  const start = new Date(elements.manualStart.value);
  const end = new Date(elements.manualEnd.value);

  if (!projectId) {
    alert(t("noProjectSelected"));
    return;
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    alert(t("invalidStartEnd"));
    return;
  }

  const conflicts = findConflictingEntries(start, end);
  if (conflicts.length && !window.confirm(buildConflictWarningMessage(conflicts))) {
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

function findConflictingEntries(start, end, ignoreEntryId = null) {
  const conflicts = state.entries
    .filter((entry) => entry.end)
    .filter((entry) => !ignoreEntryId || entry.id !== ignoreEntryId)
    .filter((entry) => rangesOverlap(start, end, new Date(entry.start), new Date(entry.end)))
    .map((entry) => ({
      type: "entry",
      projectName: findProject(entry.projectId)?.name || t("unknownProject"),
      start: entry.start,
      end: entry.end
    }));

  if (state.activeSession) {
    const activeStart = new Date(state.activeSession.start);
    const activeEnd = new Date();
    if (rangesOverlap(start, end, activeStart, activeEnd)) {
      conflicts.unshift({
        type: "active",
        projectName: findProject(state.activeSession.projectId)?.name || t("unknownProject"),
        start: state.activeSession.start,
        end: activeEnd.toISOString()
      });
    }
  }

  return conflicts;
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function buildConflictWarningMessage(conflicts) {
  const preview = conflicts
    .slice(0, 3)
    .map((conflict) => {
      const prefix = conflict.type === "active" ? t("manualConflictPrefixActive") : t("manualConflictPrefixBlock");
      return `${prefix}: ${conflict.projectName} (${formatDateTime(conflict.start)} – ${formatDateTime(conflict.end)})`;
    })
    .join("\n");
  const more = conflicts.length > 3 ? `\n${t("manualConflictMore", { count: conflicts.length - 3 })}` : "";
  return `${t("overlapWarning")}\n\n${preview}${more}\n\n${t("manualConflictQuestion")}`;
}

async function handleExportSubmit(event) {
  event.preventDefault();

  const range = getSelectedRange();
  const rows = buildExportRows(range.start, range.end, getExportProjectFilter());
  const format = elements.exportFormatSelect.value;

  if (!rows.length) {
    alert(t("noFinishedBlocks"));
    return;
  }

  if (format === "csv") {
    const csv = createCsv(rows);
    const fileName = `zeiterfassung-${range.fileStamp}.csv`;
    const file = new File([csv], fileName, { type: "text/csv;charset=utf-8" });
    await shareOrDownloadFile(file, fileName, t("exportShareTitle"));
    return;
  }

  if (format === "report") {
    const report = createMonthlyReportHtml(rows, range.label);
    const fileName = `zeiterfassung-bericht-${range.fileStamp}.html`;
    const file = new File([report], fileName, { type: "text/html;charset=utf-8" });
    await shareOrDownloadFile(file, fileName, t("exportReportTitle"));
    return;
  }

  const workbook = createSpreadsheetXml(rows, range.label, isMonthlyWorkbookMode(range));
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel" });
  const fileName = `zeiterfassung-${range.fileStamp}.xls`;
  const file = new File([blob], fileName, { type: blob.type });
  await shareOrDownloadFile(file, fileName, t("exportShareTitle"));
}

function updateExportFields() {
  const type = elements.exportRangeType.value;
  elements.exportDay.disabled = type !== "day";
  elements.exportWeek.disabled = type !== "week";
  elements.exportMonth.disabled = type !== "customMonth";
  const singleProjectSelected = elements.exportScopeSelect.value === "single";
  elements.exportProjectField.hidden = !singleProjectSelected;
  elements.exportProjectSelect.disabled = !singleProjectSelected;

  elements.exportDayField.hidden = false;
  elements.exportWeekField.hidden = false;
  elements.exportMonthField.hidden = false;
}

function startTicker() {
  updateActiveTimer();
  setInterval(updateActiveTimer, 1000);
}

function updateActiveTimer() {
  const activeProject = getActiveProject();

  if (!state.activeSession || !activeProject) {
    void closeTimerReminderNotification();
    elements.activeProjectName.textContent = t("noActiveProject");
    elements.activeTimer.textContent = "00:00:00";
    return;
  }

  const startedAt = new Date(state.activeSession.start);
  const now = Date.now();
  const durationMs = Math.max(now - startedAt.getTime(), 0);
  const leadMs = Math.max(startedAt.getTime() - now, 0);
  elements.activeProjectName.textContent = activeProject.name;

  if (leadMs > 0) {
    elements.activeTimer.textContent = `${t("startsIn")} ${formatDuration(leadMs, true)}`;
    return;
  }

  elements.activeTimer.textContent = formatDuration(durationMs, true);
  maybeSendTimerReminder(activeProject, durationMs);
}

function maybeSendTimerReminder(activeProject, durationMs) {
  if (!state.activeSession || !activeProject || !getTimerReminderEnabled() || !supportsNotificationApi()) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const reminderMinute = getReminderMilestoneForDuration(durationMs);
  if (!reminderMinute) {
    return;
  }

  const lastReminderMinute = Number(state.activeSession.lastReminderMinute) || 0;
  if (reminderMinute <= lastReminderMinute) {
    return;
  }

  state.activeSession.lastReminderMinute = reminderMinute;
  saveState();

  const reminderHours = Math.floor(reminderMinute / 60);
  const remainderMinutes = reminderMinute % 60;
  const durationLabel = remainderMinutes
    ? `${reminderHours} h ${String(remainderMinutes).padStart(2, "0")} min`
    : `${reminderHours} h`;

  void showTimerReminderNotification(activeProject.name, durationLabel);
}

function getReminderMilestoneForDuration(durationMs) {
  const totalMinutes = Math.floor(durationMs / 60000);
  if (totalMinutes < 60) {
    return 0;
  }

  return 60 + Math.floor((totalMinutes - 60) / 30) * 30;
}

async function showTimerReminderNotification(projectName, durationLabel) {
  const registration = await getNotificationRegistration();
  if (!registration) {
    return;
  }

  await closeTimerReminderNotification();
  await registration.showNotification(t("timerReminderTitle"), {
    body: t("timerReminderBody", { project: projectName, duration: durationLabel }),
    tag: "active-project-timer",
    renotify: false,
    icon: "./icons/app-icon.svg",
    badge: "./icons/app-icon.svg",
    data: {
      url: "./"
    }
  });
}

async function closeTimerReminderNotification() {
  const registration = await getNotificationRegistration();
  if (!registration) {
    return;
  }

  const notifications = await registration.getNotifications({ tag: "active-project-timer" });
  notifications.forEach((notification) => notification.close());
}

async function getNotificationRegistration() {
  if (serviceWorkerRegistration) {
    return serviceWorkerRegistration;
  }

  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    serviceWorkerRegistration = await navigator.serviceWorker.ready;
    return serviceWorkerRegistration;
  } catch {
    return null;
  }
}

function getPendingStartMs(startIso) {
  return Math.max(new Date(startIso).getTime() - Date.now(), 0);
}

function render() {
  elements.roundingSelect.value = String(getRoundingMinutes());
  elements.timerReminderCheckbox.checked = getTimerReminderEnabled();
  elements.timerReminderCheckbox.disabled = !supportsNotificationApi();
  elements.dailyGoalInput.value = String(getDailyGoalHours());
  elements.weeklyGoalInput.value = String(getWeeklyGoalHours());
  renderBackupStatus();
  renderProjects();
  renderManualProjectOptions();
  renderExportProjectOptions();
  renderEntries();
  renderChart();
  renderCalendar();
  renderGoalStatus();
  renderTotals();
  updateActiveTimer();
  updateExportFields();
  elements.deleteAllEntriesButton.disabled = !state.entries.length;
  const hasActiveSession = Boolean(state.activeSession);
  const hasResumableProject = Boolean(findProject(state.lastStoppedSession?.projectId));
  elements.editActiveSessionButton.disabled = !hasActiveSession;
  elements.pauseActiveSessionButton.disabled = !hasActiveSession;
  elements.resumeLastProjectButton.disabled = hasActiveSession || !hasResumableProject;
  maybeShowFileBackupNotice();
}

function renderProjects() {
  elements.projectsList.innerHTML = "";
  const filteredProjects = getFilteredProjects();

  if (!state.projects.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `<strong>${escapeHtml(t("emptyProjectsTitle"))}</strong><p>${escapeHtml(t("emptyProjectsText"))}</p>`;
    elements.projectsList.appendChild(empty);
    return;
  }

  if (!filteredProjects.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `<strong>${escapeHtml(t("noTimeBlocksFound"))}</strong><p>${escapeHtml(t("noTimeBlocksFoundText"))}</p>`;
    elements.projectsList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const project of filteredProjects) {
    const active = state.activeSession?.projectId === project.id;
    const color = getProjectColor(project.id);
    const pendingStart = active ? getPendingStartMs(state.activeSession.start) : 0;
    const projectEntries = state.entries.filter((entry) => entry.projectId === project.id && isEntryOnDate(entry, new Date()));
    const projectTotalMs = projectEntries.reduce((sum, entry) => sum + getDurationMs(entry), 0);
    const notePreview = project.note
      ? `<button class="project-note-preview" type="button" data-project-note="${project.id}">${escapeHtml(project.note)}</button>`
      : `<span class="project-note-preview">${escapeHtml(t("projectNoteMissing"))}</span>`;
    const todayLabel = projectEntries.length === 1 ? t("projectBlocksTodayOne") : t("projectBlocksTodayMany", { count: projectEntries.length });
    const activityLabel = active
      ? (pendingStart > 0
        ? `${t("plannedFrom")} ${formatDateTime(state.activeSession.start)}`
        : `${t("runningSince")} ${formatDateTime(state.activeSession.start)}`)
      : todayLabel;

    const card = document.createElement("article");
    card.className = `project-card${active ? " active" : ""}`;
    card.draggable = true;
    card.dataset.projectId = project.id;
    card.style.setProperty("--project-color", color);
    card.innerHTML = `
      <div class="project-header-row">
        <div class="project-main">
          <div class="project-title">
            <span class="project-color-dot" style="background:${color}"></span>
            <div class="project-name">${escapeHtml(project.name)}</div>
          </div>
          <div class="project-meta">
            <span class="pill">${escapeHtml(activityLabel)}</span>
            <span class="pill">${escapeHtml(`${t("projectToday")} ${formatDuration(projectTotalMs)}`)}</span>
          </div>
          ${notePreview}
        </div>
        <div class="drag-handle" aria-hidden="true" title="${escapeHtml(t("projectDragHandle"))}">⋮⋮</div>
      </div>
      <div class="project-actions">
        <button class="primary-button project-button" data-action="clock-in" data-project-id="${project.id}" ${active ? "disabled" : ""}>${escapeHtml(t("projectClockIn"))}</button>
        <button class="secondary-button project-button" data-action="clock-out" data-project-id="${project.id}" ${active ? "" : "disabled"}>${escapeHtml(t("projectClockOut"))}</button>
      </div>
      <div class="project-secondary-actions">
        <button class="secondary-button move-button" data-action="move-up" data-project-id="${project.id}" title="${escapeHtml(t("projectMoveUp"))}">↑</button>
        <button class="secondary-button move-button" data-action="move-down" data-project-id="${project.id}" title="${escapeHtml(t("projectMoveDown"))}">↓</button>
        <button class="secondary-button project-button" data-action="edit" data-project-id="${project.id}">${escapeHtml(t("projectEdit"))}</button>
        <button class="danger-button project-button" data-action="delete" data-project-id="${project.id}">${escapeHtml(t("projectDelete"))}</button>
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
    option.textContent = t("noProjectSelected");
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
    row.innerHTML = `<td colspan="5" class="empty-cell">${escapeHtml(t("noBlocksSaved"))}</td>`;
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
    const color = getProjectColor(entry.projectId);
    const row = document.createElement("tr");
    row.dataset.entryId = entry.id;
    row.innerHTML = `
      <td data-label="${escapeAttribute(t("overviewProject"))}">
        <span class="project-inline-label">
          <span class="project-color-dot" style="background:${color}"></span>
          <span>${escapeHtml(project?.name || t("unknownProject"))}</span>
        </span>
      </td>
      <td data-label="${escapeAttribute(t("overviewPeriod"))}">
        <div>${escapeHtml(formatDateTime(entry.start))}</div>
        <div>${escapeHtml(formatDateTime(entry.end))}</div>
      </td>
      <td data-label="${escapeAttribute(t("overviewDuration"))}">${formatDuration(getDurationMs(entry))}</td>
      <td data-label="${escapeAttribute(t("note"))}">${escapeHtml(entry.note || "-")}</td>
      <td class="entry-action-cell"><button class="secondary-button entry-edit-button" type="button" data-entry-action="edit" data-entry-id="${entry.id}">${escapeHtml(t("overviewEditor"))}</button></td>
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
    elements.statsChart.innerHTML = `<text x="320" y="160" text-anchor="middle" fill="#6b5c4d" font-size="18">${escapeHtml(t("noChartData"))}</text>`;
    return;
  }

  if (elements.chartTypeSelect.value === "pie") {
    renderPieChart(data);
  } else {
    renderBarChart(data);
  }

  renderChartLegend(data);
}

function renderCalendar() {
  if (!elements.calendarDetails.open) {
    return;
  }

  const selectedDate = new Date(elements.calendarDateInput.value || new Date());
  const view = elements.calendarViewSelect.value;
  const entries = state.entries.filter((entry) => entry.end);
  elements.calendarLegend.innerHTML = `
    <span><i class="calendar-dot" style="background:#0f766e"></i> ${escapeHtml(t("calendarTimeBlock"))}</span>
    <span><i class="calendar-dot" style="background:#d97706"></i> ${escapeHtml(t("holiday"))}</span>
    <span><i class="calendar-dot" style="background:#2563eb"></i> ${escapeHtml(t("weekend"))}</span>
  `;

  if (view === "day") {
    renderDayCalendar(selectedDate, entries);
    return;
  }

  if (view === "week") {
    renderWeekCalendar(selectedDate, entries);
    return;
  }

  renderMonthCalendar(selectedDate, entries);
}

function handleCalendarToggle() {
  if (elements.calendarDetails.open) {
    renderCalendar();
  }
}

function handleHelpToggle() {
  if (elements.helpDetails.open) {
    loadHelpContent();
  }
}

async function loadHelpContent() {
  elements.helpContent.innerHTML = `<p class="help-loading">${t("helpLoading")}</p>`;

  try {
    const response = await fetch("./README.md", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("README konnte nicht geladen werden.");
    }

    const markdown = await response.text();
    elements.helpContent.innerHTML = renderMarkdownAsHtml(markdown);
  } catch {
    elements.helpContent.innerHTML = `<p class="help-loading">${t("helpLoadFailed")}</p>`;
  }
}

function renderMarkdownAsHtml(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const parts = [];
  let listType = null;
  let listItems = [];
  let paragraphLines = [];
  let codeLines = [];
  let blockquoteLines = [];
  let tableLines = [];
  let inCodeBlock = false;

  const flushList = () => {
    if (!listItems.length) {
      return;
    }
    const tag = listType || "ul";
    parts.push(`<${tag}>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</${tag}>`);
    listType = null;
    listItems = [];
  };

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return;
    }
    parts.push(`<p>${renderInlineMarkdown(paragraphLines.join(" "))}</p>`);
    paragraphLines = [];
  };

  const flushCode = () => {
    if (!codeLines.length) {
      return;
    }
    parts.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines = [];
  };

  const flushBlockquote = () => {
    if (!blockquoteLines.length) {
      return;
    }
    parts.push(`<blockquote>${renderInlineMarkdown(blockquoteLines.join(" "))}</blockquote>`);
    blockquoteLines = [];
  };

  const flushTable = () => {
    if (tableLines.length < 2 || !/^\s*\|?[\s:-]+\|[\s|:-]*$/.test(tableLines[1])) {
      paragraphLines.push(...tableLines);
      tableLines = [];
      return;
    }

    const rows = tableLines.map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
    const [header, , ...body] = rows;
    const headerMarkup = header.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join("");
    const bodyMarkup = body.map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join("")}</tr>`).join("");
    parts.push(`<table><thead><tr>${headerMarkup}</tr></thead><tbody>${bodyMarkup}</tbody></table>`);
    tableLines = [];
  };

  const flushAll = () => {
    flushList();
    flushParagraph();
    flushBlockquote();
    flushTable();
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      flushAll();
      if (inCodeBlock) {
        flushCode();
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushAll();
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length;
      parts.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    if (/^\|.+\|\s*$/.test(line.trim())) {
      flushList();
      flushParagraph();
      flushBlockquote();
      tableLines.push(line);
      continue;
    }

    flushTable();

    const unorderedListMatch = /^[-*]\s+(.+)$/.exec(line);
    if (unorderedListMatch) {
      flushParagraph();
      flushBlockquote();
      if (listType && listType !== "ul") {
        flushList();
      }
      listType = "ul";
      listItems.push(unorderedListMatch[1]);
      continue;
    }

    const orderedListMatch = /^\d+\.\s+(.+)$/.exec(line);
    if (orderedListMatch) {
      flushParagraph();
      flushBlockquote();
      if (listType && listType !== "ol") {
        flushList();
      }
      listType = "ol";
      listItems.push(orderedListMatch[1]);
      continue;
    }

    const blockquoteMatch = /^>\s?(.*)$/.exec(line);
    if (blockquoteMatch) {
      flushList();
      flushParagraph();
      blockquoteLines.push(blockquoteMatch[1]);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushAll();
      parts.push("<hr>");
      continue;
    }

    const imageMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line.trim());
    if (imageMatch) {
      flushAll();
      const src = sanitizeMarkdownUrl(imageMatch[2]);
      if (src) {
        parts.push(`<figure><img src="${escapeAttribute(src)}" alt="${escapeAttribute(imageMatch[1])}" loading="lazy"></figure>`);
      }
      continue;
    }

    paragraphLines.push(line.trim());
  }

  flushAll();
  flushCode();
  return parts.join("");
}

function renderInlineMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^\*])\*([^*]+)\*/g, "$1<em>$2</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const safeHref = sanitizeMarkdownUrl(href);
    if (safeHref) {
      const external = /^https?:\/\//i.test(safeHref);
      return `<a href="${escapeAttribute(safeHref)}"${external ? ' target="_blank" rel="noreferrer"' : ""}>${escapeHtml(label)}</a>`;
    }
    return escapeHtml(label);
  });
  return html;
}

function sanitizeMarkdownUrl(url) {
  if (typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();
  if (!trimmed || /^javascript:/i.test(trimmed)) {
    return "";
  }

  return trimmed;
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
  const handles = [...elements.projectsList.querySelectorAll(".drag-handle")];

  for (const card of cards) {
    card.addEventListener("dragstart", handleProjectDragStart);
    card.addEventListener("dragover", handleProjectDragOver);
    card.addEventListener("dragleave", handleProjectDragLeave);
    card.addEventListener("drop", handleProjectDrop);
    card.addEventListener("dragend", handleProjectDragEnd);
  }

  for (const handle of handles) {
    handle.addEventListener("touchstart", handleProjectTouchStart, { passive: true });
    handle.addEventListener("touchmove", handleProjectTouchMove, { passive: true });
    handle.addEventListener("touchend", handleProjectTouchEnd);
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

function handleProjectTouchStart(event) {
  const card = event.currentTarget.closest(".project-card");
  if (!card) {
    return;
  }
  touchDragProjectId = card.dataset.projectId;
  card.classList.add("dragging");
}

function handleProjectTouchMove(event) {
  if (!touchDragProjectId) {
    return;
  }

  const touch = event.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest(".project-card");
  elements.projectsList.querySelectorAll(".project-card").forEach((card) => card.classList.remove("drag-over"));

  if (target && target.dataset.projectId !== touchDragProjectId) {
    target.classList.add("drag-over");
    touchDragTargetId = target.dataset.projectId;
  }
}

function handleProjectTouchEnd() {
  if (touchDragProjectId && touchDragTargetId && touchDragProjectId !== touchDragTargetId) {
    const fromIndex = state.projects.findIndex((project) => project.id === touchDragProjectId);
    const toIndex = state.projects.findIndex((project) => project.id === touchDragTargetId);
    if (fromIndex !== -1 && toIndex !== -1) {
      const [movedProject] = state.projects.splice(fromIndex, 1);
      state.projects.splice(toIndex, 0, movedProject);
      saveState();
      render();
    }
  }

  touchDragProjectId = null;
  touchDragTargetId = null;
  handleProjectDragEnd();
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
  const actualNow = new Date();
  const roundedNow = roundDateUp(actualNow, getRoundingMinutes());
  const nowIso = actualNow.toISOString();
  void closeTimerReminderNotification();

  if (state.activeSession?.projectId === projectId) {
    return;
  }

  if (state.activeSession) {
    const finalized = finalizeActiveSession(nowIso, true);
    maybeShowRoundingNotice(finalized);
  }

  state.activeSession = { projectId, start: roundedNow.toISOString(), lastReminderMinute: 0 };
  if (state.lastStoppedSession?.projectId === projectId) {
    state.lastStoppedSession = null;
  }
  saveState();
  maybeShowClockInRoundingNotice(actualNow, roundedNow);
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

function openActiveSessionEditor() {
  if (!state.activeSession) {
    return;
  }

  elements.activeSessionProjectId.innerHTML = buildProjectOptions(state.activeSession.projectId);
  elements.activeSessionStart.value = toDateTimeLocalValue(new Date(state.activeSession.start));
  elements.activeSessionDialog.showModal();
}

function handleActiveSessionSubmit(event) {
  event.preventDefault();

  if (!state.activeSession) {
    return;
  }

  const projectId = elements.activeSessionProjectId.value;
  const start = new Date(elements.activeSessionStart.value);

  if (!findProject(projectId) || Number.isNaN(start.getTime()) || start > new Date()) {
    alert(t("invalidProjectStart"));
    return;
  }

  state.activeSession.projectId = projectId;
  state.activeSession.start = start.toISOString();
  state.activeSession.lastReminderMinute = getReminderMilestoneForDuration(Math.max(Date.now() - start.getTime(), 0));
  void closeTimerReminderNotification();
  saveState();
  elements.activeSessionDialog.close();
  render();
}

function pauseActiveSession() {
  if (!state.activeSession) {
    return;
  }

  state.lastStoppedSession = {
    projectId: state.activeSession.projectId,
    stoppedAt: new Date().toISOString()
  };
  const finalized = finalizeActiveSession(new Date().toISOString(), true);
  saveState();
  maybeShowRoundingNotice(finalized);
  render();
}

function resumeLastStoppedProject() {
  const lastProjectId = state.lastStoppedSession?.projectId;
  if (!lastProjectId || !findProject(lastProjectId) || state.activeSession) {
    return;
  }

  state.activeSession = {
    projectId: lastProjectId,
    start: roundDateUp(new Date(), getRoundingMinutes()).toISOString(),
    lastReminderMinute: 0
  };
  state.lastStoppedSession = null;
  saveState();
  render();
}

function finalizeActiveSession(endIso, shouldRound = false) {
  if (!state.activeSession) {
    return { endIso, rounded: false };
  }

  void closeTimerReminderNotification();

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
    roundedEnd: end.getTime() !== actualEnd.getTime(),
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
    title: t("deleteProjectTitle"),
    message: t("deleteProjectMessage", { project: project.name, count: entryCount }),
    confirmLabel: t("deleteProjectConfirm"),
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
  if (!pendingConfirmation) {
    pendingConfirmation = null;
    return;
  }

  const returnValue = elements.confirmDialog.returnValue;
  const { onConfirm, onAlternate } = pendingConfirmation;
  pendingConfirmation = null;

  if (returnValue === "confirm") {
    onConfirm?.();
    return;
  }

  if (returnValue === "alternate") {
    onAlternate?.();
  }
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
  const color = normalizeHexColor(elements.projectEditorColor.value) || project?.color || createProjectColor();

  if (!project || !name) {
    return;
  }

  if (!isProjectNameUnique(name, editingProjectId)) {
    alert(t("invalidProjectName"));
    return;
  }

  project.name = name;
  project.note = note;
  project.color = color;
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
  const color = getProjectColor(project.id);
  elements.projectEditorColor.value = color;
  renderColorPalette(elements.projectEditorColorPalette, elements.projectEditorColor, color);
  elements.projectEditorDialog.showModal();
}

function handleRoundingChange() {
  state.settings.roundingMinutes = parseRoundingMinutes(elements.roundingSelect.value, 5);
  saveState();
  applyManualTimeSuggestions();
}

function handleLanguageChange() {
  setLanguage(elements.languageSelect.value);
}

async function exportAppData() {
  const info = getVersionInfo();
  const payload = {
    exportedAt: new Date().toISOString(),
    app: t("appTitle"),
    version: info.appVersion,
    schemaVersion: DATA_SCHEMA_VERSION,
    data: {
      schemaVersion: state.schemaVersion,
      version: state.version,
      projects: state.projects,
      entries: state.entries,
      activeSession: state.activeSession,
      lastStoppedSession: state.lastStoppedSession,
      settings: state.settings
    }
  };

  const file = new File(
    [JSON.stringify(payload, null, 2)],
    `zeiterfassung-backup-${toDateInputValue(new Date())}.json`,
    { type: "application/json" }
  );

  await shareOrDownloadFile(file, file.name, t("exportDataTitle"));
  state.settings.lastDataExportAt = new Date().toISOString();
  fileBackupNoticeShown = false;
  saveState();
  hideRoundingNotice();
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
      alert(t("importInvalid"));
      return;
    }

    openConfirmation({
      title: t("importDataTitle"),
      message: buildImportPreviewMessage(importedState),
      confirmLabel: t("importDataConfirm"),
      confirmButtonClass: "primary-button",
      alternateLabel: t("importDataReplaceConfirm"),
      alternateButtonClass: "danger-button",
      onConfirm: () => {
        mergeImportedData(importedState);
        elements.settingsDialog.close();
        applyManualTimeSuggestions();
        render();
      },
      onAlternate: () => {
        replaceStateFromImport(importedState);
        elements.settingsDialog.close();
        applyManualTimeSuggestions();
        render();
      }
    });
  } catch {
    alert(t("importInvalidFile"));
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
    alert(t("invalidProjectSelection"));
    return;
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    alert(t("invalidEntryDates"));
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
    title: t("deleteEntryTitle"),
    message: t("deleteEntryMessage", { project: project?.name || t("unknownProject") }),
    confirmLabel: t("deleteEntryConfirm"),
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
    title: t("deleteAllEntriesTitle"),
    message: t("deleteAllEntriesMessage", { count: state.entries.length }),
    confirmLabel: t("deleteAllEntriesConfirm"),
    onConfirm: () => {
      state.entries = [];
      saveState();
      render();
    }
  });
}

function openConfirmation({
  title,
  message,
  confirmLabel,
  onConfirm,
  alternateLabel = "",
  onAlternate = null,
  confirmButtonClass = "danger-button",
  alternateButtonClass = "secondary-button"
}) {
  pendingConfirmation = { onConfirm, onAlternate };
  elements.confirmDialogTitle.textContent = title;
  elements.confirmDialogText.textContent = message;
  elements.confirmYesButton.textContent = confirmLabel;
  elements.confirmYesButton.className = confirmButtonClass;
  elements.confirmAlternateButton.textContent = alternateLabel;
  elements.confirmAlternateButton.className = alternateButtonClass;
  elements.confirmAlternateButton.hidden = !(alternateLabel && onAlternate);
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
  const usedAutoColors = new Set(projects.map((project) => normalizeHexColor(project.color)).filter(Boolean));

  return {
    schemaVersion: rawState.schemaVersion || DATA_SCHEMA_VERSION,
    version: rawState.version || getVersionInfo().appVersion,
    projects: projects.map((project) => {
      const id = project.id || createId();
      return {
        id,
        name: project.name || "Unbenanntes Projekt",
        note: project.note || "",
        color: normalizeHexColor(project.color) || getNextAvailableProjectColor(usedAutoColors, id),
        createdAt: project.createdAt || new Date().toISOString()
      };
    }),
    entries: entries.map((entry) => ({
      id: entry.id || createId(),
      projectId: entry.projectId,
      start: entry.start,
      end: entry.end,
      type: entry.type || "Live",
      note: entry.note || "",
      createdAt: entry.createdAt || new Date().toISOString()
    })),
    activeSession: rawState.activeSession
      ? {
          projectId: rawState.activeSession.projectId,
          start: rawState.activeSession.start,
          lastReminderMinute: rawState.activeSession.lastReminderMinute ?? getReminderMilestoneForDuration(
            Math.max(Date.now() - new Date(rawState.activeSession.start).getTime(), 0)
          )
        }
      : null,
    lastStoppedSession: rawState.lastStoppedSession || null,
    settings: {
      roundingMinutes: parseRoundingMinutes(rawState.settings?.roundingMinutes, fallback.settings.roundingMinutes),
      timerReminderEnabled: rawState.settings?.timerReminderEnabled ?? fallback.settings.timerReminderEnabled,
      language: normalizeLanguageSetting(rawState.settings?.language || fallback.settings.language),
      lastDataExportAt: rawState.settings?.lastDataExportAt || null,
      dailyGoalHours: rawState.settings?.dailyGoalHours ?? fallback.settings.dailyGoalHours,
      weeklyGoalHours: rawState.settings?.weeklyGoalHours ?? fallback.settings.weeklyGoalHours
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
  return name.trim().toLocaleLowerCase(getLocaleForFormatting());
}

function getRoundingMinutes() {
  return parseRoundingMinutes(state.settings?.roundingMinutes, 5);
}

function parseRoundingMinutes(value, fallback = 5) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return fallback;
}

function getTimerReminderEnabled() {
  return Boolean(state.settings?.timerReminderEnabled);
}

function supportsNotificationApi() {
  return typeof Notification !== "undefined";
}

function renderBackupStatus() {
  const backupStatus = getFileBackupStatus();
  const internalBackupCount = loadInternalBackups().length;
  const internalBackupText = internalBackupCount
    ? t("internalBackupAvailable", { count: internalBackupCount })
    : t("internalBackupMissing");

  if (!backupStatus.lastExport) {
    elements.backupStatusText.textContent = `${t("noBackup")} ${internalBackupText}`;
    return;
  }

  const prefix = backupStatus.isOld ? t("backupOldPrefix") : t("backupFreshPrefix");
  elements.backupStatusText.textContent = `${prefix}: ${formatDateTime(backupStatus.lastExport)}. ${internalBackupText}`;
}

function getFileBackupStatus() {
  const lastExport = state.settings?.lastDataExportAt || null;
  if (!lastExport) {
    return { lastExport: null, ageDays: null, isMissing: true, isOld: false };
  }

  const exportDate = new Date(lastExport);
  const ageDays = Number.isNaN(exportDate.getTime())
    ? Number.POSITIVE_INFINITY
    : Math.floor((Date.now() - exportDate.getTime()) / 86400000);

  return {
    lastExport,
    ageDays,
    isMissing: false,
    isOld: ageDays > FILE_BACKUP_WARNING_AGE_DAYS
  };
}

function maybeShowFileBackupNotice() {
  if (fileBackupNoticeShown || !hasRecoverableData(state)) {
    return;
  }

  const backupStatus = getFileBackupStatus();
  if (!backupStatus.isMissing && !backupStatus.isOld) {
    return;
  }

  fileBackupNoticeShown = true;
  const message = backupStatus.isMissing
    ? t("backupNoticeMissing")
    : t("backupNoticeOld", { days: backupStatus.ageDays });
  showRoundingNotice(message);
}

function renderExportProjectOptions() {
  elements.exportProjectSelect.innerHTML = "";
  for (const project of state.projects) {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    elements.exportProjectSelect.appendChild(option);
  }
}

function handleGoalChange() {
  state.settings.dailyGoalHours = Number(elements.dailyGoalInput.value) || 0;
  state.settings.weeklyGoalHours = Number(elements.weeklyGoalInput.value) || 0;
  saveState();
  renderGoalStatus();
}

async function handleTimerReminderToggle() {
  if (!elements.timerReminderCheckbox.checked) {
    state.settings.timerReminderEnabled = false;
    saveState();
    return;
  }

  if (!supportsNotificationApi()) {
    alert(t("timerReminderPermissionUnavailable"));
    elements.timerReminderCheckbox.checked = false;
    state.settings.timerReminderEnabled = false;
    saveState();
    return;
  }

  if (Notification.permission === "granted") {
    state.settings.timerReminderEnabled = true;
    saveState();
    return;
  }

  if (Notification.permission === "denied") {
    alert(t("timerReminderPermissionDenied"));
    elements.timerReminderCheckbox.checked = false;
    state.settings.timerReminderEnabled = false;
    saveState();
    return;
  }

  const permission = await Notification.requestPermission();
  const enabled = permission === "granted";
  state.settings.timerReminderEnabled = enabled;
  elements.timerReminderCheckbox.checked = enabled;
  saveState();

  if (!enabled) {
    alert(t("timerReminderPermissionNeeded"));
  }
}

function renderGoalStatus() {
  const now = new Date();
  const todayActual = sumRangeDuration(startOfDay(now), endOfDay(now));
  const weekActual = sumRangeDuration(startOfWeek(now), endOfWeek(now));
  const dailyTarget = getDailyGoalHours() * 3600000;
  const weeklyTarget = getWeeklyGoalHours() * 3600000;

  elements.dailyGoalStatus.textContent = `${formatDuration(todayActual)} / ${formatDuration(dailyTarget)}`;
  elements.weeklyGoalStatus.textContent = `${formatDuration(weekActual)} / ${formatDuration(weeklyTarget)}`;
  elements.dailyGoalStatus.className = todayActual >= dailyTarget ? "goal-good" : "goal-warn";
  elements.weeklyGoalStatus.className = weekActual >= weeklyTarget ? "goal-good" : "goal-warn";
}

function getDailyGoalHours() {
  return Number(state.settings?.dailyGoalHours ?? 8);
}

function getWeeklyGoalHours() {
  return Number(state.settings?.weeklyGoalHours ?? 40);
}

function maybeShowRoundingNotice(finalized) {
  if (!finalized?.roundedEnd || !getRoundingMinutes()) {
    return;
  }

  const roundedTo = formatDateTime(finalized.endIso);
  showRoundingNotice(t("roundingNoticeEnd", { minutes: getRoundingMinutes(), date: roundedTo }));
}

function maybeShowClockInRoundingNotice(actualStart, roundedStart) {
  if (roundedStart.getTime() === actualStart.getTime() || !getRoundingMinutes()) {
    return;
  }

  showRoundingNotice(t("roundingNoticeStart", { minutes: getRoundingMinutes(), date: formatDateTime(roundedStart) }));
}

function showRoundingNotice(message) {
  const text = String(message || "").trim();
  if (!text) {
    hideRoundingNotice();
    return;
  }

  elements.roundingNotice.textContent = text;
  elements.roundingNotice.hidden = false;
  clearTimeout(roundingNoticeTimeoutId);
  roundingNoticeTimeoutId = setTimeout(() => {
    hideRoundingNotice();
  }, 5000);
}

function hideRoundingNotice() {
  clearTimeout(roundingNoticeTimeoutId);
  roundingNoticeTimeoutId = null;
  elements.roundingNotice.textContent = "";
  elements.roundingNotice.hidden = true;
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
      name: project?.name || t("unknownProject"),
      durationMs: 0
    };
    current.durationMs += durationMs;
    totals.set(key, current);
  }

  return [...totals.values()]
    .sort((left, right) => right.durationMs - left.durationMs)
    .map((item) => ({
      ...item,
      color: getProjectColor(item.projectId)
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
    const sliceAttributes = {
      fill: item.color,
      stroke: "#fffaf3",
      "stroke-width": 2,
      "data-tooltip": `${item.name}\n${formatDuration(item.durationMs)}`
    };
    const slice = isFullCircleAngle(angle)
      ? createSvgElement("circle", {
          cx,
          cy,
          r: radius,
          ...sliceAttributes
        })
      : createSvgElement("path", {
          d: describeArc(cx, cy, radius, startAngle, endAngle),
          ...sliceAttributes
        });
    attachTooltip(slice);
    elements.statsChart.appendChild(slice);
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
  subText.textContent = t("reportTotal");
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

function buildChartDataFromRows(rows) {
  const totals = new Map();
  for (const row of rows) {
    const durationMs = Number.parseFloat(row.durationHours.replace(",", ".")) * 3600000;
    const current = totals.get(row.project) || {
      name: row.project,
      durationMs: 0,
      color: row.projectColor || getFallbackProjectColor(row.project)
    };
    current.durationMs += durationMs;
    totals.set(row.project, current);
  }

  const total = [...totals.values()].reduce((sum, item) => sum + item.durationMs, 0) || 1;

  return [...totals.values()]
    .sort((left, right) => right.durationMs - left.durationMs)
    .map((item) => ({
      ...item,
      percent: `${((item.durationMs / total) * 100).toFixed(1).replace(".", ",")} %`
    }));
}

function createChartSvgMarkup(data, type) {
  if (!data.length) {
    return "<p>Keine Statistikdaten vorhanden.</p>";
  }

  if (type === "pie") {
    const total = data.reduce((sum, item) => sum + item.durationMs, 0) || 1;
    let startAngle = -Math.PI / 2;
    const paths = data.map((item) => {
      const angle = (item.durationMs / total) * Math.PI * 2;
      const endAngle = startAngle + angle;
      const path = describeArc(220, 160, 110, startAngle, endAngle);
      startAngle = endAngle;
      if (isFullCircleAngle(angle)) {
        return `<circle cx="220" cy="160" r="110" fill="${item.color}" stroke="#fffaf3" stroke-width="2"></circle>`;
      }
      return `<path d="${path}" fill="${item.color}" stroke="#fffaf3" stroke-width="2"></path>`;
    }).join("");
    return `<svg viewBox="0 0 640 320" width="100%" height="auto">${paths}<text x="220" y="156" text-anchor="middle" fill="#2d2218" font-size="22" font-weight="700">${formatDuration(total)}</text><text x="220" y="180" text-anchor="middle" fill="#6b5c4d" font-size="13">${escapeXml(t("reportTotal"))}</text></svg>`;
  }

  const width = 640;
  const height = 320;
  const padding = { top: 24, right: 24, bottom: 60, left: 32 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((item) => item.durationMs), 1);
  const barWidth = chartWidth / data.length;

  const bars = data.map((item, index) => {
    const barHeight = (item.durationMs / max) * chartHeight;
    const x = padding.left + index * barWidth + 12;
    const y = padding.top + (chartHeight - barHeight);
    return `
      <rect x="${x}" y="${y}" width="${Math.max(barWidth - 24, 24)}" height="${barHeight}" rx="10" fill="${item.color}"></rect>
      <text x="${x + Math.max(barWidth - 24, 24) / 2}" y="${height - 24}" text-anchor="middle" fill="#6b5c4d" font-size="12">${escapeXml(truncateLabel(item.name, 14))}</text>
    `;
  }).join("");

  return `<svg viewBox="0 0 640 320" width="100%" height="auto">${bars}</svg>`;
}

function createChartLegendMarkup(data) {
  return data.map((item) => `
    <div class="legend-item">
      <span class="swatch" style="background:${item.color}"></span>
      <span><strong>${escapeHtml(item.name)}</strong><br>${formatDuration(item.durationMs)} (${item.percent})</span>
    </div>
  `).join("");
}

function renderDayCalendar(selectedDate, entries) {
  const dayEntries = entries
    .filter((entry) => isEntryOnDate(entry, selectedDate))
    .sort((left, right) => new Date(left.start) - new Date(right.start));

  elements.calendarView.innerHTML = `
    <div class="calendar-grid">
      ${dayEntries.map((entry) => {
        const project = findProject(entry.projectId);
        const color = getProjectColor(entry.projectId);
        return `<div class="calendar-block" style="background:${color}">
          <strong>${escapeHtml(project?.name || t("unknownProject"))}</strong><br>
          ${escapeHtml(formatDateTime(entry.start))} - ${escapeHtml(formatDateTime(entry.end))}<br>
          ${escapeHtml(formatDuration(getDurationMs(entry)))}${entry.note ? `<br>${escapeHtml(entry.note)}` : ""}
        </div>`;
      }).join("") || `<div class="calendar-cell"><span class="calendar-cell-meta">${escapeHtml(t("calendarNoBlocks"))}</span></div>`}
    </div>
  `;
}

function renderWeekCalendar(selectedDate, entries) {
  const start = startOfWeek(selectedDate);
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });

  const weekdayHeaders = ["", ...days.map((day) => `<div class="calendar-weekday">${escapeHtml(formatShortDay(day))}</div>`)].join("");
  const hourRows = Array.from({ length: 16 }, (_, hourIndex) => {
    const hour = 6 + hourIndex;
    const cells = days.map((day) => {
      const dayEntries = entries.filter((entry) => isEntryOnDate(entry, day) && new Date(entry.start).getHours() === hour);
      const classes = buildCalendarClasses(day);
      return `<div class="calendar-day-column ${classes}">
        ${dayEntries.map((entry) => {
          const project = findProject(entry.projectId);
          return `<div class="calendar-block" style="background:${getProjectColor(entry.projectId)}">
            <strong>${escapeHtml(project?.name || t("unknownProject"))}</strong><br>
            ${escapeHtml(formatDuration(getDurationMs(entry)))}
          </div>`;
        }).join("")}
      </div>`;
    }).join("");
    return `<div class="calendar-hour">${String(hour).padStart(2, "0")}:00</div>${cells}`;
  }).join("");

  elements.calendarView.innerHTML = `<div class="calendar-grid week">${weekdayHeaders}${hourRows}</div>`;
}

function renderMonthCalendar(selectedDate, entries) {
  const start = startOfWeek(startOfMonth(selectedDate));
  const currentMonth = selectedDate.getMonth();
  const weekdayNames = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(getLocaleForFormatting(), { weekday: "short" }).format(new Date(2024, 0, 1 + index))
  );
  const headers = weekdayNames.map((name) => `<div class="calendar-month-header">${name}</div>`).join("");

  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const dayEntries = entries.filter((entry) => isEntryOnDate(entry, day));
    const total = dayEntries.reduce((sum, entry) => sum + getDurationMs(entry), 0);
    const classes = `${buildCalendarClasses(day)} ${day.getMonth() === currentMonth ? "" : "is-outside"}`;
    return `<div class="calendar-cell ${classes}">
      <strong>${day.getDate()}</strong>
      <span class="calendar-cell-meta">${formatDuration(total)}</span>
      ${dayEntries.slice(0, 3).map((entry) => {
        const project = findProject(entry.projectId);
        return `<div class="calendar-chip" style="background:${getProjectColor(entry.projectId)}">${escapeHtml(project?.name || t("unknownProject"))}</div>`;
      }).join("")}
    </div>`;
  }).join("");

  elements.calendarView.innerHTML = `<div class="calendar-grid month">${headers}${cells}</div>`;
}

function buildCalendarClasses(date) {
  const classes = [];
  if (isWeekend(date)) {
    classes.push("is-weekend");
  }
  if (isGermanNationalHoliday(date)) {
    classes.push("is-holiday");
  }
  return classes.join(" ");
}

function formatShortDay(date) {
  return new Intl.DateTimeFormat(getLocaleForFormatting(), {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}

function getProjectColor(projectId) {
  return findProject(projectId)?.color || getFallbackProjectColor(projectId);
}

function createProjectColor() {
  const usedColors = new Set(
    state.projects
      .map((project) => normalizeHexColor(project.color))
      .filter(Boolean)
  );
  return getNextAvailableProjectColor(usedColors, createId());
}

function getNextAvailableProjectColor(usedColors, fallbackSeed) {
  const nextColor = PROJECT_COLOR_PALETTE.find((color) => !usedColors.has(color));
  if (nextColor) {
    usedColors.add(nextColor);
    return nextColor;
  }
  return getFallbackProjectColor(fallbackSeed);
}

function getFallbackProjectColor(seed) {
  const index = Math.abs(hashString(String(seed))) % PROJECT_COLOR_PALETTE.length;
  return PROJECT_COLOR_PALETTE[index];
}

function normalizeHexColor(value) {
  if (typeof value !== "string") {
    return "";
  }
  const normalized = value.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : "";
}

function getReadableTextColor(hexColor) {
  const normalized = normalizeHexColor(hexColor);
  if (!normalized) {
    return "#1f1f1f";
  }

  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness < 150 ? "#ffffff" : "#1f1f1f";
}

function renderColorPalette(container, input, selectedColor) {
  if (!container || !input) {
    return;
  }

  const normalizedSelected = normalizeHexColor(selectedColor) || PROJECT_COLOR_PALETTE[0];
  input.value = normalizedSelected;
  container.innerHTML = "";

  for (const color of PROJECT_COLOR_PALETTE) {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = `color-swatch${color === normalizedSelected ? " is-selected" : ""}`;
    swatch.style.background = color;
    swatch.dataset.color = color;
    swatch.setAttribute("role", "radio");
    swatch.setAttribute("aria-checked", String(color === normalizedSelected));
    swatch.setAttribute("aria-label", `Farbe ${color}`);
    const selectColor = (event) => {
      event.preventDefault();
      input.value = color;
      renderColorPalette(container, input, color);
    };
    swatch.addEventListener("click", selectColor);
    swatch.addEventListener("pointerup", selectColor);
    container.appendChild(swatch);
  }
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isGermanNationalHoliday(date) {
  const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const staticHolidays = new Set(["01-01", "05-01", "10-03", "12-25", "12-26"]);
  if (staticHolidays.has(monthDay)) {
    return true;
  }

  const easterSunday = getEasterSunday(date.getFullYear());
  const goodFriday = addDays(easterSunday, -2);
  const easterMonday = addDays(easterSunday, 1);
  const ascensionDay = addDays(easterSunday, 39);
  const whitMonday = addDays(easterSunday, 50);

  return [goodFriday, easterMonday, ascensionDay, whitMonday].some((holiday) => isSameDate(holiday, date));
}

function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDate(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
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

function isFullCircleAngle(angle) {
  return Math.abs(angle - Math.PI * 2) < 0.000001;
}

function polarToCartesian(cx, cy, radius, angle) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle)
  };
}

function roundDateUp(date, minutes) {
  if (!minutes) {
    return new Date(date);
  }
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const stepMs = minutes * 60 * 1000;
  rounded.setTime(Math.ceil(rounded.getTime() / stepMs) * stepMs);
  return rounded;
}

function roundDateDown(date, minutes) {
  if (!minutes) {
    return new Date(date);
  }
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const stepMs = minutes * 60 * 1000;
  rounded.setTime(Math.floor(rounded.getTime() / stepMs) * stepMs);
  return rounded;
}

function roundSessionEndUp(start, end, minutes) {
  if (!minutes) {
    return new Date(end);
  }
  const stepMs = minutes * 60 * 1000;
  const roundedEnd = roundDateUp(end, minutes);

  if (roundedEnd > start) {
    return roundedEnd;
  }

  return new Date(roundDateUp(start, minutes).getTime() + stepMs);
}

function applyManualTimeSuggestions() {
  const minutes = getRoundingMinutes();
  const now = new Date();
  const roundedEnd = minutes ? roundDateUp(now, minutes) : new Date(now);
  roundedEnd.setSeconds(0, 0);
  const roundedStart = minutes
    ? new Date(roundedEnd.getTime() - minutes * 60 * 1000)
    : new Date(roundedEnd.getTime() - 60 * 60 * 1000);
  const stepSeconds = minutes ? minutes * 60 : 60;

  elements.manualStart.step = String(stepSeconds);
  elements.manualEnd.step = String(stepSeconds);

  elements.manualStart.value = toDateTimeLocalValue(roundedStart);
  elements.manualEnd.value = toDateTimeLocalValue(roundedEnd);
}

function getFilteredProjects() {
  const search = elements.projectSearchInput.value.trim().toLocaleLowerCase(getLocaleForFormatting());
  const filter = elements.projectFilterSelect.value;
  const today = new Date();

  return state.projects.filter((project) => {
    const active = state.activeSession?.projectId === project.id;
    const hasTodayEntries = state.entries.some((entry) => entry.projectId === project.id && isEntryOnDate(entry, today));
    const matchesSearch = !search
      || project.name.toLocaleLowerCase(getLocaleForFormatting()).includes(search)
      || (project.note || "").toLocaleLowerCase(getLocaleForFormatting()).includes(search);

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
  return new Intl.DateTimeFormat(getLocaleForFormatting(), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value));
}

function buildImportPreviewMessage(importedState) {
  const projectCount = importedState.projects.length;
  const entryCount = importedState.entries.length;
  const rounding = parseRoundingMinutes(importedState.settings?.roundingMinutes, 5);
  const roundingLabel = rounding ? `${rounding} ${t("roundingUnit")}` : t("noRounding");
  return `${t("importDataPrompt")}\n\n${t("importDataContains")}\n${t("importDataProjects", { count: projectCount })}\n${t("importDataBlocks", { count: entryCount })}\n${t("importDataRounding")}: ${roundingLabel}\n\n${t("importDataMergeNotice")}`;
}

function mergeImportedData(importedState) {
  const normalizedImport = normalizeState(importedState);
  const projectIdMap = new Map(state.projects.map((project) => [normalizeProjectName(project.name), project.id]));

  for (const importedProject of normalizedImport.projects) {
    const normalizedName = normalizeProjectName(importedProject.name);
    if (!projectIdMap.has(normalizedName)) {
      const newProject = { ...structuredClone(importedProject), id: createId() };
      state.projects.push(newProject);
      projectIdMap.set(normalizedName, newProject.id);
    } else {
      const existingProject = findProject(projectIdMap.get(normalizedName));
      if (existingProject && !existingProject.note && importedProject.note) {
        existingProject.note = importedProject.note;
      }
      if (existingProject && !normalizeHexColor(existingProject.color) && importedProject.color) {
        existingProject.color = importedProject.color;
      }
    }
  }

  const entryFingerprint = new Set(state.entries.map((entry) => createEntryFingerprint(entry)));
  for (const importedEntry of normalizedImport.entries) {
    const projectName = normalizedImport.projects.find((project) => project.id === importedEntry.projectId)?.name;
    const mappedProjectId = projectName ? projectIdMap.get(normalizeProjectName(projectName)) : importedEntry.projectId;
    const nextEntry = {
      ...structuredClone(importedEntry),
      id: createId(),
      projectId: mappedProjectId
    };
    const fingerprint = createEntryFingerprint(nextEntry);
    if (!entryFingerprint.has(fingerprint)) {
      state.entries.push(nextEntry);
      entryFingerprint.add(fingerprint);
    }
  }

  state.settings = {
    ...state.settings,
    roundingMinutes: parseRoundingMinutes(normalizedImport.settings?.roundingMinutes, state.settings.roundingMinutes),
    timerReminderEnabled: normalizedImport.settings?.timerReminderEnabled ?? state.settings.timerReminderEnabled,
    dailyGoalHours: normalizedImport.settings?.dailyGoalHours ?? state.settings.dailyGoalHours,
    weeklyGoalHours: normalizedImport.settings?.weeklyGoalHours ?? state.settings.weeklyGoalHours,
    lastDataExportAt: state.settings.lastDataExportAt
  };

  saveState();
}

function replaceStateFromImport(importedState) {
  const normalizedImport = normalizeState(importedState);
  replaceState({
    ...normalizedImport,
    settings: {
      ...normalizedImport.settings,
      lastDataExportAt: state.settings.lastDataExportAt
    }
  });
}

function createEntryFingerprint(entry) {
  return [entry.projectId, entry.start, entry.end, entry.note || "", entry.type || ""].join("|");
}

function createCsv(rows) {
  const headers = [
    t("date"),
    t("reportProject"),
    t("reportStart"),
    t("reportEnd"),
    t("reportHours"),
    t("reportDuration"),
    t("reportType"),
    t("reportNote")
  ];
  const lines = [
    headers,
    ...rows.map((row) => [row.date, row.project, row.start, row.end, row.durationHours, row.durationClock, row.type, row.note])
  ];

  return lines
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"))
    .join("\n");
}

function createMonthlyReportHtml(rows, label) {
  const chartData = buildChartDataFromRows(rows);
  const chartSvg = createChartSvgMarkup(chartData, "bar");
  const groupedByDay = new Map();
  for (const row of rows) {
    const items = groupedByDay.get(row.date) || [];
    items.push(row);
    groupedByDay.set(row.date, items);
  }

  const daySections = [...groupedByDay.entries()].map(([date, items]) => {
    const totalHours = items.reduce((sum, item) => sum + Number.parseFloat(item.durationHours.replace(",", ".")), 0);
    const list = items.map((item) => `
      <tr class="project-row" style="--project-color:${item.projectColor}">
        <td>${renderProjectLabelMarkup(item.project, item.projectColor)}</td>
        <td>${escapeHtml(item.start)}</td>
        <td>${escapeHtml(item.end)}</td>
        <td>${escapeHtml(item.durationClock)}</td>
        <td>${escapeHtml(item.note || "—")}</td>
      </tr>
    `).join("");
    return `
      <section>
        <h2>${escapeHtml(date)}</h2>
        <p>${escapeHtml(t("reportDayTotal"))}: ${escapeHtml(formatDuration(totalHours * 3600000))}</p>
        <table>
          <thead><tr><th>${escapeHtml(t("reportProject"))}</th><th>${escapeHtml(t("reportStart"))}</th><th>${escapeHtml(t("reportEnd"))}</th><th>${escapeHtml(t("reportDuration"))}</th><th>${escapeHtml(t("reportNote"))}</th></tr></thead>
          <tbody>${list}</tbody>
        </table>
      </section>
    `;
  }).join("");

  const projectSummary = summarizeRowsByProject(rows).map((item) => `
    <tr class="project-row summary-row" style="--project-color:${item.projectColor}">
      <td>${renderProjectLabelMarkup(item.project, item.projectColor)}</td>
      <td>${escapeHtml(item.durationClock)}</td>
      <td>${escapeHtml(item.durationHours)}</td>
    </tr>
  `).join("");

  return `<!doctype html>
<html lang="${escapeAttribute(getEffectiveLanguage())}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(t("reportTitle"))}</title>
  <style>
    body { font-family: Segoe UI, sans-serif; margin: 32px; color: #2d2218; }
    h1, h2 { margin-bottom: 12px; }
    .chart-wrap { margin: 24px 0 32px; padding: 16px; border: 1px solid #ddd; border-radius: 18px; background: #fffaf4; }
    .legend { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
    .legend-item { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border: 1px solid #ddd; border-radius: 12px; }
    .swatch { width: 14px; height: 14px; border-radius: 999px; flex: 0 0 auto; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
    th { text-transform: uppercase; font-size: 12px; letter-spacing: 0.06em; color: #6b5c4d; }
    .project-row td:first-child { border-left: 6px solid var(--project-color); }
    .project-label { display: inline-flex; align-items: center; gap: 10px; font-weight: 600; }
  </style>
</head>
<body>
  <h1>${escapeHtml(t("reportTitle"))}</h1>
  <p>${escapeHtml(t("reportPeriod"))}: ${escapeHtml(label)}</p>
  <h2>${escapeHtml(t("reportProjectSummary"))}</h2>
  <table>
    <thead><tr><th>${escapeHtml(t("reportProject"))}</th><th>${escapeHtml(t("reportDuration"))}</th><th>${escapeHtml(t("reportHours"))}</th></tr></thead>
    <tbody>${projectSummary}</tbody>
  </table>
  ${daySections}
  <div class="chart-wrap">
    <h2>${escapeHtml(t("reportStatistics"))}</h2>
    ${chartSvg}
    <div class="legend">${createChartLegendMarkup(chartData)}</div>
  </div>
</body>
</html>`;
}

function renderProjectLabelMarkup(projectName, projectColor) {
  const color = normalizeHexColor(projectColor) || getFallbackProjectColor(projectName);
  return `<span class="project-label"><span class="swatch" style="background:${color}"></span>${escapeHtml(projectName)}</span>`;
}


function getSelectedRange() {
  const type = elements.exportRangeType.value;
  const now = new Date();

  if (type === "day") {
    const date = new Date(elements.exportDay.value || now);
    return {
      kind: "day",
      start: startOfDay(date),
      end: endOfDay(date),
      label: `${t("day")} ${toDateInputValue(date)}`,
      fileStamp: toDateInputValue(date)
    };
  }

  if (type === "week") {
    const [year, week] = (elements.exportWeek.value || toWeekInputValue(now)).split("-W").map(Number);
    const start = isoWeekToDate(year, week);
    return {
      kind: "week",
      start,
      end: endOfWeek(start),
      label: `${t("week")} ${year}-W${String(week).padStart(2, "0")}`,
      fileStamp: `${year}-W${String(week).padStart(2, "0")}`
    };
  }

  if (type === "customMonth") {
    const [year, month] = (elements.exportMonth.value || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).split("-").map(Number);
    const customMonthDate = new Date(year, month - 1, 1);
    return {
      kind: "month",
      start: startOfMonth(customMonthDate),
      end: endOfMonth(customMonthDate),
      label: `${t("month")} ${customMonthDate.getFullYear()}-${String(customMonthDate.getMonth() + 1).padStart(2, "0")}`,
      fileStamp: `${customMonthDate.getFullYear()}-${String(customMonthDate.getMonth() + 1).padStart(2, "0")}`
    };
  }

  return {
    kind: "month",
    start: startOfMonth(now),
    end: endOfMonth(now),
    label: `${t("month")} ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    fileStamp: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  };
}

function getExportProjectFilter() {
  return elements.exportScopeSelect.value === "single" ? elements.exportProjectSelect.value : null;
}

function isMonthlyWorkbookMode(range) {
  return elements.exportFormatSelect.value === "excel"
    && elements.exportScopeSelect.value === "all"
    && range.kind === "month";
}

function buildExportRows(rangeStart, rangeEnd, projectIdFilter = null) {
  return state.entries
    .filter((entry) => entry.end)
    .filter((entry) => !projectIdFilter || entry.projectId === projectIdFilter)
    .map((entry) => clipEntryToRange(entry, rangeStart, rangeEnd))
    .filter(Boolean)
    .sort((left, right) => new Date(left.start) - new Date(right.start))
    .map((entry) => {
      const project = findProject(entry.projectId);
      const durationMs = getDurationMs(entry);
      return {
        date: toDateInputValue(new Date(entry.start)),
        project: project?.name || t("unknownProject"),
        projectColor: getProjectColor(entry.projectId),
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

function createSpreadsheetXml(rows, label, includeProjectSheets = false) {
  const totalHours = rows.reduce((sum, row) => sum + Number.parseFloat(row.durationHours.replace(",", ".")), 0);
  const chartData = buildChartDataFromRows(rows);
  const { styleMap, stylesMarkup } = createSpreadsheetProjectStyles(rows, chartData);
  const dataRows = rows.map((row) => `
    <Row>
      <Cell><Data ss:Type="String">${escapeXml(row.date)}</Data></Cell>
      <Cell${getSpreadsheetStyleAttribute(row.projectColor, styleMap)}><Data ss:Type="String">${escapeXml(row.project)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(row.start)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(row.end)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(row.durationHours)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(row.durationClock)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(row.type)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(row.note)}</Data></Cell>
    </Row>`).join("");

  const summaryRows = summarizeRowsByProject(rows).map((item) => `
    <Row>
      <Cell${getSpreadsheetStyleAttribute(item.projectColor, styleMap)}><Data ss:Type="String">${escapeXml(item.project)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(item.durationClock)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(item.durationHours)}</Data></Cell>
    </Row>`).join("");

  const statisticRows = chartData.map((item) => `
    <Row>
      <Cell${getSpreadsheetStyleAttribute(item.color, styleMap)}><Data ss:Type="String">${escapeXml(item.name)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(formatDuration(item.durationMs))}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml((item.durationMs / 3600000).toFixed(2).replace(".", ","))}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(item.percent)}</Data></Cell>
    </Row>`).join("");

  const projectSheets = includeProjectSheets
    ? summarizeRowsIntoSheets(rows, styleMap)
    : "";

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" />
      <Interior ss:Color="#efe6da" ss:Pattern="Solid" />
    </Style>
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="12" />
    </Style>
    ${stylesMarkup}
  </Styles>
  <Worksheet ss:Name="${escapeXml(t("timesSection"))}">
    <Table>
      <Row>
        <Cell ss:StyleID="Title"><Data ss:Type="String">${escapeXml(t("reportTitle"))}</Data></Cell>
        <Cell ss:StyleID="Title"><Data ss:Type="String">${escapeXml(label)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("date"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportProject"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportStart"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportEnd"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportHours"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportDuration"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportType"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportNote"))}</Data></Cell>
      </Row>
      ${dataRows}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="${escapeXml(t("reportProjectSummary"))}">
    <Table>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportProject"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportDuration"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportHours"))}</Data></Cell>
      </Row>
      ${summaryRows}
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportTotal"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(formatDuration(totalHours * 3600000))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(totalHours.toFixed(2).replace(".", ","))}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
  <Worksheet ss:Name="${escapeXml(t("reportStatistics"))}">
    <Table>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportProject"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportDuration"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportHours"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportShare"))}</Data></Cell>
      </Row>
      ${statisticRows}
    </Table>
  </Worksheet>
  ${projectSheets}
</Workbook>`;
}

function summarizeRowsByProject(rows) {
  const totals = new Map();

  for (const row of rows) {
    const hours = Number.parseFloat(row.durationHours.replace(",", "."));
    const current = totals.get(row.project) || {
      project: row.project,
      projectColor: row.projectColor || getFallbackProjectColor(row.project),
      hours: 0
    };
    current.hours += hours;
    totals.set(row.project, current);
  }

  return [...totals.values()]
    .sort((left, right) => left.project.localeCompare(right.project, "de"))
    .map((item) => ({
      project: item.project,
      projectColor: item.projectColor,
      durationHours: item.hours.toFixed(2).replace(".", ","),
      durationClock: formatDuration(item.hours * 3600000)
    }));
}

function summarizeRowsIntoSheets(rows, styleMap) {
  const rowsByProject = new Map();
  for (const row of rows) {
    const items = rowsByProject.get(row.project) || [];
    items.push(row);
    rowsByProject.set(row.project, items);
  }

  return [...rowsByProject.entries()].map(([project, projectRows]) => {
    const safeName = project.replace(/[\\/*?:[\]]/g, "").slice(0, 28) || t("reportProject");
    const projectColor = projectRows[0]?.projectColor || getFallbackProjectColor(project);
    const dataRows = projectRows.map((row) => `
      <Row>
        <Cell><Data ss:Type="String">${escapeXml(row.date)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(row.start)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(row.end)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(row.durationClock)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(row.note)}</Data></Cell>
      </Row>`).join("");

    return `
  <Worksheet ss:Name="${escapeXml(safeName)}">
    <Table>
      <Row>
        <Cell${getSpreadsheetStyleAttribute(projectColor, styleMap)}><Data ss:Type="String">${escapeXml(project)}</Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("date"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportStart"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportEnd"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportDuration"))}</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(t("reportNote"))}</Data></Cell>
      </Row>
      ${dataRows}
    </Table>
  </Worksheet>`;
  }).join("");
}

function createSpreadsheetProjectStyles(rows, chartData) {
  const colors = [...new Set([
    ...rows.map((row) => normalizeHexColor(row.projectColor)).filter(Boolean),
    ...chartData.map((item) => normalizeHexColor(item.color)).filter(Boolean)
  ])];
  const styleMap = new Map();
  const stylesMarkup = colors.map((color, index) => {
    const styleId = `ProjectColor${index + 1}`;
    styleMap.set(color, styleId);
    return `
    <Style ss:ID="${styleId}">
      <Font ss:Bold="1" ss:Color="${getReadableTextColor(color)}" />
      <Interior ss:Color="${color}" ss:Pattern="Solid" />
    </Style>`;
  }).join("");
  return { styleMap, stylesMarkup };
}

function getSpreadsheetStyleAttribute(color, styleMap) {
  const normalized = normalizeHexColor(color);
  if (!normalized) {
    return "";
  }
  const styleId = styleMap.get(normalized);
  return styleId ? ` ss:StyleID="${styleId}"` : "";
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
  return new Intl.DateTimeFormat(getLocaleForFormatting(), {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function getLocaleForFormatting() {
  const language = getEffectiveLanguage();
  if (language === "fr") {
    return "fr-FR";
  }
  if (language === "en") {
    return "en-US";
  }
  return "de-DE";
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

function escapeAttribute(value) {
  return escapeHtml(value);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then((registration) => {
        serviceWorkerRegistration = registration;
      })
      .catch(() => {
        // Registrierung darf die App nicht blockieren.
      });
  });
}
