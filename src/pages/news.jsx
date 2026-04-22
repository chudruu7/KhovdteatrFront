import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { newsAPI } from '../api/adminAPI';

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────
const str = (val) => {
    if (!val) return '';
    if (typeof val === 'object') return val.name ?? val.title ?? '';
    return String(val);
};

const formatDate = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d)) return str(val);
    return `${d.getFullYear()} оны ${d.getMonth() + 1}-р сарын ${d.getDate()}`;
};

const CATEGORY_LABELS = {
    Зарлал: 'Зарлал',
    Мэдээ:         'Мэдээ',
    Урамшуулал:    'Урамшуулал',
    Event:        'Үйл явдал',
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
const News = () => {
    const [news, setNews]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const [page, setPage]       = useState(1);
    const PAGE_SIZE = 6;

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await newsAPI.getAll({ status: 'published' });
                const list = data.news ?? data;
                setNews(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error('Мэдээ татахад алдаа:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    const visible = news.slice(0, page * PAGE_SIZE);
    const hasMore = visible.length < news.length;

     return (
        <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white selection:bg-red-600 selection:text-white transition-colors duration-300">
            <Header movies={[]} onSearchResults={() => {}} />

              <main className="pt-20">
                {/* Hero */}
<section className="relative h-[40vh] w-full overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 z-0">
        
        {/* Light mode gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent dark:from-[#0A0A0A] dark:via-[#0A0A0A]/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-transparent dark:from-[#0A0A0A]/80" />
    </div>

    <div className="relative z-10 container mx-auto px-6 max-w-7xl mt-20">
        <h4 className="text-red-600 font-bold tracking-[0.3em] uppercase mb-4">
            Ховд аймгийн Хөгжимт Драмын Театр
        </h4>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-6 max-w-4xl text-gray-900 dark:text-white">
            Байгууллагын <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
                Мэдээ мэдээлэл
            </span>
        </h1>
        <p className="text-gray-700 dark:text-gray-300 text-lg md:text-xl max-w-2xl leading-relaxed border-l-4 border-red-600 pl-6">
            Бид зүгээр нэг кино үздэг газар биш. Бид дурсамж бүтээдэг, мэдрэмж бэлэглэдэг соёл урлагийн төв юм.
        </p>
    </div>
</section>

                {/* Content */}
                <section className="container mx-auto px-6 max-w-7xl py-12">
                    {loading && <LoadingGrid />}

                    {error && (
                        <div className="text-center py-20">
                            <p className="text-red-400 mb-2">Мэдээ татахад алдаа гарлаа</p>
                            <p className="text-gray-500 dark:text-gray-600 text-sm">{error}</p>
                        </div>
                    )}

                    {!loading && !error && news.length === 0 && (
                        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                            Одоогоор нийтлэгдсэн мэдээ байхгүй байна.
                        </div>
                    )}

                    {!loading && !error && news.length > 0 && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {visible.map((item) => (
                                <NewsCard key={item._id ?? item.id} news={item} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Load more */}
               {!loading && hasMore && (
                    <section className="container mx-auto px-6 max-w-7xl py-8 text-center">
                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="px-8 py-3 border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors"
                        >
                            Цааш үзэх
                        </button>
                    </section>
                )}

                {!loading && !hasMore && news.length > 0 && (
                    <section className="py-12 text-center text-gray-400 dark:text-gray-600 text-sm">
                        Бүх мэдээг харлаа
                    </section>
                )}
            </main>

            <Footer />
        </div>
    );
};

// ─────────────────────────────────────────────
// NewsCard
// ─────────────────────────────────────────────
const NewsCard = ({ news }) => {
    const id       = news._id ?? news.id;
    const category = CATEGORY_LABELS[news.category] ?? str(news.category) ?? 'Мэдээ';
    const date     = formatDate(news.date ?? news.createdAt);
    const image    = str(news.image);

    return (
        <Link
            to={`/news/${id}`}
            className="group bg-gray-100 dark:bg-[#111] rounded-xl overflow-hidden shadow-md dark:shadow-xl dark:shadow-black/50 transition-all duration-300 hover:shadow-red-200 dark:hover:shadow-red-900/40 hover:scale-[1.02] flex flex-col"
        >
            {/* Image */}
            <div className="h-48 overflow-hidden relative bg-gray-200 dark:bg-gray-900 shrink-0">
                {image ? (
                    <img
                        src={image}
                        alt={str(news.title)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-700 text-4xl">📰</div>
                )}
                <div className="absolute inset-0 bg-black/20 dark:bg-black/30 group-hover:bg-black/5 dark:group-hover:bg-black/10 transition-colors" />
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-3 text-xs uppercase font-semibold">
                    <span className="text-red-500 tracking-widest">{category}</span>
                    <span className="text-gray-400 dark:text-gray-500">{date}</span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-red-500 transition-colors line-clamp-2">
                    {str(news.title)}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 flex-1">
                    {str(news.excerpt ?? news.summary)}
                </p>

                <p className="mt-4 text-red-500 text-sm font-semibold inline-flex items-center">
                    Дэлгэрэнгүй
                    <span className="ml-2 transform group-hover:translate-x-1 transition-transform">&rarr;</span>
                </p>
            </div>
        </Link>
    );
};

// ─────────────────────────────────────────────
// LoadingGrid — theme-aware
// ─────────────────────────────────────────────
const LoadingGrid = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-[#111] rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-800" />
                <div className="p-6 space-y-3">
                    <div className="flex justify-between">
                        <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
                        <div className="h-3 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
                    </div>
                    <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
                </div>
            </div>
        ))}
    </div>
);

export default News;