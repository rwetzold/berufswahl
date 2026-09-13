export const SESSION_STORAGE_KEY = "berufswahl-careers-v1";
export function saveProgress(storage, session, history) {
  try {
    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        version: 1,
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
    if (data?.version !== 1 || !Array.isArray(data.history)) return null;
    const session = deserialize(data.session, available);
    const history = data.history.map((s) => deserialize(s, available));
    if (!session || history.some((s) => !s)) return null;
    return { session, history };
  } catch {
    return null;
  }
}
function serialize(s) {
  return {
    ...s,
    careers: s.careers.map((c) => c.id),
    ranked: s.ranked.map((c) => c.id),
    currentPair: s.currentPair?.map((c) => c.id) ?? null,
  };
}
function deserialize(s, available) {
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
