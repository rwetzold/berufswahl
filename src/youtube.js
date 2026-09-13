export function getYoutubeEmbedUrl(youtubeId, origin = globalThis.location?.origin) {
  const params = new URLSearchParams({ enablejsapi: '1' });

  if (origin) {
    params.set('origin', origin);
  }

  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`;
}

export function getYoutubeThumbnailUrl(youtubeId) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}
