import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { newsAPI } from '../api/adminAPI';

// ─────────────────────────────────────────────────────────────────────────────
// Fallback: mock data (API амжилтгүй болвол ашиглана)
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_NEWS_DB = {
    'new-projection-4k': {
        _id: 'new-projection-4k',
        title: "Шинэ 4K Laser Проекц Суурилууллаа",
        summary: "Манай кино театр үзэгчдэдээ хамгийн өндөр нягтралтай дүрсийг мэдрүүлэх зорилгоор 4K Laser проекц системийг шинэчиллээ.",
        date: "2023.11.20",
        author: "Б. Болд (Техникийн алба)",
        category: "Технологи",
        readTime: "3 мин",
        image: "https://images.unsplash.com/photo-1574356778153-f7243c3d5512?q=80&w=2070&auto=format&fit=crop",
        content: [
            { type: 'text', value: "Ховд аймгийн Хөгжимт Кино Театр нь баруун бүсдээ анхдагч болох зорилгоор Barco брэндийн 4K Laser проекторыг амжилттай суурилууллаа." },
            { type: 'quote', value: "Энэхүү технологи нь уламжлалт проектороос 3 дахин илүү тод, гүн өнгөний ялгаралтай дүрслэлийг үзүүлдэг." },
            { type: 'text', value: "Шинэ проекторын давуу тал нь зөвхөн дүрсийн чанараар хязгаарлагдахгүй — эрчим хүч хэмнэлттэй, 3D киног нүд ядраахгүйгээр үзэх боломжтой." },
        ],
        related: ['new-snack-menu'],
    },
    'new-snack-menu': {
        _id: 'new-snack-menu',
        title: "Snack Bar-ын Цэсэнд Шинэ Амттангууд",
        summary: "Попкорн, начос, эрүүл хоолны шинэ сонголтууд нэмэгдлээ.",
        date: "2023.11.15",
        author: "Амттаны баг",
        category: "Үйлчилгээ",
        readTime: "2 мин",
        image: "https://images.unsplash.com/photo-1626866164221-a3f7f45c9284?q=80&w=2070&auto=format&fit=crop",
        content: [
            { type: 'text', value: "Бид үзэгчдийнхээ санал хүсэлтийн дагуу Snack Bar-ын цэсээ шинэчиллээ." },
        ],
        related: ['new-projection-4k'],
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const str = (val) => {
    if (!val) return '';
    if (typeof val === 'object') return val.name ?? val.title ?? val.email ?? '';
    return String(val);
};

const formatDate = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    const hh   = String(d.getHours()).padStart(2, '0');
    const min  = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

const normalizeContent = (news) => {
    const blocks = [];
    if (Array.isArray(news.content)) {
        blocks.push(...news.content);
    } else if (typeof news.content === 'string' && news.content.trim()) {
        try {
            const parsed = JSON.parse(news.content);
            if (Array.isArray(parsed)) {
                blocks.push(...parsed);
            } else {
                blocks.push({ type: 'text', value: news.content });
            }
        } catch {
            blocks.push({ type: 'text', value: news.content });
        }
    } else {
        const fallback = news.excerpt || news.summary || '';
        if (fallback) blocks.push({ type: 'text', value: fallback });
    }
    return blocks;
};

// ─────────────────────────────────────────────────────────────────────────────
// Content block renderer
// ─────────────────────────────────────────────────────────────────────────────
const renderContentBlocks = (blocks) => {
    const result = [];
    let i = 0;

    while (i < blocks.length) {
        const block = blocks[i];

        if (block.type === 'image') {
            const imageGroup = [];
            while (i < blocks.length && blocks[i].type === 'image') {
                imageGroup.push(blocks[i]);
                i++;
            }
            result.push(
                <ImageGrid key={`img-group-${i}`} images={imageGroup} />
            );
            continue;
        }

        if (block.type === 'text') {
            result.push(
                <p key={i} className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                    {block.value}
                </p>
            );
        }

        if (block.type === 'quote') {
            result.push(
                <blockquote key={i} className="border-l-4 border-red-600 pl-5 py-3 pr-4
                    italic text-lg text-gray-800 dark:text-slate-100 font-medium
                    bg-red-50 dark:bg-red-900/10 rounded-r-xl">
                    "{block.value}"
                </blockquote>
            );
        }

        if (block.type === 'callout') {
            result.push(
                <div key={i} className="bg-black/5 dark:bg-white/5
                    border border-black/10 dark:border-white/10
                    rounded-xl p-4 text-gray-700 dark:text-slate-200
                    text-sm leading-relaxed">
                    {block.value}
                </div>
            );
        }

        i++;
    }

    return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox — zoom дэмжсэн
// ─────────────────────────────────────────────────────────────────────────────
const ZOOM_STEPS = [1, 1.5, 2, 3, 4];

const Lightbox = ({ images, startIndex, onClose }) => {
    const [current, setCurrent]   = useState(startIndex);
    const [zoomIdx, setZoomIdx]   = useState(0);
    const [pan, setPan]           = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const dragStart  = React.useRef(null);
    const overlayRef = React.useRef(null);

    const zoom = ZOOM_STEPS[zoomIdx];
    const resetZoom = () => { setZoomIdx(0); setPan({ x: 0, y: 0 }); };

    const prev = () => { resetZoom(); setCurrent((i) => (i - 1 + images.length) % images.length); };
    const next = () => { resetZoom(); setCurrent((i) => (i + 1) % images.length); };

    const zoomIn  = () => setZoomIdx((i) => Math.min(i + 1, ZOOM_STEPS.length - 1));
    const zoomOut = () => {
        setZoomIdx((i) => {
            const n = Math.max(i - 1, 0);
            if (n === 0) setPan({ x: 0, y: 0 });
            return n;
        });
    };

    React.useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape')             onClose();
            if (e.key === 'ArrowLeft')          prev();
            if (e.key === 'ArrowRight')         next();
            if (e.key === '+' || e.key === '=') zoomIn();
            if (e.key === '-')                  zoomOut();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [images.length, zoomIdx]);

    React.useEffect(() => {
        const el = overlayRef.current;
        if (!el) return;
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.deltaY < 0) zoomIn();
            else              zoomOut();
        };
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, [zoomIdx]);

    const handleMouseDown = (e) => {
        if (zoom <= 1) return;
        e.preventDefault();
        setDragging(true);
        dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    };
    const handleMouseMove = (e) => {
        if (!dragging || !dragStart.current) return;
        setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    };
    const handleMouseUp = () => setDragging(false);

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        if (zoomIdx > 0) resetZoom();
        else             zoomIn();
    };

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center select-none"
            style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 z-20"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
                <div className="flex items-center gap-2">
                    <button type="button"
                        onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                        disabled={zoomIdx === 0}
                        className="p-1.5 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 transition-colors text-lg font-bold w-8 h-8 flex items-center justify-center">
                        −
                    </button>
                    <span className="text-white text-sm font-medium w-14 text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button type="button"
                        onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                        disabled={zoomIdx === ZOOM_STEPS.length - 1}
                        className="p-1.5 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 transition-colors text-lg font-bold w-8 h-8 flex items-center justify-center">
                        +
                    </button>
                    {zoomIdx > 0 && (
                        <button type="button"
                            onClick={(e) => { e.stopPropagation(); resetZoom(); }}
                            className="px-2 py-1 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-colors">
                            Буцаах
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {images.length > 1 && (
                        <span className="text-gray-400 text-sm">{current + 1} / {images.length}</span>
                    )}
                    <button type="button" onClick={onClose}
                        className="p-2 rounded-full text-white hover:bg-white/10 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Prev */}
            {images.length > 1 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full text-white hover:bg-white/10 transition-colors z-20">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {/* Image */}
            <div
                className="flex items-center justify-center w-full h-full overflow-hidden px-16"
                style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
            >
                <img
                    src={images[current].value}
                    alt={images[current].caption || `Зураг ${current + 1}`}
                    draggable={false}
                    style={{
                        maxHeight: '85vh',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: 12,
                        transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                        transition: dragging ? 'none' : 'transform 0.2s ease',
                        userSelect: 'none',
                        transformOrigin: 'center center',
                    }}
                />
            </div>

            {/* Next */}
            {images.length > 1 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); next(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full text-white hover:bg-white/10 transition-colors z-20">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            {/* Caption */}
            {images[current].caption && (
                <div className="absolute bottom-0 left-0 right-0 text-center pb-5 px-6 z-20"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                    <p className="text-gray-300 text-sm">{images[current].caption}</p>
                </div>
            )}

            {/* Hint */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-600 z-20 pointer-events-none whitespace-nowrap">
                Scroll / +− — zoom · Давхар дарах — zoom · Esc — хаах
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ImageGrid
// ─────────────────────────────────────────────────────────────────────────────
const ImageGrid = ({ images }) => {
    const [lightbox, setLightbox] = useState(null);
    const count = images.length;

    const open  = (i) => { setLightbox(i); document.body.style.overflow = 'hidden'; };
    const close = ()  => { setLightbox(null); document.body.style.overflow = ''; };

    const imgClass = "w-full rounded-xl shadow-xl object-cover cursor-zoom-in hover:brightness-90 transition-all duration-200";

    const renderImg = (img, i, extraClass = '') => (
        <figure key={i} className="relative">
            <img
                src={img.value}
                alt={img.caption || `Зураг ${i + 1}`}
                className={`${imgClass} ${extraClass}`}
                onClick={() => open(i)}
            />
            {img.caption && (
                <figcaption className="text-center text-xs text-gray-400 dark:text-gray-500 mt-1.5 italic">
                    {img.caption}
                </figcaption>
            )}
        </figure>
    );

    return (
        <>
            {count === 1 && (
                <figure>
                    <img
                        src={images[0].value}
                        alt={images[0].caption || 'Зураг'}
                        className={imgClass}
                        onClick={() => open(0)}
                    />
                    {images[0].caption && (
                        <figcaption className="text-center text-sm text-gray-400 dark:text-gray-500 mt-2 italic">
                            {images[0].caption}
                        </figcaption>
                    )}
                </figure>
            )}

            {count === 2 && (
                <div className="grid grid-cols-2 gap-3">
                    {images.map((img, i) => renderImg(img, i))}
                </div>
            )}

            {count === 3 && (
                <div className="grid grid-cols-2 gap-3">
                    <figure className="row-span-2 relative">
                        <img
                            src={images[0].value}
                            alt={images[0].caption || 'Зураг 1'}
                            className={`${imgClass} w-full h-full min-h-[240px]`}
                            onClick={() => open(0)}
                        />
                        {images[0].caption && (
                            <figcaption className="text-center text-xs text-gray-400 dark:text-gray-500 mt-1.5 italic">
                                {images[0].caption}
                            </figcaption>
                        )}
                    </figure>
                    {images.slice(1).map((img, i) => renderImg(img, i + 1))}
                </div>
            )}

            {count >= 4 && (
                <div className="grid grid-cols-2 gap-3">
                    {images.slice(0, 4).map((img, i) => {
                        const extra = count - 4;
                        return (
                            <figure key={i} className="relative">
                                <img
                                    src={img.value}
                                    alt={img.caption || `Зураг ${i + 1}`}
                                    className={imgClass}
                                    onClick={() => open(i)}
                                />
                                {i === 3 && extra > 0 && (
                                    <div
                                        className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center cursor-pointer"
                                        onClick={() => open(3)}
                                    >
                                        <span className="text-white text-2xl font-black">+{extra}</span>
                                    </div>
                                )}
                                {img.caption && i !== 3 && (
                                    <figcaption className="text-center text-xs text-gray-400 dark:text-gray-500 mt-1 italic">
                                        {img.caption}
                                    </figcaption>
                                )}
                            </figure>
                        );
                    })}
                </div>
            )}

            {lightbox !== null && (
                <Lightbox images={images} startIndex={lightbox} onClose={close} />
            )}
        </>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// CommentSection
// ─────────────────────────────────────────────────────────────────────────────
const REACTIONS = [
    { emoji: '😂', label: 'Хөгжилтэй' },
    { emoji: '❤️', label: 'Таалагдав' },
    { emoji: '😍', label: 'Дуртай' },
    { emoji: '😮', label: 'Гайхсан' },
    { emoji: '😢', label: 'Гунигтай' },
    { emoji: '💩', label: 'Хог' },
    { emoji: '😡', label: 'Ууртай' },
];

const REACTION_KEY = (newsId) => `reactions_${newsId}`;

const CommentSection = ({ newsId }) => {
    const [counts, setCounts]   = useState({});
    const [chosen, setChosen]   = useState(null);
    const [thanked, setThanked] = useState(false);
    const [hovered, setHovered] = useState(null);

    React.useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(REACTION_KEY(newsId)) || '{}');
            setCounts(saved.counts || {});
            setChosen(saved.chosen || null);
        } catch {}
    }, [newsId]);

    const handleReact = (emoji) => {
        if (chosen === emoji) return;
        setCounts((prev) => {
            const next = { ...prev };
            if (chosen && next[chosen] > 0) next[chosen] -= 1;
            next[emoji] = (next[emoji] || 0) + 1;
            try {
                localStorage.setItem(REACTION_KEY(newsId), JSON.stringify({ counts: next, chosen: emoji }));
            } catch {}
            return next;
        });
        setChosen(emoji);
        setThanked(true);
        setTimeout(() => setThanked(false), 2000);
    };

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return (
        <div className="mt-12 pt-8 border-t border-black/10 dark:border-white/10">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-5 text-center uppercase"
                style={{ letterSpacing: '0.15em' }}>
                Энэ мэдээнд өгөх таны сэтгэгдэл?
            </h3>

            {total > 0 && (
                <p className="text-center text-gray-400 dark:text-gray-500 text-sm mb-3">{total}</p>
            )}

            <div className="flex items-end justify-center gap-6 mb-4">
                {REACTIONS.map(({ emoji, label }) => {
                    const isChosen  = chosen === emoji;
                    const isHovered = hovered === emoji;
                    const count     = counts[emoji] || 0;
                    return (
                        <div key={emoji} className="flex flex-col items-center gap-1">
                            <button
                                type="button"
                                onClick={() => handleReact(emoji)}
                                onMouseEnter={() => setHovered(emoji)}
                                onMouseLeave={() => setHovered(null)}
                                title={label}
                                style={{
                                    fontSize: isHovered || isChosen ? 48 : 36,
                                    lineHeight: 1,
                                    transition: 'font-size 0.15s ease, transform 0.15s ease',
                                    transform: isHovered
                                        ? 'translateY(-8px) scale(1.15)'
                                        : isChosen
                                        ? 'translateY(-4px) scale(1.05)'
                                        : 'translateY(0) scale(1)',
                                    filter: isChosen ? 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' : 'none',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'block',
                                    minWidth: 52,
                                    textAlign: 'center',
                                }}
                            >
                                {emoji}
                            </button>
                            {count > 0 && (
                                <span className="text-xs font-semibold"
                                    style={{ color: isChosen ? '#f87171' : '#6b7280' }}>
                                    {count}
                                </span>
                            )}
                            {(isHovered || isChosen) && (
                                <span className="text-xs font-bold tracking-wider"
                                    style={{ color: isChosen ? '#f87171' : '#9ca3af', fontSize: 10 }}>
                                    {label}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{
                textAlign: 'center',
                minHeight: 28,
                transition: 'opacity 0.3s ease',
                opacity: thanked ? 1 : 0,
            }}>
                <span className="text-sm font-medium text-red-500">
                    Баярлалаа 😘
                </span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// NewsDetail Component
// ─────────────────────────────────────────────────────────────────────────────
const NewsDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [news, setNews]             = useState(null);
    const [coverLightbox, setCoverLightbox] = useState(false);
    const [relatedNews, setRelatedNews]     = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchNewsDetail();
    }, [id]);

    const fetchNewsDetail = async () => {
        setLoading(true);
        setError(null);

        if (MOCK_NEWS_DB[id]) {
            const mockItem = MOCK_NEWS_DB[id];
            setNews({ ...mockItem, content: normalizeContent(mockItem) });
            const related = (mockItem.related || [])
                .map((rid) => MOCK_NEWS_DB[rid])
                .filter(Boolean);
            if (related.length > 0) {
                setRelatedNews(related);
            } else {
                fetchLatestNews();
            }
            setLoading(false);
            return;
        }

        try {
            const data = await newsAPI.getById(id);
            const item = data?.news ?? data;
            if (!item || (!item._id && !item.id)) {
                setError('Мэдээ олдсонгүй');
                setLoading(false);
                return;
            }
            setNews({ ...item, content: normalizeContent(item) });
            if (Array.isArray(item.related) && item.related.length > 0) {
                fetchRelatedNews(item.related);
            } else {
                fetchLatestNews();
            }
        } catch (err) {
            console.error('Мэдээ татахад алдаа:', err);
            setError(err.message || 'Мэдээ олдсонгүй');
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedNews = async (relatedIds) => {
        try {
            const results = await Promise.allSettled(
                relatedIds.map((rid) =>
                    typeof rid === 'object' ? Promise.resolve(rid) : newsAPI.getById(rid)
                )
            );
            const items = results
                .filter((r) => r.status === 'fulfilled')
                .map((r) => r.value?.news ?? r.value)
                .filter(Boolean);
            if (items.length > 0) {
                setRelatedNews(items);
            } else {
                fetchLatestNews();
            }
        } catch (err) {
            console.error('Related мэдээ татахад алдаа:', err);
            fetchLatestNews();
        }
    };

    const fetchLatestNews = async () => {
        try {
            const data = await newsAPI.getAll({ limit: 4, status: 'published' });
            const all  = data.news || data || [];
            const filtered = all
                .filter((n) => String(n._id ?? n.id) !== String(id))
                .slice(0, 3);
            setRelatedNews(filtered);
        } catch (err) {
            console.error('Сүүлийн мэдээ татахад алдаа:', err);
        }
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center transition-colors">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Мэдээ ачааллаж байна...</p>
                </div>
            </div>
        );
    }

    // ── Error / Not found ──
    if (error || !news) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white pt-24 flex flex-col items-center justify-center gap-4 transition-colors">
                <div className="text-6xl mb-2">📰</div>
                <h1 className="text-3xl font-bold text-red-500">Мэдээ олдсонгүй</h1>
                {error && (
                    <p className="text-gray-400 dark:text-gray-500 text-sm max-w-sm text-center">{error}</p>
                )}
                <Link
                    to="/news"
                    className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full font-semibold transition-colors"
                >
                    Мэдээний жагсаалт руу буцах
                </Link>
            </div>
        );
    }

    const authorName = str(news.author) || 'Редакц';
    const dateStr    = formatDate(news.date || news.createdAt);
    const shareUrl   = encodeURIComponent(window.location.href);
    const shareTitle = encodeURIComponent(str(news.title));

    return (
        <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white transition-colors duration-300">
            <Header movies={[]} onSearchResults={() => {}} />

            <main className="pt-20 pb-16">
                <div className="container mx-auto px-4 max-w-6xl">

                    {/* Back */}
                    <div className="mb-6">
                        <Link
                            to="/news"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Мэдээний жагсаалт
                        </Link>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-10">

                        {/* ── Main article ── */}
                        <article className="lg:w-2/3 min-w-0">

                            {/* Category + meta */}
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                {news.category && (
                                    <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-sm">
                                        {str(news.category)}
                                    </span>
                                )}
                                <span className="text-gray-500 text-sm">{dateStr}</span>
                                {news.readTime && (
                                    <span className="text-gray-400 dark:text-gray-500 text-sm flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {str(news.readTime)} унших
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-4xl font-black leading-snug text-gray-900 dark:text-white mb-3">
                                {str(news.title)}
                            </h1>

                            {/* Author */}
                            <div className="flex items-center justify-between mb-7 pb-6 border-b border-black/10 dark:border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-sm font-black text-white"
                                        style={{ background: 'linear-gradient(135deg, #dc2626, #ea580c)' }}>
                                        {authorName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-gray-900 dark:text-white text-sm font-semibold leading-tight">{authorName}</p>
                                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Зохиолч</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400
                                    bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {dateStr}
                                </div>
                            </div>

                            {/* Summary */}
                            {(news.summary || news.excerpt) && (
                                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-7 font-light
                                    border-l-[3px] border-red-600 pl-4 py-1">
                                    {str(news.summary || news.excerpt)}
                                </p>
                            )}

                            {/* Cover image */}
                            {news.image && (
                                <div className="mb-8">
                                    <img
                                        src={str(news.image)}
                                        alt={str(news.title)}
                                        className="w-full rounded-2xl cursor-zoom-in hover:brightness-90 transition-all duration-200 block"
                                        onClick={() => setCoverLightbox(true)}
                                    />
                                    {coverLightbox && (
                                        <Lightbox
                                            images={[{ value: str(news.image), caption: str(news.title) }]}
                                            startIndex={0}
                                            onClose={() => setCoverLightbox(false)}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Content blocks */}
                            <div className="space-y-6">
                                {news.content.length > 0
                                    ? renderContentBlocks(news.content)
                                    : <p className="text-gray-400 dark:text-gray-500 italic">Мэдээний агуулга байхгүй байна.</p>
                                }
                            </div>

                            {/* Share */}
                            <div className="flex items-center gap-3 mt-10 pt-6 border-t border-black/10 dark:border-white/10">
                                <span className="text-gray-400 dark:text-gray-500 text-sm">Хуваалцах:</span>
                                <button
                                    onClick={() => window.open(`https://x.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`, 'x-share', 'width=600,height=400,noopener')}
                                    className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors border border-black/10 dark:border-white/10"
                                    aria-label="X дээр хуваалцах">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                    </svg>
                                </button>
                                <button
                                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, 'fb-share', 'width=600,height=500,noopener')}
                                    className="p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-600 dark:hover:bg-blue-700 text-blue-500 dark:text-blue-400 hover:text-white rounded-full transition-colors border border-blue-200 dark:border-blue-500/20"
                                    aria-label="Facebook дээр хуваалцах">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                                    </svg>
                                </button>
                            </div>

                            {/* Comment section */}
                            <CommentSection newsId={id} />
                        </article>

                        {/* ── Sidebar ── */}
                        {relatedNews.length > 0 && (
                            <aside className="lg:w-80 shrink-0">
                                <div className="sticky top-6 bg-gray-100 dark:bg-[#0F0F0F] rounded-2xl p-5
                                    border border-gray-200 dark:border-gray-800">
                                    <h3 className="text-base font-bold mb-4 text-gray-900 dark:text-white pb-3
                                        border-b border-gray-200 dark:border-gray-800">
                                        Бусад мэдээ
                                    </h3>
                                    <div className="space-y-3">
                                        {relatedNews.map((item) => {
                                            const itemId = item._id ?? item.id;
                                            return (
                                                <Link
                                                    to={`/news/${itemId}`}
                                                    key={itemId}
                                                    className="group flex gap-3 items-start
                                                        bg-white dark:bg-[#1a1a1a] rounded-xl p-3
                                                        hover:bg-gray-50 dark:hover:bg-[#222] transition-all
                                                        border border-gray-200 dark:border-transparent
                                                        dark:hover:border-gray-700"
                                                >
                                                    <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                                                        {item.image && (
                                                            <img
                                                                src={str(item.image)}
                                                                alt={str(item.title)}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-red-500 font-bold uppercase mb-0.5">
                                                            {str(item.category)}
                                                        </p>
                                                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-red-500 transition-colors line-clamp-2 leading-snug">
                                                            {str(item.title)}
                                                        </h4>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                                                            {formatDate(item.date || item.createdAt)}
                                                        </span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </aside>
                        )}
                    </div>
                </div>

                {/* CTA */}
                <section className="mt-16 bg-red-600 py-14 text-center">
                    <div className="container mx-auto px-6">
                        <h2 className="text-2xl font-bold mb-3 text-white">Шинэчлэлийг өөрийн нүдээр үз!</h2>
                        <p className="text-red-100 mb-6 max-w-xl mx-auto text-sm">
                            Технологийн дэвшил, тав тухыг мэдрэхийн тулд яг одоо тасалбараа захиалаарай.
                        </p>
                        <button
                            onClick={() => navigate('/schedule')}
                            className="bg-white text-red-600 px-7 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-xl text-sm">
                            Цагийн хуваарь харах
                        </button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default NewsDetail;