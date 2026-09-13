import fs from "node:fs";
fs.mkdirSync("output/research", { recursive: true });
const headers = { "X-API-Key": "infosysbub-ega" };
const base = "https://rest.arbeitsagentur.de/infosysbub/";
const ids = {
  hausarzt: 8652,
  pflege: 132173,
  physio: 8747,
  hebamme: 8838,
  apotheke: 58682,
  tierarzt: 58781,
  lehrkraft: 59476,
  erzieher: 9159,
  sozialarbeit: 58775,
  psychotherapie: 118890,
  logopaedie: 8758,
  heilerziehung: 9127,
  tischler: 4458,
  elektronik: 15637,
  shk: 15164,
  maler: 15531,
  maurer: 3935,
  dachdecker: 129405,
  kfz: 14798,
  industriemechanik: 29056,
  mechatronik: 2862,
  physiklabor: 6349,
  maschinenbau: 58731,
  lebensmittel: 3897,
  landwirt: 271,
  garten: 585,
  forst: 726,
  tierpflege: 13931,
  abwasser: 138722,
  biolabor: 6318,
  koch: 3722,
  baecker: 3623,
  konditor: 3652,
  hotel: 10006,
  restaurant: 136125,
  sport: 14618,
  einzelhandel: 6565,
  buero: 123265,
  optik: 2629,
  steuer: 7572,
  anwalt: 8241,
  journalismus: 8293,
  software: 13659,
  systemintegration: 7817,
  mediengestaltung: 57882,
  fotografie: 76792,
  produktdesign: 33219,
  architektur: 15706,
  lok: 136200,
  bauingenieur: 59332,
  lkw: 14717,
  lager: 27449,
  bibliothek: 8326,
  veranstaltung: 129456,
  polizei: 8157,
  feuerwehr: 8176,
  rettung: 122461,
  verwaltung: 7896,
  friseur: 9907,
  reinigung: 10233,
};
const careers = JSON.parse(fs.readFileSync("src/careers.json"));
async function get(path) {
  const file =
    "output/research/" + path.replaceAll(/[^a-z0-9]/gi, "_") + ".json";
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file));
  const r = await fetch(base + path, { headers });
  if (!r.ok) throw Error(`${r.status}: ${path}`);
  const d = await r.json();
  fs.writeFileSync(file, JSON.stringify(d, null, 2));
  return d;
}
const dataset = await get("entgeltatlas/pc/v1/dataset");
for (const c of careers) {
  c.id = c.id.trim();
  try {
    const b = await get(`dkz-rest/pc/v1/berufe/${ids[c.id]}`);
    c.sourceTitle = b.kurzBezeichnungNeutral;
    c.dkz = b.id;
    c.kldb = b.kldb2010;
    if (!c.kldb) {
      console.log("NO KLDB", c.id, b);
      continue;
    }
    const k = c.kldb.slice(2),
      level = Number(k.at(-1));
    const group = await get(
      `dkz-rest/pc/v1/kldb2010?codenr=${encodeURIComponent(c.kldb)}&zustand.id=S`,
    );
    c.group =
      group._embedded?.berufssystematiken?.[0]?.bezeichnungNeutral ?? c.kldb;
    const data = await get(
      `entgeltatlas/pc/v1/entgelte/${k}?l=${level}&r=1&a=1&b=1`,
    );
    c.evidence = {
      year: dataset.year,
      retrieved: "2026-09-13",
      source: `https://web.arbeitsagentur.de/entgeltatlas/beruf/${b.id}`,
      group: c.group,
      scope:
        "Sozialversicherungspflichtig Vollzeitbeschäftigte der Berufsgruppe (ohne Auszubildende). Teilzeit, Selbstständige und Beamte sind nicht enthalten.",
    };
    const all = data.find((d) => d.gender.id === 1),
      men = data.find((d) => d.gender.id === 2),
      women = data.find((d) => d.gender.id === 3);
    c.salary = all?.entgelt > 0 ? all.entgelt : null;
    c.salaryCapped = c.salary >= 8050;
    c.employed = all?.besetzung > 0 ? all.besetzung : null;
    c.gender =
      men?.besetzung > 0 && women?.besetzung > 0
        ? { men: men.besetzung, women: women.besetzung }
        : null;

    c.source = `https://web.arbeitsagentur.de/berufenet/beruf/${b.id}`;
    console.log(
      c.id,
      b.kurzBezeichnungNeutral,
      k,
      c.salary,
      c.employed,
      c.gender ? "gender" : "-",
    );
  } catch (e) {
    console.log("ERROR", c.id, e.message);
  }
}
fs.writeFileSync("src/careers.json", JSON.stringify(careers, null, 2) + "\n");
