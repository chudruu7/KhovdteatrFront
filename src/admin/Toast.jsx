// src/admin/Toast.jsx
//
// Context ашиглахгүй — module-level singleton
// AdminPanel.jsx-д <ToastContainer /> нэг удаа нэмнэ
// Дурын файлд:  import toast from '../Toast';
//               toast.success('Амжилттай');
//               toast.error('Алдаа');
//               toast.warning('Анхааруулга');
//               toast.info('Мэдээлэл');

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/* ── Singleton emitter ───────────────────────────────────────────────── */
let _listeners = [];
let _id = 0;

const emit = (type, message, duration = 4500) => {
  const id = ++_id;
  _listeners.forEach(fn => fn({ id, type, message, duration, exiting: false }));
  return id;
};

const toast = {
  success: (msg, dur) => emit('success', msg, dur),
  error:   (msg, dur) => emit('error',   msg, dur),
  warning: (msg, dur) => emit('warning', msg, dur),
  info:    (msg, dur) => emit('info',    msg, dur),
};

export default toast;

/* ── Variant config ──────────────────────────────────────────────────── */
const VARIANTS = {
  success: { icon: CheckCircle,   color: '#10b981', label: 'Амжилттай'   },
  error:   { icon: XCircle,       color: '#ef4444', label: 'Алдаа'       },
  warning: { icon: AlertTriangle, color: '#f59e0b', label: 'Анхааруулга' },
  info:    { icon: Info,          color: '#6366f1', label: 'Мэдээлэл'    },
};

/* ── Single Toast ────────────────────────────────────────────────────── */
function ToastItem({ t, onDismiss }) {
  const v      = VARIANTS[t.type] || VARIANTS.info;
  const Icon   = v.icon;
  const [pct, setPct] = useState(100);
  const start  = useRef(null);
  const raf    = useRef(null);

  useEffect(() => {
    start.current = performance.now();
    const tick = (now) => {
      const rem = Math.max(0, 100 - ((now - start.current) / t.duration) * 100);
      setPct(rem);
      if (rem > 0) raf.current = requestAnimationFrame(tick);
      else onDismiss(t.id);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [t.id, t.duration, onDismiss]);

  return (
    <div style={{
      display:      'flex',
      alignItems:   'flex-start',
      gap:          '12px',
      padding:      '13px 13px 0 13px',
      background:   'rgba(13,13,20,0.97)',
      border:       '1px solid rgba(255,255,255,0.08)',
      borderRadius: '13px',
      width:        '340px',
      maxWidth:     'calc(100vw - 2rem)',
      position:     'relative',
      overflow:     'hidden',
      boxShadow:    '0 12px 40px rgba(0,0,0,0.55)',
      animation:    t.exiting
        ? 'tOut .3s cubic-bezier(.4,0,.6,1) forwards'
        : 'tIn .34s cubic-bezier(.16,1,.3,1) forwards',
    }}>
      {/* accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: '3px', background: v.color,
        borderRadius: '13px 0 0 13px',
      }} />

      {/* icon */}
      <div style={{ marginLeft: '8px', marginTop: '2px', flexShrink: 0 }}>
        <Icon size={17} color={v.color} strokeWidth={2.3} />
      </div>

      {/* text */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: '13px' }}>
        <div style={{
          fontSize: '10.5px', fontWeight: '600',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: v.color, marginBottom: '3px', opacity: 0.9,
        }}>
          {v.label}
        </div>
        <div style={{
          fontSize: '13.5px', color: '#e2e8f0',
          lineHeight: '1.45', wordBreak: 'break-word',
        }}>
          {t.message}
        </div>
      </div>

      {/* close */}
      <button
        onClick={() => onDismiss(t.id)}
        style={{
          flexShrink: 0, marginTop: '1px',
          width: '22px', height: '22px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '6px', color: '#64748b', cursor: 'pointer',
          transition: 'all .14s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = '#e2e8f0';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = '#64748b';
        }}
      >
        <X size={12} strokeWidth={2.5} />
      </button>

      {/* progress */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '2.5px', background: 'rgba(255,255,255,0.05)',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: v.color, opacity: 0.5,
          transition: 'width .1s linear',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>
    </div>
  );
}

/* ── Container — AdminPanel-д нэг удаа нэмнэ ────────────────────────── */
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => {
        const next = [...prev, t];
        return next.length > 5 ? next.slice(-5) : next;
      });
    };
    _listeners.push(handler);
    return () => { _listeners = _listeners.filter(fn => fn !== handler); };
  }, []);

  const dismiss = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 330);
  };

  if (!toasts.length) return null;

  return (
    <>
      <style>{`
        @keyframes tIn  { from{opacity:0;transform:translateX(48px) scale(.93)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes tOut { from{opacity:1;transform:translateX(0) scale(1);max-height:120px;margin-bottom:8px} to{opacity:0;transform:translateX(48px) scale(.93);max-height:0;margin-bottom:0;padding-top:0;padding-bottom:0} }
      `}</style>
      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem',
        zIndex: 99999,
        display: 'flex', flexDirection: 'column',
        gap: '8px', alignItems: 'flex-end',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem t={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </>
  );
}