import { useEffect, useState } from 'react';
import { DESKTOP_MEDIA_QUERY, isDesktopViewport } from '../../shared/utils/viewport.js';

export function useSidebarNavigation() {
  const [desktop, setDesktop] = useState(isDesktopViewport);
  const [open, setOpen] = useState(isDesktopViewport);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const resize = () => {
      setDesktop(media.matches);
      setOpen(media.matches);
    };
    const escape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    media.addEventListener('change', resize);
    window.addEventListener('keydown', escape);
    return () => {
      media.removeEventListener('change', resize);
      window.removeEventListener('keydown', escape);
    };
  }, []);

  return { open, setOpen, drawerOpen: open && !desktop };
}
