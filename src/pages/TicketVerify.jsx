import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaTicketAlt } from 'react-icons/fa';
import { API_BASE_URL } from '../api/config';

const money = (value) => `${Number(value || 0).toLocaleString('mn-MN')}₮`;

const TicketVerify = () => {
  const { bookingId } = useParams();
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/bookings/verify/${bookingId}`);
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok || !data.success) {
          setState({ loading: false, error: data.message || data.reason || 'Тасалбар шалгахад алдаа гарлаа', data });
          return;
        }
        setState({ loading: false, error: '', data });
      } catch {
        if (mounted) setState({ loading: false, error: 'Сервертэй холбогдож чадсангүй', data: null });
      }
    };

    load();
    return () => { mounted = false; };
  }, [bookingId]);

  const booking = state.data?.booking;
  const isActive = Boolean(state.data?.isActive);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.04] p-7 shadow-2xl">
        {state.loading ? (
          <div className="py-16 text-center text-slate-400 font-bold">Тасалбар шалгаж байна...</div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
                isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}>
                {isActive ? <FaCheckCircle size={42} /> : <FaTimesCircle size={42} />}
              </div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500 mb-2">Тасалбарын төлөв</p>
              <h1 className={`text-4xl font-black mb-2 ${isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {state.data?.label || (isActive ? 'Идэвхтэй' : 'Идэвхгүй')}
              </h1>
              <p className="text-sm font-semibold text-slate-400">{state.data?.reason || state.error}</p>
            </div>

            {booking && (
              <div className="mt-8 rounded-3xl bg-black/20 border border-white/10 p-5">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <FaTicketAlt />
                  </div>
                  <div>
                    <h2 className="text-lg font-black leading-tight">{booking.movieTitle || booking.title || 'Тодорхойгүй кино'}</h2>
                    <p className="text-xs text-slate-500 font-bold mt-1">#{booking.bookingCode || booking.id}</p>
                  </div>
                </div>

                {[
                  ['Огноо', booking.date],
                  ['Цаг', booking.time],
                  ['Танхим', booking.hall],
                  ['Суудал', booking.seats?.join(', ')],
                  ['Төлбөр', booking.paymentStatus === 'paid' ? 'Төлөгдсөн' : 'Хүлээгдэж байна'],
                  ['Нийт дүн', money(booking.totalPrice)],
                  ['Нэр', booking.customerName],
                  ['Утас', booking.customerPhone],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-2.5 border-b border-white/5 text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-bold text-right">{value || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TicketVerify;
