import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../api/config';

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap');

    /* ── DARK (default) ── */
    .sp {
      --bg: #0c0c0c;
      --bg2: #141414;
      --bg3: #1a1a1a;
      --border: rgba(255,255,255,0.08);
      --red: #e53935;
      --text: #e8e8e8;
      --muted: #888;
      --title-color: #ffffff;
      --slot-bg: #ffffff;
      --slot-color: #111;
      --soldout-bg: #1a1a1a;
      --soldout-color: #555;
      --empty-icon: #222;
      --empty-sub: #555;
      --day-month: #555;
      --day-active-num: #ffffff;
      --day-active-line: #ffffff;
      --day-active-name: #aaa;
      --arrow-hover-color: #ffffff;
      --arrow-hover-border: rgba(255,255,255,0.25);
      --day-hover-bg: rgba(255,255,255,0.04);
      --tab-hover-border: rgba(255,255,255,0.2);
      --imdb-color: #f5c518;
      --skel-from: #1a1a1a;
      --skel-mid: #222;
      --search-bg: rgba(255,255,255,0.06);
      --hero-overlay-start: rgba(20,0,0,0.7);
      --hero-overlay-end: rgba(12,12,12,0.95);
    }

    /* ── LIGHT — html.light дээр идэвхждэг ── */
    html.light .sp {        /* ← :global() хасав */
  --bg: #f5f5f5;
      --bg2: #ffffff;
      --bg3: #eeeeee;
      --border: rgba(0,0,0,0.10);
      --text: #1a1a1a;
      --muted: #666666;
      --title-color: #1a1a1a;
      --slot-bg: #1a1a1a;
      --slot-color: #ffffff;
      --soldout-bg: #eeeeee;
      --soldout-color: #aaa;
      --empty-icon: #cccccc;
      --empty-sub: #999999;
      --day-month: #999999;
      --day-active-num: #1a1a1a;
      --day-active-line: #1a1a1a;
      --day-active-name: #444444;
      --arrow-hover-color: #1a1a1a;
      --arrow-hover-border: rgba(0,0,0,0.25);
      --day-hover-bg: rgba(0,0,0,0.04);
      --tab-hover-border: rgba(0,0,0,0.2);
      --imdb-color: #d4a000;
      --skel-from: #e8e8e8;
      --skel-mid: #d0d0d0;
      --search-bg: rgba(0,0,0,0.06);
      --hero-overlay-start: rgba(240,220,220,0.85);
      --hero-overlay-end: rgba(245,245,245,0.97);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .sp {
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      padding-top: 80px;
      transition: background 0.25s ease, color 0.25s ease;
    }

    .sp-hero {
      position: relative;
      height: 180px;
      display: flex;
      align-items: flex-end;
      padding: 0 2rem 1.5rem;
      gap: 1rem;
    }
    .sp-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: url('public/seat.png') center/cover no-repeat;
      z-index: 0;
    }
    .sp-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, var(--hero-overlay-start) 0%, var(--hero-overlay-end) 100%);
      z-index: 1;
      transition: background 0.25s ease;
    }
    .sp-hero > * { position: relative; z-index: 2; }

    .sp-hero__title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 3rem;
      letter-spacing: 0.12em;
      color: var(--title-color);
      border-bottom: 3px solid var(--red);
      padding-bottom: 4px;
      display: inline-block;
    }
    .sp-hero__search {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--search-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 0.5rem 1rem;
      color: var(--muted);
    }
    .sp-hero__search input {
      background: transparent;
      border: none;
      outline: none;
      color: var(--text);
      width: 200px;
      font-size: 0.85rem;
      font-family: 'Inter', sans-serif;
    }
    .sp-hero__search input::placeholder { color: var(--muted); }

    .sp-wrap { max-width: 1140px; margin: 0 auto; padding: 0 1.5rem 5rem; }

    .sp-daytabs { display: flex; gap: 0.5rem; padding: 1.5rem 0; overflow-x: auto; scrollbar-width: none; }
    .sp-daytabs::-webkit-scrollbar { display: none; }
    .sp-daytab {
      display: flex; flex-direction: column; align-items: center;
      min-width: 80px; padding: 0.6rem 1rem;
      border-radius: 3px; border: 1px solid var(--border);
      background: transparent; color: var(--muted);
      cursor: pointer; transition: all 0.15s ease;
      font-family: 'Inter', sans-serif; flex-shrink: 0;
    }
    .sp-daytab:hover { border-color: var(--tab-hover-border); color: var(--text); }
    .sp-daytab--active { background: var(--red); border-color: var(--red); color: #fff; }
    .sp-daytab__name { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
    .sp-daytab__num  { font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; line-height: 1.1; }
    .sp-daytab__month{ font-size: 0.58rem; opacity: 0.7; }

    .sp-card {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 4px;
      margin-bottom: 1.5rem;
      overflow: hidden;
      animation: fadeUp 0.4s ease both;
      transition: background 0.25s ease, border-color 0.25s ease;
    }
    .sp-card:nth-child(1) { animation-delay: 0.05s; }
    .sp-card:nth-child(2) { animation-delay: 0.12s; }
    .sp-card:nth-child(3) { animation-delay: 0.19s; }
    .sp-card:nth-child(4) { animation-delay: 0.26s; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: none; }
    }

    .sp-card__head {
      display: flex;
      gap: 1.25rem;
      padding: 1.25rem 1.25rem 1rem;
      border-bottom: 1px solid var(--border);
      align-items: flex-start;
    }
    .sp-card__poster {
      width: 80px; flex-shrink: 0;
      aspect-ratio: 2/3; border-radius: 3px;
      overflow: hidden; background: var(--bg3);
    }
    .sp-card__poster img {
      width: 100%; height: 100%; object-fit: cover;
      display: block; transition: transform 0.4s ease;
    }
    .sp-card:hover .sp-card__poster img { transform: scale(1.05); }
    .sp-card__meta { flex: 1; min-width: 0; }
    .sp-card__duration {
      font-size: 0.7rem; color: var(--muted);
      letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 0.35rem;
    }
    .sp-card__title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.8rem; letter-spacing: 0.05em;
      color: var(--title-color); line-height: 1;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sp-card__imdb {
      font-size: 0.75rem; font-weight: 600;
      color: var(--muted); white-space: nowrap; flex-shrink: 0;
    }
    .sp-card__imdb span { color: var(--imdb-color); }

    .sp-card__days {
      padding: 0.8rem 1.25rem 0.6rem;
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; gap: 0.5rem;
    }
    .sp-days__arrow {
      width: 28px; height: 28px;
      background: transparent; border: 1px solid var(--border);
      border-radius: 3px; color: var(--muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; flex-shrink: 0; transition: all 0.15s;
      font-family: 'Inter', sans-serif;
    }
    .sp-days__arrow:hover:not(:disabled) { color: var(--arrow-hover-color); border-color: var(--arrow-hover-border); }
    .sp-days__arrow:disabled { opacity: 0.3; cursor: not-allowed; }
    .sp-days__list { display: flex; flex: 1; justify-content: space-between; }
    .sp-day {
      display: flex; flex-direction: column; align-items: center;
      background: transparent; border: none; cursor: pointer;
      padding: 0.25rem 0.5rem; border-radius: 3px;
      transition: background 0.15s; min-width: 56px;
    }
    .sp-day:hover { background: var(--day-hover-bg); }
    .sp-day__name {
      font-size: 0.62rem; color: var(--muted);
      text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.15rem;
    }
    .sp-day__num {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.9rem; line-height: 1; color: var(--muted); letter-spacing: 0.02em;
    }
    .sp-day__month {
      font-size: 0.58rem; color: var(--day-month);
      text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.1rem;
    }
    .sp-day__line {
      height: 2px; background: transparent;
      width: 100%; margin-top: 0.3rem; border-radius: 1px; transition: background 0.2s;
    }
    .sp-day--active .sp-day__name { color: var(--day-active-name); }
    .sp-day--active .sp-day__num  { color: var(--day-active-num); }
    .sp-day--active .sp-day__line { background: var(--day-active-line); }

    .sp-card__showtimes { padding: 0 1.25rem; }
    .sp-showrow {
      display: flex; align-items: center;
      min-height: 52px; border-bottom: 1px solid var(--border);
      gap: 1rem; padding: 0.5rem 0;
    }
    .sp-showrow:last-child { border-bottom: none; }
    .sp-showrow__format {
      width: 80px; flex-shrink: 0;
      font-size: 0.7rem; font-weight: 600;
      color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase;
    }
    .sp-showrow__slots { display: flex; flex-wrap: wrap; gap: 0.4rem; flex: 1; }
    .sp-slot {
      background: var(--slot-bg); color: var(--slot-color);
      border: none; border-radius: 3px;
      padding: 0.35rem 0.85rem;
      font-size: 0.8rem; font-weight: 500;
      cursor: pointer; transition: all 0.15s ease;
      font-family: 'Inter', sans-serif; white-space: nowrap;
    }
    .sp-slot:hover {
      background: var(--red); color: #fff;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(229,57,53,0.35);
    }
    .sp-slot--soldout {
      background: var(--soldout-bg); color: var(--soldout-color);
      cursor: not-allowed; text-decoration: line-through;
    }
    .sp-slot--soldout:hover { background: var(--soldout-bg); color: var(--soldout-color); transform: none; box-shadow: none; }
    .sp-slot--low { border: 1px solid rgba(229,57,53,0.5); }
.sp-slot--past {
  background: var(--soldout-bg);
  color: var(--soldout-color);
  cursor: not-allowed;
  opacity: 0.5;
}
.sp-slot--past:hover {
  background: var(--soldout-bg);
  color: var(--soldout-color);
  transform: none;
  box-shadow: none;
}
    .sp-empty { text-align: center; padding: 5rem 2rem; animation: fadeUp 0.4s ease both; }
    .sp-empty__icon {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 5rem; color: var(--empty-icon); margin-bottom: 1rem; letter-spacing: 0.1em;
    }
    .sp-empty__title { font-size: 1.1rem; color: var(--muted); margin-bottom: 0.5rem; }
    .sp-empty__sub { font-size: 0.8rem; color: var(--empty-sub); margin-bottom: 2rem; }
    .sp-empty__btn {
      background: transparent; border: 1px solid var(--border);
      color: var(--muted); padding: 0.65rem 1.75rem;
      border-radius: 3px; cursor: pointer;
      font-size: 0.78rem; font-family: 'Inter', sans-serif;
      letter-spacing: 0.1em; transition: all 0.2s;
    }
    .sp-empty__btn:hover { border-color: var(--red); color: var(--red); }

    .sp-skeleton {
      background: var(--bg2); border: 1px solid var(--border);
      border-radius: 4px; margin-bottom: 1.5rem;
      padding: 1.25rem; display: flex; gap: 1.25rem;
    }
    .sp-skel {
      border-radius: 3px;
      background: linear-gradient(90deg, var(--skel-from) 25%, var(--skel-mid) 50%, var(--skel-from) 75%);
      background-size: 400px 100%; animation: shimmer 1.4s infinite linear;
    }
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }

    @media (max-width: 768px) {
      .sp-card__title { font-size: 1.3rem; }
      .sp-hero__search { display: none; }
      .sp-day { min-width: 40px; }
      .sp-day__num { font-size: 1.4rem; }
    }
  `}</style>
);

/* ─── Constants ──────────────────────────────────────────────────────────── */
const MONTHS    = ['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар','7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'];
const DAYS_ABBR = ['Ням','Даваа','Мягмар','Лхагва','Пүрэв','Баасан','Бямба'];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const getDays = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      dayName:  DAYS_ABBR[d.getDay()],
      dateNum:  d.getDate(),
      month:    MONTHS[d.getMonth()],
      fullDate: d.toISOString().split('T')[0],
    };
  });
};

const normalizeData = (data) => {
  if (Array.isArray(data)) return data;
  for (const key of ['data', 'results', 'movies', 'schedules']) {
    if (data && Array.isArray(data[key])) return data[key];
  }
  return [];
};

const fmtTime = (dt) => {
  try {
    return new Date(dt).toLocaleTimeString('mn-MN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ulaanbaatar',   // ← UTC+8 тодорхой зааж өгнө
    });
  } catch { return null; }
};

/* ─── useTheme hook — html.light class-ийг ажиглана ── */
const useTheme = () => {
  const [isLight, setIsLight] = useState(
    () => document.documentElement.classList.contains('light')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return isLight;
};

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
const Skeleton = () => (
  <>
    {[1, 2, 3].map(i => (
      <div key={i} className="sp-skeleton">
        <div className="sp-skel" style={{ width: 80, aspectRatio: '2/3', borderRadius: 3, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="sp-skel" style={{ height: 10, width: 120, marginBottom: 14 }} />
          <div className="sp-skel" style={{ height: 30, width: '50%', marginBottom: 10 }} />
          <div className="sp-skel" style={{ height: 8, width: 90, marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3].map(j => <div key={j} className="sp-skel" style={{ height: 32, width: 72 }} />)}
          </div>
        </div>
      </div>
    ))}
  </>
);

/* ─── Error Boundary ─────────────────────────────────────────────────────── */
class EB extends React.Component {
  constructor(p) { super(p); this.state = { err: false }; }
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e, ei) { console.error(e, ei); }
  render() {
    if (this.state.err) return (
      <div className="sp">
        <div className="sp-wrap">
          <div className="sp-empty">
            <div className="sp-empty__icon">!</div>
            <p className="sp-empty__title">Алдаа гарлаа</p>
            <p className="sp-empty__sub">Хуваарь ачааллахад алдаа гарлаа</p>
            <button className="sp-empty__btn" onClick={() => window.location.reload()}>Дахин ачааллах</button>
          </div>
        </div>
      </div>
    );
    return this.props.children;
  }
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
const Schedule = () => {
  const navigate  = useNavigate();
  const allDays   = useMemo(() => getDays(), []);
  const isLight   = useTheme(); // Header-ийн ThemeToggle-г ажиглана

  const [selectedDate, setSelectedDate] = useState(allDays[0]?.fullDate || '');
  const [searchQ,      setSearchQ]      = useState('');
  const [isLoading,    setIsLoading]    = useState(true);
  const [schedules,    setSchedules]    = useState([]);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    if (!selectedDate) return;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res  = await api.get(`/schedules?date=${selectedDate}`);
        const data = normalizeData(res);
        setSchedules(data);
      } catch (e) {
        console.error(e);
        setError('Цагийн хуваарийг татахад алдаа гарлаа.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [selectedDate]);

  const scheduleList = useMemo(() => {
  if (!schedules.length) return [];
  const now = new Date();           // ← нэмэлт
  const movieMap = {};
  schedules.forEach(s => {
    const movie = s.movie;
    if (!movie?._id) return;
    const id = String(movie._id);
    if (!movieMap[id]) {
      movieMap[id] = { ...movie, _id: id, slots: [] };
    }
    const t = fmtTime(s.showTime);
    if (!t) return;
    const total = s.hall?.totalSeats ?? 0;
    const sold  = s.soldSeats?.length ?? 0;
    const avail = total - sold;
    movieMap[id].slots.push({
      scheduleId: s._id,
      time: t,
      hall:            s.hall,
      soldSeats:       s.soldSeats || [],
      basePrice:       s.basePrice,
      availableSeats:  avail,
      totalSeats:      total,
      lowAvailability: avail <= 10 && avail > 0,
      soldOut: avail <= 0,
  isPast: new Date(s.showTime) < new Date(),   // ← нэмэлт
      format:          s.hall?.hallName || 'Standard',
    });
  });
  return Object.values(movieMap).map(m => ({
      ...m,
       slots: m.slots.sort((a, b) => a.time.localeCompare(b.time)),
    }));
  }, [schedules]);

  const filtered = useMemo(() => {
    let list = scheduleList;
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(m =>
        m.title?.toLowerCase().includes(q) ||
        (Array.isArray(m.genre) ? m.genre : [m.genre])
          .some(g => g?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [scheduleList, searchQ]);

  const handleBook = useCallback((movie, slot) => {
    if (slot.soldOut) return;
    navigate('/booking', {
      state: {
        scheduleId:     slot.scheduleId,
        movie: {
          _id:          movie._id,
          title:        movie.title,
          duration:     movie.duration,
          rating:       movie.rating,
          genre:        movie.genre || [],
          posterUrl:    movie.posterUrl || '',
          selectedTime: slot.time,
          selectedDate,
        },
        hall:           slot.hall,
        soldSeats:      slot.soldSeats,
        basePrice:      slot.basePrice,
        availableSeats: slot.availableSeats,
      },
    });
  }, [navigate, selectedDate]);

  const changeDate = useCallback((date) => {
    setSelectedDate(date);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const activeIdx = allDays.findIndex(d => d.fullDate === selectedDate);

  // html.light class байвал light CSS variables идэвхждэг
  // — inline style-р override хийх шаардлагагүй, зөвхөн
  //   isLight-г ашиглан re-render өдөөхөд хангалттай.
  void isLight;

  return (
    <EB>
      <Styles />
      <div className="sp">
        <Header movies={[]} onSearchResults={() => {}} />

        <div className="sp-hero">
          <h1 className="sp-hero__title">ҮЗВЭРИЙН ХУВААРЬ</h1>
          <div className="sp-hero__search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
          </div>
        </div>

        <div className="sp-wrap">
          <div className="sp-daytabs">
            {allDays.map(day => (
              <button
                key={day.fullDate}
                className={`sp-daytab ${day.fullDate === selectedDate ? 'sp-daytab--active' : ''}`}
                onClick={() => changeDate(day.fullDate)}
              >
                <span className="sp-daytab__name">{day.dayName}</span>
                <span className="sp-daytab__num">{day.dateNum}</span>
                <span className="sp-daytab__month">{day.month}</span>
              </button>
            ))}
          </div>

          {error ? (
            <div className="sp-empty">
              <div className="sp-empty__icon">!</div>
              <p className="sp-empty__title">{error}</p>
              <p className="sp-empty__sub">Та дахин оролдоно уу.</p>
              <button className="sp-empty__btn" onClick={() => window.location.reload()}>
                Дахин оролдох
              </button>
            </div>

          ) : isLoading ? (
            <Skeleton />

          ) : filtered.length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty__icon">○</div>
              <p className="sp-empty__title">Энэ өдөр ямар нэгэн үзвэр байхгүй байна</p>
              <p className="sp-empty__sub">Өөр өдөр сонгож үзнэ үү</p>
              {allDays[1] && (
                <button className="sp-empty__btn" onClick={() => changeDate(allDays[1].fullDate)}>
                  Дараагийн өдөр →
                </button>
              )}
            </div>

          ) : (
            filtered.map(movie => {
              const formatMap = {};
              movie.slots.forEach(slot => {
                const fmt = slot.format || 'Standard';
                if (!formatMap[fmt]) formatMap[fmt] = [];
                formatMap[fmt].push(slot);
              });

              return (
                <div key={movie._id} className="sp-card">
                  <div className="sp-card__head">
                    <div className="sp-card__poster">
                      <img
                        src={movie.posterUrl || '/placeholder-poster.jpg'}
                        alt={movie.title}
                        loading="lazy"
                        onError={e => { e.target.onerror = null; e.target.src = '/placeholder-poster.jpg'; }}
                      />
                    </div>
                    <div className="sp-card__meta">
                      <div className="sp-card__duration">
                        {[
                          movie.duration ? `${movie.duration}` : null,
                          movie.genre
                            ? (Array.isArray(movie.genre)
                                ? movie.genre.join(', ')
                                : movie.genre
                              ).toUpperCase()
                            : null,
                        ].filter(Boolean).join('  |  ')}
                      </div>
                      <div className="sp-card__title">{movie.title}</div>
                    </div>
                    {movie.rating && (
                      <div className="sp-card__imdb">
                        Ангилал: {movie.rating}
                      </div>
                    )}
                  </div>

                  <div className="sp-card__days">
                    <button
                      className="sp-days__arrow"
                      onClick={() => activeIdx > 0 && changeDate(allDays[activeIdx - 1].fullDate)}
                      disabled={activeIdx === 0}
                    >←</button>
                    <div className="sp-days__list">
                      {allDays.map(day => (
                        <button
                          key={day.fullDate}
                          className={`sp-day ${day.fullDate === selectedDate ? 'sp-day--active' : ''}`}
                          onClick={() => changeDate(day.fullDate)}
                        >
                          <span className="sp-day__name">{day.dayName}</span>
                          <span className="sp-day__num">{day.dateNum}</span>
                          <span className="sp-day__month">{day.month}</span>
                          <div className="sp-day__line" />
                        </button>
                      ))}
                    </div>
                    <button
                      className="sp-days__arrow"
                      onClick={() => activeIdx < allDays.length - 1 && changeDate(allDays[activeIdx + 1].fullDate)}
                      disabled={activeIdx === allDays.length - 1}
                    >→</button>
                  </div>

                  <div className="sp-card__showtimes">
                    {Object.entries(formatMap).map(([fmt, slots]) => (
                      <div key={fmt} className="sp-showrow">
                        <div className="sp-showrow__format">{fmt}</div>
                        <div className="sp-showrow__slots">
                          {slots.map(slot => (
                            <button
  key={slot.scheduleId}
  className={[
    'sp-slot',
    slot.soldOut                    ? ' sp-slot--soldout' : '',
    slot.isPast && !slot.soldOut    ? ' sp-slot--past'    : '',
    slot.lowAvailability            ? ' sp-slot--low'     : '',
  ].join('')}
  onClick={() => (!slot.soldOut && !slot.isPast) && handleBook(movie, slot)}
  disabled={slot.soldOut || slot.isPast}
  title={
    slot.soldOut    ? 'Дууссан'
    : slot.isPast   ? 'Цаг өнгөрсөн'
    : slot.availableSeats > 0 ? `${slot.availableSeats} суудал үлдсэн`
    : ''
  }
>
  {slot.time}
</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Footer />
      </div>
    </EB>
  );
};

export default Schedule;