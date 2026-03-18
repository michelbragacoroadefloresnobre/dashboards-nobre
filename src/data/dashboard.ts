export const AVATAR_COLORS = [
  ["#C8963E", "#A67C2E"],
  ["#8C8C8C", "#6C6C6C"],
  ["#B87333", "#8B5E28"],
  ["#5C7A6B", "#3D5A4B"],
  ["#6B5B73", "#4D3D55"],
  ["#5B6B73", "#3D4D55"],
  ["#7B6B5B", "#5D4D3D"],
  ["#5B7367", "#3D554B"],
  ["#735B6B", "#553D4D"],
  ["#6B6B5B", "#4D4D3D"],
  ["#8C6B5B", "#6E4D3D"],
  ["#5B6B8C", "#3D4D6E"],
  ["#6B8C5B", "#4D6E3D"],
  ["#8C5B6B", "#6E3D4D"],
  ["#5B8C7B", "#3D6E5D"],
];

export interface MonthlySeller {
  pos: number;
  initials: string;
  name: string;
  fat: string;
  orders: number;
  tm: string;
}

export interface DailySeller {
  pos: number;
  initials: string;
  name: string;
  fat: string;
  orders: string;
}

export interface Conquista {
  emoji: string;
  name: string;
  price: string;
  progress?: number;
  locked?: boolean;
  imageUrl?: string;
  sellerName?: string;
}

export const monthlyData: MonthlySeller[] = [
  {
    pos: 1,
    initials: "EM",
    name: "Erika Moreira",
    fat: "R$ 22.070,00",
    orders: 46,
    tm: "R$ 479,79",
  },
  {
    pos: 2,
    initials: "AM",
    name: "Ana Manuela",
    fat: "R$ 21.510,00",
    orders: 41,
    tm: "R$ 524,63",
  },
  {
    pos: 3,
    initials: "LV",
    name: "Luana Vieira",
    fat: "R$ 20.022,00",
    orders: 38,
    tm: "R$ 528,91",
  },
  {
    pos: 4,
    initials: "LC",
    name: "Luma Cintra",
    fat: "R$ 17.474,00",
    orders: 36,
    tm: "R$ 485,39",
  },
  {
    pos: 5,
    initials: "PO",
    name: "Patrick Oliveira",
    fat: "R$ 17.460,00",
    orders: 40,
    tm: "R$ 436,50",
  },
  {
    pos: 6,
    initials: "DG",
    name: "Daniel Gonçalves",
    fat: "R$ 17.188,00",
    orders: 35,
    tm: "R$ 491,00",
  },
  {
    pos: 7,
    initials: "SA",
    name: "Saria",
    fat: "R$ 14.645,00",
    orders: 28,
    tm: "R$ 523,04",
  },
  {
    pos: 8,
    initials: "MM",
    name: "Murillo Manzione",
    fat: "R$ 11.035,00",
    orders: 25,
    tm: "R$ 441,40",
  },
  {
    pos: 9,
    initials: "SH",
    name: "Sanndy Helen",
    fat: "R$ 9.670,00",
    orders: 18,
    tm: "R$ 537,22",
  },
  {
    pos: 10,
    initials: "AP",
    name: "Angélica Prado",
    fat: "R$ 6.425,00",
    orders: 12,
    tm: "R$ 535,42",
  },
  {
    pos: 11,
    initials: "IB",
    name: "Igor Braga",
    fat: "R$ 5.890,00",
    orders: 10,
    tm: "R$ 589,00",
  },
  {
    pos: 12,
    initials: "TV",
    name: "TV",
    fat: "R$ 4.320,00",
    orders: 8,
    tm: "R$ 540,00",
  },
  {
    pos: 13,
    initials: "RF",
    name: "Renata Farias",
    fat: "R$ 3.750,00",
    orders: 7,
    tm: "R$ 535,71",
  },
  {
    pos: 14,
    initials: "CS",
    name: "Carlos Silva",
    fat: "R$ 2.980,00",
    orders: 5,
    tm: "R$ 596,00",
  },
  {
    pos: 15,
    initials: "ML",
    name: "Marina Lima",
    fat: "R$ 2.450,00",
    orders: 4,
    tm: "R$ 612,50",
  },
];

