import React from 'react';
import { useAudioContext } from '../hooks/AudioContext';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import Button from './Button';

const MusicControls: React.FC = () => {
  const { settings, updateSettings } = useAudioContext();
  const { isPlaying, toggle } = useBackgroundMusic();

  const toggleMusic = () => {
    updateSettings({ musicEnabled: !settings.musicEnabled });
  };

  const toggleSoundEffects = () => {
    updateSettings({ soundEffectsEnabled: !settings.soundEffectsEnabled });
  };

  return (
    <div className="music-controls">
      <Button
        variant="secondary"
        size="small"
        onClick={toggle}
        title={isPlaying ? "Pausar música" : "Reproducir música"}
      >
        {isPlaying ? "🔊" : "🔇"}
      </Button>
      <Button
        variant="secondary"
        size="small"
        onClick={toggleMusic}
        title={settings.musicEnabled ? "Desactivar música" : "Activar música"}
      >
        🎵{settings.musicEnabled ? "" : "❌"}
      </Button>
      <Button
        variant="secondary"
        size="small"
        onClick={toggleSoundEffects}
        title={settings.soundEffectsEnabled ? "Desactivar sonidos" : "Activar sonidos"}
      >
        🔊{settings.soundEffectsEnabled ? "" : "❌"}
      </Button>
    </div>
  );
};

export default MusicControls;