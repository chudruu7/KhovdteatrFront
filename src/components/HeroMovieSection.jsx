import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   STYLES
   Theme selector: [data-theme="light"]  ←  таны app-д тохируулна уу
   ───────────────────────────────────────────────────────────────────────── */
const HeroStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Outfit:wght@300;400;500;600;700&display=swap');

    /* ══════════════════════════════════════════════════════════
       ROOT
    ══════════════════════════════════════════════════════════ */
    .hero-root {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      overflow: hidden;
      background: #080808;
    }

    /* ══════════════════════════════════════════════════════════
       DARK MODE — full-bleed poster + parallax
    ══════════════════════════════════════════════════════════ */
    .hero-bg {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }
    .hero-bg__img {
      width: 100%; height: 110%;
      object-fit: cover;
      object-position: center top;
      opacity: 0.3;
      will-change: transform;
    }
    /* 4-layer gradient — cinematic vignette */
    .hero-bg::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(to right,  #080808 0%,  rgba(8,8,8,0.92) 40%, rgba(8,8,8,0.2) 75%, transparent 100%),
        linear-gradient(to top,    #080808 0%,  rgba(8,8,8,0.7)  25%, transparent 60%),
        linear-gradient(to bottom, #080808 0%,  transparent 15%),
        radial-gradient(ellipse 80% 60% at 70% 50%, rgba(180,20,20,0.07) 0%, transparent 100%);
    }

    /* Film-grain texture */
    .hero-grain {
      position: absolute; inset: 0; z-index: 2; pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='0.08'/%3E%3C/svg%3E");
      background-size: 180px 180px;
      mix-blend-mode: overlay;
    }

    /* Red light leak — cinematic glow */
    .hero-light-leak {
      position: absolute;
      top: -20%; right: 15%;
      width: 40vw; height: 80vh;
      background: radial-gradient(ellipse, rgba(200,30,30,0.12) 0%, transparent 70%);
      pointer-events: none; z-index: 1;
    }

    /* Vertical film-strip marks — left edge */
    .hero-filmstrip {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 28px; z-index: 3;
      display: flex; flex-direction: column;
      justify-content: space-around;
      padding: 2rem 0; pointer-events: none;
    }
    .hero-filmstrip__hole {
      width: 16px; height: 12px;
      background: transparent;
      border: 1.5px solid rgba(255,255,255,0.08);
      border-radius: 2px;
      margin: 0 auto;
    }

    /* ── Content layout ── */
    .hero-content {
      position: relative; z-index: 10;
      width: 100%; max-width: 1320px;
      margin: 0 auto;
      padding: 0 3.5rem 0 4.5rem;
      display: grid;
      grid-template-columns: 1fr;
    }
    .hero-text-col {
      max-width: 600px;
      padding: 7rem 0 6rem;
    }

    /* ── Eyebrow ── */
    .hero-eyebrow {
      font-family: 'Outfit', sans-serif;
      font-size: 0.65rem; font-weight: 600;
      letter-spacing: 0.3em; text-transform: uppercase;
      color: #e53935;
      margin-bottom: 1.5rem;
      display: flex; align-items: center; gap: 0.75rem;
    }
    .hero-eyebrow__line {
      display: block; width: 28px; height: 1.5px;
      background: #e53935; flex-shrink: 0;
    }

    /* ── Title ── */
    .hero-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(3.8rem, 7.5vw, 7rem);
      font-weight: 700; line-height: 0.95;
      color: #f5f0ea;
      margin-bottom: 2rem;
      letter-spacing: -0.02em;
    }
    .hero-title em {
      font-style: italic;
      color: #ffffff;
    }

    /* ── Meta chips ── */
    .hero-meta {
      display: flex; flex-wrap: wrap;
      align-items: center; gap: 0.4rem 0.75rem;
      margin-bottom: 1.75rem;
    }
    .hero-chip {
      font-family: 'Outfit', sans-serif;
      font-size: 0.68rem; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      padding: 0.35rem 0.9rem; border-radius: 2px;
    }
    .hero-chip--rating { background: #e53935; color: #fff; }
    .hero-chip--outline {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.14);
      color: rgba(255,255,255,0.55);
    }
    .hero-meta-sep { color: rgba(255,255,255,0.18); font-size: 0.45rem; }

    /* ── Description ── */
    .hero-desc {
      font-family: 'Outfit', sans-serif;
      font-size: 0.975rem; font-weight: 300; line-height: 1.85;
      color: rgba(245,240,234,0.5);
      margin-bottom: 2.75rem; max-width: 480px;
    }

    /* ── Buttons ── */
    .hero-btns { display: flex; gap: 0.875rem; flex-wrap: wrap; }

    .hero-btn-primary {
      font-family: 'Outfit', sans-serif;
      font-size: 0.78rem; font-weight: 700;
      letter-spacing: 0.12em; text-transform: uppercase;
      padding: 1.05rem 2.75rem;
      background: #e53935; color: #fff;
      border: none; border-radius: 2px; cursor: pointer;
      transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
      box-shadow: 0 4px 24px rgba(229,57,53,0.3);
      position: relative; overflow: hidden;
    }
    /* Shimmer sweep */
    .hero-btn-primary::after {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
      transform: translateX(-100%);
      transition: transform 0.5s ease;
    }
    .hero-btn-primary:hover::after { transform: translateX(100%); }
    .hero-btn-primary:hover { background: #c62828; box-shadow: 0 8px 40px rgba(229,57,53,0.45); }
    .hero-btn-primary:disabled {
      background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.25);
      cursor: not-allowed; box-shadow: none;
    }
    .hero-btn-primary:disabled::after { display: none; }

    .hero-btn-ghost {
      font-family: 'Outfit', sans-serif;
      font-size: 0.78rem; font-weight: 500;
      letter-spacing: 0.1em; text-transform: uppercase;
      padding: 1.05rem 2rem;
      background: transparent; color: rgba(245,240,234,0.6);
      border: 1px solid rgba(255,255,255,0.12); border-radius: 2px;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s, background 0.2s;
      display: flex; align-items: center; gap: 0.55rem;
    }
    .hero-btn-ghost:hover {
      border-color: rgba(255,255,255,0.35); color: #f5f0ea;
      background: rgba(255,255,255,0.04);
    }
    .hero-btn-ghost .play-icon {
      width: 26px; height: 26px;
      border: 1px solid rgba(255,255,255,0.2); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: border-color 0.2s, background 0.2s;
    }
    .hero-btn-ghost:hover .play-icon {
      border-color: rgba(255,255,255,0.5);
      background: rgba(255,255,255,0.07);
    }

    /* ── Scroll indicator ── */
    .hero-scroll {
      position: absolute; bottom: 2.25rem; left: 4.5rem;
      display: flex; align-items: center; gap: 1rem; z-index: 10;
    }
    .hero-scroll__label {
      font-family: 'Outfit', sans-serif;
      font-size: 0.58rem; letter-spacing: 0.25em; text-transform: uppercase;
      color: rgba(255,255,255,0.25); writing-mode: vertical-rl;
    }
    .hero-scroll__track {
      width: 1px; height: 56px;
      background: rgba(255,255,255,0.1);
      position: relative; overflow: hidden;
    }
    .hero-scroll__thumb {
      position: absolute; top: 0; left: 0;
      width: 100%; height: 40%;
      background: rgba(229,57,53,0.6);
      animation: scrollThumb 2s ease-in-out infinite;
    }
    @keyframes scrollThumb {
      0%   { transform: translateY(-100%); opacity: 1; }
      60%  { transform: translateY(250%);  opacity: 1; }
      61%  { opacity: 0; }
      100% { transform: translateY(250%);  opacity: 0; }
    }

    /* ══════════════════════════════════════════════════════════
       LIGHT MODE  —  [data-theme="light"]
    ══════════════════════════════════════════════════════════ */
    [data-theme="light"] .hero-root   { background: #EEEBE4; }
    [data-theme="light"] .hero-bg,
    [data-theme="light"] .hero-grain,
    [data-theme="light"] .hero-light-leak,
    [data-theme="light"] .hero-filmstrip { display: none; }

    /* Warm right panel background */
    [data-theme="light"] .hero-root::before {
      content: '';
      position: absolute; top: 0; right: 0;
      width: 52%; height: 100%;
      background: #E5E0D6;
      clip-path: polygon(9% 0, 100% 0, 100% 100%, 0 100%);
      pointer-events: none;
    }
    /* Dot grid on right panel */
    [data-theme="light"] .hero-root::after {
      content: '';
      position: absolute; top: 0; right: 0;
      width: 52%; height: 100%;
      background-image: radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px);
      background-size: 22px 22px;
      clip-path: polygon(9% 0, 100% 0, 100% 100%, 0 100%);
      pointer-events: none; opacity: 0.45;
    }

    /* 2-column grid */
    [data-theme="light"] .hero-content {
      grid-template-columns: 1fr auto;
      align-items: center; gap: 5rem;
      padding: 0 4rem 0 5rem;
    }
    [data-theme="light"] .hero-text-col {
      max-width: 520px;
      padding: 8rem 0 6rem;
    }

    [data-theme="light"] .hero-eyebrow      { color: #b71c1c; }
    [data-theme="light"] .hero-eyebrow__line { background: #b71c1c; }

    [data-theme="light"] .hero-title {
      color: #1C1410;
      font-size: clamp(3rem, 4.5vw, 4.8rem);
    }
    [data-theme="light"] .hero-title em { color: #b71c1c; }

    [data-theme="light"] .hero-chip--rating  { background: #1C1410; color: #EEEBE4; }
    [data-theme="light"] .hero-chip--outline {
      border-color: rgba(28,20,16,0.18); color: rgba(28,20,16,0.55);
    }
    [data-theme="light"] .hero-meta-sep { color: rgba(28,20,16,0.2); }
    [data-theme="light"] .hero-desc { color: rgba(28,20,16,0.55); }

    [data-theme="light"] .hero-btn-primary {
      background: #1C1410;
      box-shadow: 0 4px 20px rgba(28,20,16,0.2);
    }
    [data-theme="light"] .hero-btn-primary:hover {
      background: #b71c1c;
      box-shadow: 0 8px 32px rgba(183,28,28,0.3);
    }
    [data-theme="light"] .hero-btn-primary:disabled {
      background: rgba(28,20,16,0.08); color: rgba(28,20,16,0.3);
    }
    [data-theme="light"] .hero-btn-ghost {
      border-color: rgba(28,20,16,0.16); color: rgba(28,20,16,0.6);
    }
    [data-theme="light"] .hero-btn-ghost:hover {
      border-color: rgba(28,20,16,0.45); color: #1C1410;
      background: rgba(28,20,16,0.04);
    }
    [data-theme="light"] .hero-btn-ghost .play-icon { border-color: rgba(28,20,16,0.2); }
    [data-theme="light"] .hero-btn-ghost:hover .play-icon {
      border-color: rgba(28,20,16,0.5); background: rgba(28,20,16,0.05);
    }
    [data-theme="light"] .hero-scroll       { left: 5rem; }
    [data-theme="light"] .hero-scroll__label { color: rgba(28,20,16,0.3); }
    [data-theme="light"] .hero-scroll__track { background: rgba(28,20,16,0.1); }
    [data-theme="light"] .hero-scroll__thumb { background: rgba(183,28,28,0.5); }

    /* ── A4 Poster column ── */
    .hero-poster-col { display: none; }

    [data-theme="light"] .hero-poster-col {
      display: block;
      position: relative; z-index: 10;
      flex-shrink: 0; padding: 5rem 0;
    }

    .hero-poster-wrap {
      position: relative;
      width: clamp(240px, 22vw, 310px);
    }
    /* Offset card #1 — warm red tint */
    .hero-poster-wrap::before {
      content: '';
      position: absolute; inset: 0;
      background: rgba(183,28,28,0.18); border-radius: 3px;
      transform: rotate(2.5deg) translate(10px, 14px);
    }
    /* Offset card #2 — neutral shadow */
    .hero-poster-wrap::after {
      content: '';
      position: absolute; inset: 0;
      background: rgba(28,20,16,0.08); border-radius: 3px;
      transform: rotate(-1.2deg) translate(-7px, 9px);
    }

    .hero-poster-img {
      position: relative; z-index: 2;
      width: 100%; aspect-ratio: 2 / 3;
      object-fit: cover; border-radius: 3px; display: block;
      box-shadow:
        0 2px 4px  rgba(28,20,16,0.06),
        0 8px 24px rgba(28,20,16,0.14),
        0 32px 64px rgba(28,20,16,0.18);
    }

    /* Genre tag — top left, slightly overhangs */
    .hero-poster-genre {
      position: absolute; top: 1.5rem; left: -1.5rem; z-index: 5;
      background: #EEEBE4;
      border: 1px solid rgba(28,20,16,0.1);
      box-shadow: 0 6px 20px rgba(28,20,16,0.15);
      padding: 0.55rem 0.9rem; border-radius: 2px;
      display: flex; flex-direction: column; gap: 0.1rem;
      max-width: 130px;
    }
    .hero-poster-genre__label {
      font-family: 'Outfit', sans-serif;
      font-size: 0.52rem; letter-spacing: 0.2em; text-transform: uppercase;
      color: rgba(28,20,16,0.4);
    }
    .hero-poster-genre__val {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1rem; font-weight: 700;
      color: #b71c1c; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }

    /* Rating badge — bottom right, slightly overhangs */
    .hero-poster-rating {
      position: absolute; bottom: 3.75rem; right: -1.5rem; z-index: 5;
      background: #1C1410; color: #EEEBE4;
      padding: 0.8rem 1rem; border-radius: 2px;
      display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
      box-shadow: 0 10px 28px rgba(28,20,16,0.28);
    }
    .hero-poster-rating__stars { font-size: 0.48rem; letter-spacing: 0.15em; color: #f5c518; }
    .hero-poster-rating__val {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.6rem; font-weight: 700; line-height: 1; color: #EEEBE4;
    }
    .hero-poster-rating__src {
      font-family: 'Outfit', sans-serif;
      font-size: 0.48rem; letter-spacing: 0.18em; text-transform: uppercase;
      color: rgba(238,235,228,0.4);
    }

    /* Strip below poster */
    .hero-poster-strip {
      position: relative; z-index: 3;
      margin-top: 1rem;
      display: flex; align-items: center; gap: 0.75rem;
    }
    .hero-poster-strip__text {
      font-family: 'Outfit', sans-serif;
      font-size: 0.55rem; letter-spacing: 0.2em; text-transform: uppercase;
      color: rgba(28,20,16,0.35); white-space: nowrap;
    }
    .hero-poster-strip__line {
      flex: 1; height: 1px; background: rgba(28,20,16,0.12);
    }

    /* ══════════════════════════════════════════════════════════
       RESPONSIVE — both themes
    ══════════════════════════════════════════════════════════ */
    @media (max-width: 1100px) {
      [data-theme="light"] .hero-content {
        grid-template-columns: 1fr;
        gap: 0; padding: 0 2.5rem;
      }
      [data-theme="light"] .hero-text-col  { max-width: 100%; padding: 6rem 0 2rem; }
      [data-theme="light"] .hero-poster-col { padding: 0 0 4rem; }
      [data-theme="light"] .hero-poster-wrap { width: min(260px, 55vw); margin: 0 auto; }
      .hero-poster-genre,
      .hero-poster-rating     { display: none; }
      [data-theme="light"] .hero-root::before,
      [data-theme="light"] .hero-root::after { display: none; }
    }

    @media (max-width: 768px) {
      .hero-content  { padding: 0 1.5rem 0 2.5rem; }
      .hero-text-col { padding: 5.5rem 0 5rem; }
      .hero-scroll   { left: 2.5rem; }
      [data-theme="light"] .hero-content { padding: 0 1.5rem; }
      [data-theme="light"] .hero-scroll  { left: 1.5rem; }
      .hero-btns { flex-direction: column; }
      .hero-btn-primary, .hero-btn-ghost { justify-content: center; width: 100%; }
    }
  `}</style>
);

/* ─── Animation variants ─────────────────────────────────────────────────── */
const containerAnim = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } }
};
const fadeUp = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};
const fadeRight = {
  hidden:  { opacity: 0, x: 36, rotate: 1.5 },
  visible: { opacity: 1, x: 0, rotate: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } }
};

/* ─── Component ──────────────────────────────────────────────────────────── */
const HeroMovieSection = ({ movie, onWatchTrailer, onBookTicket, isLoggedIn }) => {
  const navigate    = useNavigate();
  const sectionRef  = useRef(null);
  const isComingSoon = movie.status === 'comingSoon';

  // Subtle parallax — dark mode only
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);

  const handleBookTicket = () => {
    if (isComingSoon) return;
    if (!isLoggedIn) {
      alert('Тасалбар захиалахын тулд эхлээд нэвтрэнэ үү!');
      navigate('/login');
      return;
    }
    onBookTicket();
  };

  const genreLabel      = Array.isArray(movie.genre) ? movie.genre[0] : movie.genre;
  const allGenres       = Array.isArray(movie.genre) ? movie.genre.join(' · ') : movie.genre;
  const releaseYear     = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '';
  const releaseFormatted = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  // Last word in italic — editorial flair
  const words    = (movie.title || '').split(' ');
  const lastWord = words.pop();
  const restTitle = words.join(' ');

  return (
    <>
      <HeroStyles />

      <section className="hero-root" ref={sectionRef}>

        {/* ── DARK: parallax poster bg ── */}
        <div className="hero-bg">
          <motion.img
            className="hero-bg__img"
            src={movie.posterUrl}
            alt=""
            style={{ y: imgY }}
            initial={{ scale: 1.06, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        </div>

        <div className="hero-grain" />
        <div className="hero-light-leak" />

        {/* Film-strip holes */}
        <div className="hero-filmstrip" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="hero-filmstrip__hole" />
          ))}
        </div>

        {/* ── Main content grid ── */}
        <motion.div
          className="hero-content"
          variants={containerAnim}
          initial="hidden"
          animate="visible"
        >
          {/* TEXT COLUMN */}
          <div className="hero-text-col">

            <motion.p variants={fadeUp} className="hero-eyebrow">
              <span className="hero-eyebrow__line" />
              {isComingSoon ? 'Удахгүй нээлтээ хийх' : 'Яг одоо дэлгэцнээ'}
            </motion.p>

            <motion.h1 variants={fadeUp} className="hero-title">
              {restTitle && <>{restTitle} </>}
              <em>{lastWord}</em>
            </motion.h1>

            <motion.div variants={fadeUp} className="hero-meta">
              {movie.rating && (
                <span className="hero-chip hero-chip--rating">{movie.rating} ★</span>
              )}
              {movie.duration && (
                <span className="hero-chip hero-chip--outline">{movie.duration}</span>
              )}
              {allGenres && (
                <>
                  <span className="hero-meta-sep">●</span>
                  <span className="hero-chip hero-chip--outline">{allGenres}</span>
                </>
              )}
              {releaseFormatted && (
                <>
                  <span className="hero-meta-sep">●</span>
                  <span className="hero-chip hero-chip--outline">{releaseFormatted}</span>
                </>
              )}
            </motion.div>

            <motion.p variants={fadeUp} className="hero-desc">
              {movie.description}
            </motion.p>

            <motion.div variants={fadeUp} className="hero-btns">
              <motion.button
                className="hero-btn-primary"
                onClick={handleBookTicket}
                disabled={isComingSoon}
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.975 }}
              >
                {isComingSoon ? 'Удахгүй нээлттэй' : 'Тасалбар захиалах'}
              </motion.button>

              <motion.button
                className="hero-btn-ghost"
                onClick={onWatchTrailer}
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.975 }}
              >
                <span className="play-icon" aria-hidden="true">
                  <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor">
                    <path d="M0 0l9 5-9 5V0z"/>
                  </svg>
                </span>
                Трейлер үзэх
              </motion.button>
            </motion.div>
          </div>

          {/* POSTER COLUMN — light mode only */}
          <motion.div className="hero-poster-col" variants={fadeRight}>
            <div className="hero-poster-wrap">

              <div className="hero-poster-genre">
                <span className="hero-poster-genre__label">Төрөл</span>
                <span className="hero-poster-genre__val">{genreLabel}</span>
              </div>

              <img
                className="hero-poster-img"
                src={movie.posterUrl}
                alt={movie.title}
              />

              {movie.rating && (
                <div className="hero-poster-rating">
                  <span className="hero-poster-rating__stars">★★★★★</span>
                  <span className="hero-poster-rating__val">{movie.rating}</span>
                  <span className="hero-poster-rating__src">IMDB</span>
                </div>
              )}
            </div>

            <div className="hero-poster-strip">
              <span className="hero-poster-strip__text">Кино постер</span>
              <div  className="hero-poster-strip__line" />
              <span className="hero-poster-strip__text">{releaseYear}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <div className="hero-scroll" aria-hidden="true">
          <motion.span
            className="hero-scroll__label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            Доош гүйлгэ
          </motion.span>
          <motion.div
            className="hero-scroll__track"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <div className="hero-scroll__thumb" />
          </motion.div>
        </div>

      </section>
    </>
  );
};

export default HeroMovieSection;