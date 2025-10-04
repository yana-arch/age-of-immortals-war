import React from 'react';
import { ProjectileInstance } from '../types';

interface ProjectileProps {
  projectile: ProjectileInstance;
}

const ProjectileComponent: React.FC<ProjectileProps> = ({ projectile }) => {
  const style = {
    left: `${projectile.position.x}%`,
    bottom: `${projectile.position.y}%`,
    transform: 'translate(-50%, 50%)',
  };

  const projectileClass = {
      arrow: 'w-6 h-1 bg-yellow-300 transform -rotate-45',
      fireball: 'w-4 h-4 bg-orange-500 rounded-full shadow-[0_0_10px_orange]',
  }[projectile.type];

  return (
    <div
      className={`absolute transition-all duration-75 ease-linear ${projectileClass}`}
      style={style}
    />
  );
};

export default ProjectileComponent;
