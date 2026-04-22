import { useState, useEffect } from 'react';
import {
  Search, Plus, Edit2, Trash2, Clock, Star, Users,
  Calendar, Play, Award, Film, Layers,
  Clapperboard, Filter, Grid3X3,
  List, X, RefreshCw,
} from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import MovieModal from '../modals/MovieModal';
import { movieAPI } from '../../api/adminAPI';
import toast from '../Toast';
import { useConfirm } from '../modals/ConfirmModal';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const EMPTY_FORM = {
  title: '', originalTitle: '', duration: '',
  genre: [], rating: 'PG', imdb: '',
  status: 'nowShowing', posterUrl: '',
  description: '', trailerUrl: '', releaseDate: '',
  cast: [],
};

const FALLBACK_GRADIENTS = [
  ['#1a0533','#4c1d95'],
  ['#0c1a33','#1e3a8a'],
  ['#0c2620','#065f46'],
  ['#2d0a14','#9f1239'],
  ['#1a1400','#78350f'],
  ['#111827','#374151'],
];

const GENRE_COLOR = {
  'Action':      ['#ef4444','rgba(239,68,68,0.12)'],
  'Comedy':      ['#fbbf24','rgba(251,191,36,0.12)'],
  'Drama':       ['#60a5fa','rgba(96,165,250,0.12)'],
  'Horror':      ['#a78bfa','rgba(167,139,250,0.12)'],
  'Romance':     ['#f472b6','rgba(244,114,182,0.12)'],
  'Sci-Fi':      ['#22d3ee','rgba(34,211,238,0.12)'],
  'Thriller':    ['#818cf8','rgba(129,140,248,0.12)'],
  'Documentary': ['#34d399','rgba(52,211,153,0.12)'],
};

/* ─── Genre badge ─────────────────────────────────────────────────────────── */
const GenreBadge = ({ genre }) => {
  const [clr, bg] = GENRE_COLOR[genre] || ['#94a3b8','rgba(148,163,184,0.1)'];
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 6,
      background: bg, border: `1px solid ${clr}30`,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      color: clr, whiteSpace: 'nowrap',
    }}>{genre}</span>
  );
};

