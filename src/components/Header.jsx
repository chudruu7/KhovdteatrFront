// src/components/Header.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Calendar, Settings, ChevronDown, Home, Clock, Newspaper, Info, Gift } from 'lucide-react';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';
import { movies } from '../data/movies';

const Header = ({ onSearchResults, isLoggedIn, user, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const profileDropdownRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navItems = [
        { name: 'ҮЗВЭРҮҮД', path: '/', anchor: '#now-showing', icon: Home },
        { name: 'ХУВААРЬ', path: '/schedule', icon: Clock },
        { name: 'МЭДЭЭ', path: '/news', icon: Newspaper },
        { name: 'БИДНИЙ ТУХАЙ', path: '/about', icon: Info },
        { name: 'УРАМШУУЛАЛ', path: '/promotions', icon: Gift }
    ];

    const handleNavigation = (path, anchor) => {
        setIsMobileMenuOpen(false);
        if (anchor && location.pathname === '/') {
            const element = document.getElementById(anchor.substring(1));
            if (element) {
                const offset = 80;
                const bodyRect = document.body.getBoundingClientRect().top;
                const elementRect = element.getBoundingClientRect().top;
                const elementPosition = elementRect - bodyRect;
                const offsetPosition = elementPosition - offset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        } else {
            navigate(path);
        }
    };

    const allMovies = [...movies.nowShowing, ...movies.comingSoon];

    // Аватар компонент — дахин ашиглахад хялбар
    const AvatarCircle = ({ size = 'sm' }) => {
        const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
        const textClass = size === 'sm' ? 'text-xs' : 'text-sm';
        const showAvatar = user?.avatarUrl && !avatarError;
        
        return (
            <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 border border-white/20`}>
                {showAvatar ? (
                    <img
                        src={user.avatarUrl}
                        alt={user?.name}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                    />
                ) : null}
                <div
                    className={`w-full h-full bg-gradient-to-tr from-yellow-400 to-orange-500 items-center justify-center`}
                    style={{ display: showAvatar ? 'none' : 'flex' }}
                >
                    <span className={`text-black font-bold ${textClass} uppercase`}>
                        {user?.name?.charAt(0) || 'U'}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <header className={`site-header fixed top-0 w-full z-50 transition-all duration-300 border-b ${
            scrolled ? 'py-2' : 'py-4 border-transparent'
        }`}>
            <div className="container mx-auto px-4 max-w-screen-2xl">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <div
                        className="flex items-center space-x-3 cursor-pointer group"
                        onClick={() => navigate('/')}
                    >
                        <div className="relative w-12 h-12 transition-transform duration-300 group-hover:scale-110">
                            <img src="/kdt.png" alt="KDT Logo" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex flex-col">
                            <span className="site-header-text font-bold text-2xl tracking-tighter leading-tight">
                                ХОВД АЙМГИЙН
                            </span>
                            <span className="site-header-subtext text-[11px] font-bold tracking-[0.2em] uppercase">
                                ХӨГЖИМТ ДРАМЫН ТЕАТР
                            </span>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center bg-white/5 backdrop-blur-md rounded-full px-6 py-2 border border-white/10 space-x-1">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => handleNavigation(item.path, item.anchor)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 flex items-center gap-2 ${
                                        isActive
                                            ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                                            : 'site-nav-item hover:bg-white/10'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {item.name}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                        <div className="hidden sm:block">
                            <SearchBar movies={allMovies} onSearch={onSearchResults} />
                        </div>

                        <ThemeToggle />

                        <div className="h-6 w-[1px] bg-black/10 dark:bg-white/10 mx-2 hidden md:block" />

                        {isLoggedIn ? (
                            <div className="relative" ref={profileDropdownRef}>
                                {/* Profile товч */}
                                <button
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="flex items-center space-x-2 p-1 pl-3 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                                >
                                    <span className="hidden sm:inline text-xs font-medium site-header-text">
                                        {user?.name}
                                    </span>
                                    <AvatarCircle size="sm" />
                                    <ChevronDown className={`w-3 h-3 site-header-subtext transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown */}
                                {isProfileDropdownOpen && (
                                    <div className="site-dropdown absolute right-0 mt-3 w-64 border rounded-2xl shadow-2xl overflow-hidden animate-in">

                                        {/* Хэрэглэгчийн мэдээлэл + аватар */}
                                        <div className="site-dropdown-header p-4 border-b flex items-center space-x-3">
                                            <AvatarCircle size="lg" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm site-header-text font-semibold truncate">
                                                    {user?.name}
                                                </p>
                                                <p className="text-xs site-header-subtext truncate">
                                                    {user?.email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Меню */}
                                        <div className="p-2">
                                            <DropdownItem
                                                icon={User}
                                                label="Миний профайл"
                                                onClick={() => {
                                                    navigate('/profile');
                                                    setIsProfileDropdownOpen(false);
                                                }}
                                            />
                                            
                                           
                                            <div className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
                                            <button
                                                onClick={() => {
                                                    onLogout();
                                                    setIsProfileDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Гарах
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-full text-xs font-black transition-all active:scale-95 shadow-lg shadow-yellow-500/20"
                            >
                                НЭВТРЭХ
                            </button>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 site-header-subtext hover:site-header-text transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden absolute top-full left-0 w-full site-mobile-menu backdrop-blur-2xl border-b border-black/10 dark:border-white/10 p-6 space-y-6 animate-in slide-in-from-top duration-300">
                    <div className="sm:hidden">
                        <SearchBar movies={allMovies} onSearch={onSearchResults} />
                    </div>

                    {/* Mobile хэрэглэгчийн мэдээлэл */}
                    {isLoggedIn && (
                        <div className="flex items-center space-x-3 pb-4 border-b border-black/10 dark:border-white/10">
                            <AvatarCircle size="lg" />
                            <div>
                                <p className="site-header-text font-semibold text-sm">{user?.name}</p>
                                <p className="site-header-subtext text-xs">{user?.email}</p>
                            </div>
                        </div>
                    )}

                    <nav className="flex flex-col space-y-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => handleNavigation(item.path, item.anchor)}
                                    className="text-left text-lg font-bold site-nav-item hover:text-yellow-500 transition-colors flex items-center gap-3"
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </button>
                            );
                        })}
                    </nav>

                    {isLoggedIn && (
                        <div className="flex flex-col space-y-2 pt-4 border-t border-black/10 dark:border-white/10">
                            <button
                                onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                                className="text-left text-sm site-nav-item hover:site-header-text transition-colors py-1 flex items-center gap-2"
                            >
                                <User className="w-4 h-4" />
                                Миний профайл
                            </button>
                            <button
                                onClick={() => { navigate('/booking'); setIsMobileMenuOpen(false); }}
                                className="text-left text-sm site-nav-item hover:site-header-text transition-colors py-1 flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4" />
                                Захиалгууд
                            </button>
                            <button
                                onClick={() => { navigate('/settings'); setIsMobileMenuOpen(false); }}
                                className="text-left text-sm site-nav-item hover:site-header-text transition-colors py-1 flex items-center gap-2"
                            >
                                <Settings className="w-4 h-4" />
                                Тохиргоо
                            </button>
                            <button
                                onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                                className="text-left text-sm text-red-500 dark:text-red-400 hover:text-red-400 transition-colors py-1 flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Гарах
                            </button>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};

const DropdownItem = ({ icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg site-nav-item hover:bg-black/5 dark:hover:bg-white/10 hover:site-header-text transition-all text-sm font-medium"
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

export default Header;