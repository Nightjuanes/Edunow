import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AudioSettings {
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
  musicVolume: number;
  soundEffectsVolume: number;
}

interface AudioContextType {
  settings: AudioSettings;
  updateSettings: (newSettings: Partial<AudioSettings>) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const defaultSettings: AudioSettings = {
  musicEnabled: true,
  soundEffectsEnabled: true,
  musicVolume: 0.3,
  soundEffectsVolume: 0.5
};

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('edunow-audio-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const updateSettings = (newSettings: Partial<AudioSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Save to localStorage
      localStorage.setItem('edunow-audio-settings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AudioContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
};