import React, { useState, useEffect, useRef } from 'react';
import { UnitInstance, PlayerType } from '../types';
import { UNITS } from '../constants';

interface UnitProps {
  unit: UnitInstance;
  isTargeting: boolean;
  onTarget: () => void;
}

const UnitComponent: React.FC<UnitProps> = ({ unit, isTargeting, onTarget }) => {
  const unitData = UNITS[unit.unitId];
  const isPlayer = unit.owner === PlayerType.PLAYER;
  const [animationClass, setAnimationClass] = useState('');
  const animationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
      if (unit.attackAnimationEnd) {
          if (animationTimeoutRef.current) {
              clearTimeout(animationTimeoutRef.current);
          }
          const animClass = unitData.projectile ? 'animate-attack-ranged' : 'animate-attack-melee';
          setAnimationClass(animClass);
          animationTimeoutRef.current = window.setTimeout(() => {
              setAnimationClass('');
          }, 300);
      }
      return () => {
          if (animationTimeoutRef.current) {
              clearTimeout(animationTimeoutRef.current);
          }
      };
  }, [unit.attackAnimationEnd]);

  const colorClass = isPlayer ? 'bg-blue-500/50 border-cyan-400' : 'bg-red-500/50 border-red-400';
  const positionStyle = {
    left: `${unit.position}%`,
    transform: `translateX(-50%) ${isPlayer ? '' : 'scaleX(-1)'}`,
  };

  const statusClass = {
      dying: 'opacity-0 scale-50',
  }[unit.status] || '';

  const hpPercentage = (unit.hp / unit.maxHp) * 100;
  
  const isEnemy = unit.owner === PlayerType.ENEMY;
  const isTargetable = isTargeting && isEnemy;

  const clickableProps = isTargetable ? { onClick: onTarget } : {};
  const targetableClass = isTargetable ? 'cursor-crosshair ring-4 ring-yellow-300 ring-offset-2 ring-offset-black animate-pulse hover:!scale-125 z-20 shadow-lg shadow-yellow-300/50' : '';

  return (
    <div 
      {...clickableProps}
      className={`absolute bottom-5 w-12 h-16 flex flex-col items-center transition-all duration-200 ${statusClass} ${targetableClass}`}
      style={positionStyle}
    >
      <div className={`w-10 h-10 flex items-center justify-center rounded-md border-2 transition-transform duration-100 ${colorClass} ${unit.status === 'attacking' ? (isPlayer ? 'shadow-[0_0_15px_cyan]' : 'shadow-[0_0_15px_red]') : ''} ${animationClass}`}>
        <unitData.icon className="w-6 h-6 text-white" />
      </div>
      <div className="w-10 h-1 mt-1 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={isPlayer ? "bg-green-500 h-full" : "bg-yellow-500 h-full"} 
          style={{ width: `${hpPercentage}%`, transition: 'width 0.2s' }}
        ></div>
      </div>
       <span className="text-xs mt-1 font-bold text-shadow">{unitData.name.split(' ').pop()}</span>
    </div>
  );
};

export default UnitComponent;