import { useState, useEffect, useRef } from "react";
import qpayAPI from "../api/qpayAPI";

const POLL_INTERVAL_MS = 3000;

const BANKS = [
  { name: "Хаан банк",  short: "ХБ",  color: "#d32f2f", deeplink: "khanbank", logo: "/public/haan.jpg" },
  { name: "Голомт",     short: "ГБ",  color: "#1565c0", deeplink: "golomtbank", logo: "https://companieslogo.com/img/orig/GOLOMT.MN-12a05a42.png?t=1637187775" },
  { name: "ХХБ",        short: "ХХБ", color: "#2e7d32", deeplink: "tdbbank", logo: "https://upload.wikimedia.org/wikipedia/en/0/0b/Trade_and_Development_Bank_of_Mongolia_logo.png" },
  { name: "Төрийн",     short: "ТБ",  color: "#6a1b9a", deeplink: "statebankmongolia", logo: "https://statebank.mn/images/logo.png" },
  { name: "ХАС банк",   short: "ХАС", color: "#e65100", deeplink: "xacbank", logo: "https://companieslogo.com/img/orig/XAC.MN-0a0d292a.png?t=1637187775" },
  { name: "Social Pay", short: "SP",  color: "#0288d1", deeplink: "socialpay-payment", logo: "https://play-lh.googleusercontent.com/8g7XmTqJtU5kY5KJ5q5J5q5J5q5J5q5J5q5J5q5J5q5J5q5J5q5J5q5J5q5J5" },
  { name: "Ард апп",    short: "АРД", color: "#00796b", deeplink: "ard", logo: "https://ardcredit.mn/images/logo.png" },
  { name: "Богд",       short: "БГД", color: "#37474f", deeplink: "bogdbank", logo: "https://bogdbank.mn/images/logo.png" },
  { name: "M банк",     short: "М",   color: "#ad1457", deeplink: "mbank", logo: "https://www.mbank.mn/img/logo.png" },
  { name: "Чингис",     short: "ЧК",  color: "#4527a0", deeplink: "ckbank", logo: "https://chinggisbank.mn/img/logo.png" },
  { name: "Мост Мани",  short: "MM",  color: "#558b2f", deeplink: "most", logo: "https://mostmoney.mn/img/logo.png" },
  { name: "Транс",      short: "ТРБ", color: "#455a64", deeplink: "transbank", logo: "https://transbank.mn/img/logo.png" },
];

