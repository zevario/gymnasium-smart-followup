// Single breakpoint shared by the sidebar logic; mirrors the CSS media queries.
export const DESKTOP_MIN_WIDTH = 1024;
export const DESKTOP_MEDIA_QUERY = `(min-width: ${DESKTOP_MIN_WIDTH}px)`;
export const MOBILE_MEDIA_QUERY = `(max-width: ${DESKTOP_MIN_WIDTH - 1}px)`;

export const isDesktopViewport = () => window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
export const isMobileViewport = () => window.matchMedia(MOBILE_MEDIA_QUERY).matches;
