import { useState } from 'react';
import {
  X, Plus, Trash2, Film, Clock, Star, Calendar,
  Tag, Users, Link2, ImageIcon, AlignLeft, ShieldCheck,
  Clapperboard, PlayCircle, CheckCircle2, ChevronDown,
  User, Briefcase, Globe, Sparkles
} from 'lucide-react';

const GENRE_LIST = [
  'Адал явдалт', 'Инээдэм', 'Драма', 'Шинжлэх ухаан', 'Фантастик', 'Аймшгийн', 'Триллер', 'Нууцлагдмал', 'Гэр бүлийн', 'Аниме', 'Баримтат', 'Гэрэл зураг', 'Түүхэн', 'Хүүхэлдэйн', 'Хөгжимт', 'Уянгын', 'Уран зөгнөлт'
];

const getYoutubeId = (url) => {
  if (!url) return null;
  url = url.trim();
  const patterns = [
    /youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const C = {
  bg:       '#090b10',
  surface:  '#0e1117',
  elevated: '#13181f',
  border:   'rgba(255,255,255,0.07)',
  borderHi: 'rgba(255,255,255,0.13)',
  accent:   '#7c3aed',
  accentLo: 'rgba(124,58,237,0.12)',
  accentMd: 'rgba(124,58,237,0.25)',
  pink:     '#ec4899',
  green:    '#34d399',
  amber:    '#fbbf24',
  red:      '#f87171',
  text:     '#f1f5f9',
  muted:    '#64748b',
  faint:    '#1e293b',
};

/* ─── Field wrapper ──────────────────────────────────────────────────────── */
const Field = ({ icon: Icon, label, required, hint, children, accent }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <label style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: accent ? C.accent : C.muted,
      }}>
        {Icon && <Icon size={11} />}
        {label}
        {required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
      </label>
      {hint && <span style={{ fontSize: '10px', color: C.muted }}>{hint}</span>}
    </div>
    {children}
  </div>
);

/* ─── Input ──────────────────────────────────────────────────────────────── */
const Input = ({ type = 'text', ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '10px 13px',
        background: focused ? 'rgba(124,58,237,0.06)' : C.elevated,
        border: `1px solid ${focused ? 'rgba(124,58,237,0.5)' : C.border}`,
        borderRadius: '10px',
        color: C.text, fontSize: '13px',
        outline: 'none', fontFamily: 'inherit',
        transition: 'all 0.15s',
        ...(props.style || {}),
      }}
      placeholder={props.placeholder}
    />
  );
};

/* ─── Textarea ───────────────────────────────────────────────────────────── */
const Textarea = ({ rows = 3, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      rows={rows}
      {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '10px 13px', resize: 'vertical',
        background: focused ? 'rgba(124,58,237,0.06)' : C.elevated,
        border: `1px solid ${focused ? 'rgba(124,58,237,0.5)' : C.border}`,
        borderRadius: '10px',
        color: C.text, fontSize: '13px',
        outline: 'none', fontFamily: 'inherit',
        transition: 'all 0.15s',
      }}
    />
  );
};

/* ─── Select ─────────────────────────────────────────────────────────────── */
const Select = ({ children, ...props }) => (
  <div style={{ position: 'relative' }}>
    <select
      {...props}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '10px 36px 10px 13px',
        background: C.elevated,
        border: `1px solid ${C.border}`,
        borderRadius: '10px',
        color: C.text, fontSize: '13px',
        outline: 'none', fontFamily: 'inherit',
        appearance: 'none', cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      {children}
    </select>
    <ChevronDown size={13} style={{
      position: 'absolute', right: 12, top: '50%',
      transform: 'translateY(-50%)', color: C.muted,
      pointerEvents: 'none',
    }} />
  </div>
);

