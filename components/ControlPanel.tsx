import React, { useState } from 'react';
import { PlayerState, PlayerProfile } from '../types';
import { AGES, UNITS, SPELLS, UPGRADES, TITLES } from '../constants';
import { StarIcon, ArrowUpTrayIcon, SparklesIcon, BookmarkSquareIcon } from './Icons';

interface ControlPanelProps {
  player: PlayerState;
  playerProfile: PlayerProfile;
  spellCooldowns: { [spellId: string]: number };
  onSummonUnit: (unitId: string) => void;
  onCastSpell: (spellId: string) => void;
  onEvolve: () => void;
  onUpgrade: (upgradeId: string) => void;
  onEquipTitle: (titleId: string | null) => void;
  targetingSpell: string | null;
  onCancelTargeting: () => void;
}

interface ControlButtonProps {
    onClick: () => void;
    disabled: boolean;
    cost?: number;
    cooldown?: number;
    maxCooldown?: number;
    children: React.ReactNode;
    className?: string;
    isEvolve?: boolean;
    isUpgrade?: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({ onClick, disabled, cost, cooldown, maxCooldown, children, className, isEvolve = false, isUpgrade = false }) => {
    const cooldownPercentage = maxCooldown && cooldown ? (cooldown / maxCooldown) * 100 : 0;

    let enabledStyle = "bg-gradient-to-br from-sky-600 to-indigo-800 border-cyan-400 text-white hover:from-sky-500 hover:to-indigo-700";
    if (isEvolve) {
        enabledStyle = "bg-gradient-to-br from-yellow-500 to-amber-700 border-yellow-300 text-white hover:from-yellow-400 hover:to-amber-600";
    } else if (isUpgrade) {
        enabledStyle = "bg-gradient-to-br from-emerald-600 to-teal-800 border-green-400 text-white hover:from-emerald-500 hover:to-teal-700";
    }

    const baseStyle = "relative flex flex-col items-center justify-center w-20 h-24 p-1 rounded-lg shadow-lg border-2 transition-all duration-200 transform hover:scale-105";
    const disabledStyle = "bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed";

    return (
        <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${disabled ? disabledStyle : enabledStyle} ${className}`}>
            {children}
            {cost !== undefined && <span className="absolute bottom-1 text-xs font-semibold">{cost} Mana</span>}
            {cooldown !== undefined && cooldown > 0 && maxCooldown && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                    <span className="text-xl font-bold">{cooldown.toFixed(1)}</span>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-lg">
                         <div className="bg-cyan-400 h-full" style={{width: `${100-cooldownPercentage}%`}}></div>
                    </div>
                </div>
            )}
        </button>
    );
};

const Tooltip: React.FC<{title: string, cost?: number, description: string, stats?: React.ReactNode, children?: React.ReactNode}> = ({ title, cost, description, stats, children }) => (
    <div className="absolute bottom-full mb-3 w-56 p-3 bg-gray-900 border-2 border-cyan-400/50 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none transform -translate-x-1/2 left-1/2 z-10 scale-95 group-hover:scale-100 duration-200 origin-bottom">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-cyan-300">{title}</h3>
            {cost !== undefined && <span className="text-sm font-semibold text-yellow-400">{cost} Mana</span>}
        </div>
        <p className="text-xs text-gray-400 mt-1 italic">{description}</p>
        {stats && <div className="mt-2 text-left text-xs space-y-1 text-gray-200 grid grid-cols-2 gap-x-4">{stats}</div>}
        {children}
        <div className="absolute bottom-[-9px] left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 transform rotate-45 border-b-2 border-r-2 border-cyan-400/50"></div>
    </div>
);


const ControlPanel: React.FC<ControlPanelProps> = ({ player, playerProfile, spellCooldowns, onSummonUnit, onCastSpell, onEvolve, onUpgrade, onEquipTitle, targetingSpell, onCancelTargeting }) => {
  const [activeTab, setActiveTab] = useState('combat');
  const currentAge = AGES[player.age];
  const nextAge = AGES[player.age + 1];

  const TabButton: React.FC<{tabId: string, children: React.ReactNode}> = ({tabId, children}) => {
    const isActive = activeTab === tabId;
    return (
      <button 
        onClick={() => setActiveTab(tabId)}
        className={`px-4 py-2 text-lg font-bold rounded-t-lg transition-colors ${isActive ? 'bg-gray-700/60 border-b-2 border-cyan-400 text-white' : 'bg-black/30 text-gray-400'}`}
      >
        {children}
      </button>
    )
  }

  return (
    <div className="w-full bg-gray-800/50 backdrop-blur-md border-t-2 border-cyan-500/30 flex flex-col">
      <div className="flex px-4">
        <TabButton tabId="combat">
            <div className="flex items-center gap-2"><SparklesIcon className="w-5 h-5"/>Chiến Đấu</div>
        </TabButton>
        <TabButton tabId="upgrades">
            <div className="flex items-center gap-2"><ArrowUpTrayIcon className="w-5 h-5"/>Nâng Cấp</div>
        </TabButton>
        <TabButton tabId="titles">
            <div className="flex items-center gap-2"><BookmarkSquareIcon className="w-5 h-5"/>Danh Hiệu</div>
        </TabButton>
      </div>
      <div className="relative h-48 flex-grow p-2 flex items-center justify-center gap-2 bg-gray-700/30">
        {activeTab === 'combat' && (
          <>
            <div className="flex gap-2">
              {currentAge.units.map(unitId => {
                const unit = UNITS[unitId];
                return (
                    <div key={unitId} className="relative group">
                        <Tooltip title={unit.name} cost={unit.cost} description={unit.description} stats={
                            <>
                                <span>HP: <span className="font-semibold text-white">{unit.hp}</span></span>
                                <span>Tấn công: <span className="font-semibold text-white">{unit.attack}</span></span>
                                <span>Tầm đánh: <span className="font-semibold text-white">{unit.range}</span></span>
                                <span>Tốc độ: <span className="font-semibold text-white">{unit.speed}</span></span>
                                <span className="col-span-2">Tốc độ đánh: <span className="font-semibold text-white">{unit.attackSpeed} /s</span></span>
                            </>
                        }/>
                        <ControlButton onClick={() => onSummonUnit(unitId)} disabled={player.mana < unit.cost} cost={unit.cost}>
                            <unit.icon className="w-8 h-8 mb-1" />
                            <span className="text-xs text-center">{unit.name}</span>
                        </ControlButton>
                    </div>
                );
              })}
            </div>

            <div className="w-px h-full bg-cyan-500/30 mx-4"></div>

            <div className="flex gap-2">
              {currentAge.spells.map(spellId => {
                const spell = SPELLS[spellId];
                const cd = spellCooldowns[spellId];
                return (
                  <div key={spellId} className="relative group">
                    <Tooltip 
                        title={spell.name} 
                        cost={spell.cost} 
                        description={spell.description}
                        stats={
                            <span className="col-span-2">
                                Hồi chiêu: <span className="font-semibold text-white">{spell.cooldown}s</span>
                            </span>
                        }
                    />
                    <ControlButton onClick={() => onCastSpell(spellId)} disabled={player.mana < spell.cost || cd > 0} cost={spell.cost} cooldown={cd} maxCooldown={spell.cooldown}>
                        <spell.icon className="w-8 h-8 mb-1" />
                        <span className="text-xs text-center">{spell.name}</span>
                    </ControlButton>
                  </div>
                );
              })}
            </div>
            
            <div className="w-px h-full bg-cyan-500/30 mx-4"></div>

            {nextAge && (() => {
                const newUnits = nextAge.units.filter(u => !currentAge.units.includes(u));
                const newSpells = nextAge.spells.filter(s => !currentAge.spells.includes(s));
                const requiredExp = currentAge.evolveExp;
                const canEvolve = player.mana >= currentAge.evolveCost && player.exp >= requiredExp;
                return (
                  <div className="relative group">
                    <Tooltip 
                      title={`Tiến hóa: ${nextAge.name}`} 
                      cost={currentAge.evolveCost} 
                      description={nextAge.description}
                    >
                      <div className="mt-2 text-left text-xs space-y-1 text-gray-200">
                        <span>Kinh nghiệm: <span className={`font-semibold ${player.exp >= requiredExp ? 'text-green-300' : 'text-white'}`}>{player.exp} / {requiredExp}</span></span>
                      </div>
                      {(newUnits.length > 0 || newSpells.length > 0) && (
                        <div className="mt-2 pt-2 border-t border-cyan-500/20">
                          <h4 className="font-bold text-sm text-white">Mở Khóa Mới:</h4>
                          <ul className="text-xs text-gray-300 list-disc list-inside mt-1 space-y-1">
                            {newUnits.map(unitId => <li key={unitId}>Lính: <span className="font-semibold">{UNITS[unitId].name}</span></li>)}
                            {newSpells.map(spellId => <li key={spellId}>Phép: <span className="font-semibold">{SPELLS[spellId].name}</span></li>)}
                          </ul>
                        </div>
                      )}
                    </Tooltip>
                    <ControlButton onClick={onEvolve} disabled={!canEvolve} cost={currentAge.evolveCost} isEvolve={true} className={canEvolve ? 'animate-pulse' : ''}>
                        <StarIcon className="w-8 h-8 mb-1"/>
                        <span className="text-xs text-center font-bold">Tiến Hóa</span>
                    </ControlButton>
                  </div>
                );
              })()
            }
          </>
        )}
        {activeTab === 'upgrades' && (
          <div className="flex gap-2">
            {Object.values(UPGRADES).map(upgrade => {
              const currentLevel = player.upgrades[upgrade.id] || 0;
              const isMaxLevel = currentLevel >= upgrade.maxLevel;
              const cost = isMaxLevel ? undefined : upgrade.cost(currentLevel);
              const canAfford = !isMaxLevel && cost !== undefined && player.mana >= cost;
              const isDisabled = isMaxLevel || (cost !== undefined && player.mana < cost);
              const highlightClass = canAfford ? 'ring-2 ring-offset-2 ring-offset-gray-700/30 ring-green-400 animate-pulse' : '';

              return (
                <div key={upgrade.id} className="relative group">
                    <Tooltip 
                        title={upgrade.name} 
                        cost={cost} 
                        description={upgrade.description(0).split(' Hiện tại:')[0]}
                    >
                        <div className="mt-2 text-left text-xs space-y-1 text-gray-200">
                            <span>Hiện tại: <span className="font-semibold text-white">{upgrade.description(currentLevel).split('Hiện tại: ')[1]}</span></span>
                            {!isMaxLevel && (
                                <span>Tiếp theo: <span className="font-semibold text-green-300">{upgrade.description(currentLevel + 1).split('Hiện tại: ')[1]}</span></span>
                            )}
                        </div>

                        <div className="mt-2 text-xs text-cyan-300 font-bold">
                            {isMaxLevel ? 'Cấp Tối Đa' : `Cấp ${currentLevel} / ${upgrade.maxLevel}`}
                        </div>
                    </Tooltip>
                    <ControlButton onClick={() => onUpgrade(upgrade.id)} disabled={isDisabled} cost={cost} isUpgrade={true} className={highlightClass}>
                        <upgrade.icon className="w-8 h-8 mb-1" />
                        <span className="text-xs text-center">{upgrade.name}</span>
                        <div className="flex justify-center items-center gap-1 mt-1.5">
                          {[...Array(upgrade.maxLevel)].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-sm ${i < currentLevel ? 'bg-cyan-300' : 'bg-gray-600'}`}></div>
                          ))}
                        </div>
                    </ControlButton>
                </div>
              );
            })}
          </div>
        )}
        {activeTab === 'titles' && (
          <div className="grid grid-cols-5 gap-3">
             {Object.values(TITLES).map(title => {
                const isUnlocked = playerProfile.unlockedTitles.includes(title.id);
                const isEquipped = playerProfile.equippedTitle === title.id;
                
                const baseStyle = "flex flex-col items-center justify-center w-32 h-20 p-2 rounded-lg shadow-lg border-2 transition-all duration-200 transform hover:scale-105 text-center";
                let stateStyle = "bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed";
                if(isUnlocked) {
                    stateStyle = "bg-gradient-to-br from-purple-600 to-indigo-800 border-purple-400 text-white hover:from-purple-500 hover:to-indigo-700 cursor-pointer";
                }
                if(isEquipped) {
                    stateStyle += " ring-4 ring-yellow-300 ring-offset-2 ring-offset-gray-700/30";
                }

                return (
                    <div key={title.id} className="relative group">
                        <Tooltip title={title.name} description={title.description}/>
                        <button 
                            onClick={() => isUnlocked && onEquipTitle(isEquipped ? null : title.id)}
                            disabled={!isUnlocked}
                            className={`${baseStyle} ${stateStyle}`}
                        >
                            <span className="font-bold text-sm">{title.name}</span>
                        </button>
                    </div>
                );
            })}
          </div>
        )}
        {targetingSpell && (
            <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <h3 className="text-2xl font-bold text-yellow-300 animate-pulse">
                    Chọn mục tiêu cho {SPELLS[targetingSpell].name}
                </h3>
                <p className="text-gray-400 mt-2">Click vào một đơn vị địch trên chiến trường.</p>
                <button onClick={onCancelTargeting} className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold transition-transform transform hover:scale-105">
                    Hủy
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;