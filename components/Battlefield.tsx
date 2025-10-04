import React from 'react';
import { UnitInstance, PlayerState, PlayerType, ProjectileInstance, VisualEffectInstance } from '../types';
import UnitComponent from './Unit';
import Base from './Base';
import Background from './Background';
import ProjectileComponent from './Projectile';
import VisualEffect from './VisualEffect';

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
  return (
    <div className={`relative flex-grow w-full overflow-hidden ${targetingSpell ? 'cursor-crosshair' : ''}`}>
      <Background />
      <div className="absolute inset-0 z-10">
        <Base owner={PlayerType.PLAYER} hp={player.hp} maxHp={player.maxHp} />
        <Base owner={PlayerType.ENEMY} hp={enemy.hp} maxHp={enemy.maxHp} />

        {units.map(unit => (
          <UnitComponent 
            key={unit.id} 
            unit={unit} 
            isTargeting={!!targetingSpell}
            onTarget={() => onUnitTargeted(unit.id)}
          />
        ))}
        
        {projectiles.map(p => (
            <ProjectileComponent key={p.id} projectile={p}/>
        ))}

        {effects.map(effect => (
            <VisualEffect key={effect.id} effect={effect} />
        ))}
      </div>
    </div>
  );
};

export default Battlefield;