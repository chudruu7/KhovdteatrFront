import { useState, useEffect, useMemo } from "react";
import {
  Ticket, Search, ChevronDown, ChevronLeft, ChevronRight,
  Calendar, Clock, User, Eye, XCircle, CheckCircle,
  AlertCircle, RefreshCw, Film, Trash2,
} from "lucide-react";
import TicketModal from "../modals/TicketModal";
import bookingAPI from "../../api/bookingAPI";
import toast from "../Toast";
import { useConfirm } from '../modals/ConfirmModal';

const PAGE_SIZE = 10;

const isExpired = (ticket) => {
  if (!ticket.date || !ticket.time) return false;
  try {
    // ISO string байсан ч зөв авна: "2026-04-22T..." → "2026-04-22"
    const dateStr = String(ticket.date).split('T')[0];
    // ticket.time нь Монголын цаг (UTC+8) тул +08:00 тодорхой зааж өгнө
    const showTime = new Date(`${dateStr}T${ticket.time}:00+08:00`);
    return Date.now() > showTime.getTime();
  } catch { return false; }
};

const effectiveStatus = (ticket) => {
  if (ticket.status === 'cancelled') return 'cancelled';
  if (ticket.status === 'active' && isExpired(ticket)) return 'used';
  return ticket.status;
};

const getMockTickets = () => [
  { _id:'1', movieTitle:'Дюн 2',        date:'2026-03-20', time:'19:00', userName:'Бат',   seat:'A12', totalPrice:15000, status:'active'    },
  { _id:'2', movieTitle:'Годзилла',      date:'2026-03-19', time:'16:30', userName:'Сараа', seat:'B05', totalPrice:12000, status:'used'      },
  { _id:'3', movieTitle:'Кунг-фу Панда', date:'2026-03-18', time:'14:00', userName:'Дорж',  seat:'C08', totalPrice:10000, status:'cancelled' },
];

