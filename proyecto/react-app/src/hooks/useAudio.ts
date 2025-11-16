import { useCallback, useRef } from 'react';
import { useAudioContext } from './AudioContext';

export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { settings } = useAudioContext();

  const playSound = useCallback((soundPath: string, baseVolume: number = 0.5) => {
    if (!settings.soundEffectsEnabled) return;

    try {
      // Create new audio instance for each play to allow overlapping sounds
      const audio = new Audio(soundPath);
      audio.volume = baseVolume * settings.soundEffectsVolume;
      audio.play().catch(error => {
        console.warn('Audio play failed:', error);
      });
    } catch (error) {
      console.warn('Audio creation failed:', error);
    }
  }, [settings]);

  const playButtonClick = useCallback(() => {
    playSound('/audio/button-click.mp3', 0.3);
  }, [playSound]);

  const playSuccess = useCallback(() => {
    playSound('/audio/success.mp3', 0.4);
  }, [playSound]);

  const playError = useCallback(() => {
    playSound('/audio/error.mp3', 0.4);
  }, [playSound]);

  return {
    playSound,
    playButtonClick,
    playSuccess,
    playError
  };
};