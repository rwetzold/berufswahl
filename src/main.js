import "./styles.css";
import careers from "./careers.json";
import { pageContent } from "./appContent.js";
import { createRankingSession } from "./ranking.js";
import { shuffleCareers } from "./shuffle.js";
import { chooseWithHistory, stepBackSession, canStepBack } from "./undo.js";
import { loadProgress, saveProgress } from "./persistence.js";
import {
  metrics,
  number,
  missing,
  populationBounds,
  salaryBounds,
} from "./metrics.js";
const app = document.querySelector("#app");
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}
const loaded = loadProgress(storage, careers);
let session = loaded?.session ?? createRankingSession(shuffleCareers(careers));
let history = loaded?.history ?? [];
let saved = saveProgress(storage, session, history);
const link = (url, label) =>
  url
    ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`
    : "";
function imageCredit(c) {
  return c.image.kind === "generated"
    ? "KI-generiertes Tätigkeitsbild · OpenAI Imagegen · September 2026. Beispielhafte Szene, keine Aufnahme eines echten Arbeitsplatzes."
    : `Foto: ${esc(c.image.author)} · ${link(c.image.source, c.image.title)} · ${link(c.image.licenseUrl, c.image.license)}`;
}
function photo(c, small = false) {
  return c.image
    ? `<img class="career-photo${small ? " small" : ""}" src="${import.meta.env.BASE_URL}${esc(c.image.path)}?v=${esc(c.image.version ?? "1")}" alt="${esc(c.image.alt)}" width="768" height="512" loading="lazy" decoding="async">`
    : `<div class="photo-missing">Foto noch nicht verfügbar</div>`;
}
function bars(score) {
  return `<span class="segments" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<i class="${i < score ? "filled" : ""}"></i>`).join("")}</span>`;
}
function renderMetrics(c) {
  return `<div class="metrics">${metrics(c)
    .map(
      (m) =>
        `<details class="metric ${m.key}"><summary><span class="metric-label">${esc(m.label)} <span class="info-dot" aria-hidden="true">i</span></span><span class="metric-visual">${m.score === null ? `<span class="unavailable">${missing}</span>` : bars(m.score) + `<b>${m.score}<small>/10</small></b>`}</span><span class="sr-only">${esc(m.value)}. Erklärung öffnen</span></summary><div class="metric-info"><strong>${esc(m.value)}</strong><p>${esc(m.info)}</p>${link(m.source, "Quelle ansehen")}</div></details>`,
    )
    .join("")}${gender(c)}</div>`;
}
function gender(c) {
  const g = c.gender;
  const men = g ? Math.round((100 * g.men) / (g.men + g.women)) : null;
  return `<details class="metric gender"><summary><span class="metric-label">Männer / Frauen <span class="info-dot" aria-hidden="true">i</span></span>${g ? `<span class="gender-bar" aria-hidden="true"><i style="width:${men}%"></i></span><span class="gender-labels">${men}% Männer · ${100 - men}% Frauen</span>` : `<span class="unavailable">${missing}</span>`}</summary><div class="metric-info">${g ? `<strong>${number(g.men)} Männer · ${number(g.women)} Frauen</strong><p>Anteile unter den ausgewiesenen Männern und Frauen in der Vollzeit-Berufsgruppe, ${c.evidence.year}. ${esc(c.evidence.group)}. ${esc(c.evidence.scope)} Andere Geschlechtseinträge werden hier nicht gesondert ausgewiesen. Alle Berufe stehen Menschen unabhängig vom Geschlecht offen.</p>` : "<p>Keine ausreichend vollständigen veröffentlichten Angaben für diese Gruppe. Das ist keine Aussage darüber, wer diesen Beruf ausüben kann.</p>"}${link(c.evidence?.source, "Datenquelle")}</div></details>`;
}
function more(c) {
  return `<details class="more"><summary>Mehr über diesen Beruf <span aria-hidden="true">＋</span></summary><div class="more-content"><h3>So könnte ein Arbeitstag aussehen</h3><p class="muted">Ein Beispiel – jeder Arbeitsplatz ist anders.</p><ol class="day"><li><strong>Zum Start</strong>${esc(c.day[0])}</li><li><strong>Mittendrin</strong>${esc(c.day[1])} Pausen gehören dazu.</li><li><strong>Zum Abschluss</strong>${esc(c.day[2])}</li></ol><h3>Arbeitszeiten</h3><p>${esc(c.hours ?? "Je nach Arbeitsplatz überwiegend tagsüber; Termine und betriebliche Abläufe können die Zeiten verändern.")}</p><h3>Dein Weg in den Beruf</h3><p>${esc(c.training.path)}</p><div class="two-facts"><section><h3>Das kann schön sein</h3><p>${esc(c.joy)}</p></section><section><h3>Das kann fordern</h3><p>${esc(c.challenge)}</p></section></div><section class="try-it"><span class="eyebrow">Kleine Entdeckeraufgabe</span><h3>Probier eine Idee aus</h3><p>${esc(c.tryIt)}</p></section><div class="sources"><h3>Quellen & Bildnachweis</h3><p>${link(c.source, "Berufsprofil der Bundesagentur für Arbeit")} · ${link(c.evidence?.source, "Entgeltatlas 2025")}</p>${c.image ? `<p>${imageCredit(c)}</p>` : ""}<p>Texte und Einschätzungen: Redaktion „Berufe entdecken“, September 2026.</p></div></div></details>`;
}
function card(c) {
  return `<article class="career-card"><div class="photo-wrap"><button class="photo-button" data-photo="${esc(c.id)}" aria-label="Bild von ${esc(c.title)} vergrößern">${photo(c)}${c.image?.kind === "generated" ? '<span class="ai-label">KI-Bild</span>' : ""}<span class="zoom-label">⤢ Vergrößern</span></button><span class="category">${esc(c.category)}</span></div><div class="card-body"><h2>${esc(c.title)}</h2><p class="career-description">${esc(c.description)}</p><div class="environment">${c.environment.map((e, i) => `<span><span aria-hidden="true">${i ? "✦" : "⌂"}</span> ${esc(e)}</span>`).join("")}</div><ul class="tasks">${c.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><button class="choice-button" data-choice="${esc(c.id)}">${pageContent.primaryAction} <span aria-hidden="true">↗</span></button><p class="metric-hint">1–10 heißt „mehr“, nicht automatisch „besser“.<br>Tippe eine Anzeige an, um mehr zu erfahren.</p>${renderMetrics(c)}${more(c)}</div></article>`;
}
function ranking() {
  return `<section class="ranking" aria-labelledby="ranking-title"><div class="section-heading"><div><span class="eyebrow">Deine Entdeckungen</span><h2 id="ranking-title">${session.isComplete ? "Deine Favoritenliste" : "Deine Liste wächst"}</h2></div><span class="pill">${session.isComplete ? "Alle 60 entdeckt" : session.ranked.length + " einsortiert"}</span></div>${session.ranked.length ? `<ol class="ranking-list">${session.ranked.map((c, i) => `<li><details class="rank-detail"><summary><span class="rank-number">${i + 1}</span>${photo(c, true)}<span class="rank-name"><strong>${esc(c.title)}</strong><small>${esc(c.category)}</small></span><span aria-hidden="true">＋</span></summary><div class="rank-content"><p>${esc(c.description)}</p><ul>${c.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>${renderMetrics(c)}${more(c)}</div></details></li>`).join("")}</ol>` : '<div class="empty-list"><span aria-hidden="true">✧</span><p>Deine erste Entscheidung ist der Anfang.<br>Hier entsteht nach und nach deine persönliche Liste.</p></div>'}<p class="muted">${session.isComplete ? "" : "Zwischenstand: Noch nicht alle Berufe sind einsortiert. "}Deine Liste zeigt, was dich gerade interessiert. Sie misst keine berufliche Eignung.</p></section>`;
}
function render(moveFocus = false) {
  app.innerHTML = `<div class="app-shell"><nav class="topbar" aria-label="Seitennavigation"><a class="brand" href="#"><span class="brand-mark" aria-hidden="true">✳</span> Berufe entdecken</a><a class="about-link" href="#about">Über die Zahlen <span aria-hidden="true">↗</span></a></nav><header class="hero"><div><span class="eyebrow">Deine Zukunft hat viele Möglichkeiten</span><h1>Was steckt<br><span>in deiner Zukunft?</span></h1><p>${pageContent.description}<br>Entdecke, was du gerne einmal ausprobieren würdest.</p></div><div class="hero-art" aria-hidden="true"><span class="orbit a">✦</span><span class="orbit b">↗</span><span class="orbit c">?</span><div class="hero-stamp"><strong>60</strong><span>Berufe entdecken</span></div></div></header><section class="progress-panel" aria-label="Dein Fortschritt"><div class="progress-copy" role="status"><strong>${session.ranked.length} <span>von 60 Berufen einsortiert</span></strong><small>${session.comparisons} Vergleiche · ${saved ? "Fortschritt auf diesem Gerät gespeichert" : "Speichern nicht möglich – halte diesen Tab geöffnet"}</small></div><progress value="${session.ranked.length}" max="60" aria-label="Berufe einsortiert"></progress><div class="progress-actions"><button data-undo ${canStepBack(session, history) ? "" : "disabled"}>↶ Schritt zurück</button><button data-reset>Neu starten</button></div></section><section class="duel" aria-labelledby="duel-title"><div class="duel-heading"><span class="eyebrow">${session.isComplete ? "Geschafft!" : "Folge deiner Neugier"}</span><h2 id="duel-title" tabindex="-1">${session.isComplete ? "Deine Favoritenliste steht." : "Welchen Beruf würdest du lieber einmal ausprobieren?"}</h2><p>${session.isComplete ? "Schau dir deine Favoriten an und sprich mit jemandem darüber." : "Es gibt kein Richtig oder Falsch. Du kannst jederzeit eine Pause machen."}</p></div>${session.isComplete ? "" : `<div class="career-grid">${session.currentPair.map(card).join("")}</div>`}</section>${ranking()}<details class="about" id="about"><summary>Über die Zahlen, Quellen & Datenschutz</summary><div><h2>Orientierung statt Noten</h2><p>Die Balken vergleichen feste Maßstäbe. Eine längere Ausbildung oder stärkere Belastung ist nicht besser. Deine Auswahl allein bestimmt die Rangliste.</p><p>Gehalt, Menschen im Beruf und Geschlechterverteilung beziehen sich auf die jeweilige Vollzeit-Berufsgruppe der Bundesagentur für Arbeit. Das sind nicht alle Erwerbstätigen dieses einzelnen Berufs. Selbstständige, Beamte, Teilzeitkräfte und Auszubildende fehlen in diesen Zahlen. Datenstand: Entgeltatlas 2025, abgerufen am 13. September 2026.</p><p>Gehalt: Stufenobergrenzen ${salaryBounds.map(number).join(" / ")} €; darüber Stufe 10. Beschäftigte: ${populationBounds.map(number).join(" / ")}; darüber Stufe 10. Ausbildungsdauer: aufgerundete Jahre, maximal Stufe 10. Bei unterschiedlichen Wegen steht ein erklärtes Beispiel.</p><p>Lernen, Belastungen und Zukunftssicherheit sind redaktionelle Einschätzungen, keine wissenschaftlich validierten Tests. 1–2 bedeutet sehr gering, 3–4 eher gering, 5–6 mittel, 7–8 hoch, 9–10 sehr hoch. Zukunftssicherheit betrachtet Aufgaben und KI-Veränderungen über 10–15 Jahre. Automatisierbare Aufgaben bedeuten nicht automatisch, dass ein Beruf verschwindet.</p><p>„Aktuell gesucht“ zeigt gemeldete Stellen je 100 sozialversicherungspflichtig Beschäftigte einer Berufsgruppe, nach dem letzten verfügbaren IAB-Datenstand 2024. Das ist eine Nachfrage-Näherung, kein amtlicher Engpasswert und keine Live-Stellenbörse. Stufenobergrenzen: 0,5 / 1 / 2 / 3 / 4 / 5 / 6 / 8 / 10 Stellen pro 100 Beschäftigte; darüber Stufe 10. Nicht alle Stellen sind gemeldet, Personalwechsel beeinflussen den Wert. Fehlende Werte werden nicht geschätzt.</p><p>${link("https://www.arbeitsagentur.de/hilfe-entgeltatlas", "Methodik Entgeltatlas")} · ${link("https://iab.de/publikationen/publikation/?id=15227157", "IAB: KI-Szenarien")} · ${link("https://github.com/rwetzold/berufswahl", "Quellcode & vollständige Dokumentation")}</p><h3>Deine Entscheidungen bleiben bei dir</h3><p>Keine Anmeldung, keine Analyse-Tracker. Dein Fortschritt wird nur im lokalen Browserspeicher gespeichert. Beim Löschen der Browserdaten geht er verloren. Die Website und Bilder werden von GitHub Pages ausgeliefert; externe Quellen öffnen sich erst beim Anklicken.</p></div></details><footer>Mit Neugier gemacht. <span>Robert Wetzold & Anton Wetzold · MIT-Lizenz</span></footer><dialog id="image-dialog" class="image-dialog" aria-labelledby="image-title"></dialog><dialog id="reset-dialog" aria-labelledby="reset-title"><h2 id="reset-title">Noch einmal neu entdecken?</h2><p>Deine aktuelle Liste wird durch einen neuen, zufällig gemischten Durchlauf ersetzt.</p><div class="dialog-actions"><button data-cancel>Liste behalten</button><button class="choice-button" data-confirm>Neu starten</button></div></dialog></div>`;
  if (moveFocus)
    document.querySelector("#duel-title").focus({ preventScroll: true });
}
app.addEventListener("click", (e) => {
  if(e.target.closest(".about-link")) document.querySelector("#about").open=true;
  const photoButton = e.target.closest("[data-photo]");
  if (photoButton) {
    const c = careers.find((c) => c.id === photoButton.dataset.photo);
    if (c?.image) {
      const d = document.querySelector("#image-dialog");
      d.innerHTML = `<header><h2 id="image-title">${esc(c.title)}</h2><button data-close-photo autofocus>Schließen ✕</button></header><img src="${import.meta.env.BASE_URL}${esc(c.image.path)}?v=${esc(c.image.version ?? "1")}" alt="${esc(c.image.alt)}"><p class="image-credit">${imageCredit(c)}</p>`;
      d.showModal();
    }
    return;
  }
  if (e.target.closest("[data-close-photo]"))
    document.querySelector("#image-dialog").close();
  const choice = e.target.closest("[data-choice]");
  if (choice) {
    const next = chooseWithHistory(session, history, choice.dataset.choice);
    if (next.changed) {
      session = next.session;
      history = next.history;
      saved = saveProgress(storage, session, history);
      render(true);
      document.querySelector(".duel").scrollIntoView({ block: "start" });
    }
    return;
  }
  if (e.target.closest("[data-undo]")) {
    const next = stepBackSession(session, history);
    session = next.session;
    history = next.history;
    saved = saveProgress(storage, session, history);
    render(true);
  }
  if (e.target.closest("[data-reset]"))
    document.querySelector("#reset-dialog").showModal();
  if (e.target.closest("[data-cancel]"))
    document.querySelector("#reset-dialog").close();
  if (e.target.closest("[data-confirm]")) {
    session = createRankingSession(shuffleCareers(careers));
    history = [];
    saved = saveProgress(storage, session, history);
    render(true);
  }
});
app.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const detail = e.target.closest("details");
    if (detail) {
      detail.open = false;
      detail.querySelector("summary").focus();
    }
  }
});
render();