/* ─── Filter pill ─────────────────────────────────────────────────────────── */
const FilterPill = ({ active, onClick, icon: Icon, label, count, activeColor }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '8px 16px', borderRadius: 10,
    background: active ? `${activeColor}18` : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? `${activeColor}50` : 'rgba(255,255,255,0.07)'}`,
    color: active ? activeColor : '#475569',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.15s',
  }}>
    <Icon size={13} />
    {label}
    <span style={{
      padding: '1px 7px', borderRadius: 20,
      background: active ? `${activeColor}25` : 'rgba(255,255,255,0.06)',
      fontSize: 11, fontWeight: 800,
      color: active ? activeColor : '#334155',
    }}>{count}</span>
  </button>
);

/* ─── Movie Card ──────────────────────────────────────────────────────────── */
const MovieCard = ({ movie, index, onEdit, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  const [grad] = useState(FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length]);
  const isNow = movie.status === 'nowShowing';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: '#0e1117',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: hovered
          ? '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 4px 20px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* ── Poster ── */}
      {/* paddingBottom 150% = 2:3 ratio, works reliably across all browsers */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '150%', overflow: 'hidden', flexShrink: 0 }}>
        {/* Fallback gradient — always visible behind image */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(160deg, ${grad[0]}, ${grad[1]})`,
        }} />
        {/* Poster image — NO scale on hover */}
        {movie.posterUrl && (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}

        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
          background: 'linear-gradient(to top, rgba(14,17,23,0.98) 0%, rgba(14,17,23,0.5) 60%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Status badge */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 9px', borderRadius: 7,
          background: isNow ? 'rgba(16,185,129,0.9)' : 'rgba(59,130,246,0.9)',
          backdropFilter: 'blur(6px)',
          fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
          color: '#fff', textTransform: 'uppercase',
          boxShadow: isNow ? '0 2px 12px rgba(16,185,129,0.4)' : '0 2px 12px rgba(59,130,246,0.4)',
        }}>
          {isNow ? <Play size={8} /> : <Calendar size={8} />}
          {isNow ? 'Үзэж болно' : 'Удахгүй'}
        </div>

        {/* IMDB */}
        {movie.imdb && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 9px', borderRadius: 7,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            fontSize: 11, fontWeight: 800, color: '#fbbf24',
          }}>
            <Star size={10} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
            {movie.imdb}
          </div>
        )}

        {/* Title block inside poster */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 14px 10px',
        }}>
          <div style={{
            fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em',
            color: '#f1f5f9', lineHeight: 1.25,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{movie.title}</div>
          {movie.originalTitle && (
            <div style={{
              fontSize: 10, color: '#64748b', marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{movie.originalTitle}</div>
          )}
        </div>
      </div>

      {/* ── Info body ── */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Genres */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(movie.genre || []).slice(0, 3).map(g => <GenreBadge key={g} genre={g} />)}
          {(movie.genre || []).length > 3 && (
            <span style={{ padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, color: '#475569', border: '1px solid rgba(255,255,255,0.06)' }}>
              +{movie.genre.length - 3}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: 12 }}>
          {movie.duration && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569' }}>
              <Clock size={10} /> {movie.duration} 
            </div>
          )}
          {movie.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569' }}>
              <Award size={10} /> {movie.rating}
            </div>
          )}
          {movie.cast?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569' }}>
              <Users size={10} /> {movie.cast.length}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Actions */}
        <div style={{
          display: 'flex', gap: 6,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <button
            onClick={() => onEdit(movie)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '8px', borderRadius: 9,
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#818cf8', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; }}
          >
            <Edit2 size={12} /> Засах
          </button>

          <button
            onClick={() => onDelete(movie._id)}
            style={{
              width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 9,
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.15)',
              color: '#f87171', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.16)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.15)'; }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── List Row ────────────────────────────────────────────────────────────── */
const MovieRow = ({ movie, index, onEdit, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  const [grad] = useState(FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length]);
  const isNow = movie.status === 'nowShowing';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '12px 16px',
        background: hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        transition: 'background 0.15s',
      }}
    >
      {/* Mini poster */}
      <div style={{
        width: 42, height: 58, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
        background: `linear-gradient(160deg, ${grad[0]}, ${grad[1]})`,
        position: 'relative', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        {movie.posterUrl && (
          <img src={movie.posterUrl} alt={movie.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }} />
        )}
      </div>

      {/* Title */}
      <div style={{ flex: '0 0 220px', minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {movie.title}
        </div>
        {movie.originalTitle && (
          <div style={{ fontSize: 11, color: '#475569', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {movie.originalTitle}
          </div>
        )}
      </div>

      {/* Genres */}
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {(movie.genre || []).slice(0, 2).map(g => <GenreBadge key={g} genre={g} />)}
      </div>

      {/* Duration */}
      <div style={{ width: 80, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#475569' }}>
        <Clock size={11} /> {movie.duration || '—'}
      </div>

      {/* IMDB */}
      <div style={{ width: 72, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>
        <Star size={11} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
        {movie.imdb || '—'}
      </div>

      {/* Status */}
      <div style={{ width: 110 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 10px', borderRadius: 7,
          background: isNow ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
          border: `1px solid ${isNow ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.25)'}`,
          fontSize: 11, fontWeight: 700,
          color: isNow ? '#34d399' : '#60a5fa',
        }}>
          {isNow ? <Play size={9} /> : <Calendar size={9} />}
          {isNow ? 'Үзэж болно' : 'Тун удахгүй'}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onEdit(movie)} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 12px', borderRadius: 8,
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
          color: '#818cf8', fontSize: 11, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
        >
          <Edit2 size={11} /> Засах
        </button>
        <button onClick={() => onDelete(movie._id)} style={{
          width: 30, height: 30, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
          color: '#f87171', cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.16)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
};

/* ─── Main ────────────────────────────────────────────────────────────────── */
const MovieManagementModule = () => {
  const confirm = useConfirm();
  const [showModal,    setShowModal]    = useState(false);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [movies,       setMovies]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formData,     setFormData]     = useState(EMPTY_FORM);
  const [filter,       setFilter]       = useState('all');
  const [viewMode,     setViewMode]     = useState('grid');

  useEffect(() => { fetchMovies(); }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const data = await movieAPI.getAll();
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && typeof data === 'object') {
        list = [
          ...(Array.isArray(data.nowShowing) ? data.nowShowing : []),
          ...(Array.isArray(data.comingSoon) ? data.comingSoon : []),
          ...(Array.isArray(data.movies)     ? data.movies     : []),
          ...(Array.isArray(data.data)       ? data.data       : []),
        ];
      }
      setMovies(list);
    } catch (err) {
      toast.error('Кинонууд татахад алдаа гарлаа');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange  = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleGenreToggle  = g => setFormData(p => ({ ...p, genre: p.genre.includes(g) ? p.genre.filter(x => x !== g) : [...p.genre, g] }));
  const handleCastChange   = c => setFormData(p => ({ ...p, cast: c }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Хоосон string genre-г цэвэрлэнэ (Mongoose validation алдаагаас сэргийлнэ)
    const cleanedForm = {
      ...formData,
      genre: (formData.genre || []).filter(g => g && g.trim() !== ''),
      cast:  (formData.cast  || []).filter(c => c.name && c.name.trim() !== ''),
      releaseDate: formData.releaseDate ? formData.releaseDate.slice(0, 10) : '',
    };
    if (!cleanedForm.genre.length) { toast.warning('Дор хаяж нэг төрөл сонгоно уу'); return; }
    try {
      if (editingMovie) {
        await movieAPI.update(editingMovie._id, cleanedForm);
        toast.success('Кино амжилттай шинэчлэгдлээ');
      } else {
        await movieAPI.create(cleanedForm);
        toast.success('Кино амжилттай нэмэгдлээ');
      }
      setShowModal(false); setEditingMovie(null); setFormData(EMPTY_FORM);
      await fetchMovies();
    } catch (err) {
      toast.error('Хадгалахад алдаа: ' + err.message);
    }
  };

  const handleEdit = (movie) => {
    cast: Array.isArray(movie.cast)
  ? movie.cast.filter(c => c && c.name && c.name.trim() !== '')
  : [],
    setEditingMovie(movie);
    setFormData({
      title:         movie.title         || '',
      originalTitle: movie.originalTitle || '',
      duration:      movie.duration      || '',
      // Хоосон string genre-г хасна
      genre: Array.isArray(movie.genre)
        ? movie.genre.filter(g => g && g.trim() !== '')
        : [],
      rating:      movie.rating    || 'PG',
      imdb:        movie.imdb      || '',
      status:      movie.status    || 'nowShowing',
      posterUrl:   movie.posterUrl || '',
      description: movie.description || '',
      trailerUrl:  movie.trailerUrl  || '',
      // ISO date → "yyyy-MM-dd" формат болгоно
      releaseDate: movie.releaseDate
        ? String(movie.releaseDate).slice(0, 10)
        : '',
      cast: Array.isArray(movie.cast)
        ? movie.cast.filter(c => c && c.name && c.name.trim() !== '')
        : [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Кино устгах уу?', message: 'Кино болон холбоотой бүх мэдээлэл устана. Буцаах боломжгүй.', confirmText: 'Устгах', variant: 'danger' });
    if (!ok) return;
    try { await movieAPI.delete(id); toast.success('Кино устгагдлаа'); fetchMovies(); }
    catch (err) { toast.error('Устгахад алдаа: ' + err.message); }
  };

  const openAdd = () => { setEditingMovie(null); setFormData(EMPTY_FORM); setShowModal(true); };

  const filtered = movies.filter(m => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || m.title?.toLowerCase().includes(q) || m.originalTitle?.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || m.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total:      movies.length,
    nowShowing: movies.filter(m => m.status === 'nowShowing').length,
    comingSoon: movies.filter(m => m.status === 'comingSoon').length,
    avgRating:  movies.length
      ? (movies.reduce((s, m) => s + (parseFloat(m.imdb) || 0), 0) / movies.length).toFixed(1)
      : '—',
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{
      minHeight: '100vh',
      
      fontFamily: "'Outfit', 'DM Sans', system-ui, sans-serif",
      color: '#e2e8f0',
      position: 'relative',
    }}>
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 700, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(127,29,29,0.12) 0%, transparent 70%)', filter: 'blur(60px)', top: '-5%', left: '-5%' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(30,27,75,0.15) 0%, transparent 70%)', filter: 'blur(80px)', bottom: '0', right: '-5%' }} />
        {/* subtle grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1440, margin: '0 auto', padding: '2rem 2rem 4rem' }}>

        {/* ── Header ── */}
        <header style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: 'linear-gradient(135deg, #dc2626, #ea580c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(220,38,38,0.4)',
                }}>
                  <Clapperboard size={18} color="#fff" />
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: '#dc2626',
                  padding: '3px 10px', borderRadius: 6,
                  background: 'rgba(220,38,38,0.1)',
                  border: '1px solid rgba(220,38,38,0.2)',
                }}>
                  Кино удирдлага
                </div>
              </div>
              <h1 style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 900, letterSpacing: '-0.035em', margin: '0 0 6px',
                background: 'linear-gradient(120deg, #f1f5f9 30%, #64748b 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Кинонуудын жагсаалт</h1>
              <p style={{ fontSize: 13, color: '#334155', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Film size={12} /> Нийт {stats.total} кино · Сүүлийн шинэчлэл: одоо
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={fetchMovies} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 11,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#475569', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
                <RefreshCw size={13} /> Шинэчлэх
              </button>
              <button onClick={openAdd} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 20px', borderRadius: 11,
                background: 'linear-gradient(135deg, #dc2626, #ea580c)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 20px rgba(220,38,38,0.35)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(220,38,38,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(220,38,38,0.35)'; }}
              >
                <Plus size={15} /> Шинэ кино
              </button>
            </div>
          </div>
        </header>

        {/* ── Toolbar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#334155', pointerEvents: 'none' }} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Кино хайх..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 14px 10px 36px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 11, color: '#f1f5f9', fontSize: 13,
                outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(220,38,38,0.4)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex',
              }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filters */}
          <FilterPill active={filter === 'all'}        onClick={() => setFilter('all')}        icon={Layers}   label="Бүгд"         count={stats.total}      activeColor="#f87171" />
          <FilterPill active={filter === 'nowShowing'} onClick={() => setFilter('nowShowing')} icon={Play}     label="Үзэж болно"   count={stats.nowShowing} activeColor="#34d399" />
          <FilterPill active={filter === 'comingSoon'} onClick={() => setFilter('comingSoon')} icon={Calendar} label="Тун удахгүй"  count={stats.comingSoon} activeColor="#60a5fa" />

          {/* View toggle */}
          <div style={{
            display: 'flex', gap: 3,
            padding: '4px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            marginLeft: 'auto',
          }}>
            {[
              { mode: 'grid', Icon: Grid3X3 },
              { mode: 'list', Icon: List    },
            ].map(({ mode, Icon: Ic }) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                width: 32, height: 32, borderRadius: 7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: viewMode === mode ? 'rgba(255,255,255,0.09)' : 'transparent',
                border: 'none', color: viewMode === mode ? '#f1f5f9' : '#334155',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <Ic size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Result count ── */}
        {(searchTerm || filter !== 'all') && (
          <div style={{ marginBottom: '1rem', fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={11} />
            {filtered.length} кино олдлоо
            {searchTerm && <span style={{ color: '#475569' }}>— "{searchTerm}"</span>}
          </div>
        )}

        {/* ── Content ── */}
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '5rem 2rem', textAlign: 'center',
            background: 'rgba(255,255,255,0.015)',
            border: '1px dashed rgba(255,255,255,0.07)',
            borderRadius: 18,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, marginBottom: 16,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Search size={24} style={{ color: '#f87171', opacity: 0.5 }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8', margin: '0 0 6px' }}>
              Кино олдсонгүй
            </h3>
            <p style={{ fontSize: 13, color: '#334155', margin: '0 0 20px' }}>
              Хайлт эсвэл шүүлтийг өөрчилж үзнэ үү
            </p>
            <button onClick={() => { setSearchTerm(''); setFilter('all'); }} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <X size={12} /> Шүүлт арилгах
            </button>
          </div>

        ) : viewMode === 'grid' ? (
          /* Grid view */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
            gap: 16,
          }}>
            {filtered.map((movie, i) => (
              <MovieCard
                key={movie._id || i}
                movie={movie}
                index={i}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

        ) : (
          /* List view */
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {/* List header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#334155',
            }}>
              <div style={{ width: 42 }} />
              <div style={{ flex: '0 0 220px' }}>Кино</div>
              <div style={{ flex: 1 }}>Төрөл</div>
              <div style={{ width: 80 }}>Хугацаа</div>
              <div style={{ width: 72 }}>IMDB</div>
              <div style={{ width: 110 }}>Статус</div>
              <div style={{ width: 120 }}>Үйлдэл</div>
            </div>
            {filtered.map((movie, i) => (
              <MovieRow
                key={movie._id || i}
                movie={movie}
                index={i}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <MovieModal
          editingMovie={editingMovie}
          formData={formData}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          onChange={handleInputChange}
          onGenreToggle={handleGenreToggle}
          onCastChange={handleCastChange}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #1e293b !important; }
        @media (max-width: 900px) {
          /* 2-col grid on tablet */
        }
        @media (max-width: 640px) {
          .mm-stats { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
};

export default MovieManagementModule;