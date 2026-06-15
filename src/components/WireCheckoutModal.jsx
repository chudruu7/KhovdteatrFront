import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import wireAPI from '../api/wireAPI';

const POLL_INTERVAL_MS = 1000;
const PAYMENT_TIMEOUT_SECS = 600;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isUrl = (value) => /^[a-z][a-z0-9+.-]*:\/\//i.test(String(value || ''));
const isImageUrl = (value) => (
  /^data:image\//i.test(String(value || '')) ||
  /\.(avif|bmp|gif|ico|jpeg|jpg|png|svg|webp)(\?|#|$)/i.test(String(value || ''))
);

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function QPayMark({ logo }) {
  if (logo) {
    return <img src={logo} alt="qPay" className="h-7 w-7 rounded-lg object-contain" />;
  }

  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0b4f91]">
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-label="qPay logo">
        <circle cx="16" cy="16" r="11" fill="#ffffff" />
        <path
          d="M22.8 22.2 27 26.3l-4.4 1-2.2-2.2A10.2 10.2 0 1 1 26.2 16h-5.3a4.9 4.9 0 1 0-1.8 3.8l-2.8-2.8h6.5v5.2Z"
          fill="#0b4f91"
        />
      </svg>
    </div>
  );
}

function parseWireAction(nextAction) {
  const banks = [];
  const qrImages = [];
  const qrTexts = [];

  const getFirstString = (obj, keys) => {
    for (const key of keys) {
      if (typeof obj?.[key] === 'string' && obj[key]) return obj[key];
    }
    return '';
  };

  const visit = (value, parentLabel = 'Төлөх', path = []) => {
    if (!value) return;

    if (typeof value === 'string') {
      const key = path.join('.').toLowerCase();
      if ((/qr_image|qrimage/.test(key) || isImageUrl(value)) && !/(logo|icon|avatar|thumbnail)/.test(key)) {
        qrImages.push(value);
        return;
      }
      if ((/qr_text|qrtext|qr_code|qrcode/.test(key) || (!isUrl(value) && value.length > 40)) && !isImageUrl(value)) {
        qrTexts.push(value);
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, parentLabel, [...path, String(index)]));
      return;
    }

    if (typeof value === 'object') {
      const label = getFirstString(value, ['name', 'title', 'bank', 'operator', 'description']) || parentLabel;
      const url = getFirstString(value, ['deeplink', 'link', 'url', 'payment_url', 'checkout_url', 'redirect_url', 'web_url']);
      const logo = getFirstString(value, ['logo', 'icon', 'image', 'thumbnail']);

      if (url && isUrl(url) && !isImageUrl(url)) {
        banks.push({ label, url, logo: isImageUrl(logo) ? logo : '' });
      }

      Object.entries(value).forEach(([key, item]) => visit(item, label, [...path, key]));
    }
  };

  visit(nextAction);

  const seenBanks = new Set();
  const uniqueBanks = banks.filter((bank) => {
    const id = `${bank.label}-${bank.url}`;
    if (seenBanks.has(id)) return false;
    seenBanks.add(id);
    return true;
  });

  return {
    banks: uniqueBanks,
    qrImage: [...new Set(qrImages)][0] || '',
    qrText: [...new Set(qrTexts)][0] || '',
  };
}

