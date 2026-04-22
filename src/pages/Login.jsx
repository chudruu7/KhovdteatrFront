// src/pages/Login.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { login, register, getCurrentUser } from '../auth/auth';
import { auth } from '../auth/firebaseConfig';
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { SYSTEM_AVATARS } from '../data/avatars'; // ← DEFAULT_AVATAR хэрэгтэй үгүй

// ── AvatarSelector ──────────────────────────────────────────────
const AvatarSelector = ({ selectedId, onSelect, disabled }) => {
  // ID-р олж preview-д харуулна
  const selectedAvatar = SYSTEM_AVATARS.find((a) => a.id === selectedId) ?? SYSTEM_AVATARS[0];

  return (
    <div className="space-y-4 py-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center">
        Аватар сонгох
      </p>

      {/* Preview */}
      <div className="flex justify-center">
        <div className="relative">
          <img
            src={selectedAvatar.url}
            alt="Сонгосон"
            className="w-20 h-20 rounded-full object-cover ring-4 ring-purple-500 ring-offset-4 ring-offset-black/80 shadow-xl shadow-purple-500/30"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-2 border-black">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Сонголтууд */}
      <div className="flex justify-center gap-3">
        {SYSTEM_AVATARS.map((avatar) => {
          const isSelected = selectedId === avatar.id; // ✅ ID-р харьцуулна
          return (
            <button
              key={avatar.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(avatar.id)} // ✅ ID дамжуулна
              className={`relative w-14 h-14 rounded-2xl overflow-hidden transition-all duration-200
                ${isSelected
                  ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black scale-110 opacity-100'
                  : 'ring-1 ring-white/10 opacity-40 hover:opacity-90 hover:scale-105'
                }`}
            >
              <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Particles (өмнөхтэй адил) ────────────────────────────────────
const PARTICLE_COUNT = 50;
const initParticles = () =>
  Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 3 + 1,
    speedX: (Math.random() - 0.5) * 0.5,
    speedY: (Math.random() - 0.5) * 0.5,
    opacity: Math.random() * 0.5 + 0.2,
  }));

// ── CinematicLogin ───────────────────────────────────────────────
const CinematicLogin = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);

  // ✅ URL биш ID хадгална
  const [selectedAvatarId, setSelectedAvatarId] = useState(SYSTEM_AVATARS[0].id);

  const emptyForm = { name: '', email: '', password: '', confirmPassword: '' };
  const [formData, setFormData]   = useState(emptyForm);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const navigate = useNavigate();

  const particlesRef = useRef(initParticles());
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) navigate('/');
  }, [navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.map((p) => {
        const nx = (p.x + p.speedX + canvas.width)  % canvas.width;
        const ny = (p.y + p.speedY + canvas.height) % canvas.height;
        ctx.beginPath();
        ctx.arc(nx, ny, p.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
        return { ...p, x: nx, y: ny };
      });
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    setFormData(emptyForm);
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Хүчинтэй имэйл хаяг оруулна уу.');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.');
      return false;
    }
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError('Нууц үгнүүд тохирохгүй байна.');
        return false;
      }
      if (!formData.name.trim()) {
        setError('Нэрээ оруулна уу.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password, rememberMe);
      } else {
        // ✅ ID-г URL болгож хөрвүүлж backend-д явуулна
        const avatarUrl = SYSTEM_AVATARS.find((a) => a.id === selectedAvatarId)?.url
          ?? SYSTEM_AVATARS[0].url;

        result = await register({
          name:      formData.name,
          email:     formData.email,
          password:  formData.password,
          avatarUrl, // ← зөв URL явна
        });
      }
      if (result.success) {
        setSuccess(isLogin ? 'Амжилттай нэвтэрлээ!' : 'Амжилттай бүртгүүллээ!');
        if (onLogin && result.user) onLogin(result.user);
        const target = result.user?.role === 'admin' ? '/admin' : '/';
        setTimeout(() => navigate(target), 600);
      } else {
        setError(result.message || 'Алдаа гарлаа');
      }
    } catch (err) {
      setError('Серверт холбогдоход алдаа гарлаа.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
  setIsLoading(true);
  setError('');
  try {
    const authProvider =
      provider === 'Google'
        ? new GoogleAuthProvider()
        : new FacebookAuthProvider();

    const result = await signInWithPopup(auth, authProvider);
    const firebaseUser = result.user;

    // Таны existing register/login logic-тай нэгтгэнэ
    const syncResult = await register({
      name:      firebaseUser.displayName ?? 'Хэрэглэгч',
      email:     firebaseUser.email,
      password:  firebaseUser.uid,          // uid-г нууц үг болгоно (backend-д hash хийнэ)
      avatarUrl: firebaseUser.photoURL ?? SYSTEM_AVATARS[0].url,
      oauthProvider: provider.toLowerCase(), // backend мэдэх тул давхар бүртгэлгүй
    });

    if (syncResult.success) {
      if (onLogin && syncResult.user) onLogin(syncResult.user);
      const target = syncResult.user?.role === 'admin' ? '/admin' : '/';
      navigate(target);
    } else {
      setError(syncResult.message || 'Нэвтрэхэд алдаа гарлаа.');
    }
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user') {
      setError('Нэвтрэх цонхыг хаалаа.');
    } else if (err.code === 'auth/account-exists-with-different-credential') {
      setError('Энэ имэйлтэй бүртгэл аль хэдийн байна.');
    } else {
      setError(`${provider}-р нэвтрэхэд алдаа гарлаа.`);
    }
    console.error('Social login error:', err);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-center mb-8 md:mb-12"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4">
              <img src="/kdt.png" alt="KDT" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              ХОВД АЙМГИЙН ХӨГЖИМТ КИНО ТЕАТР
            </h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base">
              {isLogin ? 'Тасалбар захиалах бол нэвтрэнэ үү' : 'Шинэ бүртгэл үүсгэх'}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                ⚠️ {error}
              </motion.div>
            )}
            {success && (
              <motion.div key="success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm">
                ✅ {success}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex border-b border-white/10">
              <button type="button" onClick={() => switchTab(true)}
                className={`flex-1 py-4 md:py-6 font-semibold transition-all duration-500 relative ${isLogin ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                Нэвтрэх
                {isLogin && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />}
              </button>
              <button type="button" onClick={() => switchTab(false)}
                className={`flex-1 py-4 md:py-6 font-semibold transition-all duration-500 relative ${!isLogin ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                Бүртгүүлэх
                {!isLogin && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-4 md:space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? 'login' : 'signup'}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 md:space-y-5"
                >
                  {!isLogin && (
                    <>
                      <div className="rounded-2xl border border-white/8 bg-white/3 px-2 py-3">
                        {/* ✅ selectedId / onSelect props */}
                        <AvatarSelector
                          selectedId={selectedAvatarId}
                          onSelect={setSelectedAvatarId}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Нэр</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300"
                          placeholder="Өөрийн нэрээ оруулна уу" required={!isLogin} disabled={isLoading} />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Имэйл</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300"
                      placeholder="имэйл@жишээ.com" required disabled={isLoading} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Нууц үг</label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300"
                      placeholder="Нууц үгээ оруулна уу" required disabled={isLoading} />
                    {!isLogin && <p className="text-xs text-gray-500">Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой</p>}
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Нууц үг баталгаажуулах</label>
                      <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300"
                        placeholder="Нууц үгээ дахин оруулна уу" required={!isLogin} disabled={isLoading} />
                    </div>
                  )}

                  {isLogin && (
                    <div className="flex items-center justify-between mt-2">
                      <label className="flex items-center space-x-3 cursor-pointer" onClick={() => setRememberMe((prev) => !prev)}>
                        <div className={`w-5 h-5 border-2 rounded transition-all duration-300 flex items-center justify-center
                          ${rememberMe ? 'bg-purple-500 border-purple-500' : 'bg-white/5 border-white/20'}`}>
                          {rememberMe && (
                            <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </motion.svg>
                          )}
                        </div>
                        <span className="text-sm text-gray-300">Намайг санах</span>
                      </label>
                      <button type="button" onClick={() => setError('Нууц үг сэргээх нь түр хугацаанд ашиглах боломжгүй.')}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                        Нууц үгээ мартсан уу?
                      </button>
                    </div>
                  )}

                  <motion.button type="submit" disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    className="w-full py-3 md:py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-2xl transition-all duration-500 shadow-2xl shadow-purple-500/30 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    {isLoading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto" />
                    ) : (
                      <span className="relative">{isLogin ? 'Нэвтрэх' : 'Бүртгүүлэх'}</span>
                    )}
                  </motion.button>
                </motion.div>
              </AnimatePresence>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-transparent text-gray-400">Эсвэл</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
  <button
    type="button"
    onClick={() => handleSocialLogin('Google')}
    disabled={isLoading}
    className="flex items-center justify-center space-x-3 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all disabled:opacity-50"
  >
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
    </svg>
    <span className="text-sm font-medium">Google</span>
  </button>
                 <button
    type="button"
    disabled
    className="flex items-center justify-center space-x-3 py-3 px-4 bg-white/5 border border-white/10 rounded-2xl text-white/30 cursor-not-allowed"
  >
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
    <span className="text-sm font-medium">Тун удахгүй</span>
  </button>
</div>
            </form>

            <div className="px-4 md:px-8 pb-6 pt-2">
              <button type="button" onClick={() => navigate('/')} disabled={isLoading}
                className="w-full text-center text-gray-400 hover:text-white text-sm transition-colors">
                ← Нүүр хуудас руу буцах
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }}
            className="text-center mt-6 md:mt-8 text-gray-400 text-xs md:text-sm">
            <p>©2025 Б.ТӨМӨРЧӨДӨРИЙН бүтээл. Бүх эрх хуулиар хамгаалагдсан.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CinematicLogin;