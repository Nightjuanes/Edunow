import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioContext } from './AudioContext';

export const useBackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { settings } = useAudioContext();

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio('/audio/background-music.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = settings.musicVolume;

    // Load the audio
    audioRef.current.load();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.musicVolume;
    }
  }, [settings.musicVolume]);

  useEffect(() => {
    if (settings.musicEnabled && !isPlaying) {
      play();
    } else if (!settings.musicEnabled && isPlaying) {
      pause();
    }
  }, [settings.musicEnabled]);

  const play = useCallback(async () => {
    if (audioRef.current && settings.musicEnabled) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.warn('Background music play failed:', error);
      }
    }
  }, [settings.musicEnabled]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  return {
    isPlaying,
    volume: settings.musicVolume,
    play,
    pause,
    toggle
  };
};