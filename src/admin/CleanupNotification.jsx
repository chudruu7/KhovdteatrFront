import { useState, useEffect } from "react";
import { cleanupAPI } from "../api/adminAPI";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Trash2, Clock, X, Check, 
  AlertCircle, Archive, ChevronRight, Database 
} from "lucide-react";

export default function CleanupNotification() {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchPending = async () => {
    try {
      const data = await cleanupAPI.getPending();
      if (data.request) setRequest(data.request);
    } catch (err) {
      console.error("Cleanup fetch алдаа:", err.message);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const data = await cleanupAPI.approve(request._id);
      setMessage({
        type: "success",
        text: "Амжилттай цэвэрлэгдлээ",
        details: `${data.deletedBookings} захиалга, ${data.deletedSchedules} хуваарь устгав.`
      });
      setRequest(null);
    } catch (err) {
      setMessage({ type: "error", text: "Алдаа гарлаа", details: err.message });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60] w-[380px] flex flex-col gap-4 pointer-events-none">
      
      {/* 1. ТОП МЭДЭГДЭЛ (SUCCESS/ERROR TOAST) */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
              pointer-events-auto p-4 rounded-2xl backdrop-blur-2xl border shadow-2xl
              ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">{message.text}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{message.details}</p>
              </div>
              <button onClick={() => setMessage(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ҮНДСЭН ХҮСЭЛТНИЙ КАРТ */}
      <AnimatePresence>
        {request && (
          <motion.div
            initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="pointer-events-auto relative group"
          >
            {/* Гэрлийн эффект (Ambient Glow) */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-[24px] blur-xl opacity-50 group-hover:opacity-100 transition-all duration-700" />
            
            <div className="relative bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[22px] overflow-hidden shadow-2xl">
              
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/5 bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide">Өгөгдөл цэвэрлэх</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] text-amber-500/80 uppercase font-bold tracking-wider">Засварлах шаардлагатай</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body / Stats */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Захиалга</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">{request.stats.bookingCount}</span>
                      <span className="text-[10px] text-gray-500">ш</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Хуваарь</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">{request.stats.scheduleCount}</span>
                      <span className="text-[10px] text-gray-500">ш</span>
                    </div>
                  </div>
                </div>

                {request.stats.oldestDate && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-6">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-500 leading-none">Хуучин өгөгдлийн огноо</p>
                      <p className="text-xs text-gray-200 font-medium mt-1">
                        {new Date(request.stats.oldestDate).toLocaleDateString("mn-MN", {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-[2] h-11 bg-white text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-gray-100 disabled:opacity-50 transition-all"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Цэвэрлэх
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReject}
                    disabled={loading}
                    className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs transition-all"
                  >
                    Алгасах
                  </motion.button>
                </div>
              </div>

              {/* Progress-like decorative line */}
              <div className="h-1 w-full bg-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 10, ease: "linear" }}
                  className="h-full bg-amber-500/40"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}