import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const current = queue[index] ?? null;

  const playQueue = useCallback((tracks, startIndex = 0) => {
    const playable = tracks.filter((track) => track.previewUrl);
    const selected = tracks[startIndex];
    const nextIndex = selected?.previewUrl ? playable.findIndex((track) => track === selected) : 0;
    setQueue(playable);
    setIndex(Math.max(0, nextIndex));
    setPlaying(Boolean(playable.length));
    setCurrentTime(0);
  }, []);

  const toggle = useCallback(() => {
    if (!current) return;
    if (audioRef.current?.paused) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audioRef.current?.pause();
      setPlaying(false);
    }
  }, [current]);

  const step = useCallback((direction) => {
    setIndex((value) => (value + direction + queue.length) % queue.length);
    setCurrentTime(0);
    setPlaying(true);
  }, [queue.length]);

  const value = useMemo(() => ({
    audioRef, current, playing, currentTime, duration,
    playQueue, toggle, next: () => step(1), previous: () => step(-1),
    setCurrentTime, setDuration, setPlaying,
    seek: (time) => { if (audioRef.current) audioRef.current.currentTime = time; },
  }), [current, playing, currentTime, duration, playQueue, toggle, step]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const value = useContext(PlayerContext);
  if (!value) throw new Error('usePlayer must be used within PlayerProvider');
  return value;
}

export function useOptionalPlayer() {
  return useContext(PlayerContext);
}
