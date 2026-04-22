import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, Edit2, Calendar, Clock, Users,
  ChevronLeft, ChevronRight, X, Check, AlertCircle,
  Monitor, Ticket, Film, CalendarDays, Clapperboard,
  Clock3, TrendingUp, SlidersHorizontal, RefreshCw,
  CircleCheck, LayoutGrid
} from 'lucide-react';
import ScheduleModal from '../modals/ScheduleModal';
import { scheduleAPI, movieAPI } from '../../api/adminAPI';
import { useConfirm } from '../modals/ConfirmModal';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const formatPrice = (n) =>
  new Intl.NumberFormat('mn-MN', {
    style: 'currency', currency: 'MNT',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);

const formatTime = (dt) => {
  if (!dt) return '—';
  return new Intl.DateTimeFormat('mn-MN', {
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'Asia/Ulaanbaatar',
  }).format(new Date(dt));
};

const getWeekDays = (offset = 0) => {
  const days = [];
  const base = new Date();
  base.setDate(base.getDate() + offset * 7);
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      date:     d,
      label:    d.toLocaleDateString('mn-MN', { weekday: 'short' }),
      day:      d.getDate(),
      month:    d.toLocaleDateString('mn-MN', { month: 'short' }),
      fullDate: d.toISOString().split('T')[0],
      isToday:  d.toDateString() === new Date().toDateString(),
    });
  }
  return days;
};

/* ─── Toast ─────────────────────────────────────────────────────────────── */
const ToastNotif = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`sched-toast sched-toast--${type}`}>
      <div className="sched-toast__icon">
        {type === 'success' ? <CircleCheck size={15} /> : <AlertCircle size={15} />}
      </div>
      <span>{message}</span>
      <button onClick={onClose} className="sched-toast__close"><X size={13} /></button>
    </div>
  );
};

