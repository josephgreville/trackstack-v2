import { useEffect } from 'react';
import { useOptionalPlayer } from '../context/PlayerContext.jsx';

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
    <aside className="player-bar" aria-label="Music player">
      <audio
        ref={audioRef}
        onTimeUpdate={(event) => player.setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => player.setDuration(event.currentTarget.duration || 0)}
        onEnded={player.next}
        onPlay={() => player.setPlaying(true)}
        onPause={() => player.setPlaying(false)}
        onError={() => player.setPlaying(false)}
      />
      <div className="player-track">
        <img src={current.artworkUrl || ''} alt="" />
        <div className="player-track-copy">
          <strong>{current.title}</strong>
          <span>{current.artist}</span>
        </div>
      </div>
      <div className="player-controls">
        <div className="player-buttons">
          <button type="button" aria-label="Previous preview" onClick={player.previous}>|◀</button>
          <button type="button" className="player-play" aria-label={playing ? 'Pause preview' : 'Play preview'} onClick={player.toggle}>
            {playing ? 'Ⅱ' : '▶'}
          </button>
          <button type="button" aria-label="Next preview" onClick={player.next}>▶|</button>
        </div>
        <div className="player-progress">
          <span>{timeLabel(currentTime)}</span>
          <input
            aria-label="Seek preview"
            type="range"
            min="0"
            max={duration || 30}
            value={Math.min(currentTime, duration || 30)}
            onChange={(event) => player.seek(Number(event.target.value))}
          />
          <span>{timeLabel(duration)}</span>
        </div>
      </div>
      <span className="player-note">iTunes preview</span>
    </aside>
  );
}
