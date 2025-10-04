import React from 'react';
import { VisualEffectInstance } from '../types';

interface VisualEffectProps {
  effect: VisualEffectInstance;
}

const VisualEffect: React.FC<VisualEffectProps> = ({ effect }) => {
  const style = {
    left: `${effect.position.x}%`,
    bottom: `${effect.position.y}%`,
  };

  let effectClass = '';
  switch (effect.type) {
    case 'explosion':
      effectClass = "w-12 h-12 bg-red-500 rounded-full animate-ping opacity-75";
      break;
    case 'heal':
      effectClass = "w-16 h-16 border-4 border-green-400 rounded-full animate-pulse";
      break;
  }
  
  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${effectClass}`}
      style={style}
    />
  );
};

export default VisualEffect;
