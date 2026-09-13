export const SESSION_STORAGE_KEY = 'berufswahl-ranking-session';
export const SELECTED_SONG_SET_STORAGE_KEY = 'berufswahl-ranking-selected-set';
const DEFAULT_SONG_SET_ID = '2026';

export function saveSessionState(storage, session, songSetId = DEFAULT_SONG_SET_ID, history = []) {
  storage.setItem(
    getSessionStorageKey(songSetId),
    JSON.stringify({
      ...serializeSession(session),
      history: history.map((historySession) => serializeSession(historySession)),
    }),
  );
}

export function loadSessionState(storage, availableSongs, songSetId = DEFAULT_SONG_SET_ID) {
  return deserializeSession(loadStoredState(storage, songSetId), availableSongs);
}

export function loadSessionHistory(storage, availableSongs, songSetId = DEFAULT_SONG_SET_ID) {
  const parsed = loadStoredState(storage, songSetId);

  if (!Array.isArray(parsed?.history)) {
    return [];
  }

  return parsed.history
    .map((historySession) => deserializeSession(historySession, availableSongs))
    .filter(Boolean);
}

function loadStoredState(storage, songSetId) {
  const rawState =
    storage.getItem(getSessionStorageKey(songSetId)) ??
    (songSetId === DEFAULT_SONG_SET_ID ? storage.getItem(SESSION_STORAGE_KEY) : null);

  if (!rawState) {
    return null;
  }

  try {
    return JSON.parse(rawState);
  } catch {
    return null;
  }
}

export function clearSessionState(storage, songSetId = DEFAULT_SONG_SET_ID) {
  storage.removeItem?.(getSessionStorageKey(songSetId));

  if (songSetId === DEFAULT_SONG_SET_ID) {
    storage.removeItem?.(SESSION_STORAGE_KEY);
  }
}

export function saveSelectedSongSetId(storage, songSetId) {
  storage.setItem(SELECTED_SONG_SET_STORAGE_KEY, songSetId);
}

export function loadSelectedSongSetId(storage) {
  return storage.getItem(SELECTED_SONG_SET_STORAGE_KEY) ?? DEFAULT_SONG_SET_ID;
}

function getSessionStorageKey(songSetId) {
  return `${SESSION_STORAGE_KEY}:${songSetId}`;
}

function serializeSession(session) {
  return {
    songIds: session.songs.map((song) => song.id),
    rankedIds: session.ranked.map((song) => song.id),
    candidateIndex: session.candidateIndex,
    insertion: session.insertion,
    comparisons: session.comparisons,
    isComplete: session.isComplete,
    currentPairIds: session.currentPair?.map((song) => song.id) ?? null,
  };
}

function deserializeSession(parsed, availableSongs) {
  if (!parsed) {
    return null;
  }

  const songs = resolveSongs(parsed.songIds, availableSongs);

  if (!songs) {
    return null;
  }

  const ranked = resolveSongs(parsed.rankedIds, songs);
  const currentPair = parsed.currentPairIds ? resolveSongs(parsed.currentPairIds, songs) : null;

  if (!ranked || (parsed.currentPairIds && !currentPair)) {
    return null;
  }

  return {
    songs,
    ranked,
    candidateIndex: parsed.candidateIndex,
    insertion: parsed.insertion ?? null,
    comparisons: parsed.comparisons ?? 0,
    isComplete: Boolean(parsed.isComplete),
    currentPair,
  };
}

function resolveSongs(ids, availableSongs) {
  if (!Array.isArray(ids) || !Array.isArray(availableSongs)) {
    return null;
  }

  const songById = new Map(availableSongs.map((song) => [song.id, song]));
  availableSongs.forEach((song) => {
    if (song.legacyId) {
      songById.set(song.legacyId, song);
    }
  });

  const songs = ids.map((id) => songById.get(id));

  if (songs.some((song) => !song)) {
    return null;
  }

  return songs;
}
