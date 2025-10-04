import React from 'react';
import { PlayerState } from '../types';
import { AGES, UPGRADES } from '../constants';

interface ConfirmationModalProps {
  confirmation: { type: 'evolve' | 'upgrade'; id?: string } | null;
  player: PlayerState;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ confirmation, player, onConfirm, onCancel }) => {
  if (!confirmation) return null;

  let title = '';
  let content: React.ReactNode = null;
  let cost = 0;
  let canAfford = false;

  if (confirmation.type === 'evolve') {
    const currentAge = AGES[player.age];
    const nextAge = AGES[player.age + 1];

    if (nextAge) {
      title = `Tiến hóa: ${nextAge.name}`;
      cost = currentAge.evolveCost;
      const expCost = currentAge.evolveExp;
      canAfford = player.mana >= cost && player.exp >= expCost;
      content = (
        <div>
          <p className="text-gray-300">Bạn có chắc muốn tiến hóa lên cảnh giới tiếp theo không?</p>
          <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Chi phí Mana:</span>
              <span className={`font-bold ${player.mana >= cost ? 'text-green-400' : 'text-red-400'}`}>{cost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Yêu cầu EXP:</span>
              <span className={`font-bold ${player.exp >= expCost ? 'text-green-400' : 'text-red-400'}`}>{player.exp} / {expCost}</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-400">{nextAge.description}</p>
        </div>
      );
    }
  } else if (confirmation.type === 'upgrade' && confirmation.id) {
    const upgrade = UPGRADES[confirmation.id];
    const currentLevel = player.upgrades[upgrade.id] || 0;
    
    if (upgrade && currentLevel < upgrade.maxLevel) {
        title = `Nâng cấp: ${upgrade.name}`;
        cost = upgrade.cost(currentLevel);
        canAfford = player.mana >= cost;
        content = (
            <div>
                <p className="text-gray-300">Bạn có chắc muốn nâng cấp không?</p>
                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-left space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Chi phí Mana:</span>
                        <span className={`font-bold ${player.mana >= cost ? 'text-green-400' : 'text-red-400'}`}>{cost}</span>
                    </div>
                    <div className="mt-2 text-sm">
                        <p className="text-gray-400">Hiện tại: <span className="font-semibold text-white">{upgrade.description(currentLevel).split('Hiện tại: ')[1]}</span></p>
                        <p className="text-green-400">Tiếp theo: <span className="font-semibold text-green-300">{upgrade.description(currentLevel + 1).split('Hiện tại: ')[1]}</span></p>
                    </div>
                </div>
            </div>
        );
    }
  }


  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="w-full max-w-md p-6 rounded-xl shadow-2xl border-2 border-cyan-400/50 bg-gray-800 text-center">
        <h2 className="text-3xl font-bold text-cyan-300 mb-4">{title}</h2>
        <div className="text-lg text-gray-300 mb-6">{content}</div>
        <div className="flex justify-center gap-4">
            <button
                onClick={onCancel}
                className="px-8 py-3 rounded-lg text-white font-bold text-lg bg-red-600 hover:bg-red-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
                Hủy
            </button>
            <button
                onClick={onConfirm}
                disabled={!canAfford}
                className="px-8 py-3 rounded-lg text-white font-bold text-lg bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
                Xác Nhận
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
