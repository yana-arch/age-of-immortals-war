
import React from 'react';
import { PlayerType } from '../types';

interface BaseProps {
  owner: PlayerType;
  hp: number;
  maxHp: number;
}

const Base: React.FC<BaseProps> = ({ owner, hp, maxHp }) => {
  const isPlayer = owner === PlayerType.PLAYER;
  const positionClass = isPlayer ? 'left-[-4%]' : 'right-[-4%]';
  const colorClass = isPlayer ? 'from-cyan-500/50' : 'from-red-500/50';
  const textClass = isPlayer ? 'text-cyan-300' : 'text-red-300';

  return (
    <div className={`absolute bottom-0 w-48 h-48 ${positionClass}`}>
      <div className={`absolute inset-0 bg-gradient-to-t ${colorClass} to-transparent rounded-t-full`}></div>
      <div className="absolute bottom-0 w-full flex flex-col items-center p-2">
         <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/20">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-600" style={{width: `${(hp/maxHp)*100}%`}}></div>
        </div>
        <span className={`mt-1 text-sm font-bold ${textClass}`}>{Math.max(0, hp)} / {maxHp}</span>
      </div>
    </div>
  );
};

export default Base;
