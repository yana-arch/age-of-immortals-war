
import React, { useState, useEffect, useCallback, useRef } from 'react';
// Fix: Import GoogleGenAI instead of the deprecated GoogleGenerativeAI.
import { GoogleGenAI } from "@google/genai";
import {
  PlayerState,
  UnitInstance,
  PlayerType,
  GameStatus,
  ProjectileInstance,
  VisualEffectInstance,
  Difficulty,
  FloatingTextInstance,
  GameSpeed,
  PlayerProfile,
  PlayerStats
} from './types';
import { AGES, UNITS, SPELLS, UPGRADES, TICK_RATE, BATTLEFIELD_WIDTH, INITIAL_PLAYER_STATE, FORMATION_CONFIG, DIFFICULTY_SETTINGS, TITLES } from './constants';
import Battlefield from './components/Battlefield';
import ControlPanel from './components/ControlPanel';
import StatusBar from './components/StatusBar';
import GameModal from './components/GameModal';
import { CpuChipIcon, SparklesIcon } from './components/Icons';
import Background from './components/Background';
import ConfirmationModal from './components/ConfirmationModal';
import GameSpeedControl from './components/GameSpeedControl';

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
  floatingTexts: [] as FloatingTextInstance[],
  spellCooldowns: {} as { [spellId: string]: number },
  gameStatus: GameStatus.MENU,
  gameTime: 0,
});

const getInitialPlayerProfile = (): PlayerProfile => {
    try {
        const savedProfile = localStorage.getItem('playerProfile');
        if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            if (parsed.stats && parsed.unlockedTitles) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Failed to load player profile from localStorage", error);
    }
    // Default profile
    return {
        stats: { wins: 0, eliteKills: 0, gamesPlayed: 0 },
        unlockedTitles: ['novice'],
        equippedTitle: 'novice',
    };
};

