import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Plus, 
  Search, 
  Bell, 
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Globe,
  Menu,
  X
} from 'lucide-react';
import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';

// --- TRANSLATIONS ---
const translations = {
  en: {
    dashboard: 'Dashboard',
    subscriptions: 'Subscriptions',
    insights: 'AI Insights',
    groups: 'Groups',
    totalSpent: 'Total Spent This Month',
    vsLastMonth: 'vs last month',
    deltaIndex: 'Δ (Delta) Index',
    inflationDropping: 'Your personal inflation is dropping.',
    aiAutoEntry: 'AI Auto-Entry',
    dropReceipt: 'Drop a receipt or screenshot here',
    manualEntry: 'Manual Entry',
    spendingTrends: 'Spending Trends',
    categories: 'Categories',
    top5: 'Top 5',
    recentTransactions: 'Recent Transactions',
    viewAll: 'View All',
    search: 'Search transactions...',
    addExpense: 'Add Expense',
    proMember: 'Pro Member',
    
    // Subscriptions
    invisibleRadar: 'Invisible Subscription Radar',
    manageRecurring: 'Manage recurring charges and free trials automatically.',
    addTrial: 'Add Trial',
    trialEnding: 'Free Trial Ending Soon',
    trialDesc: 'Your ChatGPT Plus trial ends in 3 days. You will be charged $20.00/month if not cancelled.',
    cancelSub: 'Cancel Subscription',
    keepIt: 'Keep It',
    active: 'Active',
    trial: 'Trial',
    
    // Insights
    smartStrategist: 'Smart Consumption Strategist',
    aiDrivenInsights: 'AI-driven insights to reshape your budget and track real inflation.',
    moversShakers: 'Movers & Shakers (Δ Index)',
    steepestChanges: 'Items with the steepest price changes in your history.',
    was: 'Was',
    now: 'Now',
    aiBudgetReshaping: 'AI Budget Reshaping',
    smartTrimming: 'Smart Trimming Suggestion',
    basedOnGoal: 'Based on your goal to save $300 this month.',
    coffeeShop: 'Coffee Shop Visits',
    coffeeDesc: 'You average 5 coffees a week. Trimming to 2 per week saves you ~$85/month.',
    unusedSubs: 'Unused Subscriptions',
    huluDesc: "You haven't used Hulu in 45 days. Cancel to save $24/month.",
    applyPlan: 'Apply AI Budget Plan',
    
    // Groups
    scenarioGroups: 'Scenario-Based Groups',
    smartSplit: 'Smart split engine for shared expenses.',
    newGroup: 'New Group',
    activeTrip: 'Active Trip',
    members: 'members',
    totalSpentGroup: 'Total spent',
    recentGroupExp: 'Recent Group Expenses',
    paidBy: 'Paid by',
    split: 'Split',
    equally: 'Equally',
    settlementPlan: 'Settlement Plan',
    graphOptimized: 'Graph algorithm optimized: 3 transactions saved.',
    youOwe: 'You owe',
    owesYou: 'owes You',
    settleUp: 'Settle Up',
    sendReminder: 'Send Reminder',
    
    // Mock Data
    dining: 'Dining',
    groceries: 'Groceries',
    transport: 'Transport',
    entertainment: 'Entertainment',
    income: 'Income',
    today: 'Today',
    yesterday: 'Yesterday',
    monthly: 'Monthly'
  },
  zh: {
    dashboard: '仪表盘',
    subscriptions: '订阅管理',
    insights: 'AI 洞察',
    groups: '群组账单',
    totalSpent: '本月总支出',
    vsLastMonth: '对比上月',
    deltaIndex: 'Δ (Delta) 指数',
    inflationDropping: '您的个人通胀率正在下降。',
    aiAutoEntry: 'AI 自动录入',
    dropReceipt: '将收据或截图拖拽至此',
    manualEntry: '手动录入',
    spendingTrends: '支出趋势',
    categories: '消费分类',
    top5: '前 5 名',
    recentTransactions: '最近交易',
    viewAll: '查看全部',
    search: '搜索交易记录...',
    addExpense: '记一笔',
    proMember: 'Pro 会员',
    
    // Subscriptions
    invisibleRadar: '隐形订阅雷达',
    manageRecurring: '自动管理周期性扣费和免费试用。',
    addTrial: '添加试用',
    trialEnding: '免费试用即将结束',
    trialDesc: '您的 ChatGPT Plus 试用将在 3 天后结束。如果不取消，将收取 $20.00/月。',
    cancelSub: '取消订阅',
    keepIt: '保留订阅',
    active: '活跃',
    trial: '试用中',
    
    // Insights
    smartStrategist: '智能消费策略师',
    aiDrivenInsights: 'AI 驱动的洞察，重塑您的预算并追踪真实通胀。',
    moversShakers: '价格波动榜 (Δ 指数)',
    steepestChanges: '历史记录中价格变化最剧烈的商品。',
    was: '原价',
    now: '现价',
    aiBudgetReshaping: 'AI 预算重塑',
    smartTrimming: '智能削减建议',
    basedOnGoal: '基于您本月节省 $300 的目标。',
    coffeeShop: '咖啡店消费',
    coffeeDesc: '您平均每周喝 5 杯咖啡。减少到每周 2 杯可以为您节省约 $85/月。',
    unusedSubs: '未使用的订阅',
    huluDesc: "您已经 45 天没有使用 Hulu 了。取消订阅可节省 $24/月。",
    applyPlan: '应用 AI 预算计划',
    
    // Groups
    scenarioGroups: '场景化群组',
    smartSplit: '用于共享支出的智能 AA 结算引擎。',
    newGroup: '新建群组',
    activeTrip: '进行中的旅行',
    members: '成员',
    totalSpentGroup: '总支出',
    recentGroupExp: '最近群组支出',
    paidBy: '支付人',
    split: '分摊方式',
    equally: '平摊',
    settlementPlan: '结算方案',
    graphOptimized: '图算法已优化：节省了 3 笔转账。',
    youOwe: '你欠',
    owesYou: '欠你',
    settleUp: '结清',
    sendReminder: '发送提醒',
    
    // Mock Data
    dining: '餐饮',
    groceries: '买菜',
    transport: '交通',
    entertainment: '娱乐',
    income: '收入',
    today: '今天',
    yesterday: '昨天',
    monthly: '每月'
  }
};

