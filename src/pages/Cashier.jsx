import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { BrowserQRCodeReader } from '@zxing/browser';
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
    panel: 'border-emerald-500/40 bg-emerald-500/10',
    text: 'text-emerald-300',
    badge: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  };
  if (admission?.result === 'warning') return {
    icon: Clock,
    panel: 'border-amber-500/40 bg-amber-500/10',
    text: 'text-amber-300',
    badge: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  };
  return {
    icon: XCircle,
    panel: 'border-red-500/40 bg-red-500/10',
    text: 'text-red-300',
    badge: 'bg-red-500/15 text-red-300 ring-red-500/30',
  };
};

const TicketPanel = ({ booking, scan, onAdmit, admitting }) => {
  if (!booking && !scan) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
          <ScanLine className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black text-white">QR уншуулахад бэлэн</h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Утсаа station-д холбоод хэрэглэгчийн тасалбарын QR-ийг уншуулна. Мэдээлэл энэ дэлгэц дээр автоматаар гарна.
        </p>
      </div>
    );
  }

  const admission = booking?.admission || {};
  const style = statusStyle(admission);
  const StatusIcon = style.icon;

  return (
    <div className={`rounded-2xl border p-6 shadow-2xl ${style.panel}`}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-black/25 ${style.text}`}>
            <StatusIcon className="h-9 w-9" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Тасалбарын төлөв</p>
            <h2 className={`mt-1 text-3xl font-black ${style.text}`}>
              {admission.label || scan?.message || 'Шалгагдсан'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-300">{admission.reason || scan?.message}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black ring-1 ${style.badge}`}>
          <ShieldCheck className="h-4 w-4" />
          {booking?.paymentStatus === 'paid' ? 'Төлөгдсөн' : 'Төлбөр баталгаажаагүй'}
        </span>
      </div>

      {booking && (
        <>
          <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
              {booking.posterUrl ? (
                <img src={booking.posterUrl} alt={booking.movieTitle} className="h-full min-h-[250px] w-full object-cover" />
              ) : (
                <div className="flex min-h-[250px] items-center justify-center text-slate-500">
                  <Ticket className="h-16 w-16" />
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-2xl font-black text-white">{booking.movieTitle}</h3>
              <p className="mt-1 text-xs font-bold text-slate-500">#{booking.bookingCode}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
                  <div key={label} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-1 break-words text-sm font-bold text-white">{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onAdmit}
              disabled={!admission.allowed || admitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-4 text-sm font-black text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
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
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const lastValueRef = useRef('');
  const [manualCode, setManualCode] = useState('');
  const [message, setMessage] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [startingCamera, setStartingCamera] = useState(false);

  const submitScan = useCallback(async (value) => {
    const qrData = String(value || '').trim();
    if (!qrData || submitting) return;
    if (lastValueRef.current === qrData) return;
    lastValueRef.current = qrData;
    setSubmitting(true);
    try {
      const data = await cashierAPI.submitScan(stationKey, qrData);
      setMessage(data.booking?.movieTitle ? `${data.booking.movieTitle} уншигдлаа` : 'QR уншигдлаа');
      setTimeout(() => { lastValueRef.current = ''; }, 2500);
    } catch (err) {
      setMessage(err.message || 'QR уншихад алдаа гарлаа');
      setTimeout(() => { lastValueRef.current = ''; }, 2500);
    } finally {
      setSubmitting(false);
    }
  }, [stationKey, submitting]);

  const startCamera = useCallback(async () => {
    setStartingCamera(true);
    setCameraError('');
    try {
      controlsRef.current?.stop?.();
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (!result) return;
          submitScan(result.getText());
        },
      );
    } catch (err) {
      setCameraError(err.message || 'Камер нээж чадсангүй. Permission зөвшөөрөөд дахин оролдоно уу.');
    } finally {
      setStartingCamera(false);
    }
  }, [submitScan]);

  useEffect(() => {
    startCamera();
    return () => {
      controlsRef.current?.stop?.();
    };
  }, [startCamera]);

  /* Removed legacy auto-start camera effect.
    const start = async () => {
      try {
        const reader = new BrowserQRCodeReader();
        controlsRef.current = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (!alive || !result) return;
            submitScan(result.getText());
          },
        );
      } catch (err) {
        setCameraError(err.message || 'Камер нээж чадсангүй. Permission зөвшөөрөөд дахин оролдоно уу.');
      }
    };

    start();
    return () => {
      alive = false;
      controlsRef.current?.stop?.();
    };
  }, [submitScan]);
  */

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-400">Cashier mobile scanner</p>
          <h1 className="mt-2 text-2xl font-black">QR уншуулах</h1>
          <p className="mt-1 text-sm text-slate-400">Station: {stationKey}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black">
          <video ref={videoRef} className="aspect-[3/4] w-full object-cover" muted playsInline />
        </div>

        {cameraError && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            {cameraError}
          </div>
        )}
        <button
          onClick={startCamera}
          disabled={startingCamera}
          className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-black disabled:bg-slate-700 disabled:text-slate-400"
        >
          {startingCamera ? 'Камер нээж байна...' : 'Камер нээх'}
        </button>
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <ScanLine className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-400">Gate control</p>
              <h1 className="text-2xl font-black">Cashier тасалбар шалгах</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-4 flex items-center gap-3">
              <MonitorSmartphone className="h-5 w-5 text-emerald-400" />
              <h2 className="font-black">Утас холбох</h2>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <QRCodeSVG value={scannerUrl} size={260} className="h-auto w-full" />
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Cashier эрхтэй утсаараа энэ QR-ийг уншуулж scanner нээнэ. Уншсан тасалбар энэ компьютер дээр гарна.
            </p>
            <button onClick={resetStation} className="mt-4 w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800">
              Station шинэчлэх
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h2 className="font-black">Гараар шалгах</h2>
            <input
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="Захиалгын код эсвэл QR URL"
              className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />
            <button
              onClick={submitManualScan}
              disabled={loading || !manualCode.trim()}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
              Шалгах
            </button>
          </div>
        </aside>

        <TicketPanel booking={booking} scan={scan} onAdmit={admit} admitting={admitting} />
      </main>
    </div>
  );
}
