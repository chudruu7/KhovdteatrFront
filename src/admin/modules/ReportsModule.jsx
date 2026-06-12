// ================================================================
// ReportsModule.jsx
// Байршил: frontend/src/admin/modules/ReportsModule.jsx
// ================================================================

import { useState, useEffect } from 'react';
import {
  Armchair,
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  Download,
  Film,
  Landmark,
  Radio,
  Receipt,
  RefreshCcw,
  Star,
  Ticket,
  Users,
  XCircle,
} from 'lucide-react';
import {
  getDashboard, getDailySales, getMonthlySales, getPaymentMethods,
  getMovieViewership, getBookingChannels, getSeatTypes,
  getHallOccupancy, getPeakHours, getLostRevenue, getUserActivity, getLoyaltyReport,
  getCancellations, getDiscounts, getRefunds,
} from '../../api/reportAPI';

// ─── Туслах функцүүд ────────────────────────────────────────────
const fmt  = (n) => new Intl.NumberFormat('mn-MN').format(Math.round(n || 0));
const pct  = (n) => `${parseFloat(n || 0).toFixed(1)}%`;
const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => {
  const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
};
const exportRowsToCsv = (filename, columns, rows) => {
  const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const header = columns.map(c => escapeCsv(c.label)).join(',');
  const body = rows.map(row => columns.map(c => escapeCsv(c.value(row))).join(',')).join('\n');
  const blob = new Blob([`\ufeff${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ─── Таб тодорхойлолт ───────────────────────────────────────────
const TABS = [
  { id: 'dashboard',  label: 'Хураангуй', icon: BarChart3 },
  { id: 'financial',  label: 'Санхүү', icon: CircleDollarSign },
  { id: 'movies',     label: 'Үзвэр & Үзэлт', icon: Film },
  { id: 'tickets',    label: 'Захиалга', icon: Ticket },
  { id: 'halls',      label: 'Танхим', icon: Landmark },
  { id: 'audience',   label: 'Үзэгч', icon: Users },
];

// ─── Дэд компонентүүд ───────────────────────────────────────────

const StatCard = ({ label, value, sub, color = 'blue' }) => {
  const colors = {
    blue:   'bg-blue-500/10 border-blue-400/25 text-blue-200',
    green:  'bg-emerald-500/10 border-emerald-400/25 text-emerald-200',
    amber:  'bg-amber-500/10 border-amber-400/25 text-amber-200',
    red:    'bg-red-500/10 border-red-400/25 text-red-200',
    purple: 'bg-violet-500/10 border-violet-400/25 text-violet-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
};

const BarRow = ({ label, value, max, pctLabel, color = 'bg-blue-500' }) => (
  <div className="flex items-center gap-3 py-1.5">
    <span className="text-sm text-gray-600 w-36 shrink-0 truncate">{label}</span>
    <div className="flex-1 bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(100, (value / (max || 1)) * 100)}%` }} />
    </div>
    <span className="text-sm font-medium text-gray-700 w-20 text-right shrink-0">{pctLabel || fmt(value)}</span>
  </div>
);

const Table = ({ columns, rows, emptyMsg = 'Өгөгдөл байхгүй' }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          {columns.map(c => (
            <th key={c.key} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${c.right ? 'text-right' : 'text-left'}`}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.length === 0
          ? <tr><td colSpan={columns.length} className="text-center py-10 text-gray-400">{emptyMsg}</td></tr>
          : rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {columns.map(c => (
                <td key={c.key} className={`px-4 py-3 text-gray-700 ${c.right ? 'text-right font-medium' : ''}`}>
                  {c.render ? c.render(row, i) : row[c.key]}
                </td>
              ))}
            </tr>
          ))
        }
      </tbody>
    </table>
  </div>
);

const Loader = () => (
  <div className="flex items-center justify-center h-40">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ReportTheme = () => (
  <style>{`
    .reports-surface { color: #e5edf8; }
    .reports-surface .bg-white {
      background: rgba(15, 23, 42, 0.82) !important;
      border-color: rgba(148, 163, 184, 0.18) !important;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
      backdrop-filter: blur(16px);
    }
    .reports-surface .bg-gray-50,
    .reports-surface .bg-gray-100 {
      background: rgba(30, 41, 59, 0.72) !important;
    }
    .reports-surface .border-gray-200,
    .reports-surface .border-gray-100,
    .reports-surface .border-gray-50 {
      border-color: rgba(148, 163, 184, 0.16) !important;
    }
    .reports-surface .text-gray-900,
    .reports-surface .text-gray-800,
    .reports-surface .text-gray-700,
    .reports-surface .text-gray-600 {
      color: #e5edf8 !important;
    }
    .reports-surface .text-gray-500,
    .reports-surface .text-gray-400 {
      color: #93a4b8 !important;
    }
    .reports-surface input[type="date"] {
      background: rgba(2, 6, 23, 0.58);
      color: #e5edf8;
      border-color: rgba(148, 163, 184, 0.22);
      color-scheme: dark;
    }
    .reports-surface button:not(.bg-blue-600):not(.bg-emerald-600) {
      background: rgba(15, 23, 42, 0.9);
      border-color: rgba(148, 163, 184, 0.2);
      color: #cbd5e1;
    }
    .reports-surface button:not(.bg-blue-600):not(.bg-emerald-600):hover {
      background: rgba(30, 41, 59, 0.95);
      border-color: rgba(96, 165, 250, 0.42);
      color: #bfdbfe;
    }
    .reports-surface table tbody tr:hover {
      background: rgba(30, 41, 59, 0.58) !important;
    }
  `}</style>
);

const SectionTitle = ({ title, sub, icon: Icon }) => (
  <div className="mb-4">
    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
      {Icon && <Icon size={17} strokeWidth={2.2} />}
      {title}
    </h3>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ─── Огноо шүүлтүүр ─────────────────────────────────────────────
const DateFilter = ({ filters, onChange }) => (
  <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6">
    <span className="text-sm text-gray-500 font-medium">Хугацаа:</span>
    <input type="date" value={filters.startDate} onChange={e => onChange({ ...filters, startDate: e.target.value })}
      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400" />
    <span className="text-gray-300">—</span>
    <input type="date" value={filters.endDate} onChange={e => onChange({ ...filters, endDate: e.target.value })}
      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400" />
    {[
      { label: 'Бүх хугацаа',    s: '',              e: ''              },
      { label: 'Өнөөдөр',    s: today(),         e: today()         },
      { label: 'Энэ сар',    s: firstOfMonth(),  e: today()         },
      { label: 'Сүүлийн 3 сар', s: (() => { const d = new Date(); d.setMonth(d.getMonth()-3); return d.toISOString().slice(0,10); })(), e: today() },
    ].map(q => (
      <button key={q.label} onClick={() => onChange({ startDate: q.s, endDate: q.e })}
        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors">
        {q.label}
      </button>
    ))}
  </div>
);

// ================================================================
// ТАБ: Dashboard
// ================================================================
const DashboardTab = ({ filters }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDashboard(filters).then(r => { setData(r); setLoading(false); }).catch(() => setLoading(false));
  }, [filters]);

  if (loading) return <Loader />;
  if (!data)   return <p className="text-red-500 text-sm">Өгөгдөл татахад алдаа гарлаа</p>;

  const s = data.summary || {};
  const maxRev = Math.max(...(data.topMovies || []).map(m => m.totalRevenue), 1);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Нийт захиалгын дүн" value={`${fmt(s.totalRevenue)}₮`} color="green"  />
        <StatCard label="Төлөгдсөн орлого" value={`${fmt(s.paidRevenue)}₮`} color="blue" />
        <StatCard label="Тасалбар" value={fmt(s.ticketCount)} color="purple" />
        <StatCard label="Захиалга" value={fmt(s.bookingCount)} color="amber" />
        <StatCard label="Цуцалсан" value={fmt(s.cancelledCount)} color="red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionTitle title="Топ 5 үзвэр (орлогоор)" icon={Star} />
          <div className="space-y-1">
            {(data.topMovies || []).map((m, i) => (
              <BarRow key={i} label={`${i+1}. ${m.movieTitle}`} value={m.totalRevenue} max={maxRev}
                pctLabel={`${fmt(m.totalRevenue)}₮`} color="bg-blue-500" />
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionTitle title="Захиалгын суваг" icon={Radio} />
          <div className="space-y-2">
            {(data.channels || []).map((c, i) => {
              const total = (data.channels || []).reduce((s, x) => s + x.count, 0);
              const colors = ['bg-blue-500','bg-green-500','bg-amber-500','bg-purple-500','bg-red-500'];
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]} shrink-0`} />
                  <span className="text-sm text-gray-600 flex-1">{c._id}</span>
                  <span className="text-sm font-medium">{fmt(c.count)}</span>
                  <span className="text-xs text-gray-400 w-12 text-right">{pct(total ? c.count/total*100 : 0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================================================
// ТАБ: Санхүү
// ================================================================
const FinancialTab = ({ filters }) => {
  const [daily, setDaily]       = useState([]);
  const [summary, setSummary]   = useState({});
  const [monthly, setMonthly]   = useState([]);
  const [payments, setPayments] = useState([]);
  const [refundData, setRefund] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    const year = filters.startDate?.slice(0, 4) || new Date().getFullYear();
    Promise.all([
      getDailySales(filters),
      getMonthlySales({ year }),
      getPaymentMethods(filters),
      getRefunds(filters),
    ]).then(([d, m, p, r]) => {
      setDaily(d.data || []);
      setSummary(d.summary || {});
      setMonthly(m.data || []);
      setPayments(p.data || []);
      setRefund(r.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filters]);

  if (loading) return <Loader />;

  const maxRev = Math.max(...monthly.map(m => m.totalRevenue), 1);
  const exportFinancial = () => exportRowsToCsv(
    `financial-report-${filters.startDate || 'all'}-${filters.endDate || 'all'}.csv`,
    [
      { label: 'Огноо', value: r => r._id },
      { label: 'Орлого', value: r => r.totalRevenue },
      { label: 'Тасалбар', value: r => r.ticketCount },
      { label: 'Захиалга', value: r => r.bookingCount },
      { label: 'Дундаж үнэ', value: r => Math.round(r.avgTicketPrice || 0) },
    ],
    daily
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4">
        <StatCard label="Нийт захиалгын дүн" value={`${fmt(summary.totalRevenue)}₮`} color="green" />
        <StatCard label="Төлөгдсөн орлого" value={`${fmt(summary.paidRevenue)}₮`} color="blue" />
        <StatCard label="Нийт тасалбар" value={fmt(summary.ticketCount)} color="blue" />
        <StatCard label="Нийт захиалга" value={fmt(summary.bookingCount)} color="purple" />
        <StatCard label="Цуцалсан" value={fmt(summary.cancelledCount)} color="red" />
        <button
          onClick={exportFinancial}
          className="self-stretch px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
        >
          <Download size={16} />
          CSV татах
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <SectionTitle title="Өдрийн дэлгэрэнгүй орлого" />
        <Table
          columns={[
            { key: '_id', label: 'Огноо' },
            { key: 'bookingCount', label: 'Захиалга', right: true, render: r => fmt(r.bookingCount) },
            { key: 'ticketCount', label: 'Тасалбар', right: true, render: r => fmt(r.ticketCount) },
            { key: 'avgTicketPrice', label: 'Дундаж үнэ', right: true, render: r => `${fmt(r.avgTicketPrice)}₮` },
            { key: 'totalRevenue', label: 'Орлого', right: true, render: r => `${fmt(r.totalRevenue)}₮` },
          ]}
          rows={daily}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <SectionTitle title="Сарын орлого" sub={`${filters.startDate?.slice(0,4) || new Date().getFullYear()} он`} icon={BarChart3} />
        <div className="space-y-1">
          {monthly.map((m, i) => (
            <BarRow key={i} label={m.month} value={m.totalRevenue} max={maxRev}
              pctLabel={`${fmt(m.totalRevenue)}₮`} color="bg-green-500" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionTitle title="Төлбөрийн арга" icon={Receipt} />
          {payments.map((p, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{p._id || 'Бусад'}</span>
              <div className="text-right">
                <p className="text-sm font-semibold">{fmt(p.totalRevenue)}₮</p>
                <p className="text-xs text-gray-400">{p.count} захиалга · {pct(p.percentage)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionTitle title="Буцаан олголт (шалтгаанаар)" icon={RefreshCcw} />
          {refundData.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">Буцаалт байхгүй</p>
            : refundData.map((r, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{r._id || 'Шалтгаан тодорхойгүй'}</span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">{fmt(r.refundedAmount)}₮</p>
                  <p className="text-xs text-gray-400">{r.count} тасалбар</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

// ================================================================
// ТАБ: Үзвэр & Үзэлт
// ================================================================
const MoviesTab = ({ filters }) => {
  const [viewership, setViewership] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    setLoading(true);
    getMovieViewership(filters)
      .then(r => { setViewership(r.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filters]);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <Table
        columns={[
          { key: 'rank',         label: '#',          render: (_, i) => i + 1 },
          { key: 'movieTitle',   label: 'Үзвэрийн нэр'  },
          { key: 'genre',        label: 'Ангилал'        },
          { key: 'ticketCount',  label: 'Тасалбар',   right: true, render: r => fmt(r.ticketCount)  },
          { key: 'bookingCount', label: 'Захиалга',   right: true, render: r => fmt(r.bookingCount) },
          { key: 'totalRevenue', label: 'Орлого',     right: true, render: r => `${fmt(r.totalRevenue)}₮` },
        ]}
        rows={viewership.map((r, i) => ({ ...r, rank: i + 1 }))}
      />
    </div>
  );
};

// ================================================================
// ТАБ: Тасалбар захиалга
// ================================================================
const TicketsTab = ({ filters }) => {
  const [channels, setChannels]  = useState([]);
  const [seatData, setSeatData]  = useState([]);
  const [discData, setDiscData]  = useState([]);
  const [loading, setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getBookingChannels(filters),
      getSeatTypes(filters),
      getDiscounts(filters),
    ]).then(([ch, st, di]) => {
      setChannels(ch.data || []);
      setSeatData(st.data || []);
      setDiscData(di.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filters]);

  if (loading) return <Loader />;

  const channelColors = ['bg-blue-500','bg-green-500','bg-amber-500','bg-purple-500','bg-red-400'];
  const maxCh = Math.max(...channels.map(c => c.count), 1);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionTitle title="Захиалгын суваг" icon={Radio} />
          {channels.map((c, i) => (
            <BarRow key={i} label={c._id || 'Бусад'} value={c.count} max={maxCh}
              pctLabel={`${c.count} (${pct(c.percentage)})`} color={channelColors[i % channelColors.length]} />
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionTitle title="Суудлын ангилал" icon={Armchair} />
          {seatData.map((s, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{s._id}</span>
              <div className="text-right">
                <p className="text-sm font-semibold">{fmt(s.count)} суудал</p>
                <p className="text-xs text-gray-400">{pct(s.percentage)} · {fmt(s.totalRevenue)}₮</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <SectionTitle title="Хөнгөлөлтийн тасалбар (төрлөөр)" icon={Ticket} />
        <Table
          columns={[
            { key: '_id',           label: 'Хөнгөлөлтийн төрөл'                            },
            { key: 'count',         label: 'Тоо',           right: true, render: r => fmt(r.count)         },
            { key: 'totalDiscount', label: 'Хөнгөлсөн дүн', right: true, render: r => `${fmt(r.totalDiscount)}₮` },
            { key: 'totalRevenue',  label: 'Орлого',         right: true, render: r => `${fmt(r.totalRevenue)}₮`  },
          ]}
          rows={discData}
        />
      </div>
    </div>
  );
};

// ================================================================
// ТАБ: Танхим
// ================================================================
const HallsTab = ({ filters }) => {
  const [occupancy, setOccupancy] = useState([]);
  const [peaks, setPeaks]         = useState([]);
  const [lost, setLost]           = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getHallOccupancy(filters),
      getPeakHours(filters),
      getLostRevenue(filters),
    ]).then(([o, p, l]) => {
      setOccupancy(o.data || []);
      setPeaks(p.data?.slice(0, 10) || []);
      setLost(l);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filters]);

  if (loading) return <Loader />;

  return (
    <div className="space-y-8">
      {lost && (
        <StatCard label="Хоосон суудлын таамаглалын алдагдал"
          value={`${fmt(lost.totalLostRevenue)}₮`} color="red" />
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <SectionTitle title="Танхим тус бүрийн дүүргэлт" icon={Landmark} />
        <Table
          columns={[
            { key: '_id',           label: 'Танхим'               },
            { key: 'sessionCount',  label: 'Сеанс',      right: true, render: r => fmt(r.sessionCount)                              },
            { key: 'totalSoldSeats',label: 'Зарагдсан',  right: true, render: r => fmt(r.totalSoldSeats)                           },
            { key: 'avgOccupancy',  label: 'Дундаж %',   right: true, render: r => <span className={parseFloat(r.avgOccupancy) >= 70 ? 'text-green-600 font-semibold' : parseFloat(r.avgOccupancy) >= 40 ? 'text-amber-600' : 'text-red-500'}>{pct(r.avgOccupancy)}</span> },
            { key: 'totalRevenue',  label: 'Орлого',     right: true, render: r => `${fmt(r.totalRevenue)}₮`                       },
          ]}
          rows={occupancy}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <SectionTitle title="Хамгийн их ачаалалтай цаг" icon={CalendarClock} />
        <Table
          columns={[
            { key: 'weekday',      label: 'Өдөр'                                       },
            { key: 'hour',         label: 'Цаг'                                        },
            { key: 'bookingCount', label: 'Захиалга', right: true, render: r => fmt(r.bookingCount) },
            { key: 'totalRevenue', label: 'Орлого',   right: true, render: r => `${fmt(r.totalRevenue)}₮` },
          ]}
          rows={peaks}
        />
      </div>
    </div>
  );
};

// ================================================================
// ТАБ: Үзэгч
// ================================================================
const AudienceTab = ({ filters }) => {
  const [activity, setActivity]   = useState(null);
  const [loyalty, setLoyalty]     = useState([]);
  const [cancel, setCancel]       = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getUserActivity(filters),
      getLoyaltyReport({ limit: 10 }),
      getCancellations(filters),
    ]).then(([a, l, c]) => {
      setActivity(a);
      setLoyalty(l.data || []);
      setCancel(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filters]);

  if (loading) return <Loader />;

  return (
    <div className="space-y-8">
      {activity && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Идэвхтэй үзэгч"     value={fmt(activity.totalActiveUsers)} color="blue"   />
          <StatCard label="Шинэ үзэгч"          value={fmt(activity.newUsers)}         color="green"  />
          <StatCard label="Буцаж ирсэн"         value={fmt(activity.returningUsers)}   color="purple" />
          <StatCard label="Дундаж захиалга/хүн" value={(activity.avgBookingsPerUser||0).toFixed(1)} color="amber" />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <SectionTitle title="Үнэнч үзэгч (Топ 10)" icon={Star} />
        <Table
          columns={[
            { key: 'rank',         label: '#',          render: (_, i) => i + 1     },
            { key: 'userName',     label: 'Нэр'                                      },
            { key: 'email',        label: 'И-мэйл'                                   },
            { key: 'bookingCount', label: 'Захиалга',  right: true, render: r => fmt(r.bookingCount) },
            { key: 'totalSpent',   label: 'Нийт зарцуулсан', right: true, render: r => `${fmt(r.totalSpent)}₮` },
          ]}
          rows={loyalty.map((r, i) => ({ ...r, rank: i + 1 }))}
        />
      </div>

      {cancel && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <SectionTitle title="Цуцлалт (шалтгаанаар)" icon={XCircle} />
            {(cancel.byReason || []).map((r, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{r._id || 'Шалтгаангүй'}</span>
                <span className="text-sm font-medium text-red-600">{r.count} удаа</span>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <SectionTitle title="Хамгийн их цуцлагдсан үзвэр" icon={Film} />
            {(cancel.byMovie || []).map((m, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{m.movieTitle}</span>
                <span className="text-sm font-medium">{m.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ================================================================
// ҮНДСЭН КОМПОНЕНТ
// ================================================================
const ReportsModule = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters]     = useState({ startDate: '', endDate: '' });

  const TAB_COMPONENTS = {
    dashboard: DashboardTab,
    financial: FinancialTab,
    movies:    MoviesTab,
    tickets:   TicketsTab,
    halls:     HallsTab,
    audience:  AudienceTab,
  };

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="reports-surface p-4 md:p-6 max-w-6xl mx-auto">
      <ReportTheme />
      {/* Гарчиг */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 size={22} />
          Тайлан & Шинжилгээ
        </h2>
        <p className="text-sm text-gray-400 mt-1">Үзвэр театрын бүх үзүүлэлт нэг дор</p>
      </div>

      {/* Табүүд */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === t.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            <Icon size={16} strokeWidth={2.2} />
            {t.label}
          </button>
          );
        })}
      </div>

      {/* Огноо шүүлтүүр */}
      <DateFilter filters={filters} onChange={setFilters} />

      {/* Идэвхтэй таб */}
      <ActiveComponent filters={filters} />
    </div>
  );
};

export default ReportsModule;
