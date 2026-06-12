import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Home, CalendarDays, Newspaper, UserCircle, Gift, Info, Ticket, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_GUIDES = [
  {
    key: 'home',
    match: (path) => path === '/',
    icon: Home,
    title: 'Үзвэрүүд',
    items: [
      'Постер дээр дарж дэлгэрэнгүй үзнэ.',
      '“Тасалбар” товчоор захиалга эхлүүлнэ.',
      'Хайлт ашиглаж үзвэрээ хурдан олно.',
    ],
  },
  {
    key: 'schedule',
    match: (path) => path.startsWith('/schedule'),
    icon: CalendarDays,
    title: 'Үзвэрийн хуваарь',
    items: [
      'Дээд хэсгээс өдрөө сонгоно.',
      'Карт дотор тухайн үзвэр гарах өдрүүд л харагдана.',
      'Цаг дээр дарж суудал захиална.',
    ],
  },
  {
    key: 'booking',
    match: (path) => path.startsWith('/booking'),
    icon: Ticket,
    title: 'Тасалбар захиалах',
    items: [
      'Огноо, цаг, суудлаа шалгана.',
      'Тасалбарын төрлөө сонгоно.',
      'Төлбөр төлөөд тасалбараа авна.',
    ],
  },
  {
    key: 'news',
    match: (path) => path.startsWith('/news'),
    icon: Newspaper,
    title: 'Мэдээ',
    items: [
      'Зарлал, шинэ мэдээг эндээс харна.',
      'Мэдээ дээр дарж дэлгэрэнгүй уншина.',
    ],
  },
  {
    key: 'promotions',
    match: (path) => path.startsWith('/promotions'),
    icon: Gift,
    title: 'Урамшуулал',
    items: [
      'Идэвхтэй хөнгөлөлтийг шалгана.',
      'Тусгай саналын нөхцөлийг уншина.',
    ],
  },
  {
    key: 'about',
    match: (path) => path.startsWith('/about'),
    icon: Info,
    title: 'Бидний тухай',
    items: [
      'Театрын танилцуулгыг уншина.',
      'Байршил, холбоо барих мэдээлэл авна.',
    ],
  },
  {
    key: 'profile',
    match: (path) => path.startsWith('/profile'),
    icon: UserCircle,
    title: 'Миний профайл',
    items: [
      'Өөрийн мэдээллээ шалгана.',
      'Захиалгын түүхээ харна.',
      'Хэрэгтэй үед системээс гарна.',
    ],
  },
];

const OnboardingGuide = ({ isOpen, onClose, user }) => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const guide = useMemo(() => {
    return PAGE_GUIDES.find((item) => item.match(location.pathname)) || PAGE_GUIDES[0];
  }, [location.pathname]);

  const openGuide = () => {
    setManualOpen(true);
    setVisible(true);
  };

  useEffect(() => {
    window.addEventListener('kdt:open-guide', openGuide);
    return () => window.removeEventListener('kdt:open-guide', openGuide);
  }, []);

  useEffect(() => {
    if (manualOpen) {
      setVisible(true);
      return;
    }

    if (!isOpen) {
      setVisible(false);
      return;
    }

    const pending = localStorage.getItem('kdt_onboarding_pending') === '1';
    const seen = localStorage.getItem('kdt_onboarding_seen') === '1';
    setVisible(pending && !seen);
  }, [guide.key, isOpen, location.pathname, manualOpen]);

  const closeGuide = () => {
    if (!manualOpen) {
      localStorage.setItem('kdt_onboarding_seen', '1');
      localStorage.removeItem('kdt_onboarding_pending');
    }

    setManualOpen(false);
    setVisible(false);
    onClose?.();
  };

  const Icon = guide.icon;

  return (
    <>
      {!visible && (
        <button
          type="button"
          onClick={openGuide}
          className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-yellow-400 text-black shadow-2xl shadow-black/30 transition hover:scale-105 hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-300/35 sm:bottom-6 sm:right-6"
          aria-label="Заавар харах"
          title="Заавар"
        >
          <HelpCircle className="h-7 w-7" />
        </button>
      )}

      <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${guide.title} заавар`}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 text-white shadow-2xl"
            initial={{ scale: 0.94, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 18, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={closeGuide}
              className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Зааврыг хаах"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="bg-gradient-to-br from-yellow-500/20 via-white/5 to-teal-500/10 px-6 pb-5 pt-7">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                  <img src="/kdt.png" alt="KDT" className="h-12 w-12 object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-yellow-300">
                    Сайн байна уу{user?.name ? `, ${user.name}` : ''}?
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    Ховд аймгийн ХДТ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400 text-black">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black leading-tight">{guide.title}</h2>
              </div>
            </div>

            <div className="px-6 py-6">
              <ul className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                {guide.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-white/75">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={closeGuide}
                className="mt-5 h-11 w-full rounded-full bg-yellow-400 px-6 text-sm font-black text-black transition hover:bg-yellow-300"
              >
                Ойлголоо
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
};

export default OnboardingGuide;
