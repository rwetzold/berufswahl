import { restoreRankingSession, migrateLegacySession } from "./ranking.js";
export const SESSION_STORAGE_KEY = "berufswahl-careers-v1";
export function saveProgress(storage, session, history) {
  try {
    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        session: serialize(session),
        history: history.map(serialize),
      }),
    );
    return true;
  } catch {
    return false;
  }
}
export function loadProgress(storage, available) {
  try {
    const data = JSON.parse(storage.getItem(SESSION_STORAGE_KEY));
    if (![1, 2].includes(data?.version) || !Array.isArray(data.history))
      return null;
    const read =
      data.version === 1
        ? (raw) => {
            const s = deserializeLegacy(raw, available);
            return s ? migrateLegacySession(s) : null;
          }
        : (raw) => deserialize(raw, available);
    const session = read(data.session),
      history = data.history.map(read);
    return session && history.every(Boolean) ? { session, history } : null;
  } catch {
    return null;
  }
}
function serialize(s) {
  return {
    careers: s.careers.map((c) => c.id),
    baseRelations: s.baseRelations,
    baseSeen: s.baseSeen,
    baseComparisons: s.baseComparisons,
    decisions: s.decisions,
  };
}
function deserialize(raw, available) {
  const map = new Map(available.map((c) => [c.id, c]));
  if (
    !raw ||
    !Array.isArray(raw.careers) ||
    raw.careers.length !== available.length ||
    new Set(raw.careers).size !== available.length ||
    raw.careers.some((id) => !map.has(id))
  )
    return null;
  if (
    !Array.isArray(raw.baseRelations) ||
    !Array.isArray(raw.baseSeen) ||
    !Array.isArray(raw.decisions) ||
    !Number.isInteger(raw.baseComparisons)
  )
    return null;
  return restoreRankingSession(
    raw.careers.map((id) => map.get(id)),
    raw,
  );
}

// Reader for the previous insertion-based save format.
function deserializeLegacy(s, available) {
  if (!s || !Array.isArray(s.careers) || !Array.isArray(s.ranked)) return null;
  const map = new Map(available.map((c) => [c.id, c]));
  const valid = (ids) =>
    Array.isArray(ids) &&
    ids.every((id) => map.has(id)) &&
    new Set(ids).size === ids.length;
  if (
    !valid(s.careers) ||
    s.careers.length !== available.length ||
    !valid(s.ranked)
  )
    return null;
  if (
    !Number.isInteger(s.comparisons) ||
    s.comparisons < 0 ||
    !Number.isInteger(s.candidateIndex) ||
    s.candidateIndex < 0 ||
    s.candidateIndex > s.careers.length
  )
    return null;
  if (typeof s.isComplete !== "boolean") return null;
  if (
    s.isComplete
      ? s.ranked.length !== s.careers.length || s.currentPair !== null
      : !valid(s.currentPair) || s.currentPair.length !== 2
  )
    return null;
  if (
    s.isComplete &&
    (s.candidateIndex !== s.careers.length || s.insertion !== null)
  )
    return null;
  if (
    !s.isComplete &&
    s.ranked.length === 0 &&
    (s.candidateIndex !== 2 ||
      s.comparisons !== 0 ||
      s.insertion !== null ||
      s.currentPair[0] !== s.careers[0] ||
      s.currentPair[1] !== s.careers[1])
  )
    return null;
  if (!s.isComplete && s.ranked.length > 0) {
    if (
      s.candidateIndex !== s.ranked.length ||
      s.ranked.includes(s.careers[s.candidateIndex])
    )
      return null;
    if (
      s.ranked.some((id) => !s.careers.slice(0, s.candidateIndex).includes(id))
    )
      return null;
    const p = s.insertion;
    if (
      !p ||
      ![p.low, p.high, p.mid].every(Number.isInteger) ||
      p.low < 0 ||
      p.high > s.ranked.length ||
      p.low > p.mid ||
      p.mid >= p.high
    )
      return null;
    if (
      s.currentPair[0] !== s.careers[s.candidateIndex] ||
      s.currentPair[1] !== s.ranked[p.mid]
    )
      return null;
  }
  return {
    ...s,
    careers: s.careers.map((id) => map.get(id)),
    ranked: s.ranked.map((id) => map.get(id)),
    currentPair: s.currentPair?.map((id) => map.get(id)) ?? null,
  };
}
