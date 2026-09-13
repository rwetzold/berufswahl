// Keep only established preferences. A new comparison never asks about an
// ordering that is already implied by previous choices.
export function createRankingSession(careers) {
  return restoreRankingSession(Array.isArray(careers) ? careers : [], {});
}

export function restoreRankingSession(careers, state) {
  const {
    baseRelations = [],
    baseSeen = [],
    baseComparisons = 0,
    decisions = [],
  } = state;
  const ids = careers.map((c) => c.id);
  const index = new Map(ids.map((id, i) => [id, i]));
  if (
    index.size !== ids.length ||
    !Number.isInteger(baseComparisons) ||
    baseComparisons < 0 ||
    !Array.isArray(baseSeen) ||
    new Set(baseSeen).size !== baseSeen.length ||
    baseSeen.some((id) => !index.has(id)) ||
    !Array.isArray(baseRelations) ||
    !Array.isArray(decisions)
  )
    throw Error("Invalid ranking state");
  const relations = [...baseRelations, ...decisions];
  if (
    relations.some(
      (pair) =>
        !Array.isArray(pair) ||
        pair.length !== 2 ||
        pair[0] === pair[1] ||
        pair.some((id) => !index.has(id)),
    )
  )
    throw Error("Invalid preference");
  const n = ids.length;
  const reach = Array.from({ length: n }, () => new Uint8Array(n));
  const seen = new Set(baseSeen);
  const appearances = new Uint16Array(n);
  for (const [winner, loser] of relations) {
    reach[index.get(winner)][index.get(loser)] = 1;
    seen.add(winner);
    seen.add(loser);
    appearances[index.get(winner)]++;
    appearances[index.get(loser)]++;
  }
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++)
      if (reach[i][k]) {
        for (let j = 0; j < n; j++) if (reach[k][j]) reach[i][j] = 1;
      }
  if (reach.some((row, i) => row[i])) throw Error("Cyclic preferences");
  const ancestors = new Uint16Array(n),
    descendants = new Uint16Array(n);
  let known = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if (reach[i][j]) {
        descendants[i]++;
        ancestors[j]++;
        known++;
      }
  const last = decisions.at(-1) ?? [];
  let best = null,
    bestScore = null;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      if (reach[i][j] || reach[j][i]) continue;
      const novelty = Number(!seen.has(ids[i])) + Number(!seen.has(ids[j]));
      const freshCards =
        Number(!last.includes(ids[i])) + Number(!last.includes(ids[j]));
      // Prefer a useful comparison in either direction, rather than keeping one
      // candidate fixed. Card variety takes precedence over information gain.
      const gainA = (ancestors[i] + 1) * (descendants[j] + 1);
      const gainB = (ancestors[j] + 1) * (descendants[i] + 1);
      const score = [
        novelty,
        freshCards,
        Math.min(gainA, gainB),
        gainA + gainB,
        -appearances[i] - appearances[j],
      ];
      if (!bestScore || better(score, bestScore)) {
        best = [i, j];
        bestScore = score;
      }
    }
  const comparisons = baseComparisons + decisions.length;
  if (best && comparisons % 2) best.reverse();
  const ordered = careers
    .map((c, i) => ({ c, i }))
    .sort((a, b) => ancestors[a.i] - ancestors[b.i] || a.i - b.i)
    .map((x) => x.c);
  const isComplete = best === null;
  return {
    careers,
    baseRelations: baseRelations.map((p) => [...p]),
    baseSeen: [...baseSeen],
    baseComparisons,
    decisions: decisions.map((p) => [...p]),
    comparisons,
    seen: isComplete ? ids : [...seen],
    ranked: isComplete ? ordered : ordered.filter((c) => seen.has(c.id)),
    currentPair: best?.map((i) => careers[i]) ?? null,
    isComplete,
    resolvedPairs: known,
    totalPairs: (n * (n - 1)) / 2,
  };
}

function better(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

export function choosePreferred(session, id) {
  if (session.isComplete || !session.currentPair?.some((c) => c.id === id))
    return session;
  const other = session.currentPair.find((c) => c.id !== id).id;
  return restoreRankingSession(session.careers, {
    ...session,
    decisions: [...session.decisions, [id, other]],
  });
}

export function repairSessionWithoutHistory(session) {
  if (!session?.decisions?.length) return null;
  return restoreRankingSession(session.careers, {
    ...session,
    decisions: session.decisions.slice(0, -1),
  });
}

// Preserve all order constraints established by the previous insertion sorter,
// including an unfinished binary insertion. No old decisions need to be reset.
export function migrateLegacySession(session) {
  const ranked = session.ranked.map((c) => c.id);
  const baseRelations = ranked.slice(1).map((id, i) => [ranked[i], id]);
  const baseSeen = [...ranked];
  if (!session.isComplete && session.insertion) {
    const candidate = session.careers[session.candidateIndex].id;
    const { low, high } = session.insertion;
    if (low > 0) baseRelations.push([ranked[low - 1], candidate]);
    if (high < ranked.length) baseRelations.push([candidate, ranked[high]]);
    if (low > 0 || high < ranked.length) baseSeen.push(candidate);
  }
  return restoreRankingSession(session.careers, {
    baseRelations,
    baseSeen,
    baseComparisons: session.comparisons,
  });
}