export default function WireCheckoutModal({ bookingId, amount, seats, movieTitle, onSuccess, onClose }) {
  const [step, setStep] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT_SECS);
  const [nextAction, setNextAction] = useState(null);
  const [checking, setChecking] = useState(false);
  const [isMobilePaymentView, setIsMobilePaymentView] = useState(false);
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const paidRef = useRef(false);
  const initRef = useRef(false);
  const statusCheckRef = useRef(false);

  const action = useMemo(() => parseWireAction(nextAction), [nextAction]);
  const qpayLogo = useMemo(() => (
    action.banks.find((bank) => /q\s*pay|qpay/i.test(bank.label || ''))?.logo || ''
  ), [action.banks]);

  useEffect(() => {
    const updatePaymentView = () => {
      const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
      const smallScreen = window.matchMedia?.('(max-width: 640px)').matches;
      setIsMobilePaymentView(Boolean(coarsePointer && smallScreen));
    };

    updatePaymentView();
    window.addEventListener('resize', updatePaymentView);
    return () => window.removeEventListener('resize', updatePaymentView);
  }, []);

  const cleanup = () => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  };

  const finishPaid = () => {
    if (paidRef.current) return;
    paidRef.current = true;
    cleanup();
    setStep('success');
    setTimeout(() => onSuccess?.(), 1200);
  };

  const checkPaymentNow = async ({ silent = false } = {}) => {
    if (!bookingId || paidRef.current) return false;
    if (statusCheckRef.current) return false;
    statusCheckRef.current = true;
    if (!silent) setChecking(true);
    try {
      const attempts = silent ? 1 : 5;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const res = await wireAPI.checkPaymentStatus(bookingId);
        if (res.success && res.paid) {
          finishPaid();
          return true;
        }
        if (!silent && attempt < attempts - 1) await wait(700);
      }
      if (!silent) setErrorMsg('Төлбөр хараахан баталгаажаагүй байна.');
      return false;
    } catch (err) {
      if (!silent) {
        setErrorMsg(err?.response?.data?.message || 'Төлбөрийн төлөв шалгахад алдаа гарлаа.');
      }
      return false;
    } finally {
      statusCheckRef.current = false;
      if (!silent) setChecking(false);
    }
  };

  const startPolling = () => {
    pollRef.current = setInterval(() => {
      checkPaymentNow({ silent: true });
    }, POLL_INTERVAL_MS);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          cleanup();
          setStep('error');
          setErrorMsg('Төлбөрийн хугацаа дууслаа. Дахин оролдоно уу.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const init = async () => {
    if (!bookingId) return;
    if (initRef.current && step !== 'error') return;
    initRef.current = true;
    cleanup();
    paidRef.current = false;
    setStep('loading');
    setErrorMsg('');
    setNextAction(null);
    setTimeLeft(PAYMENT_TIMEOUT_SECS);

    try {
      const res = await wireAPI.createCheckout({
        bookingId,
        successUrl: `${window.location.origin}/ticket-verify/${bookingId}`,
      });
      if (!res.success) throw new Error('Wire checkout үүсгэхэд алдаа гарлаа.');

      setNextAction(res?.data?.nextAction || null);
      setStep('checkout');
      startPolling();
      startTimer();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Wire checkout холбогдоход алдаа гарлаа.');
      setStep('error');
    }
  };

  useEffect(() => {
    init();
    return () => cleanup();
  }, [bookingId]);

  const handleClose = () => {
    // ЗАСВАР: Wire payment intent үүссэн тохиолдолд booking-г устгахгүй.
    // Хэрэглэгч дахиад modal нээхэд хуучин payment intent-г reuse хийнэ.
    // Ингэснээр банкны апп-д "давхар гүйлгээ" алдаа гарахгүй болно.
    cleanup();
    onClose?.();
  };

  const handleRetry = () => {
    initRef.current = false;
    init();
  };

  const openBank = (url) => {
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white sm:rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-9 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 px-5 pb-3 pt-1">
          <div className="flex items-center gap-2.5">
            <QPayMark logo={qpayLogo} />
            <span className="text-[15px] font-semibold text-gray-900">Төлбөрийн арга</span>
          </div>
          <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors text-sm">
            ×
          </button>
        </div>

        <div className="bg-emerald-50/60 px-5 py-3.5 border-b border-gray-100">
          <p className="text-xs text-gray-500 mb-0.5">Төлбөрийн дүн</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900 tracking-tight">{Number(amount).toLocaleString()}</span>
            <span className="text-base font-medium text-gray-600">₮</span>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">{movieTitle}</span>
            {seats?.length > 0 && (
              <span className="rounded-md bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                Суудал: {seats.join(', ')}
              </span>
            )}
          </div>
        </div>

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="h-9 w-9 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-500">Нэхэмжлэх үүсгэж байна...</p>
          </div>
        )}

        {step === 'checkout' && (
          <div className="px-5 py-5">
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                {action.qrImage ? (
                  <img src={action.qrImage} alt="Wire QR" className="h-52 w-52 object-contain" />
                ) : action.qrText ? (
                  <QRCodeSVG value={action.qrText} size={208} includeMargin />
                ) : (
                  <div className="flex h-52 w-52 items-center justify-center text-center text-sm text-gray-500">
                    QR мэдээлэл олдсонгүй
                  </div>
                )}
              </div>
            </div>

            {!isMobilePaymentView && (
              <p className="mb-3 text-center text-sm text-gray-500 leading-relaxed">
                QR кодыг банкны апп-аараа уншуулж төлбөрөө төлнө үү.
              </p>
            )}

            <p className={`${isMobilePaymentView ? '' : 'hidden'} mb-3 text-center text-sm text-gray-500 leading-relaxed`}>
              QR уншуулах эсвэл доорх банкнаас сонгож апп руугаа шилжин төлбөрөө төлнө үү.
            </p>

            {isMobilePaymentView && action.banks.length > 0 && (
              <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                {action.banks.map((bank, index) => (
                  <button
                    key={`${bank.url}-${index}`}
                    onClick={() => openBank(bank.url)}
                    className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border border-gray-100 bg-gray-50 px-1 py-2 text-center transition active:scale-95 hover:bg-emerald-50"
                    title={bank.label}
                  >
                    {bank.logo ? (
                      <img src={bank.logo} alt="" className="h-8 w-8 rounded-lg object-contain" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                        {String(bank.label || 'Б').slice(0, 1)}
                      </div>
                    )}
                    <span className="line-clamp-2 text-[10px] font-medium leading-tight text-gray-700">
                      {bank.label || 'Банк'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-center font-mono text-sm font-bold text-emerald-700">
              {formatTime(timeLeft)}
            </div>

            {errorMsg && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
                {errorMsg}
              </p>
            )}

            <button
              onClick={() => checkPaymentNow()}
              disabled={checking}
              className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60 active:opacity-80"
            >
              {checking ? 'Баталгаажуулж байна...' : 'Төлбөр баталгаажуулах'}
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center px-5 py-10 gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-600">✓</div>
            <h3 className="text-lg font-bold text-gray-900">Төлбөр амжилттай!</h3>
            <p className="text-center text-sm text-gray-500 leading-relaxed">Тасалбар бэлдэж байна...</p>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center px-5 py-10 gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl text-red-500">!</div>
            <h3 className="text-lg font-bold text-gray-900">Алдаа гарлаа</h3>
            <p className="text-center text-sm text-gray-500 leading-relaxed">{errorMsg}</p>
            <button onClick={handleRetry} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-opacity active:opacity-80">
              Дахин оролдох
            </button>
            <button onClick={handleClose} className="text-sm text-gray-400 py-1">
              Цуцлах
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