function formatTime(s) {
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

export default function QPayModal({ bookingId, amount, seats, movieTitle, onSuccess, onClose }) {
  const [step, setStep] = useState("loading");
  const [invoiceId, setInvoiceId] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [bankUrls, setBankUrls] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [timeLeft, setTimeLeft] = useState(180);
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await qpayAPI.createInvoice({ bookingId, amount, seats, movieTitle });
        if (res.success) {
          setInvoiceId(res.data.invoiceId);
          setQrCode(res.data.qrCode);
          setBankUrls(res.data.urls || []);
          setStep("qr");
          startPolling(res.data.invoiceId);
          startTimer();
        } else throw new Error();
      } catch {
        setErrorMsg("QPay холбогдоход алдаа гарлаа. Дахин оролдоно уу.");
        setStep("error");
      }
    };
    init();
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (step === "qr" && qrCode && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, 168, 168);
        ctx.drawImage(img, 0, 0, 168, 168);
      };
      img.src = `data:image/png;base64,${qrCode}`;
    }
  }, [step, qrCode]);

  const startPolling = (id) => {
  pollRef.current = setInterval(async () => {
    try {
      const res = await qpayAPI.checkPayment(id);
      if (res.success && res.data.paid) {
        cleanup();
        // ← confirmBooking дуудна
        await fetch(`https://khovdteatrbackend.onrender.com/bookings/${bookingId}/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setStep("success");
        setTimeout(() => onSuccess?.(), 2500);
      }
    } catch {}
  }, POLL_INTERVAL_MS);
};

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          cleanup();
          setStep("error");
          setErrorMsg("Төлбөрийн хугацаа дууслаа. Дахин оролдоно уу.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cleanup = () => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
  };

  const handleClose = async () => {
  cleanup();
  if (invoiceId && step === "qr") {
    try { await qpayAPI.cancelInvoice(invoiceId); } catch {}
  }
  // ← НЭМЭХ: booking-г шууд цуцлах
  if (bookingId && step === "qr") {
    try {
      await fetch(`https://khovdteatrbackend.onrender.com/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
    } catch {}
  }
  onClose?.();
};

  const handleRetry = () => {
    cleanup();
    setTimeLeft(180);
    setStep("loading");
    const reInit = async () => {
      try {
        const res = await qpayAPI.createInvoice({ bookingId, amount, seats, movieTitle });
        if (res.success) {
          setInvoiceId(res.data.invoiceId);
          setQrCode(res.data.qrCode);
          setBankUrls(res.data.urls || []);
          setStep("qr");
          startPolling(res.data.invoiceId);
          startTimer();
        } else throw new Error();
      } catch {
        setErrorMsg("QPay холбогдоход алдаа гарлаа. Дахин оролдоно уу.");
        setStep("error");
      }
    };
    reInit();
  };

  const timerColor = timeLeft > 60 ? "#1a56db" : timeLeft > 30 ? "#f59e0b" : "#ef4444";
  const progressPct = Math.round((timeLeft / 180) * 100);
  const isUrgent = timeLeft <= 30;

  const getBankUrl = (bank) => {
    const matched = bankUrls.find((u) => u?.name?.toLowerCase().includes(bank.deeplink));
    return matched?.link || `${bank.deeplink}://q?qPay_QRcode=${invoiceId}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white sm:rounded-2xl overflow-hidden shadow-2xl">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-9 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 pb-3 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700">
              <span className="text-sm font-bold text-white">Q</span>
            </div>
            <span className="text-[15px] font-semibold text-gray-900">QPay</span>
          </div>
          <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors text-sm">
            ✕
          </button>
        </div>

        {/* Loading */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="h-9 w-9 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-500">QR код бэлдэж байна...</p>
          </div>
        )}

        {/* QR */}
        {step === "qr" && (
          <>
            <div className="bg-blue-50/60 px-5 py-3.5 border-b border-gray-100">
              <p className="text-xs text-gray-500 mb-0.5">Төлбөрийн дүн</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">{Number(amount).toLocaleString()}</span>
                <span className="text-base font-medium text-gray-600">₮</span>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">{movieTitle}</span>
                {seats?.length > 0 && (
                  <span className="rounded-md bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                    Суудал: {seats.join(", ")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 border-b border-gray-100 px-5 py-4">
              <div className="rounded-2xl border border-gray-200 p-2.5">
                <canvas ref={canvasRef} width={168} height={168} />
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="9" r="5.5" stroke="#9ca3af" strokeWidth="1.4" />
                  <path d="M8 6.5V9l1.5 1" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M6 2h4" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span style={{ color: timerColor }} className={`font-mono text-base font-bold tabular-nums transition-colors ${isUrgent ? "animate-pulse" : ""}`}>
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs text-gray-400">дотор уншуулна уу</span>
              </div>
              <div className="h-0.5 w-52 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progressPct}%`, background: timerColor }} />
              </div>
              <p className="text-xs text-gray-400">Банкны аппликейшнаараа QR уншуулна уу</p>

              {/* DEV тест товч */}
              {import.meta.env.DEV && (
  <button
    onClick={async () => {
      cleanup();
      try {
        await fetch(`https://khovdteatrbackend.onrender.com/bookings/${bookingId}/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
      } catch (e) {
        console.error('Confirm error:', e);
      }
      setStep("success");
      setTimeout(() => onSuccess?.(), 2500);
    }}
    className="w-full rounded-xl border border-dashed border-green-400 bg-green-50 py-2 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
  >
    ✅ [TEST] Төлөгдсөн болгох
  </button>
)}
            </div>

            <div className="px-4 pb-5 pt-1">
              <p className="py-3 text-center text-xs text-gray-400">эсвэл банкаа сонгоно уу</p>
              <div className="grid grid-cols-3 gap-2">
                {BANKS.map((bank) => (
                  <a key={bank.deeplink} href={getBankUrl(bank)} className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-2 py-2.5 transition-all active:scale-95 hover:border-blue-200 hover:bg-blue-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ background: bank.color }}>
                      {bank.short}
                    </div>
                    <span className="text-center text-[10px] font-medium leading-tight text-gray-600">{bank.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="flex flex-col items-center px-5 py-10 gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Төлбөр амжилттай!</h3>
            <p className="text-center text-sm text-gray-500 leading-relaxed">
              Тасалбар амжилттай баталгаажлаа.<br />Таатай үзэлт болоорой!
            </p>
            <div className="w-full rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 mt-1">
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-500">Кино</span>
                <span className="font-semibold text-gray-800">{movieTitle}</span>
              </div>
              {seats?.length > 0 && (
                <div className="flex justify-between py-1 text-sm items-center">
                  <span className="text-gray-500">Суудал</span>
                  <div className="flex gap-1">
                    {seats.map((s) => (
                      <span key={s} className="rounded bg-blue-700 px-2 py-0.5 text-[11px] font-bold text-white">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between border-t border-blue-100 pt-2 mt-1 text-sm">
                <span className="text-gray-500">Нийт</span>
                <span className="font-bold text-blue-700">{Number(amount).toLocaleString()}₮</span>
              </div>
            </div>
            <button onClick={onClose} className="mt-1 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity active:opacity-80">
              И-баримт авах →
            </button>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="flex flex-col items-center px-5 py-10 gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#ef4444" strokeWidth="1.8" />
                <path d="M12 8v4m0 4h.01" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Алдаа гарлаа</h3>
            <p className="text-center text-sm text-gray-500 leading-relaxed">{errorMsg}</p>
            <button onClick={handleRetry} className="w-full rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white transition-opacity active:opacity-80">
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