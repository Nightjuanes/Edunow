import React, { useEffect } from 'react';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';

const BackgroundMusic: React.FC = () => {
  const { play } = useBackgroundMusic();

  useEffect(() => {
    // Auto-play background music when component mounts
    const timer = setTimeout(() => {
      play();
    }, 1000); // Small delay to ensure audio context is ready

    return () => clearTimeout(timer);
  }, [play]);

  // This component doesn't render anything visible
  return null;
};

export default BackgroundMusic;