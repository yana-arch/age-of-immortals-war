
import React from 'react';
import { GameStatus } from '../types';

interface GameModalProps {
  status: GameStatus;
  onRestart: () => void;
}

const GameModal: React.FC<GameModalProps> = ({ status, onRestart }) => {
  if (status === GameStatus.PLAYING) return null;

  const isVictory = status === GameStatus.WON;
  const title = isVictory ? "Chiến Thắng!" : "Thất Bại!";
  const message = isVictory
    ? "Bạn đã thống nhất tiên giới, trở thành huyền thoại!"
    : "Môn phái của bạn đã bị tiêu diệt. Hãy tu luyện lại từ đầu.";
  const colorClass = isVictory ? "from-green-500 to-cyan-500" : "from-red-500 to-orange-500";
  const buttonColor = isVictory ? "bg-cyan-600 hover:bg-cyan-500" : "bg-orange-600 hover:bg-orange-500";

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className={`w-full max-w-md p-8 rounded-xl shadow-2xl border-2 border-white/20 bg-gray-800 text-center transform scale-100 transition-transform duration-300`}>
        <h2 className={`text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${colorClass}`}>
          {title}
        </h2>
        <p className="mt-4 text-lg text-gray-300">{message}</p>
        <button
          onClick={onRestart}
          className={`mt-8 px-8 py-3 rounded-lg text-white font-bold text-xl ${buttonColor} transition-all duration-200 transform hover:scale-105 shadow-lg`}
        >
          Chơi Lại
        </button>
      </div>
    </div>
  );
};

export default GameModal;
