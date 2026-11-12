import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOptionalPlayer } from '../context/PlayerContext.jsx';
import { playPulse } from './motion.jsx';

function timeLabel(seconds) {
  const value = Math.floor(seconds || 0);
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

export default function PlayerBar() {
  const player = useOptionalPlayer();
  const { audioRef, current, playing, currentTime, duration } = player ?? {};

  useEffect(() => {
    if (!audioRef?.current || !current) return;
    audioRef.current.src = current.previewUrl;
  }, [audioRef, current?.previewUrl]);

  useEffect(() => {
    if (!audioRef?.current || !current) return;
    if (playing && audioRef.current.paused) {
      audioRef.current.play().catch(() => player?.setPlaying(false));
    } else if (!playing && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [audioRef, current, playing, player?.setPlaying]);

  if (!player || !current) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="player-bar"
      aria-label="Music player"
    >
      <audio
        ref={audioRef}
        onTimeUpdate={(event) => player.setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => player.setDuration(event.currentTarget.duration || 0)}
        onEnded={player.next}
        onPlay={() => player.setPlaying(true)}
        onPause={() => player.setPlaying(false)}
        onError={() => player.setPlaying(false)}
      />

      <motion.div whileHover={{ scale: 1.08 }} className="player-art">
        <img
          src={current.artworkUrl || ''}
          alt=""
          className="w-full h-full object-cover border border-line shadow-sm"
        />
        {playing && (
          <motion.span
            className="player-art-badge"
            variants={playPulse}
            aria-hidden="true"
          >
            <i />
            <i />
            <i />
          </motion.span>
        )}
      </motion.div>

      <div className="player-track-copy">
        <strong className="block">{current.title}</strong>
        <span>{current.artist}</span>
      </div>

      <div className="player-buttons">
        <button type="button" aria-label="Previous preview" onClick={player.previous}>|◀</button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="player-play"
          aria-label={playing ? 'Pause preview' : 'Play preview'}
          onClick={player.toggle}
        >
          {playing ? 'Ⅱ' : '▶'}
        </motion.button>
        <button type="button" aria-label="Next preview" onClick={player.next}>▶|</button>
      </div>

      <div className="player-progress">
        <span className="player-time">{timeLabel(currentTime)}</span>
        <input
          aria-label="Seek preview"
          type="range"
          min="0"
          max={duration || 30}
          value={Math.min(currentTime, duration || 30)}
          onChange={(event) => player.seek(Number(event.target.value))}
        />
        <span className="player-time">{timeLabel(duration)}</span>
      </div>

      <span className="player-note">iTunes preview</span>
    </motion.aside>
  );
}
