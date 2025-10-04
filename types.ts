import React from 'react';

export enum PlayerType {
  PLAYER,
  ENEMY,
}

export enum GameStatus {
  MENU,
  PLAYING,
  WON,
  LOST,
}

export interface UnitData {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  cost: number;
  hp: number;
  attack: number;
  range: number; // in % of battlefield width
  speed: number; // in % of battlefield width per second
  attackSpeed: number; // attacks per second
  projectile?: 'arrow' | 'fireball';
}

export interface UnitInstance {
  id:string;
  unitId: string;
  owner: PlayerType;
  hp: number;
  maxHp: number;
  position: number; // 0-100
  attackCooldown: number;
  status: 'idle' | 'moving' | 'attacking' | 'dying';
  attackAnimationEnd?: number;
}

export interface SpellData {
    id: string;
    name: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    cost: number;
    cooldown: number;
    requiresTarget?: boolean;
}

export interface UpgradeData {
    id: string;
    name: string;
    icon: React.FC<{ className?: string }>;
    maxLevel: number;
    cost: (level: number) => number;
    description: (level: number) => string;
}

export interface AgeData {
    name: string;
    description: string;
    units: string[];
    spells: string[];
    evolveCost: number;
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  manaRegen: number;
  age: number;
  upgrades: { [upgradeId: string]: number };
}

export interface ProjectileInstance {
  id: string;
  owner: PlayerType;
  from: { x: number; y: number };
  to: { x: number; y: number };
  position: { x: number; y: number };
  speed: number;
  damage: number;
  type: 'arrow' | 'fireball';
  targetId: string;
}

export interface VisualEffectInstance {
    id: string;
    type: 'explosion' | 'heal';
    position: { x: number; y: number };
    duration: number; // in ms
    createdAt: number;
}