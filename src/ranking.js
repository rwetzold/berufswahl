export function createRankingSession(careers) {
  if (!Array.isArray(careers) || careers.length === 0) {
    return completeSession([]);
  }

  if (careers.length === 1) {
    return completeSession([careers[0]]);
  }

  const session = {
    careers,
    ranked: [],
    candidateIndex: 2,
    insertion: null,
    comparisons: 0,
    isComplete: false,
    currentPair: [careers[0], careers[1]],
  };

  return session;
}

export function choosePreferred(session, preferredCareerId) {
  if (session.isComplete || !session.currentPair) {
    return session;
  }

  const candidate = session.currentPair[0];
  const compared = session.currentPair[1];
  const next = cloneSession(session);
  next.comparisons += 1;

  if (next.ranked.length === 0) {
    if (preferredCareerId === candidate.id) {
      next.ranked = [candidate, compared];
    } else if (preferredCareerId === compared.id) {
      next.ranked = [compared, candidate];
    } else {
      return session;
    }

    return prepareNextPair(next);
  }

  if (preferredCareerId === candidate.id) {
    next.insertion.high = next.insertion.mid;
  } else if (preferredCareerId === compared.id) {
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
    !Array.isArray(session.careers) ||
    !Array.isArray(session.ranked) ||
    session.ranked.length === 0
  ) {
    return null;
  }

  if (session.candidateIndex === 2 && isFreshInsertion(session)) {
    return createRankingSession(session.careers);
  }

  if (session.candidateIndex > 2 && isFreshInsertion(session)) {
    return restartPreviousCandidate(session);
  }

  return restartCurrentCandidate(session);
}

function prepareNextPair(session) {
  if (session.candidateIndex >= session.careers.length) {
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
    next.insertion.mid = Math.floor(
      (next.insertion.low + next.insertion.high) / 2,
    );
  }

  next.currentPair = [
    next.careers[next.candidateIndex],
    next.ranked[next.insertion.mid],
  ];
  next.isComplete = false;

  return next;
}

function restartCurrentCandidate(session) {
  const candidate = session.careers[session.candidateIndex];

  if (!candidate) {
    return null;
  }

  return startInsertion(
    session,
    candidate,
    session.candidateIndex,
    session.ranked,
  );
}

function restartPreviousCandidate(session) {
  const previousCandidateIndex = session.candidateIndex - 1;
  const previousCandidate = session.careers[previousCandidateIndex];

  if (!previousCandidate) {
    return null;
  }

  const ranked = session.ranked.filter(
    (career) => career.id !== previousCandidate.id,
  );

  if (ranked.length === session.ranked.length) {
    return null;
  }

  return startInsertion(
    session,
    previousCandidate,
    previousCandidateIndex,
    ranked,
  );
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
    careers: ranked,
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