/* ─── Occupancy Bar ──────────────────────────────────────────────────────── */
const OccupancyBar = ({ sold, total }) => {
  const pct = total ? Math.round((sold / total) * 100) : 0;
  const color = pct > 80 ? '#f87171' : pct > 50 ? '#fbbf24' : '#34d399';
  return (
    <div className="occ-bar-wrap">
      <div className="occ-bar-track">
        <div className="occ-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="occ-bar-label" style={{ color }}>{pct}%</span>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
const ScheduleManagementModule = () => {
  const confirm = useConfirm();

  const [weekOffset,         setWeekOffset]         = useState(0);
  const [selectedDate,       setSelectedDate]       = useState(new Date().toISOString().split('T')[0]);
  const [schedules,          setSchedules]          = useState([]);
  const [movies,             setMovies]             = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [showModal,          setShowModal]          = useState(false);
  const [editingSchedule,    setEditingSchedule]    = useState(null);
  const [preselectedMovieId, setPreselectedMovieId] = useState(null);
  const [toastMsg,           setToastMsg]           = useState(null);

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const showToast = (message, type = 'success') => setToastMsg({ message, type });

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [moviesRes, schedulesRes] = await Promise.all([
        movieAPI.getAll(),
        scheduleAPI.getByDate(selectedDate),
      ]);
      let allMovies = [];
      if (Array.isArray(moviesRes)) {
        allMovies = moviesRes;
      } else {
        allMovies = [
          ...(moviesRes?.nowShowing || []),
          ...(moviesRes?.comingSoon || []),
          ...(moviesRes?.movies     || []),
          ...(moviesRes?.data       || []),
        ];
        if (moviesRes?.featured && !allMovies.find(m => m._id === moviesRes.featured._id))
          allMovies.push(moviesRes.featured);
      }
      const schedulesData = Array.isArray(schedulesRes)
        ? schedulesRes
        : (schedulesRes?.schedules || schedulesRes?.data || []);
      setMovies(allMovies);
      setSchedules(schedulesData);
    } catch (err) {
      showToast('Өгөгдөл татахад алдаа: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Handlers ── */
  const handleAddSchedule    = (movieId = null) => { setEditingSchedule(null); setPreselectedMovieId(movieId); setShowModal(true); };
  const handleEditSchedule   = (s) => { setEditingSchedule(s); setPreselectedMovieId(null); setShowModal(true); };
  const handleDeleteSchedule = async (id) => {
    const ok = await confirm({ title: 'Хуваарь устгах уу?', message: 'Энэ үйлдлийг буцаах боломжгүй.', confirmText: 'Устгах', variant: 'danger' });
    if (!ok) return;
    try { await scheduleAPI.delete(id); showToast('Хуваарь устгагдлаа'); fetchData(); }
    catch (e) { showToast('Устгахад алдаа: ' + e.message, 'error'); }
  };
  const handleSaveSchedule = (msg) => { setShowModal(false); setEditingSchedule(null); setPreselectedMovieId(null); showToast(msg); fetchData(); };

  /* ── Group & sort ── */
  const sortedGroups = useMemo(() => {
    const grouped = schedules.reduce((acc, s) => {
      const movieId = s.movie?._id || s.movie;
      if (!movieId) return acc;
      const movie = movies.find(m => m._id === movieId) || s.movie;
      if (!acc[movieId]) acc[movieId] = { movie, schedules: [] };
      acc[movieId].schedules.push(s);
      return acc;
    }, {});
    return Object.values(grouped).map(g => ({
      ...g,
      schedules: [...g.schedules].sort((a, b) => new Date(a.showTime) - new Date(b.showTime)),
    }));
  }, [schedules, movies]);

  /* ── Stats ── */
  const totalShows  = schedules.length;
  const totalSold   = schedules.reduce((s, sc) => s + (sc.soldSeats?.length || 0), 0);
  const totalSeats  = schedules.reduce((s, sc) => s + (sc.hall?.totalSeats || 0), 0);
  const avgOcc      = totalSeats > 0 ? Math.round((totalSold / totalSeats) * 100) : 0;

  return (
    <div className="sm2-root">

      {/* ── Header ── */}
      <header className="sm2-header">
        <div className="sm2-header__left">
          <div className="sm2-header__eyebrow">
            <Clapperboard size={12} />
            <span>ХУВААРЬ УДИРДЛАГА</span>
          </div>
          <h1 className="sm2-header__title">Цагийн хуваарь</h1>
          <p className="sm2-header__sub">Цагийн хуваарийг тохируулах</p>
        </div>
        <div className="sm2-header__actions">
          <button className="sm2-btn-ghost" onClick={fetchData}>
            <RefreshCw size={14} />
            <span>Шинэчлэх</span>
          </button>
          <button className="sm2-btn-primary" onClick={() => handleAddSchedule()}>
            <Plus size={15} />
            <span>Шинэ хуваарь</span>
          </button>
        </div>
      </header>

      {/* ── Day stats strip ── */}
      <div className="sm2-stats">
        {[
          { icon: CalendarDays, label: 'Нийт үзвэр',     value: totalShows,        color: '#818cf8' },
          { icon: Ticket,       label: 'Зарагдсан',       value: totalSold,         color: '#34d399' },
          { icon: Users,        label: 'Нийт суудал',     value: totalSeats,        color: '#38bdf8' },
          { icon: TrendingUp,   label: 'Дундаж дүүргэлт', value: `${avgOcc}%`,      color: '#fbbf24' },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <div key={i} className="sm2-stat-card">
            <div className="sm2-stat-card__icon" style={{ background: `${color}14`, color }}>
              <Icon size={15} />
            </div>
            <div>
              <div className="sm2-stat-card__value" style={{ color }}>{value}</div>
              <div className="sm2-stat-card__label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Week Nav ── */}
      <div className="sm2-week">
        <button className="sm2-week__arrow" onClick={() => setWeekOffset(p => p - 1)}>
          <ChevronLeft size={16} />
        </button>
        <div className="sm2-week__days">
          {weekDays.map(day => (
            <button
              key={day.fullDate}
              onClick={() => setSelectedDate(day.fullDate)}
              className={`sm2-day${day.fullDate === selectedDate ? ' sm2-day--active' : ''}${day.isToday ? ' sm2-day--today' : ''}`}
            >
              <span className="sm2-day__label">{day.label}</span>
              <span className="sm2-day__num">{day.day}</span>
              <span className="sm2-day__month">{day.month}</span>
              {day.isToday && <span className="sm2-day__dot" />}
            </button>
          ))}
        </div>
        <button className="sm2-week__arrow" onClick={() => setWeekOffset(p => p + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="sm2-skeletons">
          {[1, 2, 3].map(i => (
            <div key={i} className="sm2-skeleton">
              <div className="sm2-skeleton__poster" />
              <div className="sm2-skeleton__lines">
                <div className="sm2-skeleton__line sm2-skeleton__line--wide" />
                <div className="sm2-skeleton__line sm2-skeleton__line--mid" />
                <div className="sm2-skeleton__line sm2-skeleton__line--short" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedGroups.length === 0 ? (
        <div className="sm2-empty">
          <div className="sm2-empty__icon-wrap">
            <Calendar size={32} />
          </div>
          <h3 className="sm2-empty__title">Хуваарь байхгүй</h3>
          <p className="sm2-empty__sub">Энэ өдөр ямар ч хөтөлбөр товлоогүй байна</p>
          <button className="sm2-btn-primary" onClick={() => handleAddSchedule()}>
            <Plus size={15} /> Хуваарь нэмэх
          </button>
        </div>
      ) : (
        <div className="sm2-list">
          {sortedGroups.map((group, gi) => {
            const totalGroupSeats = group.schedules.reduce((s, sc) => s + (sc.hall?.totalSeats || 0), 0);
            const totalGroupSold  = group.schedules.reduce((s, sc) => s + (sc.soldSeats?.length || 0), 0);
            return (
              <div key={group.movie?._id} className="sm2-group" style={{ animationDelay: `${gi * 60}ms` }}>

                {/* Movie header row */}
                <div className="sm2-group__header">
                  <div className="sm2-group__poster-wrap">
                    <img
                      src={group.movie?.posterUrl || '/placeholder-poster.jpg'}
                      alt={group.movie?.title || 'Кино'}
                      className="sm2-group__poster"
                      onError={e => { e.target.src = '/placeholder-poster.jpg'; }}
                    />
                    <div className="sm2-group__poster-shine" />
                  </div>
                  <div className="sm2-group__meta">
                    <h2 className="sm2-group__title">{group.movie?.title || 'Тодорхойгүй кино'}</h2>
                    <div className="sm2-group__chips">
                      {group.movie?.genre?.slice(0, 2).map(g => (
                        <span key={g} className="sm2-chip sm2-chip--genre">{g}</span>
                      ))}
                      <span className="sm2-chip sm2-chip--info">
                        <Clock3 size={10} /> {group.movie?.duration || '—'} мин
                      </span>
                      <span className="sm2-chip sm2-chip--info">
                        <LayoutGrid size={10} /> {group.schedules.length} хөтөлбөр
                      </span>
                    </div>
                    <div className="sm2-group__occ-row">
                      <span className="sm2-group__occ-label">
                        <Users size={11} /> {totalGroupSold}/{totalGroupSeats} суудал
                      </span>
                      <OccupancyBar sold={totalGroupSold} total={totalGroupSeats} />
                    </div>
                  </div>
                  <button className="sm2-btn-addtime" onClick={() => handleAddSchedule(group.movie?._id)}>
                    <Plus size={13} /> Цаг нэмэх
                  </button>
                </div>

                {/* Schedule rows */}
                <div className="sm2-group__rows">
                  {group.schedules.map((schedule, si) => {
                    const sold     = schedule.soldSeats?.length || 0;
                    const total    = schedule.hall?.totalSeats  || 0;
                    const pct      = total ? Math.round((sold / total) * 100) : 0;
                    const occColor = pct > 80 ? '#f87171' : pct > 50 ? '#fbbf24' : '#34d399';
                    return (
                      <div key={schedule._id} className="sm2-row" style={{ animationDelay: `${gi * 60 + si * 40}ms` }}>

                        {/* Time badge */}
                        <div className="sm2-row__time">
                          <Clock size={12} />
                          <strong>{formatTime(schedule.showTime)}</strong>
                        </div>

                        {/* Hall */}
                        <div className="sm2-row__hall">
                          <Monitor size={12} />
                          <span>{schedule.hall?.hallName || schedule.hall?.name || 'Танхим'}</span>
                        </div>

                        {/* Occupancy */}
                        <div className="sm2-row__seats">
                          <div className="sm2-row__seats-nums">
                            <Users size={11} />
                            <span>{sold}/{total}</span>
                          </div>
                          <div className="sm2-row__bar-track">
                            <div
                              className="sm2-row__bar-fill"
                              style={{ width: `${pct}%`, background: occColor }}
                            />
                          </div>
                          <span className="sm2-row__pct" style={{ color: occColor }}>{pct}%</span>
                        </div>

                        {/* Price */}
                        <div className="sm2-row__price">
                          <Ticket size={11} />
                          <span>{formatPrice(schedule.basePrice || 0)}</span>
                        </div>

                        {/* Actions */}
                        <div className="sm2-row__actions">
                          <button
                            className="sm2-icon-btn"
                            onClick={() => handleEditSchedule(schedule)}
                            title="Засах"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="sm2-icon-btn sm2-icon-btn--danger"
                            onClick={() => handleDeleteSchedule(schedule._id)}
                            title="Устгах"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ScheduleModal
          movies={movies}
          editing={editingSchedule}
          preselectedMovieId={preselectedMovieId}
          onClose={() => { setShowModal(false); setEditingSchedule(null); setPreselectedMovieId(null); }}
          onSaved={handleSaveSchedule}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <ToastNotif
          message={toastMsg.message}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        /* ── Root ── */
        .sm2-root {
          padding: 2rem 2rem 4rem;
          max-width: 1360px;
          margin: 0 auto;
          font-family: 'Sora', sans-serif;
          color: #e2e8f0;
          min-height: 100vh;
        }

        /* ── Header ── */
        .sm2-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.75rem;
        }
        .sm2-header__eyebrow {
          display: flex;
          align-items: center;
          gap: .4rem;
          font-size: .65rem;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: .5rem;
        }
        .sm2-header__title {
          font-size: 2.1rem;
          font-weight: 800;
          letter-spacing: -.03em;
          margin: 0 0 .25rem;
          background: linear-gradient(120deg, #f1f5f9 30%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sm2-header__sub {
          font-size: .8rem;
          color: #475569;
          margin: 0;
          font-weight: 400;
        }
        .sm2-header__actions {
          display: flex;
          align-items: center;
          gap: .75rem;
        }

        /* ── Buttons ── */
        .sm2-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          padding: .65rem 1.25rem;
          background: #4f46e5;
          border: 1px solid rgba(99,102,241,.4);
          border-radius: .75rem;
          color: #fff;
          font-size: .8rem;
          font-weight: 600;
          font-family: 'Sora', sans-serif;
          letter-spacing: -.01em;
          cursor: pointer;
          transition: background .15s, box-shadow .15s, transform .12s;
          box-shadow: 0 0 0 0 rgba(99,102,241,0);
        }
        .sm2-btn-primary:hover {
          background: #4338ca;
          box-shadow: 0 4px 20px rgba(99,102,241,.35);
          transform: translateY(-1px);
        }
        .sm2-btn-primary:active { transform: translateY(0); }

        .sm2-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          padding: .65rem 1.1rem;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: .75rem;
          color: #64748b;
          font-size: .8rem;
          font-weight: 500;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: all .15s;
        }
        .sm2-btn-ghost:hover {
          background: rgba(255,255,255,.07);
          color: #94a3b8;
          border-color: rgba(255,255,255,.12);
        }

        /* ── Stats Strip ── */
        .sm2-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: .75rem;
          margin-bottom: 1.5rem;
        }
        .sm2-stat-card {
          display: flex;
          align-items: center;
          gap: .875rem;
          padding: 1rem 1.125rem;
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 1rem;
          transition: background .15s;
        }
        .sm2-stat-card:hover { background: rgba(255,255,255,.04); }
        .sm2-stat-card__icon {
          width: 36px; height: 36px;
          border-radius: .625rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sm2-stat-card__value {
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -.03em;
          line-height: 1;
          font-family: 'JetBrains Mono', monospace;
        }
        .sm2-stat-card__label {
          font-size: .68rem;
          color: #334155;
          margin-top: .25rem;
          font-weight: 500;
          letter-spacing: .02em;
        }

        /* ── Week Nav ── */
        .sm2-week {
          display: flex;
          align-items: center;
          gap: .5rem;
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 1.25rem;
          padding: .625rem;
          margin-bottom: 1.75rem;
        }
        .sm2-week__arrow {
          width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: .75rem;
          color: #475569;
          cursor: pointer;
          transition: all .15s;
          flex-shrink: 0;
        }
        .sm2-week__arrow:hover {
          background: rgba(255,255,255,.06);
          color: #94a3b8;
          border-color: rgba(99,102,241,.25);
        }
        .sm2-week__days { flex: 1; display: flex; gap: .375rem; }
        .sm2-day {
          flex: 1;
          display: flex; flex-direction: column; align-items: center;
          gap: .15rem;
          padding: .625rem .375rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: .875rem;
          color: #334155;
          cursor: pointer;
          transition: all .18s;
          position: relative;
        }
        .sm2-day:hover {
          background: rgba(255,255,255,.03);
          border-color: rgba(255,255,255,.07);
          color: #64748b;
        }
        .sm2-day--active {
          background: linear-gradient(135deg, rgba(79,70,229,.14), rgba(99,102,241,.08));
          border-color: rgba(99,102,241,.3);
          color: #a5b4fc;
        }
        .sm2-day--today .sm2-day__num { color: #818cf8; }
        .sm2-day__label { font-size: .62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
        .sm2-day__num   { font-size: 1.1rem; font-weight: 800; letter-spacing: -.03em; line-height: 1; font-family: 'JetBrains Mono', monospace; }
        .sm2-day__month { font-size: .6rem; font-weight: 400; }
        .sm2-day__dot {
          position: absolute;
          bottom: .35rem;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #6366f1;
        }

        /* ── Skeletons ── */
        .sm2-skeletons { display: flex; flex-direction: column; gap: 1rem; }
        .sm2-skeleton {
          display: flex;
          gap: 1.25rem;
          padding: 1.5rem;
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 1.25rem;
          animation: sm2-pulse 1.8s ease-in-out infinite;
        }
        .sm2-skeleton__poster {
          width: 52px; height: 70px;
          border-radius: .75rem;
          background: rgba(255,255,255,.04);
          flex-shrink: 0;
        }
        .sm2-skeleton__lines { flex: 1; display: flex; flex-direction: column; gap: .6rem; justify-content: center; }
        .sm2-skeleton__line {
          height: 10px;
          border-radius: 5px;
          background: rgba(255,255,255,.04);
        }
        .sm2-skeleton__line--wide  { width: 55%; }
        .sm2-skeleton__line--mid   { width: 35%; }
        .sm2-skeleton__line--short { width: 20%; }
        @keyframes sm2-pulse {
          0%,100% { opacity: .5; }
          50%      { opacity: 1; }
        }

        /* ── Empty ── */
        .sm2-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 5rem 2rem;
          background: rgba(255,255,255,.015);
          border: 1px dashed rgba(255,255,255,.07);
          border-radius: 1.5rem;
          text-align: center;
        }
        .sm2-empty__icon-wrap {
          width: 64px; height: 64px;
          border-radius: 1.25rem;
          background: rgba(99,102,241,.08);
          border: 1px solid rgba(99,102,241,.15);
          display: flex; align-items: center; justify-content: center;
          color: #6366f1;
        }
        .sm2-empty__title { font-size: 1.1rem; font-weight: 700; color: #94a3b8; margin: 0; }
        .sm2-empty__sub   { font-size: .8rem; color: #334155; margin: 0; }

        /* ── Group ── */
        .sm2-list { display: flex; flex-direction: column; gap: 1.25rem; }
        .sm2-group {
          background: rgba(255,255,255,.018);
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 1.25rem;
          overflow: hidden;
          animation: sm2-fadein .3s ease both;
        }
        @keyframes sm2-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Movie header */
        .sm2-group__header {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem 1.5rem;
          background: rgba(255,255,255,.028);
          border-bottom: 1px solid rgba(255,255,255,.05);
        }
        .sm2-group__poster-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .sm2-group__poster {
          width: 52px; height: 72px;
          object-fit: cover;
          border-radius: .75rem;
          display: block;
          box-shadow: 0 8px 24px rgba(0,0,0,.5);
          border: 1px solid rgba(255,255,255,.08);
        }
        .sm2-group__poster-shine {
          position: absolute;
          inset: 0;
          border-radius: .75rem;
          background: linear-gradient(135deg, rgba(255,255,255,.12) 0%, transparent 50%);
          pointer-events: none;
        }
        .sm2-group__meta { flex: 1; min-width: 0; }
        .sm2-group__title {
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: -.02em;
          color: #f1f5f9;
          margin: 0 0 .5rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sm2-group__chips {
          display: flex;
          flex-wrap: wrap;
          gap: .35rem;
          margin-bottom: .625rem;
        }
        .sm2-chip {
          display: inline-flex;
          align-items: center;
          gap: .25rem;
          padding: .2rem .55rem;
          border-radius: .375rem;
          font-size: .65rem;
          font-weight: 600;
          letter-spacing: .03em;
        }
        .sm2-chip--genre {
          background: rgba(99,102,241,.1);
          border: 1px solid rgba(99,102,241,.2);
          color: #a5b4fc;
        }
        .sm2-chip--info {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.07);
          color: #475569;
        }
        .sm2-group__occ-row {
          display: flex;
          align-items: center;
          gap: .875rem;
        }
        .sm2-group__occ-label {
          display: flex;
          align-items: center;
          gap: .3rem;
          font-size: .7rem;
          color: #334155;
          white-space: nowrap;
          font-family: 'JetBrains Mono', monospace;
        }

        /* Occupancy bar */
        .occ-bar-wrap { display: flex; align-items: center; gap: .5rem; flex: 1; max-width: 160px; }
        .occ-bar-track {
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .occ-bar-fill { height: 100%; border-radius: 2px; transition: width .4s ease; }
        .occ-bar-label { font-size: .7rem; font-weight: 700; min-width: 32px; font-family: 'JetBrains Mono', monospace; }

        /* Add time button */
        .sm2-btn-addtime {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          padding: .55rem 1rem;
          background: rgba(79,70,229,.08);
          border: 1px solid rgba(99,102,241,.2);
          border-radius: .625rem;
          color: #818cf8;
          font-size: .72rem;
          font-weight: 600;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: all .15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .sm2-btn-addtime:hover {
          background: rgba(79,70,229,.14);
          border-color: rgba(99,102,241,.35);
          color: #a5b4fc;
        }

        /* Schedule rows */
        .sm2-group__rows { padding: .375rem .625rem .625rem; }
        .sm2-row {
          display: grid;
          grid-template-columns: 90px 1fr 1fr auto auto;
          align-items: center;
          gap: 1rem;
          padding: .75rem .875rem;
          border-radius: .75rem;
          transition: background .15s;
          animation: sm2-fadein .3s ease both;
        }
        .sm2-row:hover { background: rgba(255,255,255,.028); }
        .sm2-row + .sm2-row { border-top: 1px solid rgba(255,255,255,.04); }

        .sm2-row__time {
          display: flex;
          align-items: center;
          gap: .4rem;
          color: #818cf8;
          font-family: 'JetBrains Mono', monospace;
        }
        .sm2-row__time strong { font-size: 1rem; font-weight: 600; }

        .sm2-row__hall {
          display: flex;
          align-items: center;
          gap: .35rem;
          font-size: .78rem;
          color: #475569;
          font-weight: 500;
        }

        .sm2-row__seats {
          display: flex;
          align-items: center;
          gap: .625rem;
        }
        .sm2-row__seats-nums {
          display: flex;
          align-items: center;
          gap: .25rem;
          font-size: .7rem;
          color: #334155;
          font-family: 'JetBrains Mono', monospace;
          white-space: nowrap;
        }
        .sm2-row__bar-track {
          width: 72px;
          height: 4px;
          background: rgba(255,255,255,.06);
          border-radius: 2px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .sm2-row__bar-fill { height: 100%; border-radius: 2px; transition: width .4s ease; }
        .sm2-row__pct {
          font-size: .72rem;
          font-weight: 700;
          min-width: 30px;
          text-align: right;
          font-family: 'JetBrains Mono', monospace;
        }

        .sm2-row__price {
          display: flex;
          align-items: center;
          gap: .35rem;
          font-size: .75rem;
          font-weight: 700;
          color: #fbbf24;
          font-family: 'JetBrains Mono', monospace;
          white-space: nowrap;
        }

        .sm2-row__actions { display: flex; gap: .35rem; }
        .sm2-icon-btn {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: .5rem;
          color: #334155;
          cursor: pointer;
          transition: all .15s;
        }
        .sm2-icon-btn:hover {
          background: rgba(99,102,241,.1);
          border-color: rgba(99,102,241,.25);
          color: #818cf8;
        }
        .sm2-icon-btn--danger:hover {
          background: rgba(239,68,68,.1);
          border-color: rgba(239,68,68,.25);
          color: #f87171;
        }

        /* ── Toast ── */
        .sched-toast {
          position: fixed;
          bottom: 1.75rem;
          right: 1.75rem;
          display: flex;
          align-items: center;
          gap: .75rem;
          padding: .875rem 1.125rem;
          background: #0f172a;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: .875rem;
          color: #e2e8f0;
          font-size: .8rem;
          font-family: 'Sora', sans-serif;
          box-shadow: 0 16px 48px rgba(0,0,0,.5);
          animation: sm2-toast-in .25s cubic-bezier(.16,1,.3,1);
          z-index: 1100;
          max-width: 360px;
        }
        .sched-toast--success { border-left: 3px solid #34d399; }
        .sched-toast--error   { border-left: 3px solid #f87171; }
        .sched-toast__icon {
          width: 28px; height: 28px;
          border-radius: .5rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sched-toast--success .sched-toast__icon { background: rgba(52,211,153,.1); color: #34d399; }
        .sched-toast--error   .sched-toast__icon { background: rgba(248,113,113,.1); color: #f87171; }
        .sched-toast__close {
          margin-left: auto;
          background: none;
          border: none;
          color: #334155;
          cursor: pointer;
          display: flex; align-items: center;
          padding: 0;
          transition: color .12s;
          flex-shrink: 0;
        }
        .sched-toast__close:hover { color: #94a3b8; }
        @keyframes sm2-toast-in {
          from { opacity: 0; transform: translateY(12px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .sm2-stats { grid-template-columns: repeat(2, 1fr); }
          .sm2-row { grid-template-columns: 80px 1fr auto auto; }
          .sm2-row__seats { display: none; }
        }
        @media (max-width: 640px) {
          .sm2-root { padding: 1rem 1rem 3rem; }
          .sm2-header__title { font-size: 1.6rem; }
          .sm2-stats { grid-template-columns: repeat(2, 1fr); }
          .sm2-week__days { gap: .2rem; }
          .sm2-day { padding: .5rem .2rem; }
          .sm2-group__header { flex-wrap: wrap; }
          .sm2-btn-addtime { order: 3; width: 100%; justify-content: center; }
          .sm2-row { grid-template-columns: 80px 1fr auto; }
          .sm2-row__price { display: none; }
        }
      `}</style>
    </div>
  );
};

export default ScheduleManagementModule;