export const dailyData: DailySeller[] = [
  {
    pos: 1,
    initials: "IB",
    name: "Igor Braga",
    fat: "R$ 890,00",
    orders: "1 pedido",
  },
  { pos: 2, initials: "TV", name: "TV", fat: "R$ 890,00", orders: "1 pedido" },
  {
    pos: 3,
    initials: "EM",
    name: "Erika Moreira",
    fat: "R$ 745,00",
    orders: "2 pedidos",
  },
  {
    pos: 4,
    initials: "PO",
    name: "Patrick Oliveira",
    fat: "R$ 680,00",
    orders: "1 pedido",
  },
  {
    pos: 5,
    initials: "AM",
    name: "Ana Manuela",
    fat: "R$ 524,00",
    orders: "1 pedido",
  },
  {
    pos: 6,
    initials: "LC",
    name: "Luma Cintra",
    fat: "R$ 485,00",
    orders: "1 pedido",
  },
  {
    pos: 7,
    initials: "LV",
    name: "Luana Vieira",
    fat: "R$ 420,00",
    orders: "1 pedido",
  },
  {
    pos: 8,
    initials: "DG",
    name: "Daniel Gonçalves",
    fat: "R$ 350,00",
    orders: "1 pedido",
  },
  {
    pos: 9,
    initials: "MM",
    name: "Murillo Manzione",
    fat: "R$ 290,00",
    orders: "1 pedido",
  },
  {
    pos: 10,
    initials: "SH",
    name: "Sanndy Helen",
    fat: "R$ 210,00",
    orders: "1 pedido",
  },
  {
    pos: 11,
    initials: "AP",
    name: "Angélica Prado",
    fat: "R$ 180,00",
    orders: "1 pedido",
  },
  {
    pos: 12,
    initials: "SA",
    name: "Saria",
    fat: "R$ 150,00",
    orders: "1 pedido",
  },
];

export interface TeamRace {
  name: string;
  emoji: string;
  profit: number;
}

export const teamsData: TeamRace[] = [
  { name: "Tulum", emoji: "🏁", profit: 21817.25 },
  { name: "Equipe B", emoji: "🚀", profit: 21196.5 },
];

export interface WeeklyTeamRevenue {
  date: string;
  team: string;
  invoice: number;
}

export const weeklyRevenueData: WeeklyTeamRevenue[] = [
  { date: "05/03", team: "tulum", invoice: 3250.0 },
  { date: "06/03", team: "equipeB", invoice: 3850.0 },
  { date: "07/03", team: "tulum", invoice: 2890.0 },
  { date: "08/03", team: "equipeB", invoice: 2650.0 },
  { date: "09/03", team: "tulum", invoice: 4560.0 },
  { date: "10/03", team: "equipeB", invoice: 3085.0 },
  { date: "11/03", team: "tulum", invoice: 2065.75 },
];

export const todayProfitData = {
  team: "tulum" as const,
  profit: 1250.0, // faturamento de hoje - custos de hoje
};

export const conquistasData: Conquista[] = [
  {
    emoji: "💐",
    name: "Conjunto de Flores O.",
    price: "R$ 1.850,00",
    progress: 65,
    sellerName: "Erika Moreira",
  },
  {
    emoji: "👑",
    name: "Conjunto de Coroa d.",
    price: "R$ 1.890,00",
    progress: 40,
    sellerName: "Ana Manuela",
  },
  {
    emoji: "❤️",
    name: "Coração de Flores Pr.",
    price: "R$ 1.850,00",
    progress: 20,
    sellerName: "Luana Vieira",
  },
  {
    emoji: "🌹",
    name: "Buquê Premium Rosa",
    price: "R$ 2.100,00",
    progress: 55,
    sellerName: "Igor Braga",
  },
  {
    emoji: "🌻",
    name: "Girassol Especial",
    price: "R$ 1.650,00",
    progress: 30,
    sellerName: "Igor Braga",
  },
  { emoji: "🔒", name: "Meta 6", price: "???", locked: true },
  { emoji: "🔒", name: "Meta 7", price: "???", locked: true },
  { emoji: "🔒", name: "Meta 8", price: "???", locked: true },
  { emoji: "🔒", name: "Meta 9", price: "???", locked: true },
];
