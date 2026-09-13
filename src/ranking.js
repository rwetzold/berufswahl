export function createRankingSession(songs) {
  if (!Array.isArray(songs) || songs.length === 0) {
    return completeSession([]);
  }

  if (songs.length === 1) {
    return completeSession([songs[0]]);
  }

  const session = {
    songs,
    ranked: [],
    candidateIndex: 2,
    insertion: null,
    comparisons: 0,
    isComplete: false,
    currentPair: [songs[0], songs[1]],
  };

  return session;
}

export function choosePreferred(session, preferredSongId) {
  if (session.isComplete || !session.currentPair) {
    return session;
  }

  const candidate = session.currentPair[0];
  const compared = session.currentPair[1];
  const next = cloneSession(session);
  next.comparisons += 1;

  if (next.ranked.length === 0) {
    if (preferredSongId === candidate.id) {
      next.ranked = [candidate, compared];
    } else if (preferredSongId === compared.id) {
      next.ranked = [compared, candidate];
    } else {
      return session;
    }

    return prepareNextPair(next);
  }

  if (preferredSongId === candidate.id) {
    next.insertion.high = next.insertion.mid;
  } else if (preferredSongId === compared.id) {
    next.insertion.low = next.insertion.mid + 1;
  } else {
    return session;
  }

  if (next.insertion.low >= next.insertion.high) {
    next.ranked = [
      ...next.ranked.slice(0, next.insertion.low),
      candidate,
      ...next.ranked.slice(next.insertion.low),
    ];
    next.candidateIndex += 1;
    next.insertion = null;
  }

  return prepareNextPair(next);
}

export function repairSessionWithoutHistory(session) {
  if (
    !session ||
    session.isComplete ||
    !session.currentPair ||
    !Array.isArray(session.songs) ||
    !Array.isArray(session.ranked) ||
    session.ranked.length === 0
  ) {
    return null;
  }

  if (session.candidateIndex === 2 && isFreshInsertion(session)) {
    return createRankingSession(session.songs);
  }

  if (session.candidateIndex > 2 && isFreshInsertion(session)) {
    return restartPreviousCandidate(session);
  }

  return restartCurrentCandidate(session);
}

function prepareNextPair(session) {
  if (session.candidateIndex >= session.songs.length) {
    return completeSession(session.ranked, session.comparisons);
  }

  const next = cloneSession(session);

  if (!next.insertion) {
    next.insertion = {
      low: 0,
      high: next.ranked.length,
      mid: Math.floor(next.ranked.length / 2),
    };
  } else {
    next.insertion.mid = Math.floor((next.insertion.low + next.insertion.high) / 2);
  }

  next.currentPair = [
    next.songs[next.candidateIndex],
    next.ranked[next.insertion.mid],
  ];
  next.isComplete = false;

  return next;
}

function restartCurrentCandidate(session) {
  const candidate = session.songs[session.candidateIndex];

  if (!candidate) {
    return null;
  }

  return startInsertion(session, candidate, session.candidateIndex, session.ranked);
}

function restartPreviousCandidate(session) {
  const previousCandidateIndex = session.candidateIndex - 1;
  const previousCandidate = session.songs[previousCandidateIndex];

  if (!previousCandidate) {
    return null;
  }

  const ranked = session.ranked.filter((song) => song.id !== previousCandidate.id);

  if (ranked.length === session.ranked.length) {
    return null;
  }

  return startInsertion(session, previousCandidate, previousCandidateIndex, ranked);
}

function startInsertion(session, candidate, candidateIndex, ranked) {
  if (ranked.length === 0) {
    return null;
  }

  const insertion = {
    low: 0,
    high: ranked.length,
    mid: Math.floor(ranked.length / 2),
  };

  return {
    ...session,
    ranked: [...ranked],
    candidateIndex,
    insertion,
    isComplete: false,
    currentPair: [candidate, ranked[insertion.mid]],
  };
}

function isFreshInsertion(session) {
  return (
    session.insertion?.low === 0 &&
    session.insertion.high === session.ranked.length &&
    session.insertion.mid === Math.floor(session.ranked.length / 2)
  );
}

function completeSession(ranked, comparisons = 0) {
  return {
    songs: ranked,
    ranked,
    candidateIndex: ranked.length,
    insertion: null,
    comparisons,
    isComplete: true,
    currentPair: null,
  };
}

function cloneSession(session) {
  return {
    ...session,
    ranked: [...session.ranked],
    insertion: session.insertion ? { ...session.insertion } : null,
    currentPair: session.currentPair ? [...session.currentPair] : null,
  };
}
