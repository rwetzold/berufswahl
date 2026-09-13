import fs from "node:fs";
fs.mkdirSync("output/research", { recursive: true });
const careers = JSON.parse(fs.readFileSync("src/careers.json"));
for (const c of careers) {
  const file = `output/research/futuromat-${c.id}.json`;
  try {
    let d;
    if (fs.existsSync(file)) d = JSON.parse(fs.readFileSync(file));
    else {
      const r = await fetch(
        `https://job-futuromat.iab.de/api/job/${c.dkz}/groupsummary`,
        { signal: AbortSignal.timeout(20000) },
      );
      if (!r.ok) throw Error(r.status);
      d = await r.json();
      fs.writeFileSync(file, JSON.stringify(d, null, 2));
    }
    const offer = d.offers?.years
      ?.filter((x) => Number.isFinite(x.offers) && x.offers >= 0)
      .at(-1);
    const employed = d.employees?.years?.find((x) => x.year === offer?.year);
    c.demand =
      offer && employed?.employees > 0
        ? {
            year: Number(offer.year),
            offers: offer.offers,
            employees: employed.employees,
            perHundred: (100 * offer.offers) / employed.employees,
            group: d.offers.groupname,
            source: `https://job-futuromat.iab.de/?job=${c.dkz}`,
          }
        : null;
    const groupFile =
      "output/research/" +
      `dkz-rest/pc/v1/kldb2010?codenr=${encodeURIComponent(c.kldb)}&zustand.id=S`.replaceAll(
        /[^a-z0-9]/gi,
        "_",
      ) +
      ".json";
    const group = JSON.parse(fs.readFileSync(groupFile))._embedded
      .berufssystematiken[0];
    c.group = group.bezeichnungNeutral;
    c.evidence.group = c.group;
    console.log(
      c.id,
      c.demand?.year,
      c.demand?.offers,
      c.demand?.perHundred?.toFixed(2),
    );
  } catch (e) {
    console.log(c.id, e.message);
  }
}
fs.writeFileSync("src/careers.json", JSON.stringify(careers, null, 2) + "\n");
