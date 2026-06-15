import { useState, useEffect, useMemo } from 'react';
import { movieAPI, scheduleAPI } from '../../api/adminAPI';
import bookingAPI from '../../api/bookingAPI';
import { ROW_CELLS, makeSeatId } from '../../components/SeatLayout';
import { Ticket, CalendarDays, Clock, Users, CreditCard, Banknote } from 'lucide-react';
import toast from '../Toast';
import { API_BASE_URL } from '../../api/config';

const MONGOLIA_MS = 7 * 60 * 60 * 1000;
const formatDay = (iso) => {
  const d = new Date(new Date(iso).getTime() + MONGOLIA_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};
const formatTime = (iso) => {
  const d = new Date(new Date(iso).getTime() + MONGOLIA_MS);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

export default function CashierBookingModule() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [soldSeats, setSoldSeats] = useState([]);
  
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash or transfer
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    setLoading(true);
    try {
      const data = await movieAPI.getAll();
      if (data.success) {
        setMovies(data.movies?.filter(m => m.status === 'showing' || m.status === 'comingSoon') || []);
      }
    } catch (err) {
      toast.error('Киноны жагсаалт татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async (movieId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/movies/${movieId}`);
      const data = await res.json();
      if (data.success && data.schedules) {
        setSchedules(data.schedules);
      }
    } catch (err) {
      toast.error('Хуваарь татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const loadSeats = async (scheduleId) => {
    try {
      const data = await scheduleAPI.getSeats(scheduleId);
      if (data.success) {
        setSoldSeats(data.seats || []);
      }
    } catch (err) {
      toast.error('Суудлын мэдээлэл татахад алдаа гарлаа');
    }
  };

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setSelectedSchedule(null);
    setSelectedSeats([]);
    setSuccessBooking(null);
    setSchedules([]);
    // Call API using config.js API_BASE_URL logic if possible, wait I'll import API_BASE_URL
  };

  const handleScheduleSelect = (schedule) => {
    setSelectedSchedule(schedule);
    setSelectedSeats([]);
    loadSeats(schedule._id);
  };

  const toggleSeat = (seatId) => {
    if (soldSeats.includes(seatId)) return;
    if (selectedSeats.find(s => s.seatId === seatId)) {
      setSelectedSeats(prev => prev.filter(s => s.seatId !== seatId));
    } else {
      setSelectedSeats(prev => [...prev, { seatId: seatId, type: 'adult' }]);
    }
  };

  const toggleSeatType = (seatId) => {
    setSelectedSeats(prev => prev.map(s => {
      if (s.seatId === seatId) {
        return { ...s, type: s.type === 'adult' ? 'child' : 'adult' };
      }
      return s;
    }));
  };

  const calculateTotal = () => {
    if (!selectedSchedule) return 0;
    const adultPrice = selectedSchedule.basePrice || selectedMovie?.basePrice || 15000;
    const childPrice = selectedSchedule.childPrice || selectedMovie?.childPrice || 10000;
    return selectedSeats.reduce((sum, s) => sum + (s.type === 'adult' ? adultPrice : childPrice), 0);
  };

  const submitBooking = async () => {
    if (!selectedSchedule || selectedSeats.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        scheduleId: selectedSchedule._id,
        seats: selectedSeats,
        customer: {
          name: 'Кассын үйлчлүүлэгч',
          phone: '00000000',
          email: 'cashier@khovdteatr.mn'
        },
        paymentMethod: paymentMethod // 'cash' or 'transfer'
      };
      const data = await bookingAPI.create(payload);
      if (data.success) {
        setSuccessBooking(data.booking);
        toast.success('Тасалбар амжилттай борлуулагдлаа!');
        setSelectedMovie(null);
        setSelectedSchedule(null);
        setSelectedSeats([]);
      }
    } catch (err) {
      toast.error(err.message || 'Захиалга үүсгэхэд алдаа гарлаа');
    } finally {
      setSubmitting(false);
    }
  };

  if (successBooking) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-slate-900/50 rounded-2xl border border-emerald-500/20 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6">
          <Ticket className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Амжилттай борлуулагдлаа</h2>
        <p className="text-slate-400 mb-8">Тасалбарын код: <span className="text-white font-mono font-bold">{successBooking.bookingCode}</span></p>
        
        <div className="grid grid-cols-2 gap-4 text-left bg-slate-950 p-6 rounded-xl border border-slate-800 w-full max-w-md mb-8">
          <div><p className="text-xs text-slate-500 uppercase">Нийт дүн</p><p className="font-bold text-emerald-400">{successBooking.totalPrice?.toLocaleString()}₮</p></div>
          <div><p className="text-xs text-slate-500 uppercase">Төлбөр</p><p className="font-bold text-white">{successBooking.paymentMethod === 'cash' ? 'Бэлнээр' : 'Шилжүүлгээр'}</p></div>
          <div><p className="text-xs text-slate-500 uppercase">Суудал</p><p className="font-bold text-white">{successBooking.seats?.join(', ')}</p></div>
          <div><p className="text-xs text-slate-500 uppercase">Огноо/Цаг</p><p className="font-bold text-white">{successBooking.date} {successBooking.time}</p></div>
        </div>
        
        <button 
          onClick={() => setSuccessBooking(null)}
          className="bg-emerald-500 text-black px-8 py-3 rounded-xl font-bold hover:bg-emerald-400 transition"
        >
          Дараагийн тасалбар борлуулах
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Movie & Schedule Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><Ticket className="w-5 h-5 text-emerald-400"/> Үзвэр сонгох</h3>
          <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {movies.map(movie => (
              <button
                key={movie._id}
                onClick={() => handleMovieSelect(movie)}
                className={`p-3 rounded-xl border text-left transition ${selectedMovie?._id === movie._id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-950'}`}
              >
                <div className="text-sm font-bold text-white truncate">{movie.title}</div>
                <div className="text-xs text-slate-400">{movie.duration} мин</div>
              </button>
            ))}
            {loading && !movies.length && <div className="text-slate-500 p-4">Уншиж байна...</div>}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><CalendarDays className="w-5 h-5 text-emerald-400"/> Хуваарь сонгох</h3>
          {!selectedMovie ? (
            <div className="text-slate-500 text-center py-10">Эхлээд үзвэр сонгоно уу</div>
          ) : schedules.length === 0 ? (
            <div className="text-slate-500 text-center py-10">Хуваарь олдсонгүй</div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
              {schedules.map(sch => {
                const day = formatDay(sch.showTime);
                const time = formatTime(sch.showTime);
                return (
                  <button
                    key={sch._id}
                    onClick={() => handleScheduleSelect(sch)}
                    className={`p-3 rounded-xl border flex justify-between items-center transition ${selectedSchedule?._id === sch._id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-950'}`}
                  >
                    <div>
                      <div className="font-bold text-white">{day}</div>
                      <div className="text-sm text-emerald-400">{time}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Танхим {sch.hall}</div>
                      <div className="text-xs text-slate-400">{sch.basePrice?.toLocaleString()}₮</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Seat Selection */}
      {selectedSchedule && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-emerald-400"/> Суудал сонгох</h3>
            <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase">
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Том хүн</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded-sm"></div> Хүүхэд</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500/20 rounded-sm"></div> Зарагдсан</span>
            </div>
          </div>
          
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[700px] flex flex-col items-center">
              <div className="w-2/3 h-2 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mb-8 rounded-full"></div>
              
              <div className="flex flex-col gap-1 w-full max-w-[800px]">
                {ROW_CELLS.map((row, rIdx) => (
                  <div key={rIdx} className="flex items-center justify-center gap-2 text-[10px] font-mono">
                    <div className="w-16 text-right text-slate-500 pr-2">{row.label}</div>
                    
                    <div className="flex gap-1 justify-end flex-1">
                      {row.left.map((cell, cIdx) => {
                        if (cell.phantom) return <div key={cIdx} className="w-[22px] h-[22px]" />;
                        const sId = makeSeatId(row.label, cell.num);
                        const isSold = soldSeats.includes(sId);
                        const isBroken = cell.broken;
                        const selSeat = selectedSeats.find(s => s.seatId === sId);
                        
                        let bg = 'bg-slate-700/50 text-slate-500 hover:bg-slate-600';
                        if (isSold) bg = 'bg-red-500/20 text-red-500/50 cursor-not-allowed';
                        else if (isBroken) bg = 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700 border-dashed';
                        else if (selSeat) bg = selSeat.type === 'adult' ? 'bg-emerald-500 text-black' : 'bg-purple-500 text-black';
                        
                        return (
                          <button 
                            key={cIdx}
                            disabled={isSold || isBroken}
                            onClick={() => toggleSeat(sId)}
                            className={`w-[22px] h-[22px] rounded flex items-center justify-center transition-colors ${bg}`}
                          >
                            {cell.num}
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="w-6 shrink-0" />
                    
                    <div className="flex gap-1 justify-start flex-1">
                      {row.right.map((cell, cIdx) => {
                        if (cell.phantom) return <div key={cIdx} className="w-[22px] h-[22px]" />;
                        const sId = makeSeatId(row.label, cell.num);
                        const isSold = soldSeats.includes(sId);
                        const isBroken = cell.broken;
                        const selSeat = selectedSeats.find(s => s.seat === sId);
                        
                        let bg = 'bg-slate-700/50 text-slate-500 hover:bg-slate-600';
                        if (isSold) bg = 'bg-red-500/20 text-red-500/50 cursor-not-allowed';
                        else if (isBroken) bg = 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700 border-dashed';
                        else if (selSeat) bg = selSeat.type === 'adult' ? 'bg-emerald-500 text-black' : 'bg-purple-500 text-black';
                        
                        return (
                          <button 
                            key={cIdx}
                            disabled={isSold || isBroken}
                            onClick={() => toggleSeat(sId)}
                            className={`w-[22px] h-[22px] rounded flex items-center justify-center transition-colors ${bg}`}
                          >
                            {cell.num}
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="w-16 text-left text-slate-500 pl-2">{row.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {selectedSeats.length > 0 && (
            <div className="mt-6 border-t border-slate-800 pt-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedSeats.map(s => (
                  <button 
                    key={s.seatId}
                    onClick={() => toggleSeatType(s.seatId)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 ${s.type === 'adult' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}
                  >
                    {s.seatId}
                    <span className="opacity-50">•</span>
                    {s.type === 'adult' ? 'Том хүн' : 'Хүүхэд'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">Дээрх суудал дээр дарж Том хүн / Хүүхэд төрлийг солино уу.</p>
            </div>
          )}
        </div>
      )}

      {/* 3. Checkout */}
      {selectedSeats.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div>
            <div className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-1">Нийт төлөх дүн</div>
            <div className="text-3xl font-black text-white">{calculateTotal().toLocaleString()}₮</div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button 
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition ${paymentMethod === 'cash' ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'}`}
              >
                <Banknote className="w-4 h-4" /> Бэлэн
              </button>
              <button 
                onClick={() => setPaymentMethod('transfer')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition ${paymentMethod === 'transfer' ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'}`}
              >
                <CreditCard className="w-4 h-4" /> Шилжүүлэг
              </button>
            </div>
            
            <button
              onClick={submitBooking}
              disabled={submitting}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black px-8 py-3 rounded-xl transition disabled:opacity-50"
            >
              {submitting ? 'Уншиж байна...' : 'Захиалга батлах'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
