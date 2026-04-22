import { useState, useEffect } from 'react';
import {
  X, Check, AlertCircle, Film, Calendar,
  Clock, Clock3, Plus, Loader2, ChevronRight,
  MapPin, Tag, RefreshCw, Star, Users, Ticket,
  Monitor, Layers, ArrowRight, Save, Trash2,
  Zap, ChevronDown, Sparkles
} from 'lucide-react';
import { scheduleAPI, movieAPI } from '../../api/adminAPI';

/* ─── Constants ─────────────────────────────────────────────────────────── */
const HALL = {
  id: 'hall-a',
  name: 'Үзвэрийн танхим',
  totalSeats: 293,
  tags: ['dude'],
};

const PRICES = { child: 8000, adult: 15000 };

const QUICK_TIMES = ['10:00', '12:00', '14:00', '16:00', '18:00', '19:00', '20:30', '22:00'];

/* ─── Timezone helpers ───────────────────────────────────────────────────── */
const MN_OFFSET = 8 * 3600 * 1000;

const utcToMn = (iso) => {
  const d = new Date(new Date(iso).getTime() + MN_OFFSET);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

const mnToUtc = (date, time) => {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, m] = time.split(':').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, m) - MN_OFFSET).toISOString();
};

const fmt = (n) =>
  new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency: 'MNT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

