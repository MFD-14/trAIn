import React, { useEffect, useState } from 'react';
import {
  ToggleLeft, ToggleRight, DollarSign, Users, Briefcase,
  TrendingUp, Settings, Shield, Zap, Star, Award,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle,
  BarChart2, Lock
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getToken = () => {
  try {
    const s = JSON.parse(localStorage.getItem('auth-storage'));
    return s?.state?.token || '';
  } catch { return ''; }
};

const apiFetch = (path, opts = {}) =>
  fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    ...opts
  }).then(r => r.json());

// ─── Strategy metadata ──────────────────────────────────────────────
const STRATEGY_META = {
  platform_commission: {
    icon: DollarSign,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    badge: 'Always On',
    month: 'Active from Day 1',
    description: 'Take 20% of every task transaction. Your core revenue engine.',
    locked: true
  },
  company_subscriptions: {
    icon: Briefcase,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    badge: 'Month 3–4',
    month: 'Enable when you have 5+ companies',
    description: 'Monthly plans from $99–$799. Guaranteed recurring revenue.',
    locked: false
  },
  premium_trainers: {
    icon: Star,
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600',
    badge: 'Month 5–6',
    month: 'Enable when you have 100+ active trainers',
    description: 'Pro ($9.99/mo) & Elite ($24.99/mo) tiers with bonuses.',
    locked: false
  },
  data_quality_guarantee: {
    icon: Shield,
    color: 'orange',
    gradient: 'from-orange-500 to-amber-600',
    badge: 'Month 4–5',
    month: 'Enable alongside subscriptions',
    description: 'Charge 1.5–2× for multi-reviewer quality assurance.',
    locked: false
  },
  featured_listings: {
    icon: Zap,
    color: 'yellow',
    gradient: 'from-yellow-500 to-orange-500',
    badge: 'Month 4+',
    month: 'Enable once you have 200+ trainers',
    description: 'Companies pay $29–$99 to promote tasks to the top.',
    locked: false
  },
  api_access: {
    icon: Settings,
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
    badge: 'Month 7+',
    month: 'Enable for enterprise clients',
    description: 'API tiers from $49–$999/mo for system integrations.',
    locked: false
  }
};

const colorMap = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-400' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-800',    dot: 'bg-blue-400'    },
  purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  badge: 'bg-purple-100 text-purple-800',dot: 'bg-purple-400'  },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  badge: 'bg-orange-100 text-orange-800',dot: 'bg-orange-400'  },
  yellow:  { bg: 'bg-yellow-50',  border: 'border-yellow-200',  text: 'text-yellow-700',  badge: 'bg-yellow-100 text-yellow-800',dot: 'bg-yellow-400'  },
  rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    badge: 'bg-rose-100 text-rose-800',   dot: 'bg-rose-400'    }
};