// --- MOCK DATA ---
const spendingTrend = [
  { name: 'Mon', amount: 120 },
  { name: 'Tue', amount: 85 },
  { name: 'Wed', amount: 210 },
  { name: 'Thu', amount: 45 },
  { name: 'Fri', amount: 320 },
  { name: 'Sat', amount: 150 },
  { name: 'Sun', amount: 90 },
];

const categoryData = [
  { name: 'Dining', value: 400 },
  { name: 'Groceries', value: 300 },
  { name: 'Transport', value: 150 },
  { name: 'Entertainment', value: 200 },
  { name: 'Subscriptions', value: 80 },
];

const COLORS = ['#E8D5F5', '#D4F0E7', '#FDE8D0', '#DBEAFE', '#F9E8E8'];

const recentTransactions = [
  { id: 1, name: 'Whole Foods Market', category: 'Groceries', amount: -84.50, date: 'Today, 10:24 AM', icon: '🥑' },
  { id: 2, name: 'Uber Ride', category: 'Transport', amount: -24.90, date: 'Yesterday, 8:15 PM', icon: '🚗' },
  { id: 3, name: 'Netflix Subscription', category: 'Subscriptions', amount: -15.99, date: 'Yesterday, 10:00 AM', icon: '🎬' },
  { id: 4, name: 'Salary Deposit', category: 'Income', amount: 4200.00, date: 'Oct 15, 09:00 AM', icon: '💰' },
];

const subscriptions = [
  { id: 1, name: 'Netflix', price: 15.99, cycle: 'Monthly', status: 'Active', color: 'bg-pastel-pink' },
  { id: 2, name: 'Spotify', price: 10.99, cycle: 'Monthly', status: 'Active', color: 'bg-pastel-mint' },
  { id: 3, name: 'ChatGPT Plus', price: 20.00, cycle: 'Monthly', status: 'Trial', trialEnds: '3 days', color: 'bg-pastel-purple' },
  { id: 4, name: 'Adobe Creative Cloud', price: 54.99, cycle: 'Monthly', status: 'Active', color: 'bg-pastel-blue' },
];

const moversAndShakers = [
  { id: 1, name: 'Organic Eggs (Dozen)', oldPrice: 4.50, newPrice: 5.20, change: '+15.5%', trend: 'up' },
  { id: 2, name: 'Oat Milk', oldPrice: 5.99, newPrice: 5.99, change: '0%', trend: 'flat' },
  { id: 3, name: 'Avocados', oldPrice: 2.50, newPrice: 1.99, change: '-20.4%', trend: 'down' },
];

