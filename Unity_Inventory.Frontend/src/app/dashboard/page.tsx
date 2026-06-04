'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  Trophy,
  ShoppingCart,
  UserPlus,
  BarChart3
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface DashboardData {
  revenue: {
    totalRevenue: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
  };
  customerStats: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    topCustomersAllTime: {
      customerId: number;
      customerName: string;
      totalSpent: number;
      totalOrders: number;
    }[];
    topCustomersThisMonth: {
      customerId: number;
      customerName: string;
      totalSpent: number;
      totalOrders: number;
    }[];
    topCustomersThisYear: {
      customerId: number;
      customerName: string;
      totalSpent: number;
      totalOrders: number;
    }[];
  };
  productStats: {
    totalProducts: number;
    topSellingProducts: {
      inventoryId: number;
      name: string;
      totalSold: number;
      imageUrl: string;
    }[];
  };
  salesTrends: {
    weeklySales: { label: string; revenue: number; totalOrders: number }[];
    monthlySales: { label: string; revenue: number; totalOrders: number }[];
    yearlySales: { label: string; revenue: number; totalOrders: number }[];
  };
}

const formatCurrency = (value: number) => {
  return `${(value || 0).toLocaleString()} MMK`;
};

const formatDateToDisplay = (dateInput: string | Date) => {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return 'N/A';
  
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-');
    return `${day}-${month}-${year}`;
  }
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const getRankBadgeClass = (index: number) => {
  switch (index) {
    case 0:
      return "bg-amber-400 text-amber-900";
    case 1:
      return "bg-zinc-300 text-zinc-900";
    case 2:
      return "bg-orange-300 text-orange-900";
    default:
      return "bg-zinc-100 dark:bg-zinc-800 text-zinc-400";
  }
};

type TimeRange = 'weekly' | 'monthly' | 'yearly';
type CustomerRange = 'month' | 'year' | 'all';

export default function DashboardPage() {
  const { theme, resolvedTheme } = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [customerRange, setCustomerRange] = useState<CustomerRange>('month');
  
  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === 'dark';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard');
        if (response.data.isSuccess) {
          setData(response.data.data);
        }
      } catch (error: any) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['sk-1', 'sk-2', 'sk-3', 'sk-4'].map((id) => (
            <div key={id} className="h-24 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 h-[400px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg" />
          <div className="h-[400px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  let chartData: { label: string; revenue: number; totalOrders: number }[] = [];
  if (timeRange === 'weekly') {
    chartData = data.salesTrends?.weeklySales || [];
  } else if (timeRange === 'monthly') {
    chartData = data.salesTrends?.monthlySales || [];
  } else {
    chartData = data.salesTrends?.yearlySales || [];
  }

  let topCustomers: { customerId: number; customerName: string; totalSpent: number; totalOrders: number; }[] = [];
  if (customerRange === 'month') {
    topCustomers = data?.customerStats?.topCustomersThisMonth || [];
  } else if (customerRange === 'year') {
    topCustomers = data?.customerStats?.topCustomersThisYear || [];
  } else {
    topCustomers = data?.customerStats?.topCustomersAllTime || [];
  }

  const kpis = [
    { label: 'Total Revenue', value: formatCurrency(data?.revenue?.totalRevenue ?? 0), icon: DollarSign, sub: 'Lifetime Earnings', href: '/sales', color: 'text-zinc-900 dark:text-zinc-100' },
    { label: 'Monthly Revenue', value: formatCurrency(data?.revenue?.monthlyRevenue ?? 0), icon: TrendingUp, sub: 'Current Cycle', href: '/sales', color: 'text-emerald-600 dark:text-emerald-450' },
    { label: 'Active Clients', value: (data?.customerStats?.totalCustomers ?? 0).toString(), icon: Users, sub: 'Loyalty Base', href: '/customers', color: 'text-zinc-900 dark:text-zinc-100' },
    { label: 'Global Stock', value: (data?.productStats?.totalProducts ?? 0).toString(), icon: Package, sub: 'Active Products', href: '/inventory', color: 'text-zinc-900 dark:text-zinc-100' },
  ];

  return (
    <div className="space-y-8 w-full pb-20 animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase">Executive Dashboard</h1>
          <p className="text-[10px] text-zinc-400 font-semibold tracking-widest uppercase mt-1">Real-time Enterprise Intelligence • {formatDateToDisplay(new Date())}</p>
        </div>

        {/* Quick Access Toolbar */}
        <div className="flex items-center gap-2">
          <Link href="/sales" className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded shadow-lg dark:shadow-black/20 shadow-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
            <ShoppingCart size={14} /> New Sale
          </Link>
          <Link href="/customers" className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-[10px] font-bold uppercase tracking-widest rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
            <UserPlus size={14} /> Add Client
          </Link>
        </div>
      </div>

      {/* High-Performance KPI Grid */}
      <KpiGrid kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Analytics Section */}
        <div className="lg:col-span-2">
          <RevenueVelocityPanel
            chartData={chartData}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            isDark={isDark}
          />
        </div>

        {/* Sidebar Intelligence */}
        <div className="space-y-6">
          <ProductsLeaderboard products={data?.productStats?.topSellingProducts || []} />
          <CustomerRankings
            topCustomers={topCustomers}
            customerRange={customerRange}
            setCustomerRange={setCustomerRange}
          />
        </div>
      </div>
    </div>
  );
}

const KpiGrid = ({ kpis }: { kpis: { label: string; value: string; icon: React.ComponentType<any>; sub: string; href: string; color: string; }[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
    {kpis.map((stat) => (
      <Link key={stat.label} href={stat.href} className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900 transition-all">
            <stat.icon size={16} />
          </div>
          <ArrowUpRight size={14} className="text-zinc-200 dark:text-zinc-700 group-hover:text-zinc-900 dark:text-zinc-100 dark:group-hover:text-zinc-100 transition-colors" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
          <h3 className={cn("text-xl font-bold tracking-tight", stat.color)}>{stat.value}</h3>
          <p className="text-[10px] text-zinc-400 font-semibold italic">{stat.sub}</p>
        </div>
        {/* Visual Flair */}
        <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
          <stat.icon size={80} />
        </div>
      </Link>
    ))}
  </div>
);

const RevenueVelocityPanel = ({
  chartData,
  timeRange,
  setTimeRange,
  isDark
}: {
  chartData: { label: string; revenue: number; totalOrders: number }[];
  timeRange: TimeRange;
  setTimeRange: (t: TimeRange) => void;
  isDark: boolean;
}) => {
  // Pre-calculate style variables to reduce JSX Cognitive Complexity
  const gridStrokeColor = isDark ? "#27272a" : "#f8f8f8";
  const tickFillColor = isDark ? '#71717a' : '#a1a1aa';
  const tooltipCursorColor = isDark ? '#27272a' : '#f9f9f9';
  const tooltipBgColor = isDark ? '#18181b' : '#fafafa';
  const tooltipTextColor = isDark ? '#fff' : '#18181b';
  const barFillColor = isDark ? "#fafafa" : "#18181b";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col min-h-[400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Revenue Velocity</h2>
            <p className="text-[10px] text-zinc-400 font-medium">Growth analytics & volume trends</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900/50 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
          {(['weekly', 'monthly', 'yearly'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-tighter transition-all",
                timeRange === range ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-100 dark:border-zinc-600" : "text-zinc-400 hover:text-zinc-650"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[380px] w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStrokeColor} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickFillColor, fontSize: 9, fontWeight: 700 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickFillColor, fontSize: 9, fontWeight: 700 }}
                dx={-10}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                cursor={{ fill: tooltipCursorColor }}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: tooltipBgColor,
                  color: tooltipTextColor
                }}
                itemStyle={{ color: tooltipTextColor }}
                formatter={(v: any) => [formatCurrency(Number(v)), 'REVENUE']}
              />
              <Bar dataKey="revenue" fill={barFillColor} radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-50 dark:border-zinc-800 rounded-xl">
            <BarChart3 size={32} className="text-zinc-200 dark:text-zinc-600 mb-2" />
            <p className="text-[10px] font-black text-zinc-300 dark:text-zinc-500 uppercase tracking-widest">No Telemetry Found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductsLeaderboard = ({ products }: { products: any[] }) => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
    <div className="flex items-center justify-between mb-3 pb-1 border-b border-zinc-50 dark:border-zinc-800">
      <h2 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Top Products</h2>
      <Link href="/inventory" className="text-[9px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest hover:underline">Full Catalog</Link>
    </div>
    <div className="space-y-2">
      {products.slice(0, 4).map((p) => (
        <div key={p.inventoryId} className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-zinc-900 dark:group-hover:border-zinc-200 transition-all">
            {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package size={16} className="text-zinc-300 dark:text-zinc-655" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">{p.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-zinc-400">{p.totalSold} sold</p>
              <div className="h-1 flex-1 bg-zinc-50 dark:bg-zinc-900/50 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${Math.min(100, (p.totalSold / 100) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CustomerRankings = ({
  topCustomers,
  customerRange,
  setCustomerRange
}: {
  topCustomers: any[];
  customerRange: 'month' | 'year' | 'all';
  setCustomerRange: (r: 'month' | 'year' | 'all') => void;
}) => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Trophy size={14} className="text-amber-500" />
        <h2 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Client Rank</h2>
      </div>
      <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900/50 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
        {(['month', 'year', 'all'] as const).map(r => (
          <button
            key={r}
            onClick={() => setCustomerRange(r)}
            className={cn(
              "px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all",
              customerRange === r ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-650"
            )}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
    <div className="space-y-2.5">
      {topCustomers.slice(0, 5).map((c, i) => (
        <div key={c.customerId} className="flex items-center gap-3 group">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-[10px] font-bold uppercase group-hover:scale-105 transition-all shadow-lg shadow-zinc-200 dark:shadow-black/50">
              {c.customerName?.[0] || '?'}
            </div>
            <div className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-white dark:border-zinc-900",
              getRankBadgeClass(i)
            )}>
              {i + 1}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{c.customerName || 'Anonymous'}</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-zinc-900 dark:text-zinc-100 font-bold">{formatCurrency(c.totalSpent)}</p>
              <span className="w-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <p className="text-[10px] text-zinc-400 font-bold">{c.totalOrders} TX</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-all" />
        </div>
      ))}
      {topCustomers.length === 0 && (
        <div className="py-12 text-center opacity-30">
          <p className="text-[10px] font-bold uppercase tracking-widest italic">No Data</p>
        </div>
      )}
    </div>
    <Link href="/customers" className="mt-6 w-full flex items-center justify-center py-3 bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
      Comprehensive Directory
    </Link>
  </div>
);