// ─── Strategy Card ──────────────────────────────────────────────────
const StrategyCard = ({ strategy, onToggle, toggling }) => {
  const [expanded, setExpanded] = useState(false);
  const meta   = STRATEGY_META[strategy.strategy_key] || {};
  const colors = colorMap[meta.color] || colorMap.blue;
  const Icon   = meta.icon || DollarSign;
  const isOn   = strategy.is_enabled;

  const configItems = Object.entries(strategy.config || {})
    .filter(([k]) => !['description', 'tiers', 'plans'].includes(k))
    .slice(0, 4);

  const tiers = strategy.config?.tiers || strategy.config?.plans || [];

  return (
    <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden
      ${isOn ? `${colors.border} shadow-lg` : 'border-gray-200 opacity-80'}`}>

      {/* Header */}
      <div className={`p-5 ${isOn ? colors.bg : 'bg-gray-50'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
              bg-gradient-to-br ${meta.gradient} shadow-md`}>
              <Icon size={22} className="text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  {strategy.strategy_name}
                </h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                  {meta.badge}
                </span>
                {meta.locked && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={10} /> Core
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{meta.month}</p>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={() => !meta.locked && onToggle(strategy.strategy_key, !isOn)}
              disabled={toggling === strategy.strategy_key || meta.locked}
              className={`transition-all duration-200 ${meta.locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105'}`}
              title={meta.locked ? 'This strategy is always active' : `${isOn ? 'Disable' : 'Enable'} this strategy`}
            >
              {isOn
                ? <ToggleRight size={44} className={colors.text} />
                : <ToggleLeft  size={44} className="text-gray-300" />
              }
            </button>
            <span className={`text-xs font-bold ${isOn ? colors.text : 'text-gray-400'}`}>
              {toggling === strategy.strategy_key ? '...' : isOn ? 'LIVE' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mt-3 leading-relaxed">{meta.description}</p>

        {/* Status row */}
        <div className="flex items-center justify-between mt-3">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${isOn ? colors.text : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isOn ? `${colors.dot} animate-pulse` : 'bg-gray-300'}`} />
            {isOn ? `Active since ${strategy.enabled_at ? new Date(strategy.enabled_at).toLocaleDateString() : 'today'}` : 'Not yet activated'}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            {expanded ? <><ChevronUp size={14} /> Hide details</> : <><ChevronDown size={14} /> View config</>}
          </button>
        </div>
      </div>

      {/* Expanded Config */}
      {expanded && (
        <div className="px-5 pb-5 pt-3 bg-white border-t border-gray-100">
          {tiers.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pricing Tiers</p>
              <div className="grid gap-2">
                {tiers.map((tier, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{tier.name}</span>
                      {tier.description && <span className="text-xs text-gray-500 ml-2">{tier.description}</span>}
                    </div>
                    <div className="text-right">
                      {tier.price_monthly !== undefined && (
                        <span className="text-sm font-bold text-gray-900">
                          {tier.price_monthly === 0 ? 'Free' : `$${tier.price_monthly}/mo`}
                        </span>
                      )}
                      {tier.price !== undefined && (
                        <span className="text-sm font-bold text-gray-900">
                          {tier.price === 0 ? 'Free' : `$${tier.price}`}
                        </span>
                      )}
                      {tier.multiplier !== undefined && (
                        <span className="text-sm font-bold text-gray-900">{tier.multiplier}× rate</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Configuration</p>
              <div className="space-y-1">
                {configItems.map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-gray-800">
                      {typeof val === 'number' && key.includes('rate')
                        ? `${(val * 100).toFixed(0)}%`
                        : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {strategy.notes && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 flex items-start gap-1">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                {strategy.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Revenue Stat Card ──────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color = 'blue', sub }) => {
  const colors = colorMap[color] || colorMap.blue;
  return (
    <div className={`rounded-xl p-4 ${colors.bg} border ${colors.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>{label}</span>
        <Icon size={18} className={colors.text} />
      </div>
      <div className="text-2xl font-black text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
};

// ─── Main Admin Dashboard ───────────────────────────────────────────
const AdminDashboard = () => {
  const [strategies, setStrategies]   = useState([]);
  const [revenue, setRevenue]         = useState(null);
  const [toggling, setToggling]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState(null);
  const [activeTab, setActiveTab]     = useState('strategies');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [strat, rev] = await Promise.all([
        apiFetch('/admin/monetization'),
        apiFetch('/admin/revenue')
      ]);
      if (strat.strategies) setStrategies(strat.strategies);
      if (rev.totals) setRevenue(rev);
    } catch (e) {
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key, enabled) => {
    setToggling(key);
    try {
      const res = await apiFetch(`/admin/monetization/${key}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      });
      if (res.strategy) {
        setStrategies(prev => prev.map(s => s.strategy_key === key ? res.strategy : s));
        showToast(`${res.strategy.strategy_name} ${enabled ? 'enabled' : 'disabled'}!`, enabled ? 'success' : 'info');
      } else {
        showToast(res.error?.message || 'Toggle failed', 'error');
      }
    } catch {
      showToast('Network error — please try again', 'error');
    } finally {
      setToggling(null);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const enabledCount   = strategies.filter(s => s.is_enabled).length;
  const estimatedMRR   = strategies.reduce((sum, s) => {
    if (!s.is_enabled) return sum;
    const cfg = s.config;
    if (s.strategy_key === 'company_subscriptions' && cfg?.plans) {
      return sum + cfg.plans.reduce((a, p) => a + (p.price_monthly || 0), 0) * 0.1;
    }
    return sum;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading Admin Dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium animate-pulse
          ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield size={16} className="text-white" />
                </div>
                <div className="text-2xl font-black tracking-tight">
                  <span className="text-white">tr</span>
                  <span className="text-indigo-400">AI</span>
                  <span className="text-white">n</span>
                  <span className="text-gray-500 text-lg font-normal ml-2">Admin</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">Monetization Control Center</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-500">Active Strategies</div>
                <div className="text-2xl font-black text-indigo-400">{enabledCount}<span className="text-gray-600 text-lg">/6</span></div>
              </div>
              <button onClick={fetchAll} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                <TrendingUp size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Revenue Stats */}
        {revenue && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Trainers"  value={revenue.totals?.total_trainers  || 0}  icon={Users}     color="blue"    sub="Registered users" />
            <StatCard label="Total Companies" value={revenue.totals?.total_clients   || 0}  icon={Briefcase} color="purple"  sub="Client accounts" />
            <StatCard label="Revenue Today"   value={formatCurrency(revenue.today?.revenue_today || 0)} icon={DollarSign} color="emerald" sub="Platform commission" />
            <StatCard label="Total Earned"    value={formatCurrency(revenue.totals?.total_commission_earned || 0)} icon={TrendingUp} color="orange" sub="All-time commission" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-0">
          {['strategies', 'subscriptions', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-semibold capitalize rounded-t-lg transition-all -mb-px
                ${activeTab === tab
                  ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
                  : 'text-gray-400 hover:text-gray-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Strategies Tab ── */}
        {activeTab === 'strategies' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Revenue Strategies</h2>
                <p className="text-gray-400 text-sm">Toggle strategies on/off as your platform grows month by month</p>
              </div>
              <div className="text-xs text-gray-500 bg-gray-800 px-3 py-1.5 rounded-full">
                💡 Strategy 1 is always active
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {strategies.map(strategy => (
                <StrategyCard
                  key={strategy.strategy_key}
                  strategy={strategy}
                  onToggle={handleToggle}
                  toggling={toggling}
                />
              ))}
            </div>

            {/* Roadmap Timeline */}
            <div className="mt-8 bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <BarChart2 size={18} className="text-indigo-400" />
                Recommended Activation Timeline
              </h3>
              <div className="space-y-3">
                {[
                  { period: 'Month 1–2',  strategy: 'Platform Commission',     action: 'Already active. Focus on getting first 10 companies & 100 trainers.', done: true },
                  { period: 'Month 3–4',  strategy: 'Company Subscriptions',   action: 'Enable when you have 5+ repeat companies. Pitch founding member rates.',done: false },
                  { period: 'Month 4–5',  strategy: 'Data Quality Guarantee',  action: 'Enable alongside subscriptions to increase per-task revenue.',          done: false },
                  { period: 'Month 4+',   strategy: 'Featured Listings',       action: 'Enable once you have 200+ active trainers to justify promotion.',        done: false },
                  { period: 'Month 5–6',  strategy: 'Premium Trainer Accounts',action: 'Enable when 100+ trainers earn regularly. They will upgrade fast.',      done: false },
                  { period: 'Month 7+',   strategy: 'API Access',              action: 'Enable for enterprise deals. Hire one sales rep to land big accounts.',  done: false },
                ].map((item, i) => (
                  <div key={i} className={`flex gap-4 p-3 rounded-xl ${item.done ? 'bg-emerald-900/30 border border-emerald-800/50' : 'bg-gray-800/50'}`}>
                    <div className={`flex-shrink-0 w-16 text-xs font-bold text-center py-1 rounded-lg
                      ${item.done ? 'bg-emerald-700 text-emerald-100' : 'bg-gray-700 text-gray-300'}`}>
                      {item.period}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${item.done ? 'text-emerald-300' : 'text-gray-200'}`}>
                        {item.strategy} {item.done && '✅'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Subscriptions Tab ── */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Subscription Plans</h2>
              <p className="text-gray-400 text-sm">Company and trainer plans — activate by enabling the strategies above</p>
            </div>

            {/* Company Plans */}
            <div>
              <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wide mb-3">Company Plans</h3>
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { name: 'Starter',    price: '$99',    tasks: '500 tasks/mo',    color: 'bg-gray-800',   highlight: false },
                  { name: 'Growth',     price: '$299',   tasks: '2,000 tasks/mo',  color: 'bg-blue-900/40',highlight: false },
                  { name: 'Business',   price: '$799',   tasks: '10,000 tasks/mo', color: 'bg-indigo-900/40', highlight: true },
                  { name: 'Enterprise', price: 'Custom', tasks: 'Unlimited tasks', color: 'bg-purple-900/40', highlight: false },
                ].map(plan => (
                  <div key={plan.name} className={`rounded-xl p-4 border ${plan.highlight ? 'border-indigo-500' : 'border-gray-700'} ${plan.color} relative`}>
                    {plan.highlight && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-semibold">Most Popular</div>}
                    <div className="text-base font-bold text-white mb-1">{plan.name}</div>
                    <div className="text-2xl font-black text-white mb-1">{plan.price}<span className="text-sm font-normal text-gray-400">{plan.price !== 'Custom' ? '/mo' : ''}</span></div>
                    <div className="text-xs text-gray-400">{plan.tasks}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trainer Plans */}
            <div>
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide mb-3">Trainer Plans</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'Free',  price: '$0',     bonus: 'Base rate',  color: 'bg-gray-800',        highlight: false },
                  { name: 'Pro',   price: '$9.99',  bonus: '+10% bonus', color: 'bg-purple-900/40',   highlight: false },
                  { name: 'Elite', price: '$24.99', bonus: '+25% bonus', color: 'bg-violet-900/40',   highlight: true  },
                ].map(plan => (
                  <div key={plan.name} className={`rounded-xl p-4 border ${plan.highlight ? 'border-violet-500' : 'border-gray-700'} ${plan.color}`}>
                    <div className="text-base font-bold text-white mb-1">{plan.name}</div>
                    <div className="text-2xl font-black text-white mb-1">{plan.price}<span className="text-sm font-normal text-gray-400">/mo</span></div>
                    <div className="text-xs text-green-400 font-semibold">{plan.bonus}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Analytics Tab ── */}
        {activeTab === 'analytics' && revenue && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Revenue Analytics</h2>
              <p className="text-gray-400 text-sm">Platform performance overview</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Submissions</div>
                <div className="text-3xl font-black text-white">{revenue.totals?.total_submissions || 0}</div>
                <div className="text-xs text-gray-500 mt-1">All time</div>
              </div>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Gross Volume Today</div>
                <div className="text-3xl font-black text-white">{formatCurrency(revenue.today?.volume_today || 0)}</div>
                <div className="text-xs text-gray-500 mt-1">Company payments</div>
              </div>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Trainer Payouts</div>
                <div className="text-3xl font-black text-white">{formatCurrency(revenue.totals?.total_commission_earned || 0)}</div>
                <div className="text-xs text-gray-500 mt-1">Total paid to trainers</div>
              </div>
            </div>

            {/* Monthly breakdown */}
            {revenue.monthlyRevenue?.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h3 className="text-sm font-bold text-white mb-4">Monthly Revenue</h3>
                <div className="space-y-2">
                  {revenue.monthlyRevenue.map((month, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div className="text-sm text-gray-300">
                        {new Date(month.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-xs text-gray-500">{month.total_transactions} tx</div>
                        <div className="text-sm font-bold text-emerald-400">{formatCurrency(month.commission_revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No data state */}
            {(!revenue.monthlyRevenue || revenue.monthlyRevenue.length === 0) && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center">
                <BarChart2 size={48} className="mx-auto text-gray-700 mb-3" />
                <p className="text-gray-400">Revenue data will appear here once users start completing tasks</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
