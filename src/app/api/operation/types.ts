// ---------------------------------------------------------------------------
// External API response shapes (from SYSTEM_API_URL)
// ---------------------------------------------------------------------------

export interface ExternalOrderSummary {
  id: string;
  amount: string; // decimal string e.g. "150.00"
  cost: string;
  orderId: string;
  team: "tulum" | "dubai" | "none";
  status: "PRODUCING" | "FINISHED" | "CANCELLED";
  createdAt: string;
  product?: {
    id: string;
    name: string;
    imageUrl: string;
  };
  seller?: {
    id: string;
    name: string;
    email: string;
    team: "tulum" | "dubai" | "none";
    permission: "comercial" | "supervisor";
    createdAt: string;
  };
}

export interface ExternalDailySummary {
  date: string; // "YYYY-MM-DD"
  invoice: string; // decimal string
  cost: string;
  orderTotal: number;
  team: "tulum" | "dubai" | "none";
}

export interface ExternalTeamOfToday {
  team: "tulum" | "dubai" | "none";
}

export interface ExternalConversionTax {
  conversionTax: number; // 0–1
}

// ---------------------------------------------------------------------------
// Output payload (what GET /api/operation returns)
// ---------------------------------------------------------------------------

export interface OperationResponse {
  referenceMonth: string; // e.g. "Março 2026"
  headerBanner: {
    highestRevenue: { value: string; date: string; team: string };
    highestOrders: { value: number; date: string; team: string };
    today: { date: string; team: string };
  };
  monthlyRanking: Array<{
    pos: number;
    initials: string;
    name: string;
    fat: string;
    orders: number;
    tm: string;
  }>;
  dailyRanking: Array<{
    pos: number;
    initials: string;
    name: string;
    fat: string;
    orders: number;
    tm: string;
  }>;
  operationKpis: {
    revenue: string;
    conversionTax: number;
    repasse: number;
    revenueChange: number | null;
    conversionTaxChange: number | null;
    repasseChange: number | null;
  };
  salesRace: {
    teams: Array<{ name: string; averageProfit: number }>;
    todayProfit: { team: string; profit: number };
    profitDifference: number;
  };
  weeklyRevenueChart: Array<{
    date: string;
    team: string;
    invoice: number;
  }>;
  conquests: Array<{
    name: string;
    price: string;
    imageUrl?: string;
    sellerName?: string;
  }>;
}
