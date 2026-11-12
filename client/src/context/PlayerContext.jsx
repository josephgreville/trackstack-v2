import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [shuffledOrder, setShuffledOrder] = useState([]);
  const [lastSource, setLastSource] = useState(null);

  const current = queue[index] ?? null;

  /* Keep the audio element's volume in sync with state. */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  /* Auto-advance when a track ends. */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      const nextIdx = shuffle
        ? (shuffledOrder.indexOf(index) + 1) % shuffledOrder.length
        : (index + 1) % queue.length;
      setIndex(nextIdx);
      setCurrentTime(0);
      setPlaying(true);
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [index, queue.length, shuffle, repeat, shuffledOrder]);

  const playQueue = useCallback((tracks, startIndex = 0) => {
    const playable = tracks.filter((track) => track.previewUrl);
    if (!playable.length) return;
    const order = shuffle
      ? playable.map((_, i) => i).sort(() => Math.random() - 0.5)
      : playable.map((_, i) => i);
    setQueue(playable);
    setShuffledOrder(order);
    const start = order.indexOf(startIndex) !== -1 ? startIndex : 0;
    const startPos = shuffle ? order.indexOf(start) : start;
    setIndex(startPos >= 0 ? startPos : 0);
    setPlaying(true);
    setCurrentTime(0);
    setLastSource(null);
  }, [shuffle]);

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
    if (!queue.length) return;
    const next = shuffle
      ? shuffledOrder[(shuffledOrder.indexOf(index) + direction + shuffledOrder.length) % shuffledOrder.length]
      : (index + direction + queue.length) % queue.length;
    setIndex(next);
    setCurrentTime(0);
    setPlaying(true);
    setLastSource(null);
  }, [index, queue.length, shuffle, shuffledOrder]);

  const setTrackIndex = useCallback((newIndex) => {
    if (newIndex < 0 || newIndex >= queue.length) return;
    setIndex(newIndex);
    setCurrentTime(0);
    setPlaying(true);
    setLastSource(null);
  }, [queue.length]);

  const shuffleToggle = useCallback(() => {
    setShuffle((prev) => {
      const next = !prev;
      if (next && queue.length) {
        setShuffledOrder(queue.map((_, i) => i).sort(() => Math.random() - 0.5));
      }
      return next;
    });
  }, [queue.length]);

  const value = useMemo(() => ({
    audioRef, current, playing, currentTime, duration, volume, shuffle, repeat,
    playQueue, toggle, next: () => step(1), previous: () => step(-1),
    setCurrentTime, setDuration, setPlaying,
    setVolume, setShuffle, setRepeat, setTrackIndex, shuffleToggle,
    seek: (time) => { if (audioRef.current) audioRef.current.currentTime = time; },
  }), [current, playing, currentTime, duration, volume, shuffle, repeat, playQueue, toggle, step, shuffleToggle]);

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
