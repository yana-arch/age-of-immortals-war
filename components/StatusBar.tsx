
import React from 'react';
import { PlayerState } from '../types';
import { AGES } from '../constants';
import { UserIcon, CpuChipIcon, HeartIcon, SparklesIcon } from './Icons';

interface StatusBarProps {
  player: PlayerState;
  enemy: PlayerState;
}

const StatBar: React.FC<{ value: number; maxValue: number; colorClass: string }> = ({ value, maxValue, colorClass }) => {
    const percentage = (value / maxValue) * 100;
    return (
        <div className="w-full h-4 bg-black/50 rounded-full overflow-hidden border border-white/20">
            <div className={`h-full ${colorClass} transition-all duration-300`} style={{width: `${percentage}%`}}></div>
        </div>
    );
};


const StatusBar: React.FC<StatusBarProps> = ({ player, enemy }) => {
  return (
    <div className="w-full h-24 bg-black/30 p-4 flex justify-between items-center text-white border-b-2 border-cyan-500/30">
        {/* Player Stats */}
        <div className="w-1/3 flex items-center gap-4">
            <UserIcon className="w-10 h-10 text-cyan-400"/>
            <div className="flex-grow">
                <div className="font-bold text-lg">{AGES[player.age].name}</div>
                <div className="flex items-center gap-2 mt-1">
                    <HeartIcon className="w-5 h-5 text-green-400"/>
                    <StatBar value={player.hp} maxValue={player.maxHp} colorClass="bg-green-500" />
                </div>
                 <div className="flex items-center gap-2 mt-1">
                    <SparklesIcon className="w-5 h-5 text-yellow-400"/>
                    <StatBar value={player.mana} maxValue={player.maxMana} colorClass="bg-yellow-500" />
                </div>
            </div>
        </div>

        <div className="text-4xl font-extrabold text-cyan-200 tracking-widest">
            TIÊN HIỆP CHIẾN KỶ
        </div>

        {/* Enemy Stats */}
        <div className="w-1/3 flex items-center gap-4 flex-row-reverse">
            <CpuChipIcon className="w-10 h-10 text-red-400"/>
            <div className="flex-grow">
                 <div className="font-bold text-lg text-right">{AGES[enemy.age].name}</div>
                 <div className="flex items-center gap-2 mt-1 flex-row-reverse">
                    <HeartIcon className="w-5 h-5 text-green-400"/>
                    <StatBar value={enemy.hp} maxValue={enemy.maxHp} colorClass="bg-green-500" />
                </div>
                 <div className="flex items-center gap-2 mt-1 flex-row-reverse">
                    <SparklesIcon className="w-5 h-5 text-yellow-400"/>
                    <StatBar value={enemy.mana} maxValue={enemy.maxMana} colorClass="bg-yellow-500" />
                </div>
            </div>
        </div>
    </div>
  );
};

export default StatusBar;