/* ─── Section heading ────────────────────────────────────────────────────── */
const SectionHead = ({ icon: Icon, title, color = C.accent }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 0 10px',
    borderBottom: `1px solid ${C.border}`,
    marginBottom: '14px',
  }}>
    <div style={{
      width: 28, height: 28, borderRadius: 8,
      background: `${color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={13} style={{ color }} />
    </div>
    <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color }}>
      {title}
    </span>
  </div>
);

/* ─── Preview panel ──────────────────────────────────────────────────────── */
const PreviewPanel = ({ formData, videoId }) => {
  const genres = formData.genre || [];
  const statusLabel = formData.status === 'comingSoon' ? 'Тун удахгүй' : 'Үзэж болно';
  const statusColor = formData.status === 'comingSoon' ? C.amber : C.green;

  return (
    <div style={{
      width: '220px', flexShrink: 0,
      display: 'flex', flexDirection: 'column', gap: '16px',
      position: 'sticky', top: 0,
    }}>
      {/* Poster */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: '100%', aspectRatio: '2/3',
          borderRadius: '14px', overflow: 'hidden',
          background: C.elevated,
          border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {formData.posterUrl ? (
            <img
              src={formData.posterUrl}
              alt="poster"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: C.muted }}>
              <ImageIcon size={28} style={{ opacity: 0.3 }} />
              <div style={{ fontSize: '10px', marginTop: 6, opacity: 0.4 }}>Постер байхгүй</div>
            </div>
          )}
          {/* Status badge */}
          <div style={{
            position: 'absolute', top: 8, right: 8,
            padding: '3px 8px', borderRadius: 6,
            background: `${statusColor}22`,
            border: `1px solid ${statusColor}44`,
            fontSize: '9px', fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: statusColor,
          }}>
            {statusLabel}
          </div>
          {/* Shine */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%)',
          }} />
        </div>
      </div>

      {/* Info card */}
      <div style={{
        background: C.elevated, border: `1px solid ${C.border}`,
        borderRadius: '12px', padding: '14px', fontSize: '12px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        <div style={{ fontWeight: 800, fontSize: '13px', color: C.text, lineHeight: 1.3, wordBreak: 'break-word' }}>
          {formData.title || <span style={{ color: C.muted, fontStyle: 'italic', fontWeight: 400 }}>Гарчиг...</span>}
        </div>
        {formData.originalTitle && (
          <div style={{ fontSize: '10px', color: C.muted }}>{formData.originalTitle}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {formData.duration && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted }}>
              <Clock size={10} />
              <span>{formData.duration} </span>
            </div>
          )}
          {formData.imdb && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.amber }}>
              <Star size={10} />
              <span style={{ fontWeight: 700 }}>{formData.imdb} / 10</span>
            </div>
          )}
          {formData.releaseDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted }}>
              <Calendar size={10} />
              <span>{formData.releaseDate}</span>
            </div>
          )}
          {formData.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted }}>
              <ShieldCheck size={10} />
              <span>{formData.rating}</span>
            </div>
          )}
        </div>

        {genres.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {genres.slice(0, 4).map(g => (
              <span key={g} style={{
                padding: '2px 7px', borderRadius: 5,
                background: C.accentLo, border: `1px solid ${C.accentMd}`,
                fontSize: '9px', fontWeight: 700,
                letterSpacing: '0.04em', color: '#a78bfa',
              }}>{g}</span>
            ))}
            {genres.length > 4 && (
              <span style={{ fontSize: '9px', color: C.muted, padding: '2px 4px' }}>+{genres.length - 4}</span>
            )}
          </div>
        )}

        {(formData.cast || []).length > 0 && (
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
              Жүжигчид
            </div>
            {(formData.cast || []).slice(0, 3).map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: `hsl(${(i * 80 + 200) % 360}, 60%, 40%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '8px', fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                  {m.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: C.text, truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || '—'}</div>
                  {m.role && <div style={{ fontSize: '9px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.role}</div>}
                </div>
              </div>
            ))}
            {(formData.cast || []).length > 3 && (
              <div style={{ fontSize: '9px', color: C.muted }}>+{(formData.cast).length - 3} бусад</div>
            )}
          </div>
        )}
      </div>

      {/* Trailer thumbnail */}
      {videoId && (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, aspectRatio: '16/9', position: 'relative' }}>
          <img
            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
            alt="trailer"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PlayCircle size={28} style={{ color: '#fff', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Modal ─────────────────────────────────────────────────────────── */
const MovieModal = ({ editingMovie, formData, onClose, onSubmit, onChange, onGenreToggle, onCastChange }) => {
  const [trailerInput, setTrailerInput] = useState(formData.trailerUrl || '');
  const [videoId,      setVideoId]      = useState(() => getYoutubeId(formData.trailerUrl || ''));
  const [showPreview,  setShowPreview]  = useState(false);

  const handleTrailerChange = (e) => {
    const raw = e.target.value;
    setTrailerInput(raw);
    const id = getYoutubeId(raw);
    setVideoId(id);
    const embedUrl = id ? `https://www.youtube.com/embed/${id}` : raw;
    onChange({ target: { name: 'trailerUrl', value: embedUrl } });
  };

const addCast = () => onCastChange([...(formData.cast || []), { name: '', role: '', _id: crypto.randomUUID() }]);
  const removeCast = (i) => onCastChange((formData.cast || []).filter((_, idx) => idx !== i));
  const updateCast = (i, field, val) =>
    onCastChange((formData.cast || []).map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        animation: 'mm-bg-in 0.2s ease',
      }}
    >
      {/* Ambient */}
      <div style={{ position: 'absolute', pointerEvents: 'none', width: 600, height: 600, borderRadius: '50%', filter: 'blur(120px)', opacity: 0.12, background: 'radial-gradient(circle, #7c3aed, #2563eb)', top: '-10%', left: '5%' }} />
      <div style={{ position: 'absolute', pointerEvents: 'none', width: 400, height: 400, borderRadius: '50%', filter: 'blur(100px)', opacity: 0.1, background: 'radial-gradient(circle, #ec4899, #f97316)', bottom: '-5%', right: '10%' }} />

      {/* Modal panel */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '900px',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        background: C.surface,
        border: `1px solid ${C.borderHi}`,
        borderRadius: '20px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
        overflow: 'hidden',
        animation: 'mm-panel-in 0.22s cubic-bezier(0.16,1,0.3,1)',
        fontFamily: "'Outfit', 'DM Sans', system-ui, sans-serif",
      }}>

        {/* ── Top bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px',
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
            }}>
              <Clapperboard size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: C.text }}>
                {editingMovie ? 'Кино засах' : 'Шинэ кино бүртгэх'}
              </div>
              <div style={{ fontSize: '11px', color: C.muted, marginTop: 1 }}>
                Мэдээллийг дүүргэж баруун талд preview харна уу
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Mobile preview toggle */}
            <button
              onClick={() => setShowPreview(p => !p)}
              style={{
                display: 'none', // shown via media query workaround below
                alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 9,
                background: showPreview ? C.accentLo : C.elevated,
                border: `1px solid ${showPreview ? C.accentMd : C.border}`,
                color: showPreview ? '#a78bfa' : C.muted,
                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              className="mm-preview-toggle"
            >
              <ImageIcon size={12} /> Preview
            </button>

            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: C.elevated, border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.muted, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.color = C.red; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.elevated; e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Body: preview + form ── */}
        <div style={{
          display: 'flex', flex: 1, overflow: 'hidden',
        }}>
          {/* Preview column */}
          <div style={{
            width: '240px', flexShrink: 0,
            borderRight: `1px solid ${C.border}`,
            padding: '20px 16px',
            overflowY: 'auto',
            background: C.bg,
          }} className="mm-preview-col">
            <PreviewPanel formData={formData} videoId={videoId} />
          </div>

          {/* Form column */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* ── Basic info ── */}
              <section>
                <SectionHead icon={Film} title="Үндсэн мэдээлэл" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Field icon={Clapperboard} label="Киноны нэр" required>
                    <Input
                      name="title" value={formData.title} onChange={onChange}
                      placeholder="Жишээ: Dune: Part Two" required
                    />
                  </Field>
                  <Field icon={Globe} label="Эх нэр (Original)">
                    <Input
                      name="originalTitle" value={formData.originalTitle} onChange={onChange}
                      placeholder="Dune: Part Two"
                    />
                  </Field>
                  <Field icon={AlignLeft} label="Товч тайлбар">
                    <Textarea
                      name="description" value={formData.description} onChange={onChange}
                      rows={3} placeholder="Киноны товч агуулга..."
                    />
                  </Field>
                </div>
              </section>

              {/* ── Details ── */}
              <section>
                <SectionHead icon={Tag} title="Дэлгэрэнгүй" color="#38bdf8" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <Field icon={Clock} label="Үргэлжлэх хугацаа" required>
                      <Input
                        name="duration" value={formData.duration} onChange={onChange}
                        placeholder="Үргэлжлэх хугацаа" required
                      />
                    </Field>
                    <Field icon={ShieldCheck} label="Насны ангилал">
                      <Select name="rating" value={formData.rating} onChange={onChange}>
                        <option value="PG">Бүх насныхан</option>
                        <option value="13+">13 хүртэлх</option>
                        <option value="16+">16 хүртэлх</option>
                        <option value="18+">18 хүртэлх</option>
                      </Select>
                    </Field>
                    {/* <Field icon={Star} label="IMDB үнэлгээ">
                      <Input
                        type="number" step="0.1" min="0" max="10"
                        name="imdb" value={formData.imdb} onChange={onChange}
                        placeholder="8.9"
                      />
                    </Field> */}
                    <Field icon={CheckCircle2} label="Статус">
                      <Select name="status" value={formData.status} onChange={onChange}>
                        <option value="nowShowing">Үзэж болно</option>
                        <option value="comingSoon">Тун удахгүй</option>
                      </Select>
                    </Field>
                  </div>
                  <Field icon={Calendar} label="Нээлтийн огноо">
                    <Input
                      type="date" name="releaseDate" value={formData.releaseDate} onChange={onChange}
                      style={{ colorScheme: 'dark' }}
                    />
                  </Field>
                </div>
              </section>

              {/* ── Genre ── */}
              <section>
                <SectionHead icon={Sparkles} title="Төрөл" color="#a78bfa" />
                <Field
                  label=""
                  hint={`${(formData.genre || []).length} сонгосон`}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
                    {GENRE_LIST.map(genre => {
                      const sel = formData.genre?.includes(genre);
                      return (
                        <button
                          key={genre} type="button"
                          onClick={() => onGenreToggle(genre)}
                          style={{
                            padding: '7px 10px', borderRadius: '8px',
                            fontSize: '12px', fontWeight: sel ? 700 : 500,
                            fontFamily: 'inherit', cursor: 'pointer',
                            transition: 'all 0.15s',
                            background: sel ? 'rgba(124,58,237,0.15)' : C.elevated,
                            border: `1px solid ${sel ? 'rgba(124,58,237,0.45)' : C.border}`,
                            color: sel ? '#c4b5fd' : C.muted,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          }}
                        >
                          {sel && <CheckCircle2 size={10} />}
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </section>

              {/* ── Media ── */}
              <section>
                <SectionHead icon={ImageIcon} title="Медиа" color="#34d399" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Field icon={Link2} label="Постер URL">
                    <Input
                      type="url" name="posterUrl" value={formData.posterUrl} onChange={onChange}
                      placeholder="https://image.tmdb.org/..."
                    />
                  </Field>
                  <Field
                    icon={PlayCircle}
                    label="YouTube Трейлер"
                    hint={videoId ? `ID: ${videoId}` : undefined}
                    accent={!!videoId}
                  >
                    <Input
                      type="text"
                      value={trailerInput}
                      onChange={handleTrailerChange}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    {videoId ? (
                      <div style={{
                        marginTop: 8, borderRadius: 10, overflow: 'hidden',
                        border: `1px solid rgba(52,211,153,0.25)`,
                        aspectRatio: '16/9',
                      }}>
                        <iframe
                          key={videoId}
                          width="100%" height="100%"
                          src={`https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0`}
                          title="YouTube trailer" frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ display: 'block' }}
                        />
                      </div>
                    ) : trailerInput.length > 10 ? (
                      <div style={{
                        marginTop: 6, padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(251,191,36,0.07)',
                        border: '1px solid rgba(251,191,36,0.2)',
                        display: 'flex', alignItems: 'center', gap: 7,
                        fontSize: '11px', color: C.amber,
                      }}>
                        <PlayCircle size={11} />
                        YouTube video ID олдсонгүй
                      </div>
                    ) : null}
                  </Field>
                </div>
              </section>

              {/* ── Cast ── */}
              <section>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: `1px solid ${C.border}`,
                  marginBottom: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(251,191,36,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Users size={13} style={{ color: C.amber }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.amber }}>
                      Жүжигчид
                    </span>
                    {(formData.cast || []).length > 0 && (
                      <span style={{
                        padding: '1px 7px', borderRadius: 20,
                        background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
                        fontSize: '10px', fontWeight: 700, color: C.amber,
                      }}>
                        {(formData.cast || []).length}
                      </span>
                    )}
                  </div>
                  <button
                    type="button" onClick={addCast}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', borderRadius: 8,
                      background: C.elevated, border: `1px solid ${C.border}`,
                      color: C.muted, fontSize: '11px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'; e.currentTarget.style.color = C.amber; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                  >
                    <Plus size={12} /> Нэмэх
                  </button>
                </div>

                {(formData.cast || []).length === 0 ? (
                  <div style={{
                    padding: '28px 20px', textAlign: 'center',
                    border: `1px dashed ${C.border}`, borderRadius: 12,
                    color: C.muted, fontSize: '12px',
                  }}>
                    <Users size={20} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
                    "Нэмэх" товч дарж жүжигч нэмнэ үү
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(formData.cast || []).map((member, index) => (
  <div key={member._id || index} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px',
                        background: C.elevated, border: `1px solid ${C.border}`,
                        borderRadius: '10px', transition: 'border-color 0.15s',
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: `hsl(${(index * 80 + 200) % 360}, 55%, 38%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 800, color: '#fff',
                        }}>
                          {member.name?.[0]?.toUpperCase() || <User size={12} />}
                        </div>

                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div style={{ position: 'relative' }}>
                            <User size={11} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                            <input
                              type="text" value={member.name}
                              onChange={e => updateCast(index, 'name', e.target.value)}
                              placeholder="Жүжигчийн нэр"
                              style={{
                                width: '100%', boxSizing: 'border-box',
                                padding: '8px 10px 8px 28px',
                                background: C.surface, border: `1px solid ${C.border}`,
                                borderRadius: '8px', color: C.text, fontSize: '12px',
                                outline: 'none', fontFamily: 'inherit',
                              }}
                            />
                          </div>
                          <div style={{ position: 'relative' }}>
                            <Briefcase size={11} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                            <input
                              type="text" value={member.role}
                              onChange={e => updateCast(index, 'role', e.target.value)}
                              placeholder="Дүрийн нэр"
                              style={{
                                width: '100%', boxSizing: 'border-box',
                                padding: '8px 10px 8px 28px',
                                background: C.surface, border: `1px solid ${C.border}`,
                                borderRadius: '8px', color: C.text, fontSize: '12px',
                                outline: 'none', fontFamily: 'inherit',
                              }}
                            />
                          </div>
                        </div>

                        <button
                          type="button" onClick={() => removeCast(index)}
                          style={{
                            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                            background: 'rgba(248,113,113,0.08)',
                            border: '1px solid rgba(248,113,113,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.red, cursor: 'pointer', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.16)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Footer ── */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: '10px',
                paddingTop: '16px',
                borderTop: `1px solid ${C.border}`,
                position: 'sticky', bottom: 0,
                background: C.surface,
                marginLeft: '-24px', marginRight: '-24px',
                padding: '14px 24px',
              }}>
                <button
                  type="button" onClick={onClose}
                  style={{
                    padding: '10px 20px', borderRadius: '10px',
                    background: C.elevated, border: `1px solid ${C.border}`,
                    color: C.muted, fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.muted; }}
                >
                  Болих
                </button>
                <button
                  type="submit"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '10px 22px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: '13px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(124,58,237,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.4)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {editingMovie ? <><CheckCircle2 size={14} /> Хадгалах</> : <><Clapperboard size={14} /> Үүсгэх</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        @keyframes mm-bg-in    { from { opacity:0 } to { opacity:1 } }
        @keyframes mm-panel-in { from { opacity:0; transform:scale(0.97) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }

        /* Placeholder color */
        .mm-preview-col::-webkit-scrollbar { width: 4px; }
        .mm-preview-col::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 4px; }

        input::placeholder, textarea::placeholder { color: rgba(100,116,139,0.7) !important; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4); }

        @media (max-width: 700px) {
          .mm-preview-col { display: none; }
          .mm-preview-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default MovieModal;