const StartMenu: React.FC<{ onStartGame: (mode: GameMode, difficulty: Difficulty) => void }> = ({ onStartGame }) => {
    const [selectedMode, setSelectedMode] = useState<GameMode>('ai');
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');

    const modeButtonStyle = (mode: GameMode) => {
        const isSelected = selectedMode === mode;
        const base = "group relative w-72 p-6 bg-gray-800 border-2 rounded-lg shadow-lg transition-all transform hover:scale-105";
        const selected = "bg-gray-700/80 scale-105 ring-4 ring-offset-2 ring-offset-black";
        const colors = mode === 'ai' 
            ? `border-purple-500/50 hover:border-purple-400 ${isSelected ? 'border-purple-400 ring-purple-400' : ''}`
            : `border-sky-500/50 hover:border-sky-400 ${isSelected ? 'border-sky-400 ring-sky-400' : ''}`;
        return `${base} ${colors} ${isSelected ? selected : ''}`;
    };
    
    const difficultyButtonStyle = (difficulty: Difficulty) => {
        const isSelected = selectedDifficulty === difficulty;
        const base = "px-8 py-3 rounded-lg text-white font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg";
        const selected = "ring-4 ring-offset-2 ring-offset-black";
        const colors = {
            easy: `bg-green-600 hover:bg-green-500 ${isSelected ? 'ring-green-400' : ''}`,
            normal: `bg-yellow-600 hover:bg-yellow-500 ${isSelected ? 'ring-yellow-400' : ''}`,
            hard: `bg-red-600 hover:bg-red-500 ${isSelected ? 'ring-red-400' : ''}`,
            super_hard: `bg-red-900 hover:bg-red-900 ${isSelected ? 'ring-red-900' : ''}`
        };
        return `${base} ${colors[difficulty]} ${isSelected ? selected : ''}`;
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-black text-white font-sans items-center justify-center">
            <Background />
            <div className="z-10 text-center flex flex-col items-center gap-12">
                <div>
                    <h1 className="text-6xl font-extrabold text-cyan-200 tracking-widest mb-4">TIÊN HIỆP CHIẾN KỶ</h1>
                    <h2 className="text-2xl text-gray-300">Chào Mừng Tu Tiên Giả</h2>
                </div>

                <div className="flex flex-col gap-10 items-center">
                    {/* Mode Selection */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-200 mb-4">Chọn Chế Độ Chơi</h3>
                        <div className="flex gap-8">
                            <button 
                                onClick={() => setSelectedMode('ai')}
                                className={modeButtonStyle('ai')}
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
                                onClick={() => setSelectedMode('scripted')}
                                className={modeButtonStyle('scripted')}
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

                    {/* Difficulty Selection */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-200 mb-4">Chọn Độ Khó</h3>
                        <div className="flex gap-4">
                            {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map(key => (
                                <button key={key} onClick={() => setSelectedDifficulty(key)} className={difficultyButtonStyle(key)}>
                                    {DIFFICULTY_SETTINGS[key].label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={() => onStartGame(selectedMode, selectedDifficulty)}
                    className="mt-4 px-12 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-2xl font-bold rounded-xl shadow-lg hover:shadow-cyan-500/50 transition-all transform hover:scale-110"
                >
                    Bắt Đầu
                </button>
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
    const [floatingTexts, setFloatingTexts] = useState<FloatingTextInstance[]>(getInitialState().floatingTexts);
    const [spellCooldowns, setSpellCooldowns] = useState<{ [spellId: string]: number }>(getInitialState().spellCooldowns);
    const [gameStatus, setGameStatus] = useState<GameStatus>(getInitialState().gameStatus);
    const [gameTime, setGameTime] = useState<number>(getInitialState().gameTime);
    const [targetingSpell, setTargetingSpell] = useState<string | null>(null);
    const [gameMode, setGameMode] = useState<GameMode | null>(null);
    const [difficulty, setDifficulty] = useState<Difficulty>('normal');
    const [gameSpeed, setGameSpeed] = useState<GameSpeed>(1);
    const [confirmation, setConfirmation] = useState<{ type: 'evolve' | 'upgrade', id?: string } | null>(null);
    const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(getInitialPlayerProfile);
    
    const lastDecisionTime = useRef(0);
    const unitsToAddRef = useRef<UnitInstance[]>([]);

    useEffect(() => {
        if (gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) {
            setPlayerProfile(currentProfile => {
                const newStats: PlayerStats = {
                    ...currentProfile.stats,
                    gamesPlayed: currentProfile.stats.gamesPlayed + 1,
                    wins: gameStatus === GameStatus.WON ? currentProfile.stats.wins + 1 : currentProfile.stats.wins,
                    eliteKills: currentProfile.stats.eliteKills + player.eliteKills,
                };
                
                const newlyUnlocked = Object.values(TITLES)
                    .filter(title => !currentProfile.unlockedTitles.includes(title.id) && title.isUnlocked(newStats))
                    .map(title => title.id);
                
                const newProfile = {
                    ...currentProfile,
                    stats: newStats,
                    unlockedTitles: [...currentProfile.unlockedTitles, ...newlyUnlocked],
                };

                localStorage.setItem('playerProfile', JSON.stringify(newProfile));
                return newProfile;
            });
        }
    }, [gameStatus, player.eliteKills]);


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
                    const settings = DIFFICULTY_SETTINGS[difficulty];
                    const hpMultiplier = settings.enemyUnitHpMultiplier || 1;
                    const finalHp = unitData.hp * hpMultiplier;
                    const newUnit: UnitInstance = {
                        id: `${PlayerType.ENEMY}_${unitData.id}_${Date.now()}`, unitId: unitData.id, owner: PlayerType.ENEMY,
                        hp: finalHp, maxHp: finalHp, position: 100,
                        attackCooldown: 1 / unitData.attackSpeed, status: 'moving',
                        yOffset: 0,
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
    }, [enemy, player, units, gameStatus, difficulty]);

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
                const settings = DIFFICULTY_SETTINGS[difficulty];
                const hpMultiplier = settings.enemyUnitHpMultiplier || 1;
                const finalHp = unitData.hp * hpMultiplier;
                const newUnit: UnitInstance = {
                    id: `${PlayerType.ENEMY}_${unitData.id}_${Date.now()}`,
                    unitId: unitData.id,
                    owner: PlayerType.ENEMY,
                    hp: finalHp,
                    maxHp: finalHp,
                    position: 100,
                    attackCooldown: 1 / unitData.attackSpeed,
                    status: 'moving',
                    yOffset: 0,
                };
                unitsToAddRef.current.push(newUnit);
                return; 
            }
        }
        // 3. Wait if nothing else is possible
    }, [enemy, difficulty]);


    useEffect(() => {
        const dyingUnits = units.filter(u => u.status === 'dying');
        if (dyingUnits.length > 0) {
            const timer = setTimeout(() => {
                setUnits(currentUnits => currentUnits.filter(u => u.status !== 'dying'));
            }, 500); // Increased time for death animation
            return () => clearTimeout(timer);
        }
    }, [units]);

    const gameTick = useCallback(() => {
        if (gameStatus !== GameStatus.PLAYING || !gameMode) return;
        const delta = (TICK_RATE / 1000) * gameSpeed;
        setGameTime(t => t + delta);

        setPlayer(p => ({...p, mana: Math.min(p.maxMana, p.mana + p.manaRegen * delta)}));
        setEnemy(e => ({...e, mana: Math.min(e.maxMana, e.mana + e.manaRegen * delta)}));

        const decisionInterval = gameMode === 'ai' 
            ? DIFFICULTY_SETTINGS[difficulty].aiDecisionInterval
            : DIFFICULTY_SETTINGS[difficulty].scriptedDecisionInterval;

        if (gameTime - lastDecisionTime.current > decisionInterval) {
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
        let newFloatingTexts: FloatingTextInstance[] = [];
        let newEffects: VisualEffectInstance[] = [];
        let playerDamage = 0, enemyDamage = 0, expGained = 0, eliteKillsThisTick = 0;

        const createDeathEffect = (dyingUnit: UnitInstance) => {
            const unitData = UNITS[dyingUnit.unitId];
            const effectType = unitData.role === 'elite' ? 'elite_death' : 'death_puff';
            const duration = unitData.role === 'elite' ? 800 : 500;
            newEffects.push({
                id: `eff_death_${dyingUnit.id}_${Date.now()}`,
                type: effectType,
                position: { x: dyingUnit.position, y: 10 },
                duration: duration,
                createdAt: Date.now()
            });
        };

        // --- START: FORMATION LOGIC ---
        const getFormationSpeed = (owner: PlayerType) => {
            const movingUnits = newUnits.filter(u => u.owner === owner && u.status === 'moving');
            if (movingUnits.length === 0) return 0;
            return Math.min(...movingUnits.map(u => UNITS[u.unitId].speed));
        };
        const playerFormationSpeed = getFormationSpeed(PlayerType.PLAYER);
        const enemyFormationSpeed = getFormationSpeed(PlayerType.ENEMY);

        [PlayerType.PLAYER, PlayerType.ENEMY].forEach(owner => {
            const ownedUnits = newUnits.filter(u => u.owner === owner);
            const unitsByRole: { [role: string]: UnitInstance[] } = {};
            ownedUnits.forEach(u => {
                const role = UNITS[u.unitId].role;
                if (!unitsByRole[role]) unitsByRole[role] = [];
                unitsByRole[role].push(u);
            });
            Object.keys(unitsByRole).forEach(role => {
                const config = FORMATION_CONFIG[role as keyof typeof FORMATION_CONFIG];
                const group = unitsByRole[role];
                const count = group.length;
                group.forEach((unit, index) => {
                    const targetY = (index - (count - 1) / 2) * config.ySpread;
                    unit.yOffset = (unit.yOffset || 0) * 0.95 + targetY * 0.05;
                });
            });
        });
        // --- END: FORMATION LOGIC ---


        newUnits.forEach(unit => {
            if (unit.status === 'dying') return;
            if (unit.hp <= 0) {
                 unit.status = 'dying'; 
                 createDeathEffect(unit);
                 return; 
            }
            
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
                    let attack = unitData.attack * (1 + (upgrades.unit_attack || 0) * 0.1);

                    if (!isPlayer) {
                        attack *= (DIFFICULTY_SETTINGS[difficulty].enemyUnitAttackMultiplier || 1);
                    }

                    if (unitData.projectile) {
                        newProjectiles.push({
                            id: `proj_${Date.now()}_${Math.random()}`, owner: unit.owner, damage: attack, type: unitData.projectile,
                            position: { x: unit.position, y: 10 }, from: { x: unit.position, y: 10 }, to: {x: 0, y: 0},
                            speed: 25, targetId: closestOpponent.id
                        });
                    } else {
                        closestOpponent.hp -= attack;
                        newFloatingTexts.push({
                            id: `ft-${unit.id}-${Date.now()}`,
                            text: `-${Math.round(attack)}`,
                            color: isPlayer ? 'text-yellow-300' : 'text-red-400',
                            position: { x: closestOpponent.position, y: 90 + (closestOpponent.yOffset || 0) },
                            createdAt: Date.now(),
                            duration: 1500,
                        });
                        if (closestOpponent.hp <= 0 && closestOpponent.status !== 'dying') {
                            closestOpponent.status = 'dying';
                            createDeathEffect(closestOpponent);
                            if (isPlayer) {
                                expGained += Math.floor(UNITS[closestOpponent.unitId].cost / 4);
                                if (UNITS[closestOpponent.unitId].role === 'elite') {
                                    eliteKillsThisTick++;
                                }
                            }
                        }
                        newEffects.push({ id: `eff_${Date.now()}`, type: 'hit_spark', position: { x: closestOpponent.position, y: 10 }, duration: 200, createdAt: Date.now() });
                    }
                }
            } else {
                unit.status = 'moving';
                const direction = isPlayer ? 1 : -1;
                const formationSpeed = isPlayer ? playerFormationSpeed : enemyFormationSpeed;
                const speed = formationSpeed > 0 ? formationSpeed : unitData.speed;
                unit.position += direction * speed * delta;

                const targetPosition = isPlayer ? BATTLEFIELD_WIDTH : 0;
                if ((isPlayer && unit.position >= targetPosition) || (!isPlayer && unit.position <= targetPosition)) {
                    unit.position = targetPosition;
                    unit.status = 'attacking';
                    unit.attackCooldown -= delta;
                    if(unit.attackCooldown <= 0){
                        unit.attackCooldown = 1 / unitData.attackSpeed;
                        unit.attackAnimationEnd = Date.now() + 300;
                        
                        const upgrades = isPlayer ? player.upgrades : { unit_attack: 0 };
                        let damage = unitData.attack * (1 + (upgrades.unit_attack || 0) * 0.1);

                        if (!isPlayer) {
                            damage *= (DIFFICULTY_SETTINGS[difficulty].enemyUnitAttackMultiplier || 1);
                        }

                        if (isPlayer) {
                            enemyDamage += damage;
                            newFloatingTexts.push({ id: `ft-base-${unit.id}-${Date.now()}`, text: `-${Math.round(damage)}`, color: 'text-red-400', position: { x: 5, y: 90 }, createdAt: Date.now(), duration: 1500 });
                        } else {
                            playerDamage += damage;
                            newFloatingTexts.push({ id: `ft-base-${unit.id}-${Date.now()}`, text: `-${Math.round(damage)}`, color: 'text-red-400', position: { x: 95, y: 90 }, createdAt: Date.now(), duration: 1500 });
                        }
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
                newFloatingTexts.push({
                    id: `ft-${p.id}-${Date.now()}`,
                    text: `-${Math.round(p.damage)}`,
                    color: p.owner === PlayerType.PLAYER ? 'text-yellow-300' : 'text-red-400',
                    position: { x: target.position, y: 90 + (target.yOffset || 0) },
                    createdAt: Date.now(),
                    duration: 1500,
                });
                if (target.hp <= 0 && target.status !== 'dying') {
                    target.status = 'dying';
                    createDeathEffect(target);
                    if (p.owner === PlayerType.PLAYER) {
                        expGained += Math.floor(UNITS[target.unitId].cost / 4);
                         if (UNITS[target.unitId].role === 'elite') {
                            eliteKillsThisTick++;
                        }
                    }
                }
                newEffects.push({ id: `eff_${Date.now()}`, type: 'hit_spark', position: { x: target.position, y: 10 }, duration: 200, createdAt: Date.now() });
                return null;
            }
            p.position.x += (dx / dist) * p.speed * delta;
            p.position.y += (dy / dist) * p.speed * delta;
            return p;
        }).filter(p => p) as ProjectileInstance[];
        
        setUnits(newUnits);
        setProjectiles([...updatedProjectiles, ...newProjectiles]);
        setEffects(e => [...e.filter(eff => Date.now() - eff.createdAt < eff.duration), ...newEffects]);
        setFloatingTexts(current => [...current.filter(ft => Date.now() - ft.createdAt < ft.duration), ...newFloatingTexts]);

        if (playerDamage > 0 || expGained > 0 || eliteKillsThisTick > 0) {
            setPlayer(p => ({
                ...p,
                hp: Math.max(0, p.hp - playerDamage),
                exp: Math.min(p.maxExp, p.exp + expGained),
                eliteKills: p.eliteKills + eliteKillsThisTick
            }));
        }
        if (enemyDamage > 0) setEnemy(e => ({...e, hp: Math.max(0, e.hp - enemyDamage)}));
        
        setSpellCooldowns(s => Object.keys(s).reduce((acc, key) => ({...acc, [key]: Math.max(0, s[key] - delta)}), {} as {[key: string]: number}));
        
        if (player.hp <= 0 && gameStatus === GameStatus.PLAYING) setGameStatus(GameStatus.LOST);
        if (enemy.hp <= 0 && gameStatus === GameStatus.PLAYING) setGameStatus(GameStatus.WON);
    }, [gameStatus, player, enemy, units, projectiles, gameTime, makeAIDecision, makeScriptedDecision, gameMode, difficulty, gameSpeed]);

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
            yOffset: 0,
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
                const healAmount = 50;
                const textsToAdd: FloatingTextInstance[] = [];
                setUnits(currentUnits => currentUnits.map(u => {
                    if (u.owner === PlayerType.PLAYER) {
                        const hpBefore = u.hp;
                        const newHp = Math.min(u.maxHp, u.hp + healAmount);
                        const actualHeal = newHp - hpBefore;
                        if (actualHeal > 0) {
                            textsToAdd.push({
                                id: `ft-heal-${u.id}-${Date.now()}`, text: `+${Math.round(actualHeal)}`, color: 'text-green-400',
                                position: { x: u.position, y: 90 + (u.yOffset || 0) }, createdAt: Date.now(), duration: 1500,
                            });
                        }
                        return {...u, hp: newHp};
                    }
                    return u;
                }));
                setFloatingTexts(fts => [...fts, ...textsToAdd]);
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
            const damage = 100;
            target.hp -= damage;
            setFloatingTexts(fts => [...fts, {
                id: `ft-spell-${target.id}-${Date.now()}`,
                text: `-${damage}`,
                color: 'text-orange-500',
                position: { x: target.position, y: 90 + (target.yOffset || 0) },
                createdAt: Date.now(),
                duration: 1500,
            }]);
            setEffects(e => [...e, { id: `eff_${Date.now()}`, type: 'fireball_impact', position: { x: target.position, y: 10 }, duration: 500, createdAt: Date.now() }]);
        }
        
        setTargetingSpell(null);
    };

    const handleCancelTargeting = () => {
        setTargetingSpell(null);
    };


    const executeEvolve = () => {
        const currentAgeData = AGES[player.age];
        const nextAgeData = AGES[player.age + 1];
        if (!nextAgeData) return;

        const cost = currentAgeData.evolveCost;
        const requiredExp = currentAgeData.evolveExp;

        if (player.mana >= cost && player.exp >= requiredExp) {
            setPlayer(p => ({
                ...p,
                mana: p.mana - cost,
                age: p.age + 1,
                exp: 0,
                maxExp: nextAgeData.evolveExp,
            }));
        }
    };
    
    const executeUpgrade = (upgradeId: string) => {
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

    const handleEvolve = () => {
        setConfirmation({ type: 'evolve' });
    };

    const handleUpgrade = (upgradeId: string) => {
        setConfirmation({ type: 'upgrade', id: upgradeId });
    };

    const handleConfirm = () => {
        if (!confirmation) return;
        if (confirmation.type === 'evolve') {
            executeEvolve();
        } else if (confirmation.type === 'upgrade' && confirmation.id) {
            executeUpgrade(confirmation.id);
        }
        setConfirmation(null);
    };

    const handleCancelConfirmation = () => {
        setConfirmation(null);
    };

    const handleEquipTitle = (titleId: string | null) => {
        setPlayerProfile(currentProfile => {
            const newProfile = { ...currentProfile, equippedTitle: titleId };
            localStorage.setItem('playerProfile', JSON.stringify(newProfile));
            return newProfile;
        });
    };

    const handleRestart = () => {
        const s = getInitialState();
        setPlayer(s.player); setEnemy(s.enemy); setUnits(s.units); setProjectiles(s.projectiles);
        setEffects(s.effects); setSpellCooldowns(s.spellCooldowns); setGameStatus(s.gameStatus);
        setFloatingTexts(s.floatingTexts); setGameTime(s.gameTime); lastDecisionTime.current = 0;
        setTargetingSpell(null);
        setGameMode(null);
        setGameSpeed(1);
    };
    
    const handleStartGame = (mode: GameMode, difficulty: Difficulty) => {
        const settings = DIFFICULTY_SETTINGS[difficulty];
        const s = getInitialState();

        setPlayer(s.player);
        setEnemy({
            ...s.enemy,
            hp: s.enemy.hp * settings.enemyHpMultiplier,
            maxHp: s.enemy.maxHp * settings.enemyHpMultiplier,
            manaRegen: s.enemy.manaRegen * settings.enemyManaRegenMultiplier,
        });

        setUnits(s.units);
        setProjectiles(s.projectiles);
        setEffects(s.effects);
        setFloatingTexts(s.floatingTexts);
        setSpellCooldowns(s.spellCooldowns);
        setGameTime(s.gameTime);
        lastDecisionTime.current = 0;
        setTargetingSpell(null);
        setGameSpeed(1);

        setGameMode(mode);
        setDifficulty(difficulty);
        setGameStatus(GameStatus.PLAYING);
    };


    if (gameStatus === GameStatus.MENU) {
        return <StartMenu onStartGame={handleStartGame} />;
    }
    
    return (
        <div className="flex flex-col h-screen w-screen bg-black text-white font-sans">
            <StatusBar player={player} enemy={enemy} playerProfile={playerProfile} />
            <GameSpeedControl currentGameSpeed={gameSpeed} onSpeedChange={setGameSpeed} />
            <Battlefield 
                player={player} 
                enemy={enemy} 
                units={units} 
                projectiles={projectiles} 
                effects={effects}
                floatingTexts={floatingTexts}
                targetingSpell={targetingSpell}
                onUnitTargeted={handleCastTargetedSpell}
            />
            <ControlPanel
                player={player}
                playerProfile={playerProfile}
                spellCooldowns={spellCooldowns}
                onSummonUnit={handleSummonUnit}
                onCastSpell={handleCastSpell}
                onEvolve={handleEvolve}
                onUpgrade={handleUpgrade}
                onEquipTitle={handleEquipTitle}
                targetingSpell={targetingSpell}
                onCancelTargeting={handleCancelTargeting}
            />
            <GameModal status={gameStatus} onRestart={handleRestart} />
            <ConfirmationModal
                confirmation={confirmation}
                player={player}
                onConfirm={handleConfirm}
                onCancel={handleCancelConfirmation}
            />
        </div>
    );
};

export default App;