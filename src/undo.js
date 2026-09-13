import { choosePreferred, repairSessionWithoutHistory } from "./ranking.js";

export function chooseWithHistory(session, history, preferredCareerId) {
  const nextSession = choosePreferred(session, preferredCareerId);

  if (nextSession === session) {
    return {
      session,
      history,
      changed: false,
    };
  }

  return {
    session: nextSession,
    history: [...history, session],
    changed: true,
  };
}

export function stepBackSession(session, history) {
  if (history.length > 0) {
    return {
      session: history[history.length - 1],
      history: history.slice(0, -1),
      changed: true,
    };
  }

  const repairedSession = repairSessionWithoutHistory(session);

  if (!repairedSession) {
    return {
      session,
      history,
      changed: false,
    };
  }

  return {
    session: repairedSession,
    history,
    changed: true,
  };
}

export function canStepBack(session, history) {
  return history.length > 0 || Boolean(repairSessionWithoutHistory(session));
}