// --- COMPONENTS ---

const Logo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M 50 15 L 85 85 L 15 85 Z M 55.5 36 L 39 69 L 72 69 Z" />
  </svg>
);

const BlobButton = ({ children, className, onClick, variant = 'primary' }: any) => {
  const baseStyle = "px-6 py-3 font-medium transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2";
  const variants = {
    primary: "bg-gray-900 text-white blob-1 hover:blob-2",
    secondary: "bg-white text-gray-800 glass-panel blob-3 hover:blob-4",
    accent: "bg-pastel-purple text-gray-900 blob-5 hover:blob-1"
  };
  
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, className = "", title, action }: any) => (
  <div className={`glass-panel rounded-3xl p-5 md:p-6 ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-4 md:mb-6">
        {title && <h3 className="text-lg md:text-xl font-semibold text-gray-800">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
);

// --- VIEWS ---

const DashboardView = ({ t }: { t: any }) => (
  <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    {/* Top Stats Row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <Card className="bg-gradient-to-br from-white/60 to-pastel-purple/30 border-white/50">
        <p className="text-gray-500 font-medium mb-1 text-sm md:text-base">{t.totalSpent}</p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">$1,245.80</h2>
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="flex items-center text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full blob-2">
            <ArrowDownRight size={14} className="mr-1" /> 12%
          </span>
          <span className="text-gray-500">{t.vsLastMonth}</span>
        </div>
      </Card>
      
      <Card className="bg-gradient-to-br from-white/60 to-pastel-mint/30 border-white/50">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 font-medium mb-1 text-sm md:text-base">{t.deltaIndex}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">-2.4%</h2>
          </div>
          <div className="p-2 md:p-3 bg-white/50 rounded-full blob-4">
            <TrendingUp className="text-emerald-600" size={20} />
          </div>
        </div>
        <p className="text-xs md:text-sm text-gray-500 mt-2">{t.inflationDropping}</p>
      </Card>

      <div className="flex flex-col gap-3 h-full sm:col-span-2 lg:col-span-1">
        <div className="bg-gradient-to-br from-pastel-peach to-pastel-pink border-2 border-white/60 flex flex-col justify-center items-center text-center flex-1 py-6 px-4 blob-4 shadow-xl hover:scale-105 transition-transform cursor-pointer relative overflow-hidden group min-h-[180px]">
          <div className="absolute inset-0 bg-white/20 group-hover:bg-white/40 transition-colors" />
          <div className="relative z-10 flex flex-col items-center w-[80%] mx-auto">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white/90 rounded-full blob-1 flex items-center justify-center mb-3 shadow-sm backdrop-blur-sm">
              <UploadCloud className="text-gray-800" size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">{t.aiAutoEntry}</h3>
            <p className="text-xs md:text-sm text-gray-700 mt-1 font-medium">{t.dropReceipt}</p>
          </div>
        </div>
        <button className="w-full py-2.5 px-4 bg-white/60 hover:bg-white/80 transition-colors glass-panel rounded-2xl flex items-center justify-center gap-2 text-sm font-medium text-gray-700 border-white/50 shadow-sm">
          <Plus size={16} /> {t.manualEntry}
        </button>
      </div>
    </div>

    {/* Charts Row */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <Card title={t.spendingTrends} className="lg:col-span-2">
        <div className="h-48 md:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spendingTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(val) => `$${val}`} width={40} />
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                itemStyle={{ color: '#1f2937', fontWeight: 500 }}
              />
              <Line type="monotone" dataKey="amount" stroke="#A881E6" strokeWidth={3} dot={{ r: 4, fill: '#A881E6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title={t.categories}>
        <div className="h-48 md:h-64 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', background: 'rgba(255,255,255,0.9)' }}
                formatter={(value, name) => [`$${value}`, t[name.toString().toLowerCase()] || name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-lg md:text-xl font-bold text-gray-800">{t.top5}</span>
          </div>
        </div>
      </Card>
    </div>

    {/* Recent Transactions */}
    <Card title={t.recentTransactions} action={<button className="text-sm font-medium text-gray-500 hover:text-gray-900">{t.viewAll}</button>}>
      <div className="space-y-3 md:space-y-4">
        {recentTransactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-2 md:p-3 hover:bg-white/40 rounded-2xl transition-colors cursor-pointer">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full blob-3 flex items-center justify-center text-lg md:text-xl shadow-sm shrink-0">
                {tx.icon}
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm md:text-base truncate">{tx.name}</h4>
                <p className="text-xs md:text-sm text-gray-500 truncate">{t[tx.category.toLowerCase()] || tx.category} • {tx.date.includes('Today') ? t.today + tx.date.replace('Today', '') : tx.date.includes('Yesterday') ? t.yesterday + tx.date.replace('Yesterday', '') : tx.date}</p>
              </div>
            </div>
            <div className={`font-semibold text-sm md:text-base shrink-0 ${tx.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
              {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const SubscriptionsView = ({ t }: { t: any }) => (
  <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4 md:mb-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">{t.invisibleRadar}</h2>
        <p className="text-sm md:text-base text-gray-500">{t.manageRecurring}</p>
      </div>
      <BlobButton variant="accent" className="w-full sm:w-auto justify-center"><Plus size={18} /> {t.addTrial}</BlobButton>
    </div>

    {/* Trial Alert */}
    <div className="bg-pastel-peach/40 border border-pastel-peach rounded-3xl p-4 md:p-6 flex flex-col sm:flex-row items-start gap-4">
      <div className="p-2 md:p-3 bg-white rounded-full blob-1 text-orange-500 shrink-0">
        <AlertCircle size={24} />
      </div>
      <div className="flex-1">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">{t.trialEnding}</h3>
        <p className="text-sm md:text-base text-gray-600 mt-1">{t.trialDesc}</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 md:gap-3">
          <button className="w-full sm:w-auto px-4 py-2 bg-white text-gray-800 text-sm md:text-base font-medium rounded-full hover:bg-gray-50 transition-colors shadow-sm">{t.cancelSub}</button>
          <button className="w-full sm:w-auto px-4 py-2 bg-gray-900 text-white text-sm md:text-base font-medium rounded-full hover:bg-gray-800 transition-colors">{t.keepIt}</button>
        </div>
      </div>
    </div>

    {/* Active Subscriptions */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {subscriptions.map((sub) => (
        <Card key={sub.id} className="relative overflow-hidden group">
          <div className={`absolute -right-10 -top-10 w-32 h-32 ${sub.color} opacity-50 blur-2xl blob-2 group-hover:scale-150 transition-transform duration-700`} />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 ${sub.color} rounded-full blob-4 flex items-center justify-center shadow-sm`}>
                <CreditCard size={20} className="text-gray-700" />
              </div>
              {sub.status === 'Trial' ? (
                <span className="px-2 py-1 md:px-3 md:py-1 bg-orange-100 text-orange-700 text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider">{t.trial}</span>
              ) : (
                <span className="px-2 py-1 md:px-3 md:py-1 bg-emerald-100 text-emerald-700 text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider">{t.active}</span>
              )}
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">{sub.name}</h3>
            <div className="mt-2 md:mt-4 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-bold text-gray-900">${sub.price.toFixed(2)}</span>
              <span className="text-gray-500 text-xs md:text-sm">/{t.monthly.toLowerCase()}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const InsightsView = ({ t }: { t: any }) => (
  <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="mb-4 md:mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">{t.smartStrategist}</h2>
      <p className="text-sm md:text-base text-gray-500">{t.aiDrivenInsights}</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* Movers & Shakers */}
      <Card title={t.moversShakers}>
        <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">{t.steepestChanges}</p>
        <div className="space-y-3 md:space-y-4">
          {moversAndShakers.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-white/40 rounded-2xl gap-2">
              <div>
                <h4 className="font-semibold text-gray-800 text-sm md:text-base">{item.name}</h4>
                <p className="text-xs md:text-sm text-gray-500">{t.was} ${item.oldPrice.toFixed(2)} → {t.now} ${item.newPrice.toFixed(2)}</p>
              </div>
              <div className={`self-start sm:self-auto flex items-center gap-1 font-bold px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm ${
                item.trend === 'up' ? 'bg-red-100 text-red-600' : 
                item.trend === 'down' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {item.trend === 'up' ? <ArrowUpRight size={14} /> : item.trend === 'down' ? <ArrowDownRight size={14} /> : null}
                {item.change}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Budget Reshaping */}
      <Card title={t.aiBudgetReshaping} className="bg-gradient-to-br from-white/60 to-pastel-blue/30">
        <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="p-2 md:p-3 bg-white rounded-full blob-3 text-blue-500 shadow-sm shrink-0">
            <Sparkles size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">{t.smartTrimming}</h3>
            <p className="text-gray-600 text-xs md:text-sm mt-1">{t.basedOnGoal}</p>
          </div>
        </div>
        
        <div className="bg-white/60 rounded-2xl p-3 md:p-4 mb-3 md:mb-4">
          <div className="flex justify-between items-center mb-1 md:mb-2">
            <span className="font-medium text-gray-800 text-sm md:text-base">{t.coffeeShop}</span>
            <span className="text-red-500 font-medium text-sm md:text-base">-$145/mo</span>
          </div>
          <p className="text-xs md:text-sm text-gray-600">{t.coffeeDesc}</p>
        </div>

        <div className="bg-white/60 rounded-2xl p-3 md:p-4">
          <div className="flex justify-between items-center mb-1 md:mb-2">
            <span className="font-medium text-gray-800 text-sm md:text-base">{t.unusedSubs}</span>
            <span className="text-red-500 font-medium text-sm md:text-base">-$24/mo</span>
          </div>
          <p className="text-xs md:text-sm text-gray-600">{t.huluDesc}</p>
        </div>

        <button className="w-full mt-4 md:mt-6 py-2.5 md:py-3 bg-gray-900 text-white rounded-full text-sm md:text-base font-medium hover:bg-gray-800 transition-colors">
          {t.applyPlan}
        </button>
      </Card>
    </div>
  </div>
);

const GroupsView = ({ t }: { t: any }) => (
  <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4 md:mb-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">{t.scenarioGroups}</h2>
        <p className="text-sm md:text-base text-gray-500">{t.smartSplit}</p>
      </div>
      <BlobButton variant="primary" className="w-full sm:w-auto justify-center"><Plus size={18} /> {t.newGroup}</BlobButton>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Active Group Card */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-white/60 to-pastel-pink/30">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 md:mb-6">
          <div>
            <span className="px-2 py-1 md:px-3 md:py-1 bg-white/50 text-pink-700 text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider mb-2 md:mb-3 inline-block">{t.activeTrip}</span>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">Tokyo Vacation 2026</h3>
            <p className="text-xs md:text-sm text-gray-500 mt-1">4 {t.members} • {t.totalSpentGroup}: $2,450.00</p>
          </div>
          <div className="flex -space-x-2 md:-space-x-3">
            {[1,2,3,4].map(i => (
              <div key={i} className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white flex items-center justify-center text-[10px] md:text-xs font-bold text-gray-700 shadow-sm ${COLORS[i%COLORS.length]}`}>
                U{i}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 md:space-y-4 mt-6 md:mt-8">
          <h4 className="font-semibold text-gray-800 text-sm md:text-base">{t.recentGroupExp}</h4>
          {[
            { desc: 'Sushi Dinner', paidBy: 'You', amount: 120, split: 'Equally' },
            { desc: 'Shinkansen Tickets', paidBy: 'Alex', amount: 340, split: 'Equally' },
          ].map((exp, i) => (
            <div key={i} className="flex items-center justify-between p-3 md:p-4 bg-white/50 rounded-2xl">
              <div className="min-w-0 pr-2">
                <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{exp.desc}</p>
                <p className="text-xs md:text-sm text-gray-500 truncate">{t.paidBy} {exp.paidBy} • {t.split} {t.equally}</p>
              </div>
              <span className="font-bold text-gray-900 text-sm md:text-base shrink-0">${exp.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Settlement Optimization */}
      <Card title={t.settlementPlan}>
        <div className="flex items-start gap-2 md:gap-3 mb-4 md:mb-6 p-2 md:p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5 md:w-5 md:h-5" />
          <span className="text-xs md:text-sm font-medium">{t.graphOptimized}</span>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-800 text-sm md:text-base">{t.youOwe} Alex</span>
              <span className="font-bold text-gray-900 text-sm md:text-base">$85.00</span>
            </div>
            <button className="w-full py-2 bg-gray-900 text-white rounded-full text-xs md:text-sm font-medium hover:bg-gray-800 transition-colors">
              {t.settleUp}
            </button>
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-800 text-sm md:text-base">Sarah {t.owesYou}</span>
              <span className="font-bold text-emerald-600 text-sm md:text-base">$42.50</span>
            </div>
            <button className="w-full py-2 bg-white text-gray-800 border border-gray-200 rounded-full text-xs md:text-sm font-medium hover:bg-gray-50 transition-colors">
              {t.sendReminder}
            </button>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const t = translations[lang];

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'subscriptions', label: t.subscriptions, icon: CreditCard },
    { id: 'insights', label: t.insights, icon: TrendingUp },
    { id: 'groups', label: t.groups, icon: Users },
  ];

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView t={t} />;
      case 'subscriptions': return <SubscriptionsView t={t} />;
      case 'insights': return <InsightsView t={t} />;
      case 'groups': return <GroupsView t={t} />;
      default: return <DashboardView t={t} />;
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink/30 via-white/50 to-pastel-blue/30 text-gray-800 font-sans overflow-hidden relative flex flex-col md:flex-row">
      {/* Animated Background Blobs (Mesh Gradient Effect) */}
      <div className="fixed top-[-20%] left-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-pastel-purple opacity-70 blur-[100px] md:blur-[140px] blob-1 animate-[spin_40s_linear_infinite] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[90vw] md:w-[60vw] h-[90vw] md:h-[60vw] bg-pastel-mint opacity-70 blur-[100px] md:blur-[150px] blob-2 animate-[spin_50s_linear_infinite_reverse] pointer-events-none" />
      <div className="fixed top-[20%] left-[30%] w-[70vw] md:w-[40vw] h-[70vw] md:h-[40vw] bg-pastel-peach opacity-60 blur-[90px] md:blur-[130px] blob-3 animate-[spin_35s_linear_infinite] pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-10%] w-[60vw] md:w-[40vw] h-[60vw] md:h-[40vw] bg-pastel-blue opacity-60 blur-[100px] md:blur-[140px] blob-4 animate-[spin_45s_linear_infinite] pointer-events-none" />
      <div className="fixed top-[-10%] right-[10%] w-[60vw] md:w-[40vw] h-[60vw] md:h-[40vw] bg-pastel-pink opacity-60 blur-[100px] md:blur-[130px] blob-5 animate-[spin_55s_linear_infinite_reverse] pointer-events-none" />
      
      {/* Mobile Header */}
      <div className="md:hidden relative z-30 flex items-center justify-between p-4 glass-panel border-b border-white/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-full blob-4 flex items-center justify-center text-white">
            <Logo className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">DeltaSpend</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleLang} className="p-2 text-gray-600 hover:bg-white/50 rounded-full transition-colors">
            <Globe size={20} />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-900 hover:bg-white/50 rounded-full transition-colors">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 md:w-64 lg:w-72 h-screen p-4 md:p-6 flex flex-col glass-panel md:bg-transparent md:border-none md:shadow-none
        transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="hidden md:flex items-center justify-between mb-8 md:mb-12 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-full blob-4 flex items-center justify-center text-white">
              <Logo className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">DeltaSpend</span>
          </div>
          <button onClick={toggleLang} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white/50 rounded-full transition-colors" title="Toggle Language">
            <Globe size={18} />
          </button>
        </div>

        {/* Mobile close button inside sidebar */}
        <div className="md:hidden flex justify-end mb-4">
           <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500 hover:bg-white/50 rounded-full">
             <X size={20} />
           </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/60 text-gray-900 shadow-sm glass-panel' 
                    : 'text-gray-500 hover:bg-white/30 hover:text-gray-800'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-pastel-purple drop-shadow-sm' : ''} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-3 md:p-4 glass-panel rounded-3xl flex items-center gap-3">
          <div className="w-10 h-10 bg-pastel-blue rounded-full blob-1 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">Alex User</p>
            <p className="text-xs text-gray-500 truncate">{t.proMember}</p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="relative z-10 flex-1 h-[calc(100vh-65px)] md:h-screen p-2 md:p-4 lg:p-6 md:pl-0">
        <div className="w-full h-full glass-panel rounded-[2rem] md:rounded-[2.5rem] flex flex-col overflow-hidden shadow-xl shadow-purple-900/5 border-white/60">
          
          {/* Top Header */}
          <header className="px-4 md:px-6 lg:px-8 py-4 md:py-6 flex justify-between items-center border-b border-white/40 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={t.search} 
                className="w-full bg-white/50 border border-white/80 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-pastel-purple transition-all"
              />
            </div>
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <button className="hidden sm:block p-2 text-gray-500 hover:text-gray-900 hover:bg-white/50 rounded-full transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
            </div>
          </header>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-6 lg:p-8">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}
