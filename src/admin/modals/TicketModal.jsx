import { X, Ticket, Calendar, Clock, User, Film } from "lucide-react";
import { useEffect, useState } from "react";
import { useConfirm } from './ConfirmModal';

/* ── Жинхэнэ QR код ─────────────────────────────────────────────────── */
function RealQR({ value, size = 96 }) {
  const url =
    `https://api.qrserver.com/v1/create-qr-code/` +
    `?size=${size * 2}x${size * 2}` +
    `&data=${encodeURIComponent(value)}` +
    `&color=1e293b&bgcolor=ffffff&margin=4&format=svg`;
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt="QR код"
      style={{ display: 'block', borderRadius: 6 }}
    />
  );
}

// ❌ const confirm = useConfirm(); — энэ мөрийг устгасан

/* ── TicketModal ─────────────────────────────────────────────────────── */
const TicketModal = ({ isOpen, onClose, ticket }) => {
  const confirm = useConfirm(); // ✅ компонент ДОТОР
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const qrValue = ticket
    ? `${ticket._id}|${ticket.date}|${ticket.time}|${ticket.seat}`
    : 'unknown';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md transition-all duration-300 transform
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        {/* Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-rose-500/20 rounded-3xl blur-xl" />

        <div className="relative bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-800/50 overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b border-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20">
                  <Ticket className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-100">Тасалбарын дэлгэрэнгүй</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {ticket ? (
              <>
                {/* QR код */}
                <div className="flex flex-col items-center py-4">
                  <div className="p-4 bg-white rounded-2xl shadow-xl mb-3">
                    <RealQR value={qrValue} size={96} />
                  </div>
                  <p className="text-xs text-gray-500 font-mono">
                    #{ticket._id?.slice(-8) || 'XXXXXX'}
                  </p>
                </div>

                {/* Кино */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Film className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Кино</p>
                      <p className="text-sm font-medium text-gray-200">
                        {ticket.movieTitle || 'Тодорхойгүй'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Огноо / Цаг */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">Огноо</span>
                    </div>
                    <p className="text-sm font-medium text-gray-200">
                      {ticket.date
                        ? new Date(ticket.date).toLocaleDateString('mn-MN')
                        : 'Тодорхойгүй'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">Цаг</span>
                    </div>
                    <p className="text-sm font-medium text-gray-200">
                      {ticket.time || 'Тодорхойгүй'}
                    </p>
                  </div>
                </div>

                {/* Хэрэглэгч / Суудал */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <User className="w-3.5 h-3.5" />
                      <span className="text-xs">Хэрэглэгч</span>
                    </div>
                    <p className="text-sm font-medium text-gray-200">
                      {ticket.userName || 'Тодорхойгүй'}
                    </p>
                    {ticket.userEmail && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {ticket.userEmail}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Ticket className="w-3.5 h-3.5" />
                      <span className="text-xs">Суудал</span>
                    </div>
                    <p className="text-sm font-medium text-gray-200">
                      {ticket.seat || 'Тодорхойгүй'}
                    </p>
                    {ticket.totalPrice > 0 && (
                      <p className="text-xs text-amber-400 mt-0.5">
                        ₮{ticket.totalPrice?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Төлөв */}
                {ticket.status && (
                  <div className="flex justify-center">
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      ${ticket.status === 'active'    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}
                      ${ticket.status === 'used'      ? 'bg-gray-500/10    text-gray-400    border border-gray-500/20'    : ''}
                      ${ticket.status === 'cancelled' ? 'bg-rose-500/10    text-rose-400    border border-rose-500/20'    : ''}
                    `}>
                      {ticket.status === 'active'    && 'Хүчинтэй'}
                      {ticket.status === 'used'      && 'Ашиглагдсан'}
                      {ticket.status === 'cancelled' && 'Цуцлагдсан'}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Тасалбар олдсонгүй</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 pt-0">
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-gray-800 hover:bg-gray-700
                         text-gray-300 font-medium text-sm transition-all duration-200
                         border border-gray-700/50"
            >
              Хаах
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;