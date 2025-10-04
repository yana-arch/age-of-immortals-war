import React from 'react';
import { VisualEffectInstance } from '../types';

interface VisualEffectProps {
  effect: VisualEffectInstance;
}

const VisualEffect: React.FC<VisualEffectProps> = ({ effect }) => {
  const style = {
    left: `${effect.position.x}%`,
    bottom: `calc(1.25rem + ${effect.position.y}px)`, // Adjust to be relative to the ground
  };

  const baseContainerStyle = `absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none`;

  switch (effect.type) {
    case 'hit_spark':
      return (
        <div className={baseContainerStyle} style={style}>
          <div className="w-3 h-3 bg-yellow-200 rounded-full animate-hit-spark"></div>
        </div>
      );
    case 'fireball_impact':
      return (
        <div className={`${baseContainerStyle} w-24 h-24`} style={style}>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-red-600 animate-fireball-core opacity-80"></div>
          <div className="absolute inset-0 rounded-full border-yellow-300 animate-shockwave"></div>
        </div>
      );
    case 'death_puff':
      return (
        <div className={baseContainerStyle} style={style}>
          <div className="w-8 h-8 bg-gray-500 rounded-full animate-death-puff"></div>
        </div>
      );
    case 'elite_death':
        return (
            <div className={`${baseContainerStyle} w-32 h-32`} style={style}>
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-white to-yellow-300 animate-elite-flash"></div>
              <div className="absolute inset-0 rounded-full border-yellow-200 animate-shockwave" style={{animationDelay: '0.1s'}}></div>
            </div>
          );
    case 'heal':
      return (
        <div className={`${baseContainerStyle} w-full h-full top-0 left-0`} style={{left: `${effect.position.x}%`, bottom: `${effect.position.y}%`}}>
            <div className="w-48 h-48 border-4 border-green-400 rounded-full animate-pulse opacity-50"></div>
        </div>
      );
    default:
        return null;
  }
};

export default VisualEffect;