import { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, Edit2, Trash2, Newspaper, RefreshCw, Calendar, User, TrendingUp, Clock, Filter, ChevronRight, BookOpen, Sparkles } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import NewsModal from '../modals/NewsModal';
import { newsAPI } from '../../api/adminAPI';

const EMPTY_FORM = {
  title: '', excerpt: '', content: [], callout: '',
  image: '', category: 'Зарлал', status: 'draft',
};

const CATEGORY_LABELS = {
  announcement: 'Зарлал',
  news: 'Мэдээ',
  promotion: 'Урамшуулал',
  event: 'Үйл явдал',
};

const CATEGORY_COLORS = {
  announcement: 'from-blue-500 to-cyan-500',
  news: 'from-purple-500 to-pink-500',
  promotion: 'from-orange-500 to-red-500',
  event: 'from-green-500 to-emerald-500',
};

const STATUS_CONFIG = {
  published: { label: 'Нийтлэгдсэн', color: 'emerald', icon: 'Sparkles' },
  draft: { label: 'Ноорог', color: 'amber', icon: 'Clock' },
};

const str = (val) => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'object') return val.name ?? val.title ?? val.email ?? '—';
  return String(val);
};

const extractNews = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.news)) return data.news;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  console.warn('Тодорхойгүй API response формат:', data);
  return [];
};

const NewsManagementModule = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await newsAPI.getAll();
      console.log('fetchNews response:', data);
      setNews(extractNews(data));
    } catch (err) {
      console.error('Мэдээ татахад алдаа:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const closeModal = () => {
    setShowAddModal(false);
    setEditingNews(null);
    setFormData(EMPTY_FORM);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e, blocks) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingNews) {
        const id = editingNews._id ?? editingNews.id;
        const contentBlocks = blocks ?? formData.content ?? [];
        const payload = {
          ...formData,
          content: JSON.stringify(contentBlocks),
        };
        const response = await newsAPI.update(id, payload);
        console.log('update response:', response);
        const updated = response?.news ?? response?.data ?? { ...editingNews, ...payload };
        setNews(prev => prev.map(n => (n._id ?? n.id) === id ? updated : n));
      } else {
        const contentBlocks = blocks ?? formData.content ?? [];
        const payload = {
          ...formData,
          content: JSON.stringify(contentBlocks),
        };
        const response = await newsAPI.create(payload);
        console.log('create response:', response);
        const created = response?.news ?? response?.data ?? response;
        if (created && typeof created === 'object' && !Array.isArray(created)) {
          setNews(prev => [created, ...prev]);
        } else {
          await fetchNews();
        }
      }
      closeModal();
    } catch (err) {
      console.error('Хадгалахад алдаа:', err);
      alert('Хадгалахад алдаа гарлаа: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingNews(item);
    const rawContent = (() => {
      if (Array.isArray(item.content)) return item.content;
      if (typeof item.content === 'string' && item.content.trim()) {
        try {
          const parsed = JSON.parse(item.content);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [{ id: 'text-legacy', type: 'text', value: item.content, caption: '' }];
        }
      }
      return [];
    })();
    setFormData({
      title: str(item.title) !== '—' ? str(item.title) : '',
      excerpt: str(item.excerpt) !== '—' ? str(item.excerpt) : '',
      content: rawContent,
      image: str(item.image) !== '—' ? str(item.image) : '',
      callout: item.callout || '',
      category: item.category || 'Зарлал',
      status: item.status || 'draft',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Та устгахдаа итгэлтэй байна уу?')) return;
    try {
      await newsAPI.delete(id);
      setNews(prev => prev.filter(n => (n._id ?? n.id) !== id));
    } catch (err) {
      console.error('Устгахад алдаа:', err);
      alert('Устгахад алдаа гарлаа: ' + err.message);
    }
  };

  const filteredNews = news.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const stats = {
    total: news.length,
    published: news.filter(n => n.status === 'published').length,
    draft: news.filter(n => n.status === 'draft').length,
  };

  if (loading) return <LoadingSpinner />;

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="bg-red-500/10 rounded-full p-4">
        <Newspaper className="w-12 h-12 text-red-400" />
      </div>
      <p className="text-red-400 text-sm">Алдаа: {error}</p>
      <button
        onClick={fetchNews}
        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
      >
        <RefreshCw className="w-4 h-4" /> Дахин оролдох
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25">
                  <Newspaper className="w-6 h-6 text-white" />
                </div>
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent"></div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
                    {stats.published} Нийтлэгдсэн
                  </span>
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full border border-amber-500/20">
                    {stats.draft} Ноорог
                  </span>
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                Мэдээ, мэдээлэл
              </h1>
              <p className="text-slate-400 mt-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Нийт {stats.total} мэдээ
              </p>
            </div>

            <div className="flex gap-3">
              {/* View Toggle */}
              <div className="flex bg-slate-800/50 backdrop-blur-sm rounded-xl p-1 border border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  List
                </button>
              </div>

              <button
                onClick={fetchNews}
                className="p-2.5 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700 text-slate-300 rounded-xl transition-all duration-200 border border-slate-700 hover:border-slate-600"
                title="Дахин татах"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={() => { setEditingNews(null); setFormData(EMPTY_FORM); setShowAddModal(true); }}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-xl flex items-center gap-2 font-medium hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Шинэ мэдээ
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              Бүгд
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                filter === 'published'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Нийтлэгдсэн
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                filter === 'draft'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              Ноорог
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700">
              <div className="bg-slate-800 rounded-full p-6 mb-4">
                <Newspaper className="w-16 h-16 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-400 mb-2">Мэдээ байхгүй байна</h3>
              <p className="text-sm text-slate-600 mb-6">Шинэ мэдээ нэмэхийн тулд дээрх товчийг дарна уу</p>
              <button
                onClick={() => { setEditingNews(null); setFormData(EMPTY_FORM); setShowAddModal(true); }}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl flex items-center gap-2 mx-auto hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Эхний мэдээ нэмэх
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item, index) => {
              const itemId = item._id ?? item.id;
              const categoryColor = CATEGORY_COLORS[item.category] || 'from-gray-500 to-gray-600';
              const statusConfig = STATUS_CONFIG[item.status];
              
              return (
                <div
                  key={itemId}
                  className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Card Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${categoryColor} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden">
                    {item.image ? (
                      <>
                        <img
                          src={str(item.image)}
                          alt={str(item.title)}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <Newspaper className="w-16 h-16 text-white/30" />
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${categoryColor} text-white shadow-lg`}>
                        {CATEGORY_LABELS[item.category] ?? str(item.category)}
                      </span>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md ${
                        item.status === 'published'
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-amber-500/90 text-white'
                      }`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                      {str(item.title)}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                      {str(item.excerpt)}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{str(item.author) || 'Admin'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{str(item.date ?? item.createdAt)}</span>
                        </div>
                        {item.views !== undefined && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{item.views} үзсэн</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-1">
                        <button
                          className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-all duration-200 group/btn"
                          title="Харах"
                        >
                          <Eye className="w-4 h-4 text-slate-400 group-hover/btn:text-blue-400 transition-colors" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-all duration-200 group/btn"
                          title="Засах"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400 group-hover/btn:text-green-400 transition-colors" />
                        </button>
                        <button
                          onClick={() => handleDelete(itemId)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all duration-200 group/btn"
                          title="Устгах"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 group-hover/btn:text-red-400 transition-colors" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="space-y-3">
            {filteredNews.map((item, index) => {
              const itemId = item._id ?? item.id;
              const categoryColor = CATEGORY_COLORS[item.category] || 'from-gray-500 to-gray-600';
              
              return (
                <div
                  key={itemId}
                  className="group bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 p-4 hover:transform hover:translate-x-1"
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-600 to-pink-600">
                      {item.image ? (
                        <img
                          src={str(item.image)}
                          alt={str(item.title)}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="w-8 h-8 text-white/30" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r ${categoryColor} text-white`}>
                          {CATEGORY_LABELS[item.category] ?? str(item.category)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {item.status === 'published' ? 'Нийтлэгдсэн' : 'Ноорог'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1 truncate group-hover:text-purple-400 transition-colors">
                        {str(item.title)}
                      </h3>
                      <p className="text-sm text-slate-400 truncate">
                        {str(item.excerpt)}
                      </p>
                    </div>
                    
                    {/* Meta & Actions */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{str(item.date ?? item.createdAt)}</span>
                        </div>
                        {item.views !== undefined && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{item.views} үзсэн</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                          title="Харах"
                        >
                          <Eye className="w-4 h-4 text-slate-400 hover:text-blue-400 transition-colors" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                          title="Засах"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400 hover:text-green-400 transition-colors" />
                        </button>
                        <button
                          onClick={() => handleDelete(itemId)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                          title="Устгах"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400 transition-colors" />
                        </button>
                      </div>
                      
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showAddModal && (
        <NewsModal
          editingNews={editingNews}
          formData={formData}
          submitting={submitting}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={handleInputChange}
        />
      )}
    </div>
  );
};

export default NewsManagementModule;