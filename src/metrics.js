export const populationBounds = [
  5000, 10000, 25000, 50000, 100000, 200000, 400000, 700000, 1000000,
];
export const salaryBounds = [
  2000, 2750, 3500, 4250, 5000, 5750, 6500, 7250, 8000,
];
export function band(value, bounds) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value) ||
    value < 0
  )
    return null;
  const i = bounds.findIndex((b) => value <= b);
  return i < 0 ? 10 : i + 1;
}
export function trainingBand(years) {
  return Number.isFinite(years) && years >= 0
    ? Math.max(1, Math.min(10, Math.ceil(years)))
    : null;
}
export const demandBounds = [0.5, 1, 2, 3, 4, 5, 6, 8, 10];
export function demandBand(perHundred) {
  return band(perHundred, demandBounds);
}
export const number = (n) =>
  new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(n);
export const missing = "Keine verlässliche Angabe";
const editorial =
  "Redaktionelle Einschätzung, September 2026. Keine amtliche Messzahl; Anforderungen unterscheiden sich nach Arbeitsplatz. 1–2 sehr gering, 3–4 eher gering, 5–6 mittel, 7–8 hoch, 9–10 sehr hoch.";
export function metrics(c) {
  const evidence = `${c.evidence?.group ?? ""}. ${c.evidence?.scope ?? ""} Datenjahr ${c.evidence?.year ?? "unbekannt"}.`;
  return [
    {
      key: "employed",
      label: "Menschen im Beruf",
      score: band(c.employed, populationBounds),
      value: c.employed
        ? `${number(c.employed)} in der Vollzeit-Berufsgruppe`
        : missing,
      info: `${evidence} Dies ist nicht die Gesamtzahl aller Menschen in diesem Einzelberuf.`,
      source: c.evidence?.source,
    },
    {
      key: "salary",
      label: "Gehalt",
      score: band(c.salary, salaryBounds),
      value: c.salary
        ? `${c.salaryCapped ? "> " : ""}${number(c.salary)} € brutto / Monat`
        : missing,
      info: `Brutto bedeutet vor Steuern und Abgaben. Median: Die eine Hälfte verdient weniger, die andere mehr. ${evidence} ${c.salaryCapped ? "Wert an der Meldegrenze; kein exakter Median." : ""}`,
      source: c.evidence?.source,
    },
    {
      key: "demand",
      label: `Aktuell gesucht${c.demand ? " · " + c.demand.year : ""}`,
      score: demandBand(c.demand?.perHundred),
      value: c.demand
        ? `${number(c.demand.offers)} gemeldete Stellen (${c.demand.year})`
        : missing,
      info: c.demand
        ? `${number(c.demand.perHundred)} gemeldete Stellen je 100 sozialversicherungspflichtig Beschäftigte (${number(c.demand.employees)}) in der Berufsgruppe „${c.demand.group}“. Jahresdurchschnitt laut IAB / BA, letzter dort verfügbarer Stand. Eine Näherung der Nachfrage, kein amtlicher Engpasswert: Nicht alle Stellen werden gemeldet, und Personalwechsel beeinflussen die Zahl. Hoher Wert bedeutet mehr gemeldete Stellen relativ zur Gruppengröße, nicht automatisch bessere Einstellungschancen.`
        : "Für diese Berufsgruppe liegt hier keine vergleichbare Stellenstatistik vor. Fehlende Daten bedeuten nicht, dass der Beruf nicht gesucht ist.",
      source: c.demand?.source ?? "https://job-futuromat.iab.de/",
    },
    {
      key: "future",
      label: "Zukunftssicherheit",
      score: c.scores.future,
      value: `${c.scores.future}/10 · Einschätzung`,
      info: `${c.futureReason} Blick auf die nächsten 10–15 Jahre; keine Garantie. Redaktionelle Einschätzung vom September 2026 auf Basis von Berufsaufgaben und IAB-Forschung, keine IAB-Bewertung dieses Berufs.`,
      source: "https://iab.de/publikationen/publikation/?id=15227157",
    },
    {
      key: "training",
      label: "Ausbildungsdauer",
      score: trainingBand(c.training.years),
      value: `${number(c.training.years)} Jahre · Beispielweg`,
      info: `${c.training.path} Schuljahre zählen nicht mit. Länger bedeutet nicht besser.`,
      source: c.source,
    },
    {
      key: "learning",
      label: "Lernen für den Beruf",
      score: c.scores.learning,
      value: `${c.scores.learning}/10 · Einschätzung`,
      info: `Du lernst: ${c.tasks.join(", ")}. ${c.training.path} Bewertet werden Stoffumfang, Theorie und praktische Komplexität. ${editorial}`,
      source: c.source,
    },
    {
      key: "physical",
      label: "Körperliche Belastung",
      score: c.scores.physical,
      value: `${c.scores.physical}/10 · Einschätzung`,
      info: `Arbeitsumfeld: ${c.environment.join(", ")}. ${c.challenge} Bewertet werden Bewegung, Kraftaufwand und Körperhaltung. ${editorial}`,
      source: c.source,
    },
    {
      key: "mental",
      label: "Geistige & emotionale Belastung",
      score: c.scores.mental,
      value: `${c.scores.mental}/10 · Einschätzung`,
      info: `${c.challenge} Bewertet werden Konzentration, Zeitdruck, Verantwortung und emotionale Anforderungen. ${editorial}`,
      source: c.source,
    },
  ];
}
