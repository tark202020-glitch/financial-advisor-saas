export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparklineData?: number[];
  sector?: string;
  id?: string;
  market?: 'KR' | 'US';
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface InvestorTrend {
  type: 'Individual' | 'Foreign' | 'Institution' | 'Pension';
  netBuy: number; // In 100 million KRW (e.g., 500 = 50 billion KRW)
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  relatedStocks: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export const MACRO_INDICES: MarketIndex[] = [
  { name: 'KOSPI', value: 2650.32, change: 12.45, changePercent: 0.47 },
  { name: 'KOSDAQ', value: 870.12, change: -3.21, changePercent: -0.37 },
  { name: 'NASDAQ', value: 16274.94, change: 144.18, changePercent: 0.90 },
  { name: 'S&P 500', value: 5104.76, change: 25.11, changePercent: 0.50 },
];

export const EXCHANGE_RATE = {
  name: 'USD/KRW',
  value: 1335.50,
  change: 2.50,
  changePercent: 0.19,
};

export const INTEREST_RATES = {
  korea: 3.50,
  usa: 5.50,
};

export const INVESTOR_TRENDS: InvestorTrend[] = [
  { type: 'Individual', netBuy: -1200 },
  { type: 'Foreign', netBuy: 2500 },
  { type: 'Institution', netBuy: -500 },
  { type: 'Pension', netBuy: 300 },
];

export interface InvestorHistory {
  date: string;
  individual: number;
  foreign: number;
  institution: number;
  pension: number;
}

// Generate 30 days of history
const today = new Date();
export const INVESTOR_HISTORY_TRENDS: InvestorHistory[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - (29 - i));

  // Random trends
  // Foreigners buying lately, Individuals selling
  const trendFactor = i > 20 ? 1 : -1;

  return {
    date: d.toISOString().split('T')[0],
    individual: Math.floor(Math.random() * 2000 - 1000) - (i * 20), // Selling trend
    foreign: Math.floor(Math.random() * 2000 - 500) + (i * 30), // Buying trend
    institution: Math.floor(Math.random() * 1000 - 500),
    pension: Math.floor(Math.random() * 600 - 300),
  };
});

// Helper to generate random sparkline
const generateSparkline = () => Array.from({ length: 20 }, () => Math.random() * 100 + 100);

export const SECTOR_STOCKS: Record<string, Stock[]> = {
  // --- Global (US/Others) ---
  'Global Big Tech': [
    { symbol: 'NVDA', name: 'NVIDIA', price: 920.50, change: 25.30, changePercent: 2.80, sparklineData: generateSparkline() },
    { symbol: 'AAPL', name: 'Apple', price: 175.20, change: -1.50, changePercent: -0.85, sparklineData: generateSparkline() },
    { symbol: 'MSFT', name: 'Microsoft', price: 415.10, change: 2.10, changePercent: 0.51, sparklineData: generateSparkline() },
    { symbol: 'GOOGL', name: 'Alphabet', price: 140.20, change: 1.10, changePercent: 0.79, sparklineData: generateSparkline() },
    { symbol: 'AMZN', name: 'Amazon', price: 178.50, change: 3.20, changePercent: 1.83, sparklineData: generateSparkline() },
    { symbol: 'META', name: 'Meta', price: 495.30, change: 8.50, changePercent: 1.75, sparklineData: generateSparkline() },
    { symbol: 'TSLA', name: 'Tesla', price: 175.30, change: -3.50, changePercent: -1.96, sparklineData: generateSparkline() },
  ],
  'Global Finance & Consumption': [
    { symbol: 'JPM', name: 'JP Morgan', price: 195.40, change: 1.20, changePercent: 0.62, sparklineData: generateSparkline() },
    { symbol: 'BAC', name: 'Bank of America', price: 36.50, change: 0.15, changePercent: 0.41, sparklineData: generateSparkline() },
    { symbol: 'WMT', name: 'Walmart', price: 60.10, change: 0.50, changePercent: 0.84, sparklineData: generateSparkline() },
    { symbol: 'COST', name: 'Costco', price: 745.20, change: 5.10, changePercent: 0.69, sparklineData: generateSparkline() },
  ],
  'Global Semiconductor': [
    { symbol: 'TSM', name: 'TSMC', price: 145.30, change: 4.20, changePercent: 2.97, sparklineData: generateSparkline() },
    { symbol: 'ASML', name: 'ASML', price: 950.10, change: 15.50, changePercent: 1.66, sparklineData: generateSparkline() },
    { symbol: 'AVGO', name: 'Broadcom', price: 1250.30, change: 10.20, changePercent: 0.82, sparklineData: generateSparkline() },
    { symbol: 'AMD', name: 'AMD', price: 205.40, change: 8.10, changePercent: 4.10, sparklineData: generateSparkline() },
  ],

  // --- Korea ---
  'KR Tech & Manufacturing': [
    { symbol: '005930', name: '삼성전자', price: 73500, change: 800, changePercent: 1.10, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '000660', name: 'SK하이닉스', price: 165000, change: 4500, changePercent: 2.80, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '005380', name: '현대차', price: 250000, change: -1000, changePercent: -0.40, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '373220', name: 'LG에너지솔루션', price: 395000, change: -5000, changePercent: -1.25, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '352820', name: '하이브', price: 210000, change: -2000, changePercent: -0.94, sparklineData: generateSparkline(), sector: 'KOSPI' },
  ],
  'KR Industrial & Infra': [
    { symbol: '012450', name: '한화에어로스페이스', price: 195000, change: 5000, changePercent: 2.63, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '034020', name: '두산에너빌리티', price: 16500, change: 100, changePercent: 0.61, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '329180', name: 'HD현대중공업', price: 125000, change: 1500, changePercent: 1.21, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '042660', name: '한화오션', price: 28500, change: -200, changePercent: -0.70, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '015760', name: '한국전력', price: 21000, change: 150, changePercent: 0.72, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '298040', name: '효성중공업', price: 340000, change: 4000, changePercent: 1.19, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '267260', name: 'HD현대일렉트릭', price: 150000, change: 3000, changePercent: 2.04, sparklineData: generateSparkline(), sector: 'KOSPI' },
  ],
  'KR Finance & Index': [
    { symbol: '105560', name: 'KB금융', price: 72000, change: 1000, changePercent: 1.41, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '086790', name: '하나금융지주', price: 62000, change: 800, changePercent: 1.31, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '006800', name: '미래에셋증권', price: 8500, change: 50, changePercent: 0.59, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '028260', name: '삼성물산', price: 155000, change: 2000, changePercent: 1.31, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '035420', name: 'NAVER', price: 198000, change: -1000, changePercent: -0.50, sparklineData: generateSparkline(), sector: 'KOSPI' },
    { symbol: '102110', name: 'TIGER 200', price: 34000, change: 150, changePercent: 0.45, sparklineData: generateSparkline(), sector: 'ETF' },
  ],
};

export const NEWS_FEED: NewsItem[] = [
  {
    id: '1',
    title: '연준, "금리 인하 신중" 재확인... 기술주 숨고르기',
    source: '블룸버그',
    time: '30분 전',
    relatedStocks: ['NVDA', 'AAPL', 'MSFT'],
    sentiment: 'neutral',
  },
  {
    id: '2',
    title: 'SK하이닉스, HBM3E 양산 소식에 52주 신고가 경신',
    source: '한국경제',
    time: '1시간 전',
    relatedStocks: ['SK하이닉스'],
    sentiment: 'positive',
  },
  {
    id: '3',
    title: '전기차 수요 둔화 우려... 2차전지 섹터 약세',
    source: 'WSJ',
    time: '2시간 전',
    relatedStocks: ['LG에너지솔루션', 'TSLA'],
    sentiment: 'negative',
  },
];
