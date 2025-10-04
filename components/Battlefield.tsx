import React from 'react';
import { UnitInstance, PlayerState, PlayerType, ProjectileInstance, VisualEffectInstance } from '../types';
import { UNITS, BASE_VISION_RANGE } from '../constants';
import UnitComponent from './Unit';
import Base from './Base';
import Background from './Background';
import ProjectileComponent from './Projectile';
import VisualEffect from './VisualEffect';
import FogOfWar from './FogOfWar';

interface BattlefieldProps {
  player: PlayerState;
  enemy: PlayerState;
  units: UnitInstance[];
  projectiles: ProjectileInstance[];
  effects: VisualEffectInstance[];
  targetingSpell: string | null;
  onUnitTargeted: (unitId: string) => void;
}

const Battlefield: React.FC<BattlefieldProps> = ({ player, enemy, units, projectiles, effects, targetingSpell, onUnitTargeted }) => {
  const visionSources = [
    { position: 0, radius: BASE_VISION_RANGE }, // Player base vision
    ...units
      .filter(u => u.owner === PlayerType.PLAYER && u.status !== 'dying')
      .map(u => ({
        position: u.position,
        radius: UNITS[u.unitId].visionRange,
      })),
  ];

  const isPositionVisible = (position: number): boolean => {
    for (const source of visionSources) {
      if (Math.abs(position - source.position) <= source.radius) {
        return true;
      }
    }
    return false;
  };

  const visibleUnits = units.filter(u => u.owner === PlayerType.PLAYER || isPositionVisible(u.position));
  const visibleProjectiles = projectiles.filter(p => isPositionVisible(p.position.x));
  const visibleEffects = effects.filter(e => e.owner === PlayerType.PLAYER || isPositionVisible(e.position.x));

  return (
    <div className={`relative flex-grow w-full overflow-hidden ${targetingSpell ? 'cursor-crosshair' : ''}`}>
      <Background />
      <FogOfWar visionSources={visionSources} />
      <div className="absolute inset-0 z-10">
        <Base owner={PlayerType.PLAYER} hp={player.hp} maxHp={player.maxHp} />
        {/* Only render enemy base if it's within vision */}
        {isPositionVisible(100) && <Base owner={PlayerType.ENEMY} hp={enemy.hp} maxHp={enemy.maxHp} />}

        {visibleUnits.map(unit => (
          <UnitComponent 
            key={unit.id} 
            unit={unit} 
            isTargeting={!!targetingSpell}
            onTarget={() => onUnitTargeted(unit.id)}
          />
        ))}
        
        {visibleProjectiles.map(p => (
            <ProjectileComponent key={p.id} projectile={p}/>
        ))}

        {visibleEffects.map(effect => (
            <VisualEffect key={effect.id} effect={effect} />
        ))}
      </div>
    </div>
  );
};

export default Battlefield;