import { UnitData, SpellData, UpgradeData, AgeData, PlayerState } from './types';
import { SwordIcon, ShieldIcon, CrosshairIcon, ZapIcon, SunIcon, BoltIcon, HomeModernIcon, HeartIcon, SparklesIcon, GhostIcon, MoonIcon } from './components/Icons';

export const TICK_RATE = 1000 / 60; // 60 FPS
export const BATTLEFIELD_WIDTH = 100; // Use percentage
export const BASE_VISION_RANGE = 20; // in % of battlefield width

// UNITS
export const UNITS: { [id: string]: UnitData } = {
  // Age 1
  swordsman: {
    id: 'swordsman', name: 'Kiếm Sĩ', description: 'Đơn vị cận chiến cơ bản. Rẻ và hiệu quả với số lượng lớn.', icon: SwordIcon,
    cost: 50, hp: 100, attack: 10, range: 2, speed: 2.5, attackSpeed: 1, visionRange: 10,
  },
  shieldman: {
    id: 'shieldman', name: 'Thuẫn Binh', description: 'Đơn vị đỡ đòn với lượng máu cao. Dùng để bảo vệ các đơn vị tầm xa.', icon: ShieldIcon,
    cost: 75, hp: 200, attack: 5, range: 2, speed: 2, attackSpeed: 0.8, visionRange: 8,
  },
  archer: {
    id: 'archer', name: 'Cung Thủ', description: 'Tấn công từ xa, gây sát thương tốt nhưng máu giấy.', icon: CrosshairIcon,
    cost: 100, hp: 60, attack: 12, range: 15, speed: 3, attackSpeed: 0.9, projectile: 'arrow', visionRange: 18,
  },
  // Age 2
  mage: {
    id: 'mage', name: 'Pháp Sư', description: 'Pháp sư mạnh mẽ tấn công diện rộng, hiệu quả chống lại nhóm lính.', icon: GhostIcon,
    cost: 150, hp: 100, attack: 25, range: 12, speed: 2.5, attackSpeed: 0.5, projectile: 'fireball', visionRange: 15,
  },
  knight: {
    id: 'knight', name: 'Kỵ Sĩ', description: 'Kỵ sĩ trâu bò với tốc độ cao, nhanh chóng áp sát tiền tuyến địch.', icon: SwordIcon,
    cost: 200, hp: 300, attack: 20, range: 3, speed: 4, attackSpeed: 1, visionRange: 12,
  },
  // Age 3
  dragon: {
    id: 'dragon', name: 'Rồng Thần', description: 'Đơn vị tối thượng. Cực kỳ mạnh mẽ với sát thương và máu khủng khiếp.', icon: MoonIcon,
    cost: 500, hp: 1000, attack: 50, range: 10, speed: 3, attackSpeed: 0.6, projectile: 'fireball', visionRange: 20,
  },
};

// SPELLS
export const SPELLS: { [id: string]: SpellData } = {
  fireball: {
    id: 'fireball', name: 'Hỏa Cầu', description: 'Bắn một quả cầu lửa vào kẻ địch được chọn, gây sát thương lớn.', icon: ZapIcon,
    cost: 100, cooldown: 10, requiresTarget: true,
  },
  heal: {
    id: 'heal', name: 'Hồi Phục', description: 'Hồi máu cho tất cả các đơn vị đồng minh trên chiến trường.', icon: SunIcon,
    cost: 150, cooldown: 20,
  },
};

// UPGRADES
export const UPGRADES: { [id: string]: UpgradeData } = {
  base_hp: {
    id: 'base_hp', name: 'Môn Phái HP', icon: HomeModernIcon, maxLevel: 5,
    cost: level => 100 * (level + 1),
    description: level => `Tăng HP tối đa của Môn Phái. Hiện tại: +${250 * level} HP`,
  },
  mana_regen: {
    id: 'mana_regen', name: 'Hồi Mana', icon: BoltIcon, maxLevel: 5,
    cost: level => 150 * (level + 1),
    description: level => `Tăng tốc độ hồi Mana. Hiện tại: +${(0.5 * level).toFixed(1)}/s`,
  },
  unit_hp: {
    id: 'unit_hp', name: 'Lính HP', icon: HeartIcon, maxLevel: 5,
    cost: level => 200 * (level + 1),
    description: level => `Tăng HP của tất cả lính. Hiện tại: +${10 * level}%`,
  },
  unit_attack: {
    id: 'unit_attack', name: 'Lính Tấn Công', icon: SparklesIcon, maxLevel: 5,
    cost: level => 200 * (level + 1),
    description: level => `Tăng tấn công của tất cả lính. Hiện tại: +${10 * level}%`,
  }
};

// AGES
export const AGES: AgeData[] = [
  { // Age 1 - Luyện Khí Kỳ
    name: 'Luyện Khí Kỳ',
    description: 'Giai đoạn khởi đầu của con đường tu tiên, mở khóa các đơn vị cơ bản.',
    units: ['swordsman', 'shieldman', 'archer'],
    spells: ['fireball'],
    evolveCost: 250,
    evolveExp: 400,
  },
  { // Age 2 - Trúc Cơ Kỳ
    name: 'Trúc Cơ Kỳ',
    description: 'Đột phá cảnh giới, mở khóa Pháp Sư và Kỵ Sĩ, cùng với phép Hồi Phục.',
    units: ['swordsman', 'shieldman', 'archer', 'mage', 'knight'],
    spells: ['fireball', 'heal'],
    evolveCost: 600,
    evolveExp: 1000,
  },
  { // Age 3 - Kim Đan Kỳ
    name: 'Kim Đan Kỳ',
    description: 'Đạt tới Kim Đan, có thể triệu hồi Rồng Thần huyền thoại.',
    units: ['mage', 'knight', 'dragon'],
    spells: ['fireball', 'heal'],
    evolveCost: Infinity,
    evolveExp: Infinity,
  }
];

export const INITIAL_PLAYER_STATE: Omit<PlayerState, 'upgrades'> & { upgrades: { [key: string]: number} } = {
    hp: 1000,
    maxHp: 1000,
    mana: 200,
    maxMana: 1000,
    manaRegen: 5,
    age: 0,
    exp: 0,
    maxExp: AGES[0].evolveExp,
    upgrades: {
        base_hp: 0,
        mana_regen: 0,
        unit_hp: 0,
        unit_attack: 0,
    }
};