const TicketManagementModule = () => {
  const confirm = useConfirm();
  const [tickets, setTickets]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [dateFilter, setDateFilter]         = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [currentPage, setCurrentPage]       = useState(1);
  const [stats, setStats] = useState({ total:0, active:0, used:0, cancelled:0 });

  useEffect(() => { fetchTickets(); fetchStats(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getAll();
      if (res.success) {
        setTickets(res.bookings);
      } else {
        setTickets(getMockTickets());
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setTickets(getMockTickets());
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await bookingAPI.getStats();
      if (res.success) setStats(res.stats);
      else recalcStats(tickets);
    } catch { recalcStats(tickets); }
  };

  const recalcStats = (list) => {
    const r = { total: list.length, active:0, used:0, cancelled:0 };
    list.forEach(t => {
      const s = effectiveStatus(t);
      if (s === 'active')    r.active++;
      else if (s === 'used') r.used++;
      else                   r.cancelled++;
    });
    setStats(r);
  };

  useEffect(() => {
    if (!loading && tickets.length > 0) recalcStats(tickets);
  }, [tickets, loading]);

  const filteredTickets = useMemo(() => {
    return tickets
      .map(t => ({ ...t, _effectiveStatus: effectiveStatus(t) }))
      .filter(t => {
        const matchSearch =
          t.movieTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t._id?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || t._effectiveStatus === statusFilter;
        const matchDate   = !dateFilter || t.date === dateFilter;
        return matchSearch && matchStatus && matchDate;
      });
  }, [tickets, searchTerm, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filteredTickets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, dateFilter]);

  const goTo = (p) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  // ── Цуцлах ──
  const handleCancelTicket = async (ticketId) => {
    const ok = await confirm({
      title: 'Тасалбар цуцлах уу?',
      message: 'Тасалбарыг цуцлахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.',
      confirmText: 'Цуцлах',
      cancelText: 'Болих',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await bookingAPI.cancel(ticketId);
      setTickets(prev => prev.map(t =>
        t._id === ticketId ? { ...t, status: 'cancelled' } : t
      ));
      setStats(prev => ({ ...prev, active: prev.active - 1, cancelled: prev.cancelled + 1 }));
      toast.success('Тасалбар амжилттай цуцлагдлаа');
    } catch (err) {
      console.error("Error cancelling ticket:", err);
      toast.error('Тасалбар цуцлахад алдаа гарлаа');
    }
  };

  // ── Устгах ── ✅ шинэ
  const handleDeleteTicket = async (ticketId) => {
  const ok = await confirm({
    title: 'Тасалбар устгах уу?',
    message: 'Тасалбарыг бүрмөсөн устгах гэж байна. Энэ үйлдлийг буцаах боломжгүй.',
    confirmText: 'Устгах',
    cancelText: 'Болих',
    variant: 'danger',
  });
  if (!ok) return;
  try {
    await bookingAPI.delete(ticketId); // ✅ api.delete → localhost:5000 руу хандана
    setTickets(prev => prev.filter(t => t._id !== ticketId));
    setStats(prev => ({ ...prev, total: prev.total - 1 }));
    toast.success('Тасалбар амжилттай устгагдлаа');
  } catch (err) {
    console.error("Error deleting ticket:", err);
    toast.error('Тасалбар устгахад алдаа гарлаа');
  }
};

  const getStatusBadge = (status) => {
    const map = {
      active:    { icon: CheckCircle, label: 'Хүчинтэй',    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      used:      { icon: Clock,       label: 'Ашиглагдсан', cls: 'bg-gray-500/10    text-gray-400    border-gray-500/20'    },
      cancelled: { icon: XCircle,     label: 'Цуцлагдсан',  cls: 'bg-rose-500/10    text-rose-400    border-rose-500/20'    },
    };
    const s = map[status];
    if (!s) return null;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${s.cls}`}>
        <Icon className="w-3 h-3" />{s.label}
      </span>
    );
  };

  const pageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= safePage - 2 && i <= safePage + 2)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Тасалбарын удирдлага</h2>
          <p className="text-sm text-gray-500 mt-1">Нийт {stats.total} тасалбар</p>
        </div>
        <button
  onClick={async () => {
    await bookingAPI.markExpired();
    fetchTickets();
    fetchStats();
  }}
  className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors border border-gray-700/50"
>
  <RefreshCw className="w-5 h-5" />
</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Нийт',         value:stats.total,     Icon:Ticket,      color:'blue'    },
          { label:'Хүчинтэй',    value:stats.active,    Icon:CheckCircle, color:'emerald' },
          { label:'Ашиглагдсан', value:stats.used,      Icon:Clock,       color:'amber'   },
          { label:'Цуцлагдсан',  value:stats.cancelled, Icon:XCircle,     color:'rose'    },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg bg-${color}-500/10`}>
                <Icon className={`w-4 h-4 text-${color}-400`} />
              </div>
              <span className="text-sm text-gray-400">{label}</span>
            </div>
            <p className="text-2xl font-semibold text-gray-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text" placeholder="Хайх (кино, хэрэглэгч, ID)..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-gray-800/50 border border-gray-700/50
                       text-gray-200 placeholder-gray-500 text-sm
                       focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
          />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-10 pl-4 pr-10 rounded-xl bg-gray-800/50 border border-gray-700/50
                       text-gray-200 text-sm appearance-none cursor-pointer
                       focus:outline-none focus:border-amber-500/50">
            <option value="all">Бүх төлөв</option>
            <option value="active">Хүчинтэй</option>
            <option value="used">Ашиглагдсан</option>
            <option value="cancelled">Цуцлагдсан</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
        <div className="relative">
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="h-10 pl-4 pr-10 rounded-xl bg-gray-800/50 border border-gray-700/50
                       text-gray-200 text-sm focus:outline-none focus:border-amber-500/50" />
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
        {dateFilter && (
          <button onClick={() => setDateFilter("")}
            className="px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm border border-gray-700/50">
            Цэвэрлэх
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-700/50">
                {['Кино','Огноо/Цаг','Хэрэглэгч','Суудал','Төлөв','Үйлдэл'].map((h,i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider ${i===5?'text-right':'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Уншиж байна...</span>
                  </div>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center">
                  <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Тасалбар олдсонгүй</p>
                </td></tr>
              ) : (
                paginated.map(ticket => (
                  <tr key={ticket._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="text-sm text-gray-200">{ticket.movieTitle}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="text-sm text-gray-200">
                          {ticket.date ? new Date(ticket.date).toLocaleDateString('mn-MN') : '—'} {ticket.time}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-200">{ticket.userName}</span>
                          {ticket.userEmail && <span className="text-xs text-gray-500">{ticket.userEmail}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-gray-200">{ticket.seat}</span>
                        {ticket.totalPrice > 0 && (
                          <span className="text-xs text-gray-500">₮{ticket.totalPrice?.toLocaleString()}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(ticket._effectiveStatus)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Дэлгэрэнгүй */}
                        <button onClick={() => { setSelectedTicket(ticket); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors" title="Дэлгэрэнгүй">
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Цуцлах — зөвхөн active */}
                        {ticket._effectiveStatus === 'active' && (
                          <button onClick={() => handleCancelTicket(ticket._id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors" title="Цуцлах">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {/* Устгах — used эсвэл cancelled ✅ */}
                        {(ticket._effectiveStatus === 'used' || ticket._effectiveStatus === 'cancelled') && (
                          <button onClick={() => handleDeleteTicket(ticket._id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 hover:text-red-400 transition-colors" title="Устгах">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredTickets.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-800/50 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-gray-500">
              {(safePage-1)*PAGE_SIZE+1}–{Math.min(safePage*PAGE_SIZE, filteredTickets.length)} / нийт {filteredTickets.length} тасалбар
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => goTo(safePage-1)} disabled={safePage===1}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-gray-700/50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers().map((p,i) =>
                p === '...' ? (
                  <span key={`d-${i}`} className="px-2 text-gray-600 text-sm">…</span>
                ) : (
                  <button key={p} onClick={() => goTo(p)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors border
                      ${p===safePage
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border-gray-700/50'}`}>
                    {p}
                  </button>
                )
              )}
              <button onClick={() => goTo(safePage+1)} disabled={safePage===totalPages}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-gray-700/50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <TicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} ticket={selectedTicket} />
    </div>
  );
};

export default TicketManagementModule;