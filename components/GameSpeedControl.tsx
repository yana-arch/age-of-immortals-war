import React from 'react';
import { GameSpeed } from '../types';

interface GameSpeedControlProps {
  currentGameSpeed: GameSpeed;
  onSpeedChange: (speed: GameSpeed) => void;
}

const SPEEDS: GameSpeed[] = [1, 2, 4];

const GameSpeedControl: React.FC<GameSpeedControlProps> = ({ currentGameSpeed, onSpeedChange }) => {
  return (
    <div className="absolute top-28 right-4 z-20 flex items-center bg-gray-900/50 backdrop-blur-sm p-1 rounded-lg border border-white/20">
      <span className="text-sm font-bold text-gray-300 px-2">Tốc độ:</span>
      {SPEEDS.map(speed => {
        const isActive = currentGameSpeed === speed;
        return (
          <button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            className={`px-4 py-1 rounded-md text-sm font-bold transition-colors ${
              isActive
                ? 'bg-cyan-500 text-white shadow-md'
                : 'text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            {speed}x
          </button>
        );
      })}
    </div>
  );
};

export default GameSpeedControl;