/* ─── Step indicator ─────────────────────────────────────────────────────── */
const StepDot = ({ active, done, label, num }) => (
  <div className={`step-dot-wrap ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
    <div className="step-dot">
      {done ? <Check size={10} strokeWidth={3} /> : <span>{num}</span>}
    </div>
    <span className="step-label">{label}</span>
  </div>
);

/* ─── ScheduleModal ──────────────────────────────────────────────────────── */
const ScheduleModal = ({ movies: moviesProp, editing, preselectedMovieId, onClose, onSaved }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [movies, setMovies] = useState(moviesProp || []);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [moviesError, setMoviesError] = useState('');

  useEffect(() => {
    if (moviesProp?.length > 0) {
      setMovies(moviesProp.filter(m => !m.status || m.status === 'nowShowing' || m.status === 'active'));
      return;
    }
    fetchMovies();
  }, [moviesProp]);

  const fetchMovies = async () => {
    setMoviesLoading(true);
    setMoviesError('');
    try {
      const res = await movieAPI.getAll();
      const list = Array.isArray(res)
        ? res
        : [...(res?.nowShowing || []), ...(res?.comingSoon || []), ...(res?.movies || [])];
      const active = list.filter(m => !m.status || m.status === 'nowShowing' || m.status === 'active');
      setMovies(active);
      if (!active.length) setMoviesError('Идэвхтэй кино олдсонгүй.');
    } catch (e) {
      setMoviesError('Кино татахад алдаа: ' + e.message);
    } finally {
      setMoviesLoading(false);
    }
  };

  const [form, setForm] = useState({
    movieId: editing?.movie?._id || editing?.movie || preselectedMovieId || '',
    date: editing
      ? new Date(new Date(editing.showTime).getTime() + MN_OFFSET).toISOString().split('T')[0]
      : todayStr,
    times: editing ? [utcToMn(editing.showTime)] : [],
  });
  const [customTime, setCustomTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('movie');

  const editingDate = editing
    ? new Date(new Date(editing.showTime).getTime() + MN_OFFSET).toISOString().split('T')[0]
    : todayStr;

  const toggleTime = (t) => {
    if (editing) {
      setForm(p => ({ ...p, times: [t] }));
      return;
    }
    setForm(p => ({
      ...p,
      times: p.times.includes(t) ? p.times.filter(x => x !== t) : [...p.times, t].sort(),
    }));
  };

  const addCustom = () => {
    if (customTime && /^([01]?\d|2[0-3]):[0-5]\d$/.test(customTime)) {
      if (!form.times.includes(customTime))
        setForm(p => ({ ...p, times: [...p.times, customTime].sort() }));
      setCustomTime('');
    }
  };

  const removeTime = (t) => setForm(p => ({ ...p, times: p.times.filter(x => x !== t) }));

  const handleSubmit = async () => {
    if (!form.movieId) { setError('Кино сонгоно уу'); return; }
    if (!form.date) { setError('Огноо оруулна уу'); return; }
    if (!form.times.length) { setError('Дор хаяж нэг цаг сонгоно уу'); return; }

    setError('');
    setSaving(true);
    try {
      if (editing) {
        await scheduleAPI.update(editing._id, {
          movieId: form.movieId,
          showTime: mnToUtc(form.date || editingDate, form.times[0]),
          hall: HALL,
          basePrice: PRICES.adult,
        });
        onSaved('Хуваарь шинэчлэгдлээ');
      } else {
        await Promise.all(
          form.times.map(t =>
            scheduleAPI.create({
              movieId: form.movieId,
              showTime: mnToUtc(form.date, t),
              hall: HALL,
              basePrice: PRICES.adult,
            })
          )
        );
        onSaved(form.times.length > 1 ? `${form.times.length} хуваарь нэмэгдлээ` : 'Хуваарь нэмэгдлээ');
      }
    } catch (e) {
      setError(e.message || 'Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const selectedMovie = movies.find(m => m._id === form.movieId);
  const stepMovieDone = !!form.movieId;
  const stepTimeDone = form.times.length > 0 && !!form.date;

  return (
    <>
      <div className="sm-overlay" onClick={e => e.target === e.currentTarget && onClose()} />
      <div className="sm-container">

        {/* Ambient glow */}
        <div className="sm-glow" />

        {/* Header */}
        <div className="sm-header">
          <div className="sm-header-left">
            <div className={`sm-mode-tag ${editing ? 'edit' : 'new'}`}>
              {editing ? <Save size={10} /> : <Plus size={10} />}
              {editing ? 'Засах' : 'Шинэ хуваарь'}
            </div>
          </div>
          <button className="sm-close" onClick={onClose} aria-label="Хаах">
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Progress steps */}
        <div className="sm-steps">
          <StepDot num={1} label="Кино" active={activeSection === 'movie'} done={stepMovieDone} />
          <div className={`step-line ${stepMovieDone ? 'done' : ''}`} />
          <StepDot num={2} label="Цаг & Огноо" active={activeSection === 'time'} done={stepTimeDone} />
          <div className={`step-line ${stepTimeDone ? 'done' : ''}`} />
          <StepDot num={3} label="Танхим" active={activeSection === 'hall'} done={false} />
        </div>

        {/* Scrollable body */}
        <div className="sm-body">

          {/* Section: Movie */}
          <section className="sm-section" onClick={() => setActiveSection('movie')}>
            <div className="sm-section-label">
              <Film size={13} strokeWidth={2} />
              <span>Кино сонгох</span>
              {stepMovieDone && <span className="sm-done-badge"><Check size={9} /> Бэлэн</span>}
            </div>

            {moviesLoading ? (
              <div className="sm-state-box loading">
                <Loader2 size={15} className="spin" />
                <span>Кинонууд ачааллаж байна...</span>
              </div>
            ) : moviesError ? (
              <div className="sm-state-box error">
                <AlertCircle size={15} />
                <span>{moviesError}</span>
                <button className="sm-retry" onClick={fetchMovies}>
                  <RefreshCw size={11} /> Дахин
                </button>
              </div>
            ) : (
              <div className="sm-select-wrap">
                <Film size={14} className="sm-select-icon-left" />
                <select
                  className="sm-select"
                  value={form.movieId}
                  onChange={e => setForm(p => ({ ...p, movieId: e.target.value }))}
                  disabled={!!preselectedMovieId}
                >
                  <option value="">Кино сонгох...</option>
                  {movies.map(m => (
                    <option key={m._id} value={m._id}>{m.title}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="sm-select-icon-right" />
              </div>
            )}

            {selectedMovie && (
              <div className="sm-movie-card">
                <div className="sm-poster-wrap">
                  <img
                    src={selectedMovie.posterUrl || '/placeholder-poster.jpg'}
                    alt={selectedMovie.title}
                    onError={e => { e.target.src = '/placeholder-poster.jpg'; }}
                  />
                </div>
                <div className="sm-movie-details">
                  <h4 className="sm-movie-title">{selectedMovie.title}</h4>
                  {selectedMovie.originalTitle && (
                    <p className="sm-movie-orig">{selectedMovie.originalTitle}</p>
                  )}
                  <div className="sm-movie-badges">
                    {selectedMovie.duration && (
                      <span className="sm-badge">
                        <Clock size={9} strokeWidth={2.5} />
                        {selectedMovie.duration} мин
                      </span>
                    )}
                    {selectedMovie.genre?.slice(0, 2).map(g => (
                      <span key={g} className="sm-badge genre">
                        <Tag size={9} strokeWidth={2.5} />
                        {g}
                      </span>
                    ))}
                    {selectedMovie.imdb && (
                      <span className="sm-badge gold">
                        <Star size={9} strokeWidth={2.5} fill="currentColor" />
                        {selectedMovie.imdb}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className="sm-divider" />

          {/* Section: Date & Time */}
          <section className="sm-section" onClick={() => setActiveSection('time')}>
            <div className="sm-section-label">
              <Calendar size={13} strokeWidth={2} />
              <span>Огноо &amp; Цаг</span>
              {stepTimeDone && <span className="sm-done-badge"><Check size={9} /> Бэлэн</span>}
            </div>

            <div className="sm-row">
              <div className="sm-field">
                <label className="sm-field-label">
                  <Calendar size={10} /> Огноо
                </label>
                <input
                  type="date"
                  className="sm-input"
                  value={form.date || editingDate}
                  min={todayStr}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                />
              </div>

              {!editing && (
                <div className="sm-field">
                  <label className="sm-field-label">
                    <Clock size={10} /> Цаг нэмэх
                  </label>
                  <div className="sm-time-add-row">
                    <input
                      type="time"
                      className="sm-input"
                      value={customTime}
                      onChange={e => setCustomTime(e.target.value)}
                    />
                    <button className="sm-add-btn" onClick={addCustom} disabled={!customTime}>
                      <Plus size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="sm-quicktimes-label">
              <Zap size={11} strokeWidth={2.5} />
              Хурдан сонголт
            </div>
            <div className="sm-time-grid">
              {QUICK_TIMES.map(t => (
                <button
                  key={t}
                  className={`sm-time-btn ${form.times.includes(t) ? 'active' : ''}`}
                  onClick={() => toggleTime(t)}
                >
                  {form.times.includes(t) && (
                    <span className="sm-time-check"><Check size={9} strokeWidth={3} /></span>
                  )}
                  {t}
                </button>
              ))}
            </div>

            {form.times.length > 0 && (
              <div className="sm-chips-wrap">
                <span className="sm-chips-label">
                  <Clock3 size={10} /> {form.times.length} цаг сонгосон
                </span>
                <div className="sm-chips">
                  {form.times.map(t => (
                    <div key={t} className="sm-chip">
                      {t}
                      <button onClick={() => removeTime(t)} className="sm-chip-del">
                        <X size={9} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="sm-divider" />

          {/* Section: Hall */}
          <section className="sm-section" onClick={() => setActiveSection('hall')}>
            <div className="sm-section-label">
              <Monitor size={13} strokeWidth={2} />
              <span>Танхим &amp; Үнэ</span>
            </div>

            <div className="sm-hall">
              <div className="sm-hall-left">
                <div className="sm-hall-icon"><Monitor size={16} strokeWidth={1.5} /></div>
                <div>
                  <div className="sm-hall-name">{HALL.name}</div>
                  <div className="sm-hall-cap">
                    <Users size={10} /> {HALL.totalSeats} суудал
                  </div>
                </div>
              </div>
              <div className="sm-hall-tags">
                {HALL.tags.map(tag => (
                  <span key={tag} className="sm-hall-tag">{tag}</span>
                ))}
              </div>
            </div>

            <div className="sm-prices">
              <div className="sm-price-card">
                <div className="sm-price-icon child"><Users size={13} strokeWidth={1.5} /></div>
                <div className="sm-price-info">
                  <span className="sm-price-label">Хүүхэд</span>
                  <span className="sm-price-val">{fmt(PRICES.child)}</span>
                </div>
              </div>
              <div className="sm-price-card primary">
                <div className="sm-price-icon adult"><Ticket size={13} strokeWidth={1.5} /></div>
                <div className="sm-price-info">
                  <span className="sm-price-label">Насанд хүрсэн</span>
                  <span className="sm-price-val primary">{fmt(PRICES.adult)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="sm-error">
              <AlertCircle size={13} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sm-footer">
          <div className="sm-footer-summary">
            {form.times.length > 0 && form.movieId
              ? <><Sparkles size={11} />{form.times.length} сеанс бэлэн</>
              : <><Clock size={11} />Мэдээлэл оруулна уу</>
            }
          </div>
          <div className="sm-footer-actions">
            <button className="sm-cancel" onClick={onClose}>Цуцлах</button>
            <button className="sm-submit" onClick={handleSubmit} disabled={saving || moviesLoading}>
              {saving ? (
                <><Loader2 size={13} className="spin" /> Хадгалж байна...</>
              ) : editing ? (
                <><Save size={13} /> Шинэчлэх</>
              ) : (
                <><Check size={13} strokeWidth={2.5} /> Хадгалах</>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

        /* ── Reset ── */
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Overlay ── */
        .sm-overlay {
          position: fixed; inset: 0; z-index: 999;
          background: rgba(2, 4, 12, 0.88);
          backdrop-filter: blur(18px);
          animation: smFadeIn 0.25s ease;
        }

        @keyframes smFadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* ── Container ── */
        .sm-container {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
          width: min(580px, calc(100vw - 2rem));
          max-height: 92vh;
          background: #0c0e1a;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03) inset,
            0 32px 64px -16px rgba(0,0,0,0.7),
            0 0 80px -20px rgba(80,100,255,0.12);
          display: flex; flex-direction: column;
          overflow: hidden;
          animation: smSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        @keyframes smSlideUp {
          from { opacity: 0; transform: translate(-50%, -46%) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        /* ── Ambient glow ── */
        .sm-glow {
          position: absolute; top: -60px; left: 50%;
          transform: translateX(-50%);
          width: 300px; height: 120px;
          background: radial-gradient(ellipse, rgba(99,130,255,0.15) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        /* ── Header ── */
        .sm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          position: relative; z-index: 1;
        }

        .sm-mode-tag {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.3rem 0.8rem;
          border-radius: 100px;
          font-size: 0.72rem; font-weight: 600; letter-spacing: 0.04em;
        }
        .sm-mode-tag.new {
          background: rgba(99,130,255,0.12);
          border: 1px solid rgba(99,130,255,0.25);
          color: #7ea3ff;
        }
        .sm-mode-tag.edit {
          background: rgba(234,179,8,0.1);
          border: 1px solid rgba(234,179,8,0.25);
          color: #fbbf24;
        }

        .sm-close {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 50%; color: #4b5563; cursor: pointer;
          transition: all 0.18s ease;
        }
        .sm-close:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; border-color: rgba(255,255,255,0.15); }

        /* ── Steps ── */
        .sm-steps {
          display: flex; align-items: center;
          padding: 0.85rem 1.5rem;
          gap: 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.015);
        }

        .step-dot-wrap {
          display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
          flex-shrink: 0;
        }

        .step-dot {
          width: 24px; height: 24px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          font-size: 0.65rem; font-weight: 700;
          color: #4b5563;
          transition: all 0.25s ease;
          font-family: 'DM Mono', monospace;
        }

        .step-dot-wrap.active .step-dot {
          background: rgba(99,130,255,0.15);
          border-color: rgba(99,130,255,0.5);
          color: #7ea3ff;
          box-shadow: 0 0 0 4px rgba(99,130,255,0.08);
        }

        .step-dot-wrap.done .step-dot {
          background: rgba(52,211,153,0.12);
          border-color: rgba(52,211,153,0.4);
          color: #34d399;
        }

        .step-label {
          font-size: 0.6rem; font-weight: 600; letter-spacing: 0.04em;
          color: #374151; white-space: nowrap;
          transition: color 0.2s;
        }

        .step-dot-wrap.active .step-label { color: #7ea3ff; }
        .step-dot-wrap.done .step-label { color: #34d399; }

        .step-line {
          flex: 1; height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 0 0.5rem;
          margin-bottom: 1.05rem;
          transition: background 0.3s;
        }
        .step-line.done { background: rgba(52,211,153,0.3); }

        /* ── Body ── */
        .sm-body {
          flex: 1; overflow-y: auto;
          padding: 1.25rem 1.25rem;
          display: flex; flex-direction: column; gap: 0;
          scroll-behavior: smooth;
        }
        .sm-body::-webkit-scrollbar { width: 3px; }
        .sm-body::-webkit-scrollbar-track { background: transparent; }
        .sm-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        /* ── Section ── */
        .sm-section {
          display: flex; flex-direction: column; gap: 0.75rem;
          padding: 0.25rem 0;
          cursor: default;
        }

        .sm-section-label {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.68rem; font-weight: 700;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: #374151;
        }

        .sm-done-badge {
          display: inline-flex; align-items: center; gap: 0.3rem;
          margin-left: auto;
          padding: 0.15rem 0.55rem;
          background: rgba(52,211,153,0.1);
          border: 1px solid rgba(52,211,153,0.2);
          border-radius: 20px; color: #34d399;
          font-size: 0.6rem; font-weight: 600; letter-spacing: 0.03em;
          text-transform: none;
        }

        .sm-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent);
          margin: 0.75rem 0;
        }

        /* ── States ── */
        .sm-state-box {
          display: flex; align-items: center; gap: 0.7rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.8rem; font-weight: 500;
        }
        .sm-state-box.loading {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          color: #6b7280;
        }
        .sm-state-box.error {
          background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15);
          color: #f87171; flex-wrap: wrap;
        }

        .sm-retry {
          margin-left: auto; display: flex; align-items: center; gap: 0.35rem;
          padding: 0.25rem 0.65rem;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 8px; color: #f87171; font-size: 0.7rem; font-weight: 600;
          cursor: pointer; transition: all 0.18s;
          font-family: inherit;
        }
        .sm-retry:hover { background: rgba(239,68,68,0.15); }

        /* ── Select ── */
        .sm-select-wrap { position: relative; }

        .sm-select-icon-left {
          position: absolute; left: 0.85rem; top: 50%;
          transform: translateY(-50%);
          color: #374151; pointer-events: none; z-index: 1;
        }

        .sm-select-icon-right {
          position: absolute; right: 0.85rem; top: 50%;
          transform: translateY(-50%);
          color: #374151; pointer-events: none;
        }

        .sm-select {
          width: 100%;
          padding: 0.75rem 2.2rem 0.75rem 2.3rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: #e2e8f0; font-size: 0.85rem; font-weight: 500;
          appearance: none; cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .sm-select option { background: #0c0e1a; color: #e2e8f0; }
        .sm-select:focus { outline: none; border-color: rgba(99,130,255,0.4); background: rgba(99,130,255,0.05); }
        .sm-select:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── Movie card ── */
        .sm-movie-card {
          display: flex; gap: 0.9rem;
          padding: 0.85rem;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          transition: border-color 0.2s;
        }
        .sm-movie-card:hover { border-color: rgba(255,255,255,0.1); }

        .sm-poster-wrap {
          flex-shrink: 0;
          width: 44px; height: 62px;
          border-radius: 8px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
        }
        .sm-poster-wrap img { width: 100%; height: 100%; object-fit: cover; }

        .sm-movie-details { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.25rem; }

        .sm-movie-title {
          font-size: 0.88rem; font-weight: 700; color: #f1f5f9;
          margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .sm-movie-orig { font-size: 0.68rem; color: #4b5563; margin: 0; }

        .sm-movie-badges { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.15rem; }

        .sm-badge {
          display: inline-flex; align-items: center; gap: 0.25rem;
          padding: 0.2rem 0.5rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px; font-size: 0.64rem; font-weight: 600; color: #6b7280;
          font-family: 'DM Mono', monospace;
        }
        .sm-badge.genre { color: #818cf8; border-color: rgba(129,140,248,0.2); background: rgba(129,140,248,0.05); }
        .sm-badge.gold { color: #fbbf24; border-color: rgba(251,191,36,0.2); background: rgba(251,191,36,0.05); }

        /* ── Form row ── */
        .sm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

        .sm-field { display: flex; flex-direction: column; gap: 0.4rem; }

        .sm-field-label {
          display: flex; align-items: center; gap: 0.35rem;
          font-size: 0.68rem; font-weight: 600; color: #4b5563;
          letter-spacing: 0.04em;
        }

        .sm-input {
          width: 100%;
          padding: 0.65rem 0.85rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: #e2e8f0; font-size: 0.82rem; font-weight: 500;
          font-family: 'DM Mono', monospace;
          transition: all 0.2s;
        }
        .sm-input:focus { outline: none; border-color: rgba(99,130,255,0.4); background: rgba(99,130,255,0.05); }

        .sm-time-add-row { display: flex; gap: 0.5rem; }

        .sm-add-btn {
          padding: 0.65rem 0.85rem;
          background: rgba(99,130,255,0.1);
          border: 1px solid rgba(99,130,255,0.2);
          border-radius: 10px; color: #7ea3ff;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center;
          flex-shrink: 0;
        }
        .sm-add-btn:hover:not(:disabled) { background: rgba(99,130,255,0.18); border-color: rgba(99,130,255,0.4); }
        .sm-add-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ── Quick times ── */
        .sm-quicktimes-label {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.67rem; font-weight: 700; color: #374151;
          letter-spacing: 0.06em; text-transform: uppercase;
        }

        .sm-time-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.45rem;
        }

        .sm-time-btn {
          position: relative;
          display: flex; align-items: center; justify-content: center; gap: 0.3rem;
          padding: 0.55rem 0.3rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; color: #6b7280;
          font-size: 0.78rem; font-weight: 600; cursor: pointer;
          transition: all 0.18s ease;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.02em;
        }
        .sm-time-btn:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.13); color: #d1d5db;
        }
        .sm-time-btn.active {
          background: rgba(99,130,255,0.12);
          border-color: rgba(99,130,255,0.35); color: #7ea3ff;
        }

        .sm-time-check {
          display: flex; align-items: center; color: #34d399;
        }

        /* ── Chips ── */
        .sm-chips-wrap {
          padding: 0.7rem 0.85rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          display: flex; flex-direction: column; gap: 0.5rem;
        }

        .sm-chips-label {
          display: flex; align-items: center; gap: 0.35rem;
          font-size: 0.63rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: #374151;
        }

        .sm-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }

        .sm-chip {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.3rem 0.6rem 0.3rem 0.75rem;
          background: rgba(99,130,255,0.1);
          border: 1px solid rgba(99,130,255,0.22);
          border-radius: 100px;
          font-size: 0.73rem; font-weight: 600; color: #7ea3ff;
          font-family: 'DM Mono', monospace;
        }

        .sm-chip-del {
          display: flex; align-items: center;
          background: none; border: none; color: #4b5563;
          cursor: pointer; padding: 0; transition: color 0.15s;
        }
        .sm-chip-del:hover { color: #f87171; }

        /* ── Hall ── */
        .sm-hall {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.85rem 1rem;
          background: linear-gradient(135deg, rgba(99,130,255,0.06), rgba(139,92,246,0.03));
          border: 1px solid rgba(99,130,255,0.14);
          border-radius: 14px;
        }

        .sm-hall-left { display: flex; align-items: center; gap: 0.75rem; }

        .sm-hall-icon {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(99,130,255,0.1);
          border: 1px solid rgba(99,130,255,0.2);
          border-radius: 10px; color: #7ea3ff;
        }

        .sm-hall-name { font-size: 0.9rem; font-weight: 700; color: #e2e8f0; }
        .sm-hall-cap {
          display: flex; align-items: center; gap: 0.3rem;
          font-size: 0.68rem; color: #4b5563; margin-top: 0.15rem;
        }

        .sm-hall-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: flex-end; }

        .sm-hall-tag {
          font-size: 0.6rem; padding: 0.2rem 0.5rem;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.18);
          border-radius: 6px; color: #34d399; font-weight: 700;
          letter-spacing: 0.03em;
        }

        /* ── Prices ── */
        .sm-prices { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }

        .sm-price-card {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.8rem 0.9rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
        }
        .sm-price-card.primary {
          background: linear-gradient(135deg, rgba(99,130,255,0.07), rgba(139,92,246,0.04));
          border-color: rgba(99,130,255,0.2);
        }

        .sm-price-icon {
          width: 30px; height: 30px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
        }
        .sm-price-icon.child {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); color: #6b7280;
        }
        .sm-price-icon.adult {
          background: rgba(99,130,255,0.1);
          border: 1px solid rgba(99,130,255,0.2); color: #7ea3ff;
        }

        .sm-price-info { display: flex; flex-direction: column; gap: 0.1rem; }

        .sm-price-label {
          font-size: 0.63rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: #4b5563;
        }

        .sm-price-val {
          font-size: 0.95rem; font-weight: 800; color: #d1d5db;
          font-family: 'DM Mono', monospace;
        }
        .sm-price-val.primary { color: #7ea3ff; }

        /* ── Error ── */
        .sm-error {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.65rem 0.9rem;
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.18);
          border-radius: 10px; font-size: 0.78rem; color: #f87171;
          font-weight: 500;
        }

        /* ── Footer ── */
        .sm-footer {
          display: flex; align-items: center; justify-content: space-between;
          gap: 0.75rem;
          padding: 0.85rem 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.015);
        }

        .sm-footer-summary {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.72rem; font-weight: 600; color: #374151;
        }

        .sm-footer-actions { display: flex; gap: 0.6rem; }

        .sm-cancel, .sm-submit {
          display: flex; align-items: center; justify-content: center; gap: 0.45rem;
          padding: 0.6rem 1.1rem;
          border-radius: 10px; font-size: 0.82rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          font-family: inherit; white-space: nowrap;
        }

        .sm-cancel {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08); color: #6b7280;
        }
        .sm-cancel:hover { background: rgba(255,255,255,0.08); color: #d1d5db; }

        .sm-submit {
          background: linear-gradient(135deg, #5b7aff, #7c6aff);
          border: none; color: white;
          box-shadow: 0 2px 10px rgba(91,122,255,0.3);
          padding: 0.6rem 1.3rem;
        }
        .sm-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(91,122,255,0.45);
        }
        .sm-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* ── Spin ── */
        .spin { animation: smSpin 0.7s linear infinite; }
        @keyframes smSpin { to { transform: rotate(360deg); } }

        /* ── Responsive ── */
        @media (max-width: 520px) {
          .sm-row { grid-template-columns: 1fr; }
          .sm-time-grid { grid-template-columns: repeat(3, 1fr); }
          .sm-prices { grid-template-columns: 1fr; }
          .sm-hall { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
          .sm-steps { padding: 0.75rem 1rem; }
        }
      `}</style>
    </>
  );
};

export default ScheduleModal;