// src/pages/Profile.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import { getCurrentUser, updateProfile } from '../auth/auth';
import { api } from '../api/config';
import { defaultProfileUrl } from '../data/avatars';
import bookingAPI from '../api/bookingAPI';
import LoadingSpinner from '../admin/LoadingSpinner';
import {
    FaEdit, FaSave, FaTimes, FaCog, FaShieldAlt, FaSignOutAlt,
    FaCheckCircle, FaExclamationCircle, FaPhone, FaEnvelope, 
    FaUserCircle, FaTicketAlt, FaClock, FaChevronRight, FaMapMarkerAlt, FaCamera
} from 'react-icons/fa';

// ===============================================
// Glass Toast System
// ===============================================
const useToast = () => {
    const [toasts, setToasts] = useState([]);
    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);
    return { toasts, showToast };
};

const ToastContainer = ({ toasts }) => (
    <div className="fixed bottom-8 right-8 z-[60] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
            {toasts.map(toast => (
                <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold backdrop-blur-3xl border border-white/20
                        ${toast.type === 'success' ? 'bg-emerald-500/40' : 'bg-rose-500/40'}`}
                >
                    {toast.type === 'success' ? <FaCheckCircle size={18} /> : <FaExclamationCircle size={18} />}
                    {toast.message}
                </motion.div>
            ))}
        </AnimatePresence>
    </div>
);

// ===============================================
// Main ProfilePage Component
// ===============================================
const ProfilePage = ({ user: userProp, isLoggedIn = true, onLogout }) => {
    const navigate = useNavigate();
    const { showToast, toasts } = useToast();
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [bookings, setBookings] = useState([]);

    const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const userSource = userProp || getCurrentUser();
        if (!userSource) { navigate('/login'); return; }

        // ✅ Profile болон bookings хоёуланг зэрэг татна
        const [profileRes, bookingsResult] = await Promise.all([
            api.get(`/auth/profile/${userSource._id || userSource.id}`),
            bookingAPI.getMyBookings()  // ← bookingAPI ашигла
        ]);

        setCurrentUser({ ...userSource, ...profileRes });

        // ✅ success шалгаад өгөгдөл тавина
        if (bookingsResult.success && bookingsResult.bookings?.length > 0) {
            setBookings(bookingsResult.bookings);
        } else {
            setBookings([]);  // mock data биш, хоосон харуулна
        }

    } catch (err) {
        showToast('Мэдээлэл татахад алдаа гарлаа', 'error');
    } finally {
        setIsLoading(false);
    }
}, [userProp, navigate, showToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (currentUser) {
            setEditForm({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                address: currentUser.address || '',
                notifications: currentUser.notifications ?? true,
            });
        }
    }, [currentUser]);

    const handleSave = async () => {
        try {
            const response = await updateProfile({ ...editForm, _id: currentUser._id });
            if (response.success) {
                setCurrentUser(response.user);
                setIsEditing(false);
                showToast('Амжилттай шинэчлэгдлээ ✨');
            }
        } catch {
            showToast('Хадгалахад алдаа гарлаа', 'error');
        }
    };

    if (isLoading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-white dark:bg-[#030712] text-slate-900 dark:text-slate-100 transition-colors duration-700">
            <Header isLoggedIn={isLoggedIn} user={currentUser} onLogout={onLogout} />

            {/* Mesh Background Decor - Илүү тунгалаг харагдуулах арын эффект */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-500/10 blur-[120px]" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] rounded-full bg-orange-400/5 blur-[100px]" />
            </div>

            <main className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 z-10">
                <div className="max-w-6xl mx-auto">
                    
                    {/* Ultra-Liquid Header Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/20 dark:bg-white/[0.03] backdrop-blur-3xl rounded-[40px] border border-white/40 dark:border-white/10 p-10 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)] mb-10"
                    >
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-[35px] overflow-hidden ring-1 ring-white/50 dark:ring-white/10 p-1 bg-white/30 dark:bg-black/20 backdrop-blur-xl">
                                    <img src={currentUser.avatarUrl || defaultProfileUrl} alt="Avatar" className="w-full h-full object-cover rounded-[30px]" />
                                </div>
                                <button className="absolute -bottom-2 -right-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl text-rose-500 hover:scale-110 transition-all border border-white/50 dark:border-white/10">
                                    <FaCamera size={18} />
                                </button>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-4">
                                    {currentUser.name}
                                </h1>
                                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold bg-white/40 dark:bg-white/5 px-4 py-2 rounded-full border border-white/40 dark:border-white/10 backdrop-blur-md">
                                        <FaEnvelope className="text-rose-500" /> {currentUser.email}
                                    </span>
                                    {currentUser.phone && (
                                        <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold bg-white/40 dark:bg-white/5 px-4 py-2 rounded-full border border-white/40 dark:border-white/10 backdrop-blur-md">
                                            <FaPhone className="text-blue-500" /> {currentUser.phone}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setIsEditing(!isEditing)} className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black hover:scale-105 transition-all shadow-xl active:scale-95">
                                    {isEditing ? 'Цуцлах' : 'Засах'}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Sidebar */}
                        <aside className="lg:col-span-3">
                            <div className="sticky top-32 space-y-4">
                                <nav className="bg-white/10 dark:bg-white/[0.02] backdrop-blur-3xl rounded-[35px] p-4 border border-white/40 dark:border-white/10">
                                    {[
                                        { id: 'profile', label: 'Миний профайл', icon: FaUserCircle },
                                        { id: 'bookings', label: 'Захиалгын түүх', icon: FaTicketAlt },
                                        { id: 'settings', label: 'Тохиргоо', icon: FaCog },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black mb-1 transition-all
                                                ${activeTab === tab.id 
                                                    ? 'bg-rose-500 text-white shadow-[0_10px_20px_-5px_rgba(244,63,94,0.4)] translate-x-2' 
                                                    : 'text-slate-500 hover:bg-white/40 dark:hover:bg-white/5'}`}
                                        >
                                            <tab.icon size={18} /> {tab.label}
                                        </button>
                                    ))}
                                </nav>
                                <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black text-sm hover:bg-rose-500 hover:text-white transition-all">
                                    <FaSignOutAlt /> Системээс гарах
                                </button>
                            </div>
                        </aside>

                        {/* Main Glass Content */}
                        <div className="lg:col-span-9">
                            <div className="bg-white/20 dark:bg-white/[0.03] backdrop-blur-3xl rounded-[40px] border border-white/40 dark:border-white/10 p-10 min-h-[600px] shadow-sm">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        {activeTab === 'profile' && <ProfileTab isEditing={isEditing} form={editForm} setForm={setEditForm} onSave={handleSave} />}
                                        {activeTab === 'bookings' && <BookingsTab bookings={bookings} />}
                                        {activeTab === 'settings' && <SettingsTab form={editForm} setForm={setEditForm} onSave={handleSave} />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <ToastContainer toasts={toasts} />
        </div>
    );
};

// ===============================================
// Inner Tabs (More Transparent Styles)
// ===============================================

const ProfileTab = ({ isEditing, form, setForm, onSave }) => (
    <div>
        <h2 className="text-3xl font-black mb-10 tracking-tight">Хувийн мэдээлэл</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {[
                { label: 'Бүтэн нэр', name: 'name', type: 'text', icon: FaUserCircle },
                { label: 'Имэйл хаяг', name: 'email', type: 'email', disabled: true, icon: FaEnvelope },
                { label: 'Утасны дугаар', name: 'phone', type: 'text', icon: FaPhone },
                { label: 'Хаяг', name: 'address', type: 'text', icon: FaMapMarkerAlt },
            ].map((f) => (
                <div key={f.name} className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{f.label}</label>
                    <div className="relative">
                        <div className={`absolute left-5 top-1/2 -translate-y-1/2 ${isEditing ? 'text-rose-500' : 'text-slate-300'}`}>
                            <f.icon size={16} />
                        </div>
                        <input
                            type={f.type}
                            value={form[f.name] || ''}
                            readOnly={!isEditing || f.disabled}
                            onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                            className={`w-full pl-14 pr-6 py-5 rounded-[20px] border text-sm font-bold transition-all backdrop-blur-md
                                ${isEditing && !f.disabled 
                                    ? 'bg-white/50 dark:bg-white/5 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.1)] outline-none' 
                                    : 'bg-black/5 dark:bg-white/[0.02] border-white/20 text-slate-500 cursor-not-allowed'}`}
                        />
                    </div>
                </div>
            ))}
        </div>
        {isEditing && (
            <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={onSave}
                className="mt-12 px-12 py-5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-2xl font-black shadow-2xl shadow-rose-500/30"
            >
                Өөрчлөлтийг хадгалах
            </motion.button>
        )}
    </div>
);

const BookingsTab = ({ bookings }) => {
    const [selected, setSelected] = useState(null);

    return (
        <div>
            <h2 className="text-3xl font-black tracking-tight mb-8">Захиалгууд</h2>

            {bookings.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <FaTicketAlt size={40} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">Одоогоор захиалга байхгүй байна</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {bookings.map((item, index) => {
                        const isPaid = item.paymentStatus === 'paid';
                        return (
                            <div
                                key={item.id || item._id || index}
                                onClick={() => setSelected(item)}
                                className="group bg-white/30 dark:bg-white/[0.03] backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-white/10 hover:border-rose-500/40 transition-all cursor-pointer overflow-hidden hover:-translate-y-1"
                            >
                                
                                <div className="p-5">
                                    <h4 className="font-black text-base mb-3">{item.title}</h4>
                                    <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                        <p className="flex items-center gap-2"><FaClock size={11}/> {item.date} {item.time}</p>
                                        <p className="flex items-center gap-2"><FaMapMarkerAlt size={11}/> {item.hall}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-xs text-slate-400">Төлбөр:</span>
                                        <span className={`text-xs font-black px-3 py-1 rounded-full ${
                                            isPaid
                                                ? 'bg-emerald-500/15 text-emerald-500'
                                                : 'bg-amber-500/15 text-amber-500'
                                        }`}>
                                            {isPaid ? '✓ Төлөгдсөн' : '⏳ Хүлээгдэж буй'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelected(null)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-[#0f1117] rounded-[32px] border border-white/20 dark:border-white/10 w-full max-w-sm overflow-hidden shadow-2xl"
                        >
                            
                            <div className="p-7">
                                <h3 className="text-xl font-black mb-5">{selected.title}</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Огноо', value: selected.date },
                                        { label: 'Цаг', value: selected.time },
                                        { label: 'Танхим', value: selected.hall },
                                        { label: 'Суудал', value: selected.seats?.join(', ') },
                                        { label: 'Нийт үнэ', value: `${selected.totalPrice?.toLocaleString()}₮` },
                                    ].map(row => (
                                        <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-white/10 dark:border-white/5 text-sm">
                                            <span className="text-slate-500">{row.label}</span>
                                            <span className="font-bold">{row.value}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center py-2.5 text-sm">
                                        <span className="text-slate-500">Төлбөр:</span>
                                        <span className={`font-black px-3 py-1 rounded-full text-xs ${
                                            selected.paymentStatus === 'paid'
                                                ? 'bg-emerald-500/15 text-emerald-500'
                                                : 'bg-amber-500/15 text-amber-500'
                                        }`}>
                                            {selected.paymentStatus === 'paid' ? '✓ Төлөгдсөн' : '⏳ Хүлээгдэж буй'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="mt-6 w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-black text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                                >
                                    Хаах
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SettingsTab = ({ form, setForm, onSave }) => (
    <div>
        <h2 className="text-3xl font-black mb-10 tracking-tight">Тохиргоо</h2>
        <div className="p-8 bg-white/30 dark:bg-white/[0.02] backdrop-blur-xl rounded-[30px] border border-white/40 dark:border-white/10 max-w-xl">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-black text-lg">Имэйл мэдэгдэл</h4>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Шинэ мэдээллийг цаг алдалгүй авах</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={form.notifications} 
                        onChange={(e) => setForm({ ...form, notifications: e.target.checked })}
                        className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-black/10 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[24px] after:w-[24px] after:transition-all peer-checked:bg-rose-500 shadow-inner"></div>
                </label>
            </div>
        </div>
        <button onClick={onSave} className="mt-10 px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black hover:opacity-80 transition-all">
            Тохиргоог хадгалах
        </button>
    </div>
);

const LoadingScreen = () => (
    <div className="min-h-screen bg-white dark:bg-[#030712] flex items-center justify-center">
        <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-12 h-12 rounded-full bg-rose-500 blur-xl"
        />
    </div>
);

export default ProfilePage;