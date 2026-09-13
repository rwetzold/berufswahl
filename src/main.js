import './styles.css';
import { pageContent } from './appContent.js';
import {
  clearSessionState,
  loadSelectedSongSetId,
  loadSessionHistory,
  loadSessionState,
  saveSelectedSongSetId,
  saveSessionState,
} from './persistence.js';
import { createRankingSession } from './ranking.js';
import { shuffleSongs } from './shuffle.js';
import { getSongSetOption, songSetOptions } from './songs.js';
import { canStepBack, chooseWithHistory, stepBackSession } from './undo.js';
import { getYoutubeEmbedUrl, getYoutubeThumbnailUrl } from './youtube.js';

const app = document.querySelector('#app');
let activeSongSet = getSongSetOption(loadSelectedSongSetId(localStorage));
saveSelectedSongSetId(localStorage, activeSongSet.id);
let { session, sessionHistory } = loadOrCreateSessionData(activeSongSet);
let activeVideoSongId = null;

render();

function render() {
  app.innerHTML = `
    <section class="app-shell" aria-labelledby="page-title">
      <header class="hero">
        <div>
          <p class="section-label">${activeSongSet.heading}</p>
          <h1 id="page-title">${activeSongSet.title}</h1>
          <p class="description">${pageContent.description}</p>
          ${renderSongSetSelector()}
        </div>
        <div class="progress-panel" aria-live="polite">
          <span class="progress-value">${session.ranked.length}/${activeSongSet.songs.length}</span>
          <span class="progress-label">Songs einsortiert</span>
          <span class="progress-label">${session.comparisons} Duelle entschieden</span>
          <button class="undo-action" type="button" data-undo ${canStepBack(session, sessionHistory) ? '' : 'disabled'}>
            Schritt zurück
          </button>
          <button class="reset-action" type="button" data-reset>Von vorn anfangen</button>
        </div>
      </header>

      ${session.isComplete ? renderFinished() : renderComparison()}
      ${renderPlaylist()}
    </section>
  `;

  app.querySelectorAll('[data-song-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextState = chooseWithHistory(session, sessionHistory, button.dataset.songChoice);

      if (!nextState.changed) {
        return;
      }

      activeVideoSongId = null;
      session = nextState.session;
      sessionHistory = nextState.history;
      saveSessionState(localStorage, session, activeSongSet.id, sessionHistory);
      render();
    });
  });

  app.querySelectorAll('[data-song-set]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextSongSet = getSongSetOption(button.dataset.songSet);

      if (nextSongSet.id === activeSongSet.id) {
        return;
      }

      activeVideoSongId = null;
      activeSongSet = nextSongSet;
      saveSelectedSongSetId(localStorage, activeSongSet.id);
      ({ session, sessionHistory } = loadOrCreateSessionData(activeSongSet));
      render();
    });
  });

  app.querySelector('[data-undo]')?.addEventListener('click', () => {
    const nextState = stepBackSession(session, sessionHistory);

    if (!nextState.changed) {
      return;
    }

    activeVideoSongId = null;
    session = nextState.session;
    sessionHistory = nextState.history;
    saveSessionState(localStorage, session, activeSongSet.id, sessionHistory);
    render();
  });

  app.querySelector('[data-reset]')?.addEventListener('click', () => {
    activeVideoSongId = null;
    clearSessionState(localStorage, activeSongSet.id);
    session = createRankingSession(shuffleSongs(activeSongSet.songs));
    sessionHistory = [];
    render();
  });

  app.querySelectorAll('[data-video-play]').forEach((button) => {
    button.addEventListener('click', () => {
      activeVideoSongId = button.dataset.videoPlay;
      render();
    });
  });
}

function loadOrCreateSessionData(songSetOption) {
  const loadedSession = loadSessionState(localStorage, songSetOption.songs, songSetOption.id);
  const loadedHistory = loadSessionHistory(localStorage, songSetOption.songs, songSetOption.id);

  if (loadedSession) {
    saveSessionState(localStorage, loadedSession, songSetOption.id, loadedHistory);
    return {
      session: loadedSession,
      sessionHistory: loadedHistory,
    };
  }

  return {
    session: createRankingSession(shuffleSongs(songSetOption.songs)),
    sessionHistory: [],
  };
}

function renderSongSetSelector() {
  const buttons = songSetOptions
    .map((option) => {
      const isSelected = option.id === activeSongSet.id;

      return `
        <button
          class="song-set-button${isSelected ? ' song-set-button-active' : ''}"
          type="button"
          data-song-set="${option.id}"
          aria-pressed="${isSelected}"
        >
          ${option.label}
        </button>
      `;
    })
    .join('');

  return `
    <div class="song-set-selector" role="group" aria-label="Songauswahl">
      ${buttons}
    </div>
  `;
}

function renderComparison() {
  const [leftSong, rightSong] = session.currentPair;
  const isInitialDuel = session.ranked.length === 0;

  return `
    <section class="comparison" aria-label="Song-Duell">
      <div class="duel-heading">
        <p>Welcher Song soll weiter oben in deiner Playlist stehen?</p>
      </div>
      <div class="song-grid">
        ${renderSongCard(leftSong, isInitialDuel ? 'Song A' : 'Kandidat')}
        ${renderSongCard(rightSong, isInitialDuel ? 'Song B' : 'Aktuelle Playlist')}
      </div>
    </section>
  `;
}

function renderSongCard(song, context) {
  const videoTitle = `${song.artist} - ${song.title}`;
  const finalLabel =
    activeSongSet.id === 'combined' ? `${song.year} · Finale #${song.finalPlace}` : `Finale #${song.finalPlace}`;

  return `
    <article class="song-card">
      <div class="song-meta">
        <span>${context}</span>
        <span>${finalLabel}</span>
      </div>
      <div class="video-frame">
        ${activeVideoSongId === song.id ? renderVideoIframe(song, videoTitle) : renderVideoPreview(song, videoTitle)}
      </div>
      <div class="song-caption">
        <h2>${song.title}</h2>
        <p class="artist">${song.artist}</p>
        <p class="country">${song.country}</p>
      </div>
      <dl>
        <div>
          <dt>Startnummer</dt>
          <dd>${song.runningOrder}</dd>
        </div>
        <div>
          <dt>ESC-Punkte</dt>
          <dd>${song.points}</dd>
        </div>
      </dl>
      <button class="choice-button" type="button" data-song-choice="${song.id}">
        Diesen Song bevorzuge ich
      </button>
    </article>
  `;
}

function renderVideoIframe(song, videoTitle) {
  return `
    <iframe
      src="${getYoutubeEmbedUrl(song.youtubeId)}"
      title="${videoTitle}"
      data-active-video="${song.id}"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
    ></iframe>
  `;
}

function renderVideoPreview(song, videoTitle) {
  return `
    <button class="video-preview" type="button" data-video-play="${song.id}" aria-label="${videoTitle} abspielen">
      <img src="${getYoutubeThumbnailUrl(song.youtubeId)}" alt="" loading="lazy" />
      <span class="play-icon" aria-hidden="true"></span>
    </button>
  `;
}

function renderFinished() {
  return `
    <section class="finished">
      <p class="section-label">Playlist fertig</p>
      <h2>Deine Favoritenliste steht.</h2>
    </section>
  `;
}

function renderPlaylist() {
  const rankedRows = session.ranked
    .map(
      (song, index) => `
        <li class="${session.isComplete ? 'playlist-row playlist-row-final' : 'playlist-row'}">
          <span class="rank">${index + 1}</span>
          ${session.isComplete ? renderPlaylistVideo(song) : ''}
          <span class="playlist-song">
            <strong>${song.title}</strong>
            <small>${renderPlaylistSongMeta(song)}</small>
          </span>
        </li>
      `,
    )
    .join('');

  return `
    <aside class="playlist" aria-label="Aktuelle Playlist">
      <div class="playlist-header">
        <h2>Deine Playlist</h2>
        <span>${session.isComplete ? 'Final' : 'Zwischenstand'}</span>
      </div>
      <ol>${rankedRows}</ol>
    </aside>
  `;
}

function renderPlaylistSongMeta(song) {
  const yearLabel = activeSongSet.id === 'combined' ? ` · ${song.year}` : '';

  return `${song.artist} · ${song.country}${yearLabel}`;
}

function renderPlaylistVideo(song) {
  const videoTitle = `${song.artist} - ${song.title}`;

  return `
    <div class="playlist-video">
      ${activeVideoSongId === song.id ? renderVideoIframe(song, videoTitle) : renderVideoPreview(song, videoTitle)}
    </div>
  `;
}
