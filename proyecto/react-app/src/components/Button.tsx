import React from 'react';
import { useAudio } from '../hooks/useAudio';
import type { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'error';
  size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
  className = '',
  ...props
}) => {
  const { playButtonClick } = useAudio();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    playButtonClick();
    if (onClick) {
      onClick(event);
    }
  };

  const baseClasses = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const classes = `${baseClasses} ${variantClass} ${sizeClass} ${className}`.trim();

  return (
    <button
      className={classes}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;