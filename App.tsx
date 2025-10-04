import React, { useState, useEffect, useCallback, useRef } from 'react';
// Fix: Import GoogleGenAI instead of the deprecated GoogleGenerativeAI.
import { GoogleGenAI } from "@google/genai";
import {
  PlayerState,
  UnitInstance,
  PlayerType,
  GameStatus,
  ProjectileInstance,
  VisualEffectInstance
} from './types';
import { AGES, UNITS, SPELLS, UPGRADES, TICK_RATE, BATTLEFIELD_WIDTH, INITIAL_PLAYER_STATE } from './constants';
import Battlefield from './components/Battlefield';
import ControlPanel from './components/ControlPanel';
import StatusBar from './components/StatusBar';
import GameModal from './components/GameModal';
import { CpuChipIcon, SparklesIcon } from './components/Icons';
import Background from './components/Background';

const useGameLoop = (callback: () => void, interval: number) => {
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; }, [callback]);

  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    const loop = () => {
      frameId = requestAnimationFrame(loop);
      const now = performance.now();
      const delta = now - lastTime;
      if (delta > interval) {
        lastTime = now - (delta % interval);
        callbackRef.current();
      }
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [interval]);
};

let ai: GoogleGenAI | undefined;
if (process.env.API_KEY) {
  // Fix: Initialize GoogleGenAI with a named apiKey object as per guidelines.
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

type GameMode = 'ai' | 'scripted';

const getInitialState = () => ({
  player: { ...INITIAL_PLAYER_STATE },
  enemy: { ...INITIAL_PLAYER_STATE, manaRegen: 3 },
  units: [] as UnitInstance[],
  projectiles: [] as ProjectileInstance[],
  effects: [] as VisualEffectInstance[],
  spellCooldowns: {} as { [spellId: string]: number },
  gameStatus: GameStatus.MENU,
  gameTime: 0,
});

const GameModeSelection: React.FC<{ onSelectMode: (mode: GameMode) => void }> = ({ onSelectMode }) => {
    return (
        <div className="flex flex-col h-screen w-screen bg-black text-white font-sans items-center justify-center">
            <Background />
            <div className="z-10 text-center">
                <h1 className="text-6xl font-extrabold text-cyan-200 tracking-widest mb-4">TIÊN HIỆP CHIẾN KỶ</h1>
                <h2 className="text-2xl text-gray-300 mb-12">Chọn Chế Độ Chơi</h2>
                <div className="flex gap-8">
                    <button 
                        onClick={() => onSelectMode('ai')}
                        className="group relative w-64 p-6 bg-gray-800 border-2 border-purple-500/50 rounded-lg shadow-lg hover:bg-gray-700/80 hover:border-purple-400 transition-all transform hover:scale-105"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <SparklesIcon className="w-8 h-8 text-purple-400"/>
                            <span className="text-2xl font-bold">Đấu Với AI (Gemini)</span>
                        </div>
                        <p className="mt-3 text-sm text-gray-400">
                            Thách đấu AI linh hoạt với chiến thuật thích ứng theo thời gian thực.
                        </p>
                    </button>
                    <button 
                        onClick={() => onSelectMode('scripted')}
                        className="group relative w-64 p-6 bg-gray-800 border-2 border-sky-500/50 rounded-lg shadow-lg hover:bg-gray-700/80 hover:border-sky-400 transition-all transform hover:scale-105"
                    >
                         <div className="flex items-center justify-center gap-3">
                            <CpuChipIcon className="w-8 h-8 text-sky-400"/>
                            <span className="text-2xl font-bold">Đấu Với Máy (Logic)</span>
                        </div>
                        <p className="mt-3 text-sm text-gray-400">
                           Đối mặt với máy có logic đơn giản, dễ đoán. Hoàn hảo để luyện tập.
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [player, setPlayer] = useState<PlayerState>(getInitialState().player);
    const [enemy, setEnemy] = useState<PlayerState>(getInitialState().enemy);
    const [units, setUnits] = useState<UnitInstance[]>(getInitialState().units);
    const [projectiles, setProjectiles] = useState<ProjectileInstance[]>(getInitialState().projectiles);
    const [effects, setEffects] = useState<VisualEffectInstance[]>(getInitialState().effects);
    const [spellCooldowns, setSpellCooldowns] = useState<{ [spellId: string]: number }>(getInitialState().spellCooldowns);
    const [gameStatus, setGameStatus] = useState<GameStatus>(getInitialState().gameStatus);
    const [gameTime, setGameTime] = useState<number>(getInitialState().gameTime);
    const [targetingSpell, setTargetingSpell] = useState<string | null>(null);
    const [gameMode, setGameMode] = useState<GameMode | null>(null);
    
    const lastDecisionTime = useRef(0);
    const unitsToAddRef = useRef<UnitInstance[]>([]);

    const makeAIDecision = useCallback(async () => {
        if (!ai || gameStatus !== GameStatus.PLAYING) return;
        
        const gameState = {
            ai_mana: enemy.mana, ai_hp: enemy.hp, ai_age: AGES[enemy.age].name,
            ai_units: units.filter(u => u.owner === PlayerType.ENEMY).map(u => UNITS[u.unitId].name),
            player_hp: player.hp, player_age: AGES[player.age].name,
            player_units: units.filter(u => u.owner === PlayerType.PLAYER).map(u => UNITS[u.unitId].name),
            summonable_units: AGES[enemy.age].units.map(id => ({ name: UNITS[id].name, cost: UNITS[id].cost })),
            can_evolve: AGES[enemy.age + 1] && enemy.mana >= AGES[enemy.age].evolveCost
        };

        const prompt = `You are an AI for a tower defense game. Decide the best action: SUMMON, EVOLVE, or WAIT.
        - To summon a unit: 'SUMMON unit_id' (e.g., 'SUMMON swordsman').
        - To evolve to the next age: 'EVOLVE'.
        - To save mana: 'WAIT'.
        Current game state: ${JSON.stringify(gameState, null, 2)}
        Your decision (one line):`;

        try {
            // Fix: Use `ai.models.generateContent` with the correct model 'gemini-2.5-flash'.
            const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            // Fix: Access text via the `.text` property directly.
            const text = result.text;
            const [action, param] = text.trim().split(' ');

            if (action === "SUMMON" && param) {
                const unitData = Object.values(UNITS).find(u => u.id.toLowerCase() === param.toLowerCase());
                if (unitData && enemy.mana >= unitData.cost) {
                    setEnemy(e => ({...e, mana: e.mana - unitData.cost}));
                    const newUnit: UnitInstance = {
                        id: `${PlayerType.ENEMY}_${unitData.id}_${Date.now()}`, unitId: unitData.id, owner: PlayerType.ENEMY,
                        hp: unitData.hp, maxHp: unitData.hp, position: 100,
                        attackCooldown: 1 / unitData.attackSpeed, status: 'moving',
                    };
                    unitsToAddRef.current.push(newUnit);
                }
            } else if (action === "EVOLVE") {
                const cost = AGES[enemy.age].evolveCost;
                if (AGES[enemy.age + 1] && enemy.mana >= cost) {
                    setEnemy(e => ({...e, mana: e.mana - cost, age: e.age + 1}));
                }
            }
        } catch(e) { console.error("AI Error:", e); }
    }, [enemy, player, units, gameStatus]);

    const makeScriptedDecision = useCallback(() => {
        // 1. Evolve if possible
        const evolveCost = AGES[enemy.age].evolveCost;
        if (AGES[enemy.age + 1] && enemy.mana >= evolveCost) {
            setEnemy(e => ({ ...e, mana: e.mana - evolveCost, age: e.age + 1 }));
            return;
        }

        // 2. Summon most expensive unit possible
        const availableUnits = AGES[enemy.age].units.map(id => UNITS[id]).sort((a, b) => b.cost - a.cost);
        for (const unitData of availableUnits) {
            if (enemy.mana >= unitData.cost) {
                setEnemy(e => ({ ...e, mana: e.mana - unitData.cost }));
                const newUnit: UnitInstance = {
                    id: `${PlayerType.ENEMY}_${unitData.id}_${Date.now()}`,
                    unitId: unitData.id,
                    owner: PlayerType.ENEMY,
                    hp: unitData.hp,
                    maxHp: unitData.hp,
                    position: 100,
                    attackCooldown: 1 / unitData.attackSpeed,
                    status: 'moving',
                };
                unitsToAddRef.current.push(newUnit);
                return; 
            }
        }
        // 3. Wait if nothing else is possible
    }, [enemy]);


    useEffect(() => {
        const dyingUnits = units.filter(u => u.status === 'dying');
        if (dyingUnits.length > 0) {
            const timer = setTimeout(() => {
                setUnits(currentUnits => currentUnits.filter(u => u.status !== 'dying'));
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [units]);

    const gameTick = useCallback(() => {
        if (gameStatus !== GameStatus.PLAYING) return;
        const delta = TICK_RATE / 1000;
        setGameTime(t => t + delta);

        setPlayer(p => ({...p, mana: Math.min(p.maxMana, p.mana + p.manaRegen * delta)}));
        setEnemy(e => ({...e, mana: Math.min(e.maxMana, e.mana + e.manaRegen * delta)}));

        if (gameTime - lastDecisionTime.current > (gameMode === 'ai' ? 10 : 3)) {
            if (gameMode === 'ai') {
                makeAIDecision();
            } else if (gameMode === 'scripted') {
                makeScriptedDecision();
            }
            lastDecisionTime.current = gameTime;
        }

        const unitsFromRef = unitsToAddRef.current;
        unitsToAddRef.current = [];

        let newUnits = [...units, ...unitsFromRef];
        let newProjectiles: ProjectileInstance[] = [];
        let playerDamage = 0, enemyDamage = 0;

        newUnits.forEach(unit => {
            if (unit.status === 'dying') return;
            if (unit.hp <= 0) { unit.status = 'dying'; return; }
            
            const isPlayer = unit.owner === PlayerType.PLAYER;
            const opponents = newUnits.filter(u => u.owner !== unit.owner && u.status !== 'dying');
            const { closestOpponent, minDistance } = opponents.reduce((acc, opp) => {
                const distance = Math.abs(unit.position - opp.position);
                return distance < acc.minDistance ? { closestOpponent: opp, minDistance: distance } : acc;
            }, { closestOpponent: null as UnitInstance | null, minDistance: Infinity });

            const unitData = UNITS[unit.unitId];
            if (closestOpponent && minDistance <= unitData.range) {
                unit.status = 'attacking';
                unit.attackCooldown -= delta;
                if (unit.attackCooldown <= 0) {
                    unit.attackCooldown = 1 / unitData.attackSpeed;
                    unit.attackAnimationEnd = Date.now() + 300;
                    const upgrades = isPlayer ? player.upgrades : { unit_attack: 0 };
                    const attack = unitData.attack * (1 + (upgrades.unit_attack || 0) * 0.1);

                    if (unitData.projectile) {
                        newProjectiles.push({
                            id: `proj_${Date.now()}_${Math.random()}`, owner: unit.owner, damage: attack, type: unitData.projectile,
                            position: { x: unit.position, y: 10 }, from: { x: unit.position, y: 10 }, to: {x: 0, y: 0},
                            speed: 25, targetId: closestOpponent.id
                        });
                    } else {
                        closestOpponent.hp -= attack;
                        setEffects(e => [...e, { id: `eff_${Date.now()}`, type: 'explosion', position: { x: closestOpponent.position, y: 10 }, duration: 300, createdAt: Date.now() }]);
                    }
                }
            } else {
                unit.status = 'moving';
                const direction = isPlayer ? 1 : -1;
                unit.position += direction * unitData.speed * delta;
                const targetPosition = isPlayer ? BATTLEFIELD_WIDTH : 0;
                if ((isPlayer && unit.position >= targetPosition) || (!isPlayer && unit.position <= targetPosition)) {
                    unit.position = targetPosition;
                    unit.status = 'attacking';
                    unit.attackCooldown -= delta;
                    if(unit.attackCooldown <= 0){
                        unit.attackCooldown = 1 / unitData.attackSpeed;
                        unit.attackAnimationEnd = Date.now() + 300;
                        if (isPlayer) enemyDamage += unitData.attack; else playerDamage += unitData.attack;
                    }
                }
            }
        });

        const updatedProjectiles = projectiles.map(p => {
            const target = newUnits.find(u => u.id === p.targetId);
            if (!target || target.status === 'dying') return null;
            const dx = target.position - p.position.x, dy = 10 - p.position.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 1) {
                target.hp -= p.damage;
                setEffects(e => [...e, { id: `eff_${Date.now()}`, type: 'explosion', position: { x: target.position, y: 10 }, duration: 300, createdAt: Date.now() }]);
                return null;
            }
            p.position.x += (dx / dist) * p.speed * delta;
            p.position.y += (dy / dist) * p.speed * delta;
            return p;
        }).filter(p => p) as ProjectileInstance[];
        
        setUnits(newUnits);
        setProjectiles([...updatedProjectiles, ...newProjectiles]);
        setEffects(e => e.filter(eff => Date.now() - eff.createdAt < eff.duration));

        if (playerDamage > 0) setPlayer(p => ({...p, hp: Math.max(0, p.hp - playerDamage)}));
        if (enemyDamage > 0) setEnemy(e => ({...e, hp: Math.max(0, e.hp - enemyDamage)}));
        
        setSpellCooldowns(s => Object.keys(s).reduce((acc, key) => ({...acc, [key]: Math.max(0, s[key] - delta)}), {} as {[key: string]: number}));
        
        if (player.hp <= 0 && gameStatus === GameStatus.PLAYING) setGameStatus(GameStatus.LOST);
        if (enemy.hp <= 0 && gameStatus === GameStatus.PLAYING) setGameStatus(GameStatus.WON);
    }, [gameStatus, player, enemy, units, projectiles, gameTime, makeAIDecision, makeScriptedDecision, gameMode]);

    useGameLoop(gameTick, TICK_RATE);
    
    const handleSummonUnit = (unitId: string) => {
        const unitData = UNITS[unitId];
        if (player.mana < unitData.cost) return;
        setPlayer(p => ({...p, mana: p.mana - unitData.cost}));
        const hpBonus = 1 + (player.upgrades.unit_hp || 0) * 0.1;
        const newUnit: UnitInstance = {
            id: `${PlayerType.PLAYER}_${unitId}_${Date.now()}`, unitId, owner: PlayerType.PLAYER,
            hp: unitData.hp * hpBonus, maxHp: unitData.hp * hpBonus, position: 0,
            attackCooldown: 1 / unitData.attackSpeed, status: 'moving',
        };
        setUnits(u => [...u, newUnit]);
    };

    const handleCastSpell = (spellId: string) => {
        const spell = SPELLS[spellId];
        if (player.mana < spell.cost || (spellCooldowns[spellId] || 0) > 0) return;

        if (spell.requiresTarget) {
            setTargetingSpell(spellId);
        } else {
            setPlayer(p => ({...p, mana: p.mana - spell.cost}));
            setSpellCooldowns(s => ({...s, [spellId]: spell.cooldown}));
            if (spellId === 'heal') {
                setUnits(currentUnits => currentUnits.map(u => u.owner === PlayerType.PLAYER ? {...u, hp: Math.min(u.maxHp, u.hp + 50)}: u));
                setEffects(e => [...e, { id: `eff_${Date.now()}`, type: 'heal', position: { x: 20, y: 50 }, duration: 1000, createdAt: Date.now() }]);
            }
        }
    };
    
    const handleCastTargetedSpell = (targetId: string) => {
        if (!targetingSpell) return;
        
        const spell = SPELLS[targetingSpell];
        const target = units.find(u => u.id === targetId);

        if (!target || target.owner !== PlayerType.ENEMY || player.mana < spell.cost) {
            setTargetingSpell(null);
            return;
        }

        setPlayer(p => ({...p, mana: p.mana - spell.cost}));
        setSpellCooldowns(s => ({...s, [targetingSpell]: spell.cooldown}));
        
        if (targetingSpell === 'fireball') {
            target.hp -= 100;
            setEffects(e => [...e, { id: `eff_${Date.now()}`, type: 'explosion', position: { x: target.position, y: 10 }, duration: 500, createdAt: Date.now() }]);
        }
        
        setTargetingSpell(null);
    };

    const handleCancelTargeting = () => {
        setTargetingSpell(null);
    };


    const handleEvolve = () => {
        const cost = AGES[player.age].evolveCost;
        if (player.mana >= cost && AGES[player.age + 1]) {
            setPlayer(p => ({...p, mana: p.mana - cost, age: p.age + 1}));
        }
    };
    
    const handleUpgrade = (upgradeId: string) => {
        const upgrade = UPGRADES[upgradeId];
        const level = player.upgrades[upgradeId] || 0;
        if (level >= upgrade.maxLevel) return;
        const cost = upgrade.cost(level);
        if (player.mana < cost) return;
        setPlayer(p => {
            let newPlayer = {...p, mana: p.mana - cost, upgrades: {...p.upgrades, [upgradeId]: level + 1}};
            if (upgradeId === 'base_hp') newPlayer = {...newPlayer, maxHp: newPlayer.maxHp + 250, hp: newPlayer.hp + 250};
            if (upgradeId === 'mana_regen') newPlayer = {...newPlayer, manaRegen: newPlayer.manaRegen + 0.5};
            return newPlayer;
        });
    };

    const handleRestart = () => {
        const s = getInitialState();
        setPlayer(s.player); setEnemy(s.enemy); setUnits(s.units); setProjectiles(s.projectiles);
        setEffects(s.effects); setSpellCooldowns(s.spellCooldowns); setGameStatus(s.gameStatus);
        setGameTime(s.gameTime); lastDecisionTime.current = 0;
        setTargetingSpell(null);
        setGameMode(null);
    };
    
    const handleSelectMode = (mode: GameMode) => {
        setGameMode(mode);
        if (mode === 'scripted') {
            setEnemy(e => ({ ...e, manaRegen: 5 })); // Buff scripted AI slightly
        }
        setGameStatus(GameStatus.PLAYING);
    };

    if (gameStatus === GameStatus.MENU) {
        return <GameModeSelection onSelectMode={handleSelectMode} />;
    }
    
    return (
        <div className="flex flex-col h-screen w-screen bg-black text-white font-sans">
            <StatusBar player={player} enemy={enemy} />
            <Battlefield 
                player={player} 
                enemy={enemy} 
                units={units} 
                projectiles={projectiles} 
                effects={effects}
                targetingSpell={targetingSpell}
                onUnitTargeted={handleCastTargetedSpell}
            />
            <ControlPanel
                player={player}
                spellCooldowns={spellCooldowns}
                onSummonUnit={handleSummonUnit}
                onCastSpell={handleCastSpell}
                onEvolve={handleEvolve}
                onUpgrade={handleUpgrade}
                targetingSpell={targetingSpell}
                onCancelTargeting={handleCancelTargeting}
            />
            <GameModal status={gameStatus} onRestart={handleRestart} />
        </div>
    );
};

export default App;