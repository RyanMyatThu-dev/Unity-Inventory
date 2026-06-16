'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useAIChat } from '@/context/AIChatContext';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  Plus,
  Calendar,
  ArrowUpRight,
  Activity,
  DollarSign,
  Package,
  Users,
  Receipt,
  Loader2,
  Sparkles,
  Clock,
  Eye,
  FileText,
  AlertCircle,
  Send,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { toast } from 'sonner';
import { MyanmarDateInput } from '@/components/ui/MyanmarDateInput';
import { canProvisionNewBusiness } from '@/lib/accountType';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

// --- Types ---
interface SalesSummary {
  summaryId: number;
  businessId: number;
  summaryType: string;
  periodStartDate: string;
  periodEndDate: string;
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  totalItemsSold: number;
  uniqueCustomers: number;
  topCustomerId?: number;
  topCustomerName?: string;
  topCustomerTotal?: number;
  topProductId?: number;
  topProductName?: string;
  topProductQuantitySold?: number;
  topProductRevenue?: number;
  customerRanks?: SalesSummaryCustomerRank[];
  productRanks?: SalesSummaryProductRank[];
  salesTrend?: SalesTrendPoint[];
  generatedAt: string;
  source: string;
}

interface SalesTrendPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface SchedulerJobStatus {
  jobId: string;
  cron: string;
  nextExecution: string | null;
  lastExecution: string | null;
  lastJobId: string | null;
  lastJobState: string | null;
  timeZoneId: string;
  error: string | null;
}

interface SalesSummaryCustomerRank {
  rank: number;
  customerId: number;
  customerName: string;
  totalRevenue: number;
  totalOrders: number;
  percentageOfRevenue: number;
}

interface SalesSummaryProductRank {
  rank: number;
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
  percentageOfRevenue: number;
}

const formatCurrency = (value: number) => {
  return `${(value || 0).toLocaleString()} MMK`;
};

const formatShortNumber = (value: number) => {
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return (value || 0).toString();
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateToDisplay = (dateInput: string | Date) => {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-');
    return `${day}-${month}-${year}`;
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const CHART_COLORS = ['#059669', '#2563eb', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];

const renderMarkdown = (text: string, isModel: boolean) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
    let content = trimmed;
    if (isBullet) {
      content = content.replace(/^[-*]\s+/, '');
    }

    // Process bold text
    const parts = content.split('**');
    const elements = parts.map((part, partIdx) => {
      if (partIdx % 2 === 1) {
        return <strong key={partIdx} className={cn("font-extrabold", isModel ? "text-zinc-950 dark:text-white" : "text-white dark:text-zinc-900")}>{part}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <li key={lineIdx} className={cn("list-disc ml-4 my-1", isModel ? "text-zinc-750 dark:text-zinc-300" : "text-white dark:text-zinc-900")}>
          <span>{elements}</span>
        </li>
      );
    }

    return (
      <p key={lineIdx} className={cn("my-1 leading-normal min-h-[0.75rem]", isModel ? "text-zinc-755 dark:text-zinc-300" : "text-white/95 dark:text-zinc-900")}>
        {elements}
      </p>
    );
  });
};

const getScrollTargetForMessage = (content: string): { id: string; label: string } | null => {
  const lower = content.toLowerCase();
  
  if (lower.includes("scheduler") || lower.includes("hangfire") || lower.includes("cron") || lower.includes("recur") || lower.includes("background task") || lower.includes("compiler schedule")) {
    return { id: "scheduler-jobs", label: "compiler schedules" };
  }
  
  if (lower.includes("stock") || lower.includes("replenish") || lower.includes("product") || lower.includes("item") || lower.includes("best") || lower.includes("seller") || lower.includes("driver")) {
    return { id: "detailed-insights", label: "rankings & insights" };
  }
  
  if (lower.includes("peak") || lower.includes("hour") || lower.includes("time") || lower.includes("velocity") || lower.includes("trend") || lower.includes("afternoon")) {
    return { id: "telemetry-charts", label: "trend charts" };
  }
  
  if (lower.includes("revenue") || lower.includes("average") || lower.includes("ticket") || lower.includes("volume") || lower.includes("invoice") || lower.includes("performance ratio") || lower.includes("client") || lower.includes("customer")) {
    return { id: "kpi-cards", label: "revenue cards" };
  }
  
  return null;
};

// Removed mock seed data as per plan - using live API data only

// --- Generation Progress Modal Component ---
const GenerateSummaryModal = ({
  onClose,
  onGenerated
}: {
  onClose: () => void;
  onGenerated: () => void;
}) => {
  const [summaryType, setSummaryType] = useState<string>('MONTHLY');
  const [periodStartDate, setPeriodStartDate] = useState<string>(() => {
    const today = new Date();
    // Default start to first day of current month
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return formatLocalDate(firstDay);
  });
  const [periodEndDate, setPeriodEndDate] = useState<string>(() => {
    return formatLocalDate(new Date());
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodStartDate || !periodEndDate) {
      toast.error('Please specify both start and end dates');
      return;
    }

    setIsSubmitting(true);
    setProgressMsg('Extracting transactional logs...');

    // Simulate multi-step analytical compilation for visual immersion
    setTimeout(() => setProgressMsg('Calculating cross-period revenue velocity...'), 600);
    setTimeout(() => setProgressMsg('Compiling inventory top-performer rankings...'), 1200);
    setTimeout(() => setProgressMsg('Running AI narrative synthesizer...'), 1800);

    try {
      // API call expects GenerateSummaryRequest schema: SummaryType, PeriodStartDate, PeriodEndDate (as string in YYYY-MM-DD)
      const res = await api.post('/summary/sales/generate', {
        summaryType: summaryType.toUpperCase(),
        periodStartDate: periodStartDate,
        periodEndDate: periodEndDate
      });

      // Wait a fraction to complete the final simulated progress tick
      setTimeout(() => {
        if (res.data.isSuccess) {
          toast.success('Sales Summary generated successfully');
          onGenerated();
          onClose();
        } else {
          toast.error(res.data.message || 'Failed to generate summary');
          setIsSubmitting(false);
        }
      }, 2300);

    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setTimeout(() => {
        console.error(err);
        toast.error(error.response?.data?.message || 'An error occurred during summary generation');
        setIsSubmitting(false);
      }, 2300);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => !isSubmitting && onClose()}></div>
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
              <TrendingUp size={16} className="text-white dark:text-zinc-900" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Generate Analytics</h3>
              <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Synthesize executive telemetry</p>
            </div>
          </div>
          {!isSubmitting && (
            <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200">
              <X size={16} />
            </button>
          )}
        </div>

        {isSubmitting ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-zinc-100 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 animate-spin" />
              <Sparkles className="absolute text-amber-500 animate-pulse" size={20} />
            </div>
            <div className="space-y-1.5 animate-pulse">
              <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">AI Compilation in Progress</h4>
              <p className="text-[10px] text-zinc-400 font-medium italic min-h-[15px]">{progressMsg}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Summary Type Selector */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-1">Report Cadence</label>
              <div className="grid grid-cols-4 gap-1.5 bg-zinc-100/60 dark:bg-zinc-800/40 p-1 rounded-lg border border-zinc-200/50 dark:border-zinc-700/30">
                {['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSummaryType(t)}
                    className={cn(
                      "py-2 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all",
                      summaryType === t
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/20 dark:border-zinc-600"
                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    )}
                  >
                    {t.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-1">Period Start</label>
                <MyanmarDateInput
                  required
                  value={periodStartDate}
                  onChange={setPeriodStartDate}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-1">Period End</label>
                <MyanmarDateInput
                  required
                  value={periodEndDate}
                  onChange={setPeriodEndDate}
                  className="w-full"
                />
              </div>
            </div>

            {/* AI Insight Toggle Mock (Visual Flair) */}
            <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/10 rounded-xl flex gap-3">
              <Sparkles className="text-amber-500 shrink-0 mt-0.5" size={14} />
              <div>
                <p className="text-[9px] font-black text-amber-800 dark:text-amber-500 uppercase tracking-wider">AI Narrative Engaged</p>
                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-normal mt-0.5">Synthesis will automatically incorporate structural velocity audits, top products volume indices, and client concentration ratios.</p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-lg shadow-zinc-200 dark:shadow-none mt-4 flex items-center justify-center gap-2"
            >
              Generate Executive Summary
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- Detailed Summary Drawer Component ---
const DetailedSummaryModal = ({
  summary,
  onClose
}: {
  summary: SalesSummary;
  onClose: () => void;
}) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await api.post('/summary/sales/analyze', summary);
        if (res.data.isSuccess) {
          setAnalysis(res.data.data);
        } else {
          setAnalysis('Failed to load AI analysis summary.');
        }
      } catch (err) {
        console.error(err);
        setAnalysis('Failed to load AI analysis summary.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [summary]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center shadow-md">
              <FileText className="text-white dark:text-zinc-900" size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Executive Audit Report</h3>
              <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Summary ID: #{summary.summaryId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800/80 rounded-xl text-center">
            <div>
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Summary Cadence</p>
              <span className="inline-block px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 text-[8px] font-bold uppercase rounded tracking-wider">
                {summary.summaryType}
              </span>
            </div>
            <div>
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Target Period</p>
              <p className="text-[9px] font-bold text-zinc-900 dark:text-zinc-100">
                {formatDateToDisplay(summary.periodStartDate)} - {formatDateToDisplay(summary.periodEndDate)}
              </p>
            </div>
            <div>
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Generated Via</p>
              <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-zinc-600 dark:text-zinc-400">
                <Clock size={10} />
                <span>{summary.source}</span>
              </div>
            </div>
          </div>

          {/* Metric Core Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Total Sales</p>
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{formatCurrency(summary.totalRevenue)}</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Avg Ticket Value</p>
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{formatCurrency(summary.averageOrderValue)}</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Volume (Invoices)</p>
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{summary.totalOrders} Invoices</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Items Dispatched</p>
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{summary.totalItemsSold} Units</p>
            </div>
          </div>

          {/* AI Narrative Analysis Block */}
          <div className="relative group p-5 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-950/20 dark:to-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner">
            <div className="absolute top-0 right-0 p-3 opacity-15">
              <Sparkles size={36} className="text-amber-500" />
            </div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="text-amber-500" size={13} />
              <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Compulsory AI Synthesis Summary</h4>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 py-2">
                <Loader2 className="animate-spin text-amber-500" size={14} />
                <span>Generating dynamic AI business analysis...</span>
              </div>
            ) : (
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium animate-in fade-in duration-350">
                {analysis}
              </p>
            )}
          </div>

          {/* Top Performers breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Product Card */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                <Package size={14} className="text-zinc-400" />
                <h4 className="text-[9px] font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-widest">Top Inventory Item</h4>
              </div>
              {summary.topProductName ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 truncate">{summary.topProductName}</p>
                  <div className="flex items-center justify-between text-[9px] font-semibold">
                    <span className="text-zinc-400 uppercase">Quantity Sold</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{summary.topProductQuantitySold} units</span>
                  </div>
                  {summary.topProductRevenue && summary.topProductRevenue > 0 && (
                    <div className="flex items-center justify-between text-[9px] font-semibold">
                      <span className="text-zinc-400 uppercase">Product Share</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(summary.topProductRevenue)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[9px] text-zinc-400 italic">No inventory products registered for this period.</p>
              )}
            </div>

            {/* Top Customer Card */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                <Users size={14} className="text-zinc-400" />
                <h4 className="text-[9px] font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-widest">Top Capital Client</h4>
              </div>
              {summary.topCustomerName ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 truncate">{summary.topCustomerName}</p>
                  <div className="flex items-center justify-between text-[9px] font-semibold">
                    <span className="text-zinc-400 uppercase">Account ID</span>
                    <span className="text-zinc-900 dark:text-zinc-100">CLIENT-{summary.topCustomerId}</span>
                  </div>
                  {summary.topCustomerTotal && (
                    <div className="flex items-center justify-between text-[9px] font-semibold">
                      <span className="text-zinc-400 uppercase">Contributions</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold">{formatCurrency(summary.topCustomerTotal)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[9px] text-zinc-400 italic">No corporate customer entities registered for this period.</p>
              )}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

const JobCountdown = ({ nextExecution }: { nextExecution: string | null }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!nextExecution) {
      setTimeLeft('Not scheduled');
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(nextExecution) - +new Date();
      if (difference <= 0) {
        setTimeLeft('Running...');
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(`in ${parts.join(' ')}`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [nextExecution]);

  return <span className="font-mono font-bold text-amber-500">{timeLeft}</span>;
};

const SchedulerJobsWidget = ({
  jobs,
  loading,
  onRefresh,
  isDark
}: {
  jobs: SchedulerJobStatus[];
  loading: boolean;
  onRefresh: () => void;
  isDark: boolean;
}) => {
  const formatJobName = (jobId: string) => {
    return jobId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
          <div>
            <h4 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-widest">Automated Summarizer Engine</h4>
            <p className="text-[8px] text-zinc-400 font-bold uppercase mt-0.5">Background task compiler schedule and telemetry</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
        >
          <Activity size={12} className={cn(loading && "animate-spin text-zinc-900 dark:text-zinc-100")} />
        </button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/50 dark:border-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          <Clock className="text-zinc-300 dark:text-zinc-600 mb-1" size={20} />
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">No active compiler schedules found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const isActive = job.lastJobState === 'Succeeded' || !job.error;
            return (
              <div
                key={job.jobId}
                className="group relative overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-850 p-4 rounded-xl shadow-inner flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[9px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tight truncate">{formatJobName(job.jobId)}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-widest shrink-0",
                      isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450" : "bg-rose-500/10 text-rose-600"
                    )}>
                      {isActive ? 'Active' : 'Error'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-2.5 border-t border-zinc-200/30 dark:border-zinc-800/50 text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                  <div>
                    <span className="block text-[7px] text-zinc-400/85 mb-0.5">Last Run</span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {job.lastExecution ? new Date(job.lastExecution).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[7px] text-zinc-400/85 mb-0.5">Next Run</span>
                    <JobCountdown nextExecution={job.nextExecution} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Primary Page Component ---
export default function SalesSummariesPage() {
  const { user, isLoading } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const [activeSummary, setActiveSummary] = useState<SalesSummary | null>(null);
  const [historyList, setHistoryList] = useState<SalesSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-zinc-100" />
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest animate-pulse">
            Authenticating user session...
          </p>
        </div>
      </div>
    );
  }

  const isOwner = user && canProvisionNewBusiness(user.accountType);

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-zinc-50/50 dark:bg-zinc-950/20 px-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xl p-8 text-center relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-zinc-300 dark:hover:border-zinc-700">
          {/* Visual gradient backdrop glow */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
          
          <div className="flex flex-col items-center relative z-10">
            {/* Pulsing Lock Icon Container */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 dark:bg-amber-500/10 animate-ping opacity-75" />
              <div className="relative w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            
            {/* Header */}
            <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-1.5 font-display">
              Access Restricted
            </h2>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-6">
              Authorized Owner access only
            </p>
            
            {/* Descriptive Content */}
            <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 mb-6 text-left space-y-2.5">
              <p className="text-[11px] text-zinc-650 dark:text-zinc-450 leading-relaxed font-medium">
                The Sales Summaries dashboard and AI Business Analyser Assistant are restricted resources designated strictly for the **Business Owner** role.
              </p>
              <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                If you require access to sales data audits, compiling schedules, or automated telemetry, please contact your business owner to provision permissions.
              </p>
            </div>
            
            {/* Premium Button Action */}
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-850 dark:hover:bg-zinc-200 transition-all hover:shadow-lg dark:hover:shadow-none duration-200 transform active:scale-[0.98]"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  const [summaryTypeFilter, setSummaryTypeFilter] = useState<string>('MONTHLY');

  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === 'dark';

  // Date Range Quick Presets
  const [periodStartDate, setPeriodStartDate] = useState<string>(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return formatLocalDate(firstDay);
  });
  const [periodEndDate, setPeriodEndDate] = useState<string>(() => {
    return formatLocalDate(new Date());
  });

  // Create a display-safe fallback for summary details to avoid layout thrashing on empty states
  const displaySummary = React.useMemo(() => {
    return activeSummary || {
      summaryId: 0,
      businessId: 0,
      summaryType: summaryTypeFilter,
      periodStartDate: periodStartDate,
      periodEndDate: periodEndDate,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalOrders: 0,
      totalItemsSold: 0,
      uniqueCustomers: 0,
      customerRanks: [],
      productRanks: [],
      generatedAt: '',
      source: 'N/A'
    };
  }, [activeSummary, summaryTypeFilter, periodStartDate, periodEndDate]);

  // AI Analyst Chat state and handlers (Consolidated to global AIChatContext)
  const {
    chatMessages,
    chatLoading,
    sendChatMessage,
    resetChat,
    updateSummaryParams
  } = useAIChat();

  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (displaySummary) {
      updateSummaryParams({
        summaryType: displaySummary.summaryType,
        periodStartDate: displaySummary.periodStartDate,
        periodEndDate: displaySummary.periodEndDate,
        totalRevenue: displaySummary.totalRevenue,
        averageOrderValue: displaySummary.averageOrderValue,
        totalOrders: displaySummary.totalOrders,
        totalItemsSold: displaySummary.totalItemsSold
      });
    }
  }, [displaySummary, updateSummaryParams]);

  const handleSendChatMessage = async (customMessage?: string) => {
    const textToSend = customMessage || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    if (!customMessage) setChatInput('');
    await sendChatMessage(textToSend);
  };

  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<SalesSummary | null>(null);

  useEffect(() => {
    if (isGenModalOpen || selectedSummary) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isGenModalOpen, selectedSummary]);

  const [jobsStatus, setJobsStatus] = useState<SchedulerJobStatus[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(true);

  const loadSchedulerStatus = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await api.get('/summary/scheduler/status');
      if (res.data.isSuccess && res.data.data) {
        setJobsStatus(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load scheduler status:', err);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    loadSchedulerStatus();
  }, [loadSchedulerStatus]);

  // Check if User is allowed to generate summaries (Owner or Admin roles)
  const isCreateAllowed = React.useMemo(() => {
    if (!user) return false;
    const userRole = user.role?.toLowerCase() || '';
    const userAccType = user.accountType?.toLowerCase() || '';
    return userRole === 'owner' || userRole === 'admin' || userAccType === 'owner' || userAccType === 'admin';
  }, [user]);

  // Fetch summaries logic
  const loadActiveSummary = useCallback(async () => {
    if (isInitialLoading) {
      setLoading(true);
    } else {
      setIsFetching(true);
    }
    try {
      // Query parameters for GET /api/summary/sales
      const params: Record<string, string> = {
        summaryType: summaryTypeFilter.toUpperCase()
      };

      if (summaryTypeFilter === 'CUSTOM') {
        params.periodStartDate = periodStartDate;
        params.periodEndDate = periodEndDate;
      }

      const res = await api.get('/summary/sales', { params });

      if (res.data.isSuccess && res.data.data) {
        setActiveSummary(res.data.data);
      } else {
        setActiveSummary(null);
      }

      // Simultaneously retrieve history
      const historyRes = await api.get('/summary/sales/history', {
        params: { summaryType: summaryTypeFilter.toUpperCase() }
      });

      if (historyRes.data.isSuccess && historyRes.data.data) {
        setHistoryList(historyRes.data.data);
      } else {
        setHistoryList([]);
      }

    } catch (err) {
      console.error('Failed to load active summaries:', err);
      setActiveSummary(null);
      setHistoryList([]);
      toast.error('Failed to fetch analytical summaries.');
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
      setIsFetching(false);
    }
  }, [summaryTypeFilter, periodStartDate, periodEndDate, isInitialLoading]);

  // Trigger loading on filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadActiveSummary();
  }, [loadActiveSummary]);

  // Track the latest filter for SignalR without triggering an effect restart
  const summaryTypeFilterRef = React.useRef(summaryTypeFilter);
  useEffect(() => {
    summaryTypeFilterRef.current = summaryTypeFilter;
  }, [summaryTypeFilter]);

  // --- SignalR Real-Time Hook ---
  useEffect(() => {
    // Wait for initial data load to ensure any expired token is refreshed by the API interceptor
    if (!isOwner || typeof window === 'undefined' || isInitialLoading) return;

    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7217/api').replace('/api', '');

    const connection = new HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/salesummary`, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || ''
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveSummaryUpdate', (packagedData: any) => {
      console.log('Received Real-Time Summary Update:', packagedData);
      
      let newSummaryData = null;
      const currentFilter = summaryTypeFilterRef.current;
      
      // Handle either lowercase or PascalCase properties from the backend
      if (currentFilter === 'DAILY') newSummaryData = packagedData.daily || packagedData.Daily;
      else if (currentFilter === 'WEEKLY') newSummaryData = packagedData.weekly || packagedData.Weekly;
      else if (currentFilter === 'MONTHLY') newSummaryData = packagedData.monthly || packagedData.Monthly;
      else if (currentFilter === 'YEARLY') newSummaryData = packagedData.yearly || packagedData.Yearly;

      if (newSummaryData) {
        setActiveSummary(newSummaryData);
        toast.success('Live Update Received', { description: 'Sales summary metrics refreshed in real-time.' });
      }
    });

    let isMounted = true;

    async function startSignalR() {
      try {
        await connection.start();
        if (isMounted) {
          console.log('Connected to SaleSummaryHub');
        } else {
          await connection.stop();
        }
      } catch (err: any) {
        if (err.message !== 'Failed to start the HttpConnection before stop() was called.') {
          console.error('SignalR Connection Error:', err);
        }
      }
    }

    startSignalR();

    return () => {
      isMounted = false;
      connection.stop();
    };
  }, [isOwner, isInitialLoading]);



  // Generate dynamic chart data based on active summary metrics for rich visual rendering
  type TelemetryPoint = { name: string; revenue: number; orders: number };

  const telemetryChartData = React.useMemo<TelemetryPoint[]>(() => {
    if (!displaySummary) return [];

    if (displaySummary.salesTrend && displaySummary.salesTrend.length > 0) {
      return displaySummary.salesTrend.map(pt => ({
        name: pt.label,
        revenue: pt.revenue,
        orders: pt.orders
      }));
    }

    return [];
  }, [displaySummary]);

  const customerRankData = React.useMemo(() => {
    const ranks = (displaySummary.customerRanks || []).map((customer) => ({
      name: customer.customerName,
      revenue: customer.totalRevenue,
      orders: customer.totalOrders,
      percentage: customer.percentageOfRevenue
    }));

    if (ranks.length > 0 || !displaySummary.topCustomerName) return ranks;

    return [{
      name: displaySummary.topCustomerName,
      revenue: displaySummary.topCustomerTotal || 0,
      orders: displaySummary.totalOrders,
      percentage: displaySummary.totalRevenue > 0 ? ((displaySummary.topCustomerTotal || 0) / displaySummary.totalRevenue) * 100 : 0
    }];
  }, [displaySummary]);

  const productRankData = React.useMemo(() => {
    const ranks = (displaySummary.productRanks || []).map((product) => ({
      name: product.productName,
      revenue: product.revenue,
      quantity: product.quantitySold,
      percentage: product.percentageOfRevenue
    }));

    if (ranks.length > 0 || !displaySummary.topProductName) return ranks;

    return [{
      name: displaySummary.topProductName,
      revenue: displaySummary.topProductRevenue || 0,
      quantity: displaySummary.topProductQuantitySold || 0,
      percentage: displaySummary.totalRevenue > 0 ? ((displaySummary.topProductRevenue || 0) / displaySummary.totalRevenue) * 100 : 0
    }];
  }, [displaySummary]);

  const customerPieData = React.useMemo(() => customerRankData.slice(0, 6), [customerRankData]);
  const productPieData = React.useMemo(() => productRankData.slice(0, 6), [productRankData]);
  const hasDailyRankData = displaySummary.summaryType === 'DAILY' && (customerRankData.length > 0 || productRankData.length > 0);



  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300 pb-20">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-700/80 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="text-zinc-900 dark:text-zinc-100" size={18} />
            Sales Analytical Summaries
          </h1>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mt-1">
            Generate and analyze operational cadence profiles and high-velocity business trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeSummary && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 rounded-xl text-[9px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-450 shadow-sm animate-in fade-in duration-200">
              <Calendar size={12} className="text-zinc-400" />
              <span>
                {formatDateToDisplay(activeSummary.periodStartDate)} &mdash; {formatDateToDisplay(activeSummary.periodEndDate)}
              </span>
            </div>
          )}
          {isCreateAllowed && (
            <button
              onClick={() => setIsGenModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md shrink-0"
            >
              <Plus size={14} /> New Summary
            </button>
          )}
        </div>
      </div>

      {/* Scheduler status panel */}
      <div id="scheduler-jobs">
        <SchedulerJobsWidget jobs={jobsStatus} loading={loadingJobs} onRefresh={loadSchedulerStatus} isDark={isDark} />
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[350px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl" />
            <div className="h-[350px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Active Summary Dash: KPI Cards Row */}
          <div id="kpi-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Total Revenue */}
            <div className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                  <DollarSign size={16} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Aggregate Revenue</p>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {formatCurrency(displaySummary.totalRevenue)}
                </h3>
                <p className="text-[9px] text-zinc-400 font-semibold italic">Net gross over current cycles</p>
              </div>
            </div>

            {/* Average Ticket */}
            <div className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Receipt size={16} />
                </div>
                <ArrowUpRight size={14} className="text-zinc-300 dark:text-zinc-600" />
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Average Ticket Value</p>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {formatCurrency(displaySummary.averageOrderValue)}
                </h3>
                <p className="text-[9px] text-zinc-400 font-semibold italic">AOV ratio per transaction</p>
              </div>
            </div>

            {/* Total Orders / Volume */}
            <div className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Activity size={16} />
                </div>
                <ArrowUpRight size={14} className="text-zinc-300 dark:text-zinc-600" />
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Invoice Volume</p>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {displaySummary.totalOrders} Invoices
                </h3>
                <p className="text-[9px] text-zinc-400 font-semibold italic">{displaySummary.totalItemsSold} stock units sold</p>
              </div>
            </div>

            {/* Customer reach */}
            <div className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Users size={16} />
                </div>
                <ArrowUpRight size={14} className="text-zinc-300 dark:text-zinc-600" />
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Active Client Scope</p>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {displaySummary.uniqueCustomers} Unique Clients
                </h3>
                <p className="text-[9px] text-zinc-400 font-semibold italic">Registered accounts count</p>
              </div>
            </div>

          </div>

          {/* AI Insights & Recharts Telemetry Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

            {/* Visual Analytics & Drivers Column */}
            <div className={cn("lg:col-span-7 flex flex-col gap-6 transition-opacity duration-200", isFetching && "opacity-75")}>
              
              {/* Visual Analytics */}
              <div id="telemetry-charts" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col h-[480px] relative">
                {isFetching && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-100 dark:bg-zinc-800 overflow-hidden z-10 rounded-t-xl">
                    <div className="h-full bg-zinc-900 dark:bg-zinc-100 animate-pulse w-1/3" />
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-4 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-widest flex items-center gap-1.5">
                        Sales Trend Telemetry
                        {isFetching && <Loader2 className="animate-spin text-zinc-400" size={10} />}
                      </h4>
                      <p className="text-[8px] text-zinc-400 font-bold uppercase mt-0.5">Cadence distribution index</p>
                    </div>
                  </div>

                  {/* Cadence controls and Date picker */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-zinc-100/60 dark:bg-zinc-800/40 p-0.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/30 overflow-x-auto flex-nowrap w-full sm:w-auto scrollbar-none">
                      {['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSummaryTypeFilter(t)}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all shrink-0",
                            summaryTypeFilter === t
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                              : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {summaryTypeFilter === 'CUSTOM' && (
                      <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-3 duration-250">
                        <MyanmarDateInput
                          value={periodStartDate}
                          onChange={setPeriodStartDate}
                          buttonClassName="w-24 pl-2 pr-2 py-1 text-[9px] rounded-md"
                        />
                        <span className="text-[8px] font-bold text-zinc-400 uppercase">To</span>
                        <MyanmarDateInput
                          value={periodEndDate}
                          onChange={setPeriodEndDate}
                          buttonClassName="w-24 pl-2 pr-2 py-1 text-[9px] rounded-md"
                        />
                        <button
                          type="button"
                          onClick={loadActiveSummary}
                          className="px-2.5 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded text-[8px] font-bold uppercase tracking-widest shadow-sm hover:opacity-90 transition-opacity"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {telemetryChartData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 bg-zinc-50/30 dark:bg-zinc-950/10 min-h-[220px]">
                    <AlertCircle className="text-zinc-300 dark:text-zinc-600 mb-2 animate-pulse" size={24} />
                    <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">No transaction data available</p>
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Try selecting a different cadence or custom range</p>
                  </div>
                ) : (
                  <div className="flex-1 h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        key={`area-chart-${summaryTypeFilter}-${displaySummary.totalRevenue}-${displaySummary.totalOrders}`}
                        data={telemetryChartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isDark ? "#fafafa" : "#18181b"} stopOpacity={0.08} />
                            <stop offset="95%" stopColor={isDark ? "#fafafa" : "#18181b"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#27272a" : "#f1f1f1"} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: isDark ? '#71717a' : '#a1a1aa', fontSize: 9, fontWeight: 700 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: isDark ? '#71717a' : '#a1a1aa', fontSize: 9, fontWeight: 700 }}
                          tickFormatter={formatShortNumber}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                            fontSize: '9px',
                            fontWeight: 800,
                            backgroundColor: isDark ? '#18181b' : '#fafafa',
                            color: isDark ? '#fff' : '#18181b'
                          }}
                          itemStyle={{ color: isDark ? '#fff' : '#18181b' }}
                          formatter={(v: unknown) => [formatCurrency(Number(v as number)), 'REVENUE']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke={isDark ? "#fafafa" : "#18181b"} strokeWidth={2} dot={{ r: 3, strokeWidth: 1, fill: isDark ? '#18181b' : '#ffffff' }} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Drivers Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                <h4 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-zinc-900 dark:text-zinc-100" />
                  Key Business Drivers
                </h4>
                
                <div className="space-y-4 pt-1">
                  <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Primary Product Driver</span>
                    {displaySummary.topProductName ? (
                      <div className="flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/20 dark:border-zinc-800/50 p-3 rounded-lg">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 truncate uppercase">{displaySummary.topProductName}</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">{displaySummary.topProductQuantitySold} Units Dispatched</p>
                        </div>
                        <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 shrink-0">TOP</span>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic">None registered</p>
                    )}
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Highest Value Client</span>
                    {displaySummary.topCustomerName ? (
                      <div className="flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/20 dark:border-zinc-800/50 p-3 rounded-lg">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 truncate uppercase">{displaySummary.topCustomerName}</p>
                          {displaySummary.topCustomerTotal && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase mt-0.5">{formatCurrency(displaySummary.topCustomerTotal)}</p>
                          )}
                        </div>
                        <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 shrink-0">KEY</span>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic">None registered</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Active System Insights (AI Chat Area) */}
            <div className="lg:col-span-5 flex flex-col h-[480px] lg:h-[750px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-950/20 border-b border-zinc-200/50 dark:border-zinc-800/80">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="text-amber-500 animate-pulse" size={12} />
                  <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">Active System Insights</span>
                </div>
                {chatMessages.length > 1 && (
                  <button
                    onClick={resetChat}
                    className="text-[10px] font-bold text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 uppercase tracking-wider transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Messages Panel */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 animate-in fade-in duration-200">
                {chatMessages.map((msg, index) => {
                  const isModel = msg.role === 'model';
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm font-medium",
                        isModel
                          ? "bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/65 dark:border-zinc-800 text-zinc-750 dark:text-zinc-300 self-start rounded-tl-none"
                          : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 self-end rounded-tr-none"
                      )}
                    >
                      <div className="text-xs font-normal">
                        {renderMarkdown(msg.content, isModel)}
                      </div>
                      {(() => {
                        const scrollTarget = isModel ? getScrollTargetForMessage(msg.content) : null;
                        if (!scrollTarget) return null;
                        const targetExists = typeof document !== 'undefined' && document.getElementById(scrollTarget.id);
                        if (!targetExists) return null;
                        return (
                          <button
                            onClick={() => {
                              const element = document.getElementById(scrollTarget.id);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="mt-2 text-[10px] font-black text-emerald-600 dark:text-emerald-450 hover:underline flex items-center gap-1 uppercase tracking-wider self-start"
                          >
                            <ArrowUpRight size={10} />
                            (Take me to {scrollTarget.label})
                          </button>
                        );
                      })()}
                    </div>
                  );
                })}
                {chatLoading && (
                  <div className="flex items-center gap-1.5 self-start bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-850 px-4 py-3 rounded-2xl rounded-tl-none text-zinc-450">
                    <Loader2 className="animate-spin text-zinc-500" size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Analyst is typing...</span>
                  </div>
                )}
              </div>

              {/* Shortcut pills */}
              <div className="px-4 py-2.5 flex gap-2 overflow-x-auto whitespace-nowrap border-t border-zinc-200/30 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-950/10 scrollbar-none">
                {[
                  { label: 'Stock advice', text: 'Give me inventory stock and replenishment advice.' },
                  { label: 'Peak hours', text: 'Analyze peak daily sales transaction times.' },
                  { label: 'Best sellers', text: 'Show my best selling products and ranks.' },
                  { label: 'Revenue audit', text: 'Summarize total orders and ticket sizes.' }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendChatMessage(preset.text)}
                    disabled={chatLoading}
                    className="px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-bold uppercase text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-inner disabled:opacity-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                className="p-3.5 border-t border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900"
              >
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-3 py-2 transition-all focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-300 dark:focus-within:ring-zinc-700">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    placeholder="Ask the Analyst..."
                    className="flex-1 text-xs bg-transparent focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-600 disabled:opacity-50 text-zinc-800 dark:text-zinc-200"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-lg transition-all",
                      chatInput.trim()
                        ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        : "bg-zinc-100 text-zinc-450 dark:bg-zinc-800/50 dark:text-zinc-650 cursor-not-allowed"
                    )}
                    title="Send Message"
                  >
                    <Send size={14} className={chatInput.trim() ? "translate-x-[0.5px] -translate-y-[0.5px]" : ""} />
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Detailed Product & Client Insights Section */}
          {(customerRankData.length > 0 || productRankData.length > 0) && (
            <div id="detailed-insights" className="space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-widest">Detailed Product & Client Insights</h4>
                  <p className="text-[8px] text-zinc-400 font-bold uppercase mt-0.5">Rankings & Contribution breakdown for selected period</p>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Customer Revenue Share */}
                  {customerPieData.length > 0 && (
                    <div className="min-h-[230px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/10 p-4">
                      <div className="mb-3">
                        <h5 className="text-[9px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Customer Revenue Share</h5>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Contribution mix</p>
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart key={`customer-pie-${summaryTypeFilter}-${displaySummary.totalRevenue}-${displaySummary.totalOrders}`}>
                          <Tooltip
                            contentStyle={{
                              borderRadius: '8px',
                              border: 'none',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                              fontSize: '9px',
                              fontWeight: 800,
                              backgroundColor: isDark ? '#18181b' : '#fafafa',
                              color: isDark ? '#fff' : '#18181b'
                            }}
                            formatter={(v: unknown, name: unknown) => [formatCurrency(Number(v)), String(name)]}
                          />
                          <Pie data={customerPieData} dataKey="revenue" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={2}>
                            {customerPieData.map((entry, index) => (
                              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Top Customers */}
                  {customerRankData.length > 0 && (
                    <div className="min-h-[230px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/10 p-4">
                      <div className="mb-3">
                        <h5 className="text-[9px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Top Customers</h5>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Ranked by paid revenue</p>
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          key={`customer-bar-${summaryTypeFilter}-${displaySummary.totalRevenue}-${displaySummary.totalOrders}`}
                          data={customerRankData.slice(0, 5)}
                          layout="vertical"
                          margin={{ top: 0, right: 12, left: 8, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                          <XAxis type="number" hide />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={88}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 9, fontWeight: 700 }}
                            tickFormatter={(v) => String(v).length > 12 ? `${String(v).slice(0, 12)}...` : String(v)}
                          />
                          <Tooltip
                            cursor={{ fill: isDark ? '#27272a' : '#f4f4f5' }}
                            contentStyle={{
                              borderRadius: '8px',
                              border: 'none',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                              fontSize: '9px',
                              fontWeight: 800,
                              backgroundColor: isDark ? '#18181b' : '#fafafa',
                              color: isDark ? '#fff' : '#18181b'
                            }}
                            formatter={(v: unknown) => [formatCurrency(Number(v)), 'REVENUE']}
                          />
                          <Bar dataKey="revenue" radius={[0, 5, 5, 0]} fill="#2563eb" barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Product Revenue Mix */}
                  {productPieData.length > 0 && (
                    <div className="min-h-[230px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/10 p-4">
                      <div className="mb-3">
                        <h5 className="text-[9px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Product Revenue Mix</h5>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Top item contribution</p>
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart key={`product-pie-${summaryTypeFilter}-${displaySummary.totalRevenue}-${displaySummary.totalOrders}`}>
                          <Tooltip
                            contentStyle={{
                              borderRadius: '8px',
                              border: 'none',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                              fontSize: '9px',
                              fontWeight: 800,
                              backgroundColor: isDark ? '#18181b' : '#fafafa',
                              color: isDark ? '#fff' : '#18181b'
                            }}
                            formatter={(v: unknown, name: unknown) => [formatCurrency(Number(v)), String(name)]}
                          />
                          <Pie data={productPieData} dataKey="revenue" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={2}>
                            {productPieData.map((entry, index) => (
                              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Top Items Sold */}
                  {productRankData.length > 0 && (
                    <div className="min-h-[230px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/10 p-4">
                      <div className="mb-3">
                        <h5 className="text-[9px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Top Items Sold</h5>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Ranked by units moved</p>
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          key={`product-bar-${summaryTypeFilter}-${displaySummary.totalRevenue}-${displaySummary.totalOrders}`}
                          data={productRankData.slice(0, 5).sort((a, b) => b.quantity - a.quantity)}
                          layout="vertical"
                          margin={{ top: 0, right: 12, left: 8, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                          <XAxis type="number" allowDecimals={false} hide />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={88}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 9, fontWeight: 700 }}
                            tickFormatter={(v) => String(v).length > 12 ? `${String(v).slice(0, 12)}...` : String(v)}
                          />
                          <Tooltip
                            cursor={{ fill: isDark ? '#27272a' : '#f4f4f5' }}
                            contentStyle={{
                              borderRadius: '8px',
                              border: 'none',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                              fontSize: '9px',
                              fontWeight: 800,
                              backgroundColor: isDark ? '#18181b' : '#fafafa',
                              color: isDark ? '#fff' : '#18181b'
                            }}
                            formatter={(v: unknown) => [`${Number(v)} units`, 'SOLD']}
                          />
                          <Bar dataKey="quantity" radius={[0, 5, 5, 0]} fill="#059669" barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History Section Table */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
              <div>
                <h4 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-widest">Historical Archive Ledger</h4>
                <p className="text-[8px] text-zinc-400 font-medium">Record registry of generated analytics</p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20">
                      <th className="px-5 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest w-12 text-center">No</th>
                      <th className="px-5 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Audited Period</th>
                      <th className="px-5 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Type</th>
                      <th className="px-5 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">Gross Total</th>
                      <th className="px-5 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Primary Product Driver</th>
                      <th className="px-5 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Generated Via</th>
                      <th className="px-5 py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {historyList.map((item, idx) => (
                      <tr
                        key={item.summaryId}
                        onClick={() => setSelectedSummary(item)}
                        className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors border-b border-zinc-200/50 dark:border-zinc-700/80 last:border-0 cursor-pointer text-[10px]"
                      >
                        <td className="px-5 py-4 font-bold text-zinc-400 text-center w-12">{idx + 1}</td>
                        <td className="px-5 py-4 font-black text-zinc-800 dark:text-zinc-200">
                          {formatDateToDisplay(item.periodStartDate)} - {formatDateToDisplay(item.periodEndDate)}
                        </td>
                        <td className="px-5 py-4 font-bold">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
                            item.summaryType === 'DAILY' ? "bg-rose-500/10 text-rose-600" :
                              item.summaryType === 'WEEKLY' ? "bg-blue-500/10 text-blue-600" :
                                item.summaryType === 'MONTHLY' ? "bg-amber-500/10 text-amber-600" :
                                  item.summaryType === 'YEARLY' ? "bg-emerald-500/10 text-emerald-600" :
                                    "bg-violet-500/10 text-violet-600"
                          )}>
                            {item.summaryType}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(item.totalRevenue)}
                        </td>
                        <td className="px-5 py-4 font-bold text-zinc-500 dark:text-zinc-400 max-w-[150px] truncate">
                          {item.topProductName || 'N/A'}
                        </td>
                        <td className="px-5 py-4 font-bold text-zinc-400 uppercase">
                          {item.source}
                        </td>
                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedSummary(item)}
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                            >
                              <Eye size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {historyList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-zinc-400 uppercase font-bold italic">
                          No archived summaries matching these filters could be retrieved.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Generate Analytics Form Modal */}
      {isGenModalOpen && (
        <GenerateSummaryModal
          onClose={() => setIsGenModalOpen(false)}
          onGenerated={loadActiveSummary}
        />
      )}

      {/* Detailed Analysis Inspector */}
      {selectedSummary && (
        <DetailedSummaryModal
          summary={selectedSummary}
          onClose={() => setSelectedSummary(null)}
        />
      )}



    </div>
  );
}
