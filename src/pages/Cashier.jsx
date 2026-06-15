import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanType, Html5QrcodeScanner } from 'html5-qrcode';
import {
  CheckCircle2,
  Clock,
  LogOut,
  MonitorSmartphone,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Ticket,
  XCircle,
} from 'lucide-react';
import { cashierAPI } from '../api/adminAPI';
import CashierBookingModule from '../admin/modules/CashierBookingModule';

const money = (value) => `${Number(value || 0).toLocaleString('mn-MN')}₮`;

const randomStationKey = () => {
  if (crypto?.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 18);
  return `station-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getStationKey = () => {
  const saved = localStorage.getItem('cashierStationKey');
  if (saved) return saved;
  const key = randomStationKey();
  localStorage.setItem('cashierStationKey', key);
  return key;
};

const statusStyle = (admission) => {
  if (admission?.allowed) return {
    icon: CheckCircle2,
    panel: 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-900/5 to-transparent',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    glow: 'shadow-lg shadow-emerald-500/10',
    statusLabel: 'Баталгаажсан',
  };
  if (admission?.result === 'warning') return {
    icon: Clock,
    panel: 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-900/5 to-transparent',
    text: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
    glow: 'shadow-lg shadow-amber-500/10',
    statusLabel: 'Анхааруулга',
  };
  return {
    icon: XCircle,
    panel: 'border-red-500/30 bg-gradient-to-br from-red-500/10 via-red-900/5 to-transparent',
    text: 'text-red-400',
    badge: 'bg-red-500/15 text-red-300 ring-red-500/30',
    glow: 'shadow-lg shadow-red-500/10',
    statusLabel: 'Татгалзсан',
  };
};

const TicketPanel = ({ booking, scan, onAdmit, admitting }) => {
  if (!booking && !scan) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700/60 bg-slate-900/40 p-10 text-center backdrop-blur-sm">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-900 ring-1 ring-slate-700/50">
          <ScanLine className="h-11 w-11 text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-white">QR уншуулахад бэлэн</h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
          Утсаа station-д холбоод хэрэглэгчийн тасалбарын QR-ийг уншуулна. Эсвэл доорх <span className="text-slate-300 font-semibold">«Гараар шалгах»</span> хэсгээр захиалгын кодоо оруулаарай.
        </p>
      </div>
    );
  }

  const admission = booking?.admission || {};
  const style = statusStyle(admission);
  const StatusIcon = style.icon;

  return (
    <div className={`rounded-3xl border p-6 backdrop-blur-sm ${style.panel} ${style.glow}`}>
      {/* Status Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-black/30 ring-1 ring-white/5 ${style.text}`}>
            <StatusIcon className="h-8 w-8" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Тасалбарын төлөв</p>
            <h2 className={`text-2xl font-black leading-tight ${style.text}`}>
              {admission.label || scan?.message || style.statusLabel}
            </h2>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 ${style.badge}`}>
          <ShieldCheck className="h-3.5 w-3.5" />
          {booking?.paymentStatus === 'paid' ? 'Төлөгдсөн' : 'Баталгаажаагүй'}
        </span>
      </div>

      {admission.reason && (
        <p className="mb-5 rounded-xl bg-black/20 px-4 py-2.5 text-sm font-medium text-slate-300 ring-1 ring-white/5">
          {admission.reason}
        </p>
      )}

      {booking && (
        <>
          <div className="grid gap-5 lg:grid-cols-[160px_1fr]">
            <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
              {booking.posterUrl ? (
                <img src={booking.posterUrl} alt={booking.movieTitle} className="h-full min-h-[220px] w-full object-cover" />
              ) : (
                <div className="flex min-h-[220px] items-center justify-center bg-slate-800/50 text-slate-600">
                  <Ticket className="h-14 w-14" />
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-black/20 p-5 ring-1 ring-white/5">
              <h3 className="text-xl font-black text-white">{booking.movieTitle}</h3>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">#{booking.bookingCode}</p>

              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {[
                  ['Огноо', booking.date],
                  ['Цаг', booking.time],
                  ['Танхим', booking.hall],
                  ['Суудал', booking.seats?.join(', ')],
                  ['Захиалагч', booking.customerName],
                  ['Утас', booking.customerPhone],
                  ['Имэйл', booking.customerEmail],
                  ['Нийт дүн', money(booking.totalPrice)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                    <p className="mt-0.5 break-words text-sm font-semibold text-white">{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={onAdmit}
              disabled={!admission.allowed || admitting}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-sm font-black text-black shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none"
            >
              {admitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              Нэвтрүүлж ашигласан болгох
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const MobileScanner = ({ stationKey }) => {
  const scannerRef = useRef(null);
  const lastValueRef = useRef('');
  const submittingRef = useRef(false);
  const [manualCode, setManualCode] = useState('');
  const [message, setMessage] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitScan = useCallback(async (value) => {
    const qrData = String(value || '').trim();
    if (!qrData || submittingRef.current) return;
    if (lastValueRef.current === qrData) return;
    lastValueRef.current = qrData;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const data = await cashierAPI.submitScan(stationKey, qrData);
      setMessage(data.booking?.movieTitle ? `${data.booking.movieTitle} уншигдлаа` : 'QR уншигдлаа');
      setTimeout(() => { lastValueRef.current = ''; }, 2500);
    } catch (err) {
      setMessage(err.message || 'QR уншихад алдаа гарлаа');
      setTimeout(() => { lastValueRef.current = ''; }, 2500);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [stationKey]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('cashier-mobile-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      aspectRatio: 1,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
    }, false);

    scannerRef.current = scanner;
    scanner.render(
      (decodedText) => {
        setCameraError('');
        submitScan(decodedText);
      },
      (errorMessage) => {
        if (String(errorMessage || '').toLowerCase().includes('permission')) {
          setCameraError('Камерын эрх зөвшөөрөгдөөгүй байна. iPhone дээр Settings -> Safari -> Camera -> Allow болгож, энэ хуудсыг дахин нээгээрэй.');
        }
      },
    );

    return () => {
      scannerRef.current = null;
      scanner.clear().catch(() => {});
    };
  }, [submitScan]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-white p-1.5">
            <img src="/kdt.png" alt="KDT Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-400">Ховд аймгийн Хөгжимт драмын театр</p>
            <h1 className="mt-1 text-2xl font-black">QR уншуулах</h1>
            <p className="mt-1 text-sm text-slate-400">Station: {stationKey}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black p-3">
          <div id="cashier-mobile-reader" className="w-full text-slate-100" />
        </div>

        <p className="mt-3 text-xs font-semibold text-slate-500">
          iPhone Safari дээр камер асуух товч гарч ирэхэд зөвшөөрнө үү. Scanner нь HTTPS дээр ажиллана.
        </p>

        {cameraError && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            {cameraError}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-200">
            {message}
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Гараар оруулах код</label>
          <input
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="Захиалгын код эсвэл QR URL"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => submitScan(manualCode)}
            disabled={submitting || !manualCode.trim()}
            className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-black disabled:bg-slate-700 disabled:text-slate-400"
          >
            Илгээх
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Cashier({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const stationFromUrl = params.get('station');
  const isScanner = params.get('scan') === '1' && stationFromUrl;
  const [stationKey, setStationKey] = useState(stationFromUrl || getStationKey);
  const [scan, setScan] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [admitting, setAdmitting] = useState(false);
  const scannerUrl = useMemo(() => `${window.location.origin}/cashier?station=${stationKey}&scan=1`, [stationKey]);
  const booking = scan?.payload || scan?.booking;
  const [activeTab, setActiveTab] = useState('verify'); // 'verify' or 'sell'

  useEffect(() => {
    if (stationFromUrl && stationFromUrl !== stationKey) setStationKey(stationFromUrl);
  }, [stationFromUrl, stationKey]);

  useEffect(() => {
    if (isScanner) return;
    let alive = true;
    const load = async () => {
      try {
        const data = await cashierAPI.getLatestScan(stationKey);
        if (!alive) return;
        if (data.scan?._id && data.scan?._id !== scan?._id) setScan(data.scan);
      } catch {}
    };
    load();
    const timer = setInterval(load, 1800);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [stationKey, isScanner, scan?._id]);

  const refreshLatestScan = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await cashierAPI.getLatestScan(stationKey);
      setScan(data.scan || null);
    } finally {
      setLoading(false);
    }
  };

  const resetStation = () => {
    const key = randomStationKey();
    localStorage.setItem('cashierStationKey', key);
    setStationKey(key);
    setScan(null);
  };

  const submitManualScan = async () => {
    if (!manualCode.trim()) return;
    setLoading(true);
    try {
      const data = await cashierAPI.submitScan(stationKey, manualCode);
      setScan(data.scan);
      setManualCode('');
    } finally {
      setLoading(false);
    }
  };

  const admit = async () => {
    const id = booking?.id || booking?.bookingCode;
    if (!id) return;
    setAdmitting(true);
    try {
      const data = await cashierAPI.admitTicket(id);
      setScan((prev) => ({
        ...(prev || {}),
        payload: data.booking,
        message: data.message,
        result: data.booking?.admission?.result || 'warning',
      }));
    } finally {
      setAdmitting(false);
    }
  };

  if (isScanner) return <MobileScanner stationKey={stationFromUrl} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-white p-1.5 shadow-lg shadow-emerald-950/30">
              <img src="/kdt.png" alt="KDT Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-400">Ховд аймгийн Хөгжимт драмын театр</p>
              <h1 className="text-2xl font-black">Тасалбар шалгах дэлгэц</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={refreshLatestScan}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800">
                Admin
              </button>
            )}
            <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-500/20">
              <LogOut className="h-4 w-4" />
              Гарах
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 mt-6 flex gap-4">
        <button 
          onClick={() => setActiveTab('verify')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'verify' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-lg shadow-emerald-500/20' : 'bg-slate-900/80 text-slate-400 ring-1 ring-slate-700/50 hover:bg-slate-800 hover:text-slate-200'}`}
        >
          🎫 Тасалбар шалгах
        </button>
        <button 
          onClick={() => setActiveTab('sell')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'sell' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-lg shadow-emerald-500/20' : 'bg-slate-900/80 text-slate-400 ring-1 ring-slate-700/50 hover:bg-slate-800 hover:text-slate-200'}`}
        >
          💰 Тасалбар борлуулах
        </button>
      </div>

      <main className="mx-auto max-w-7xl px-5 py-6">
        {activeTab === 'verify' ? (
          <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
            <aside className="space-y-5">
              {/* QR Connect Card */}
              <div className="rounded-3xl border border-slate-700/40 bg-slate-900/60 p-5 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <MonitorSmartphone className="h-4.5 w-4.5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Утас холбох</h2>
                    <p className="text-[11px] text-slate-500">QR-ийг утсаар уншуулна</p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-white/10">
                  <QRCodeSVG value={scannerUrl} size={260} className="h-auto w-full" />
                </div>
                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  Cashier эрхтэй утсаараа энэ QR-ийг уншуулж scanner нээнэ. Уншсан тасалбар энэ дэлгэц дээр гарна.
                </p>
                <button onClick={resetStation} className="mt-4 w-full rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white">
                  Station шинэчлэх
                </button>
              </div>

              {/* Manual Check Card */}
              <div className="rounded-3xl border border-slate-700/40 bg-slate-900/60 p-5 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700/40 ring-1 ring-slate-600/30">
                    <ScanLine className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <h2 className="text-sm font-bold text-white">Гараар шалгах</h2>
                </div>
                <div className="relative">
                  <input
                    value={manualCode}
                    onChange={(event) => setManualCode(event.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitManualScan()}
                    placeholder="Захиалгын код эсвэл QR URL..."
                    className="w-full rounded-xl border border-slate-700/60 bg-slate-950/80 px-4 py-3 pr-12 text-sm outline-none ring-1 ring-transparent transition-all focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                </div>
                <button
                  onClick={submitManualScan}
                  disabled={loading || !manualCode.trim()}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-black shadow-md shadow-emerald-500/15 transition-all hover:from-emerald-400 hover:to-emerald-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                  Шалгах
                </button>
              </div>
            </aside>

            <TicketPanel booking={booking} scan={scan} onAdmit={admit} admitting={admitting} />
          </div>
        ) : (
          <CashierBookingModule />
        )}
      </main>
    </div>
  );
}
