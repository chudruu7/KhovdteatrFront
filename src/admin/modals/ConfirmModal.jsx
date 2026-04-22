import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { AlertTriangle, Trash2, LogOut, Info, X } from 'lucide-react';

const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);

const VARIANTS = {
  danger:  { color: '#e24b4a', soft: 'rgba(226,75,74,0.1)',  border: 'rgba(226,75,74,0.25)', btnBg: 'rgba(226,75,74,0.85)', icon: Trash2,        warnText: 'rgba(248,113,113,0.9)', warnBold: '#fca5a5' },
  warning: { color: '#f59e0b', soft: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', btnBg: 'rgba(245,158,11,0.85)', icon: AlertTriangle, warnText: 'rgba(252,191,73,0.9)',  warnBold: '#fde68a' },
  info:    { color: '#6366f1', soft: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', btnBg: 'rgba(99,102,241,0.85)', icon: Info,          warnText: 'rgba(165,180,252,0.9)', warnBold: '#c7d2fe' },
  logout:  { color: '#e24b4a', soft: 'rgba(226,75,74,0.1)',  border: 'rgba(226,75,74,0.25)', btnBg: 'rgba(226,75,74,0.85)', icon: LogOut,         warnText: 'rgba(248,113,113,0.9)', warnBold: '#fca5a5' },
};

export function ConfirmModalContainer({ children }) {
  const [dialog, setDialog]   = useState({ open: false });
  const [resolver, setResolver] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setResolver(() => resolve);
      setDialog({ open: true, ...options });
    });
  }, []);

  const handle = useCallback((result) => {
    setDialog({ open: false });
    setResolver(prev => { if (prev) prev(result); return null; });
  }, []);

  useEffect(() => {
    if (!dialog.open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handle(false);
      if (e.key === 'Enter')  handle(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog.open, handle]);

  const v    = VARIANTS[dialog.variant || 'danger'];
  const Icon = v?.icon;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {dialog.open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) handle(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            animation: 'cmFade .2s ease',
          }}
        >
          <style>{`
            @keyframes cmFade    { from{opacity:0} to{opacity:1} }
            @keyframes cmSlideUp { from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
          `}</style>

          {/* Bg glows */}
          <div style={{ position:'absolute', width:'280px', height:'280px', borderRadius:'50%', background:'rgba(99,102,241,0.15)', top:'-40px', left:'-60px', filter:'blur(70px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', width:'240px', height:'240px', borderRadius:'50%', background:`${v.soft.replace('0.1','0.18')}`, bottom:'-40px', right:'-40px', filter:'blur(60px)', pointerEvents:'none' }} />

          {/* Modal */}
          <div style={{
            width: '400px', maxWidth: 'calc(100vw - 2rem)',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.12)',
            overflow: 'hidden', position: 'relative',
            animation: 'cmSlideUp .25s cubic-bezier(.16,1,.3,1)',
          }}>

            {/* Top shimmer */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)' }} />

            <div style={{ padding: '32px 32px 0' }}>

              {/* Close */}
              <button
                onClick={() => handle(false)}
                style={{
                  position:'absolute', top:'16px', right:'16px',
                  width:'28px', height:'28px', borderRadius:'50%',
                  background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)',
                  color:'rgba(255,255,255,0.35)', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.13)'; e.currentTarget.style.color='rgba(255,255,255,0.7)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.35)'; }}
              >
                <X size={12} strokeWidth={2.5} />
              </button>

              {/* Title */}
              <p style={{ margin:'0 0 8px', fontSize:'20px', fontWeight:'600', color:'rgba(255,255,255,0.92)', letterSpacing:'-0.02em', textAlign:'center' }}>
                {dialog.title || 'Баталгаажуулах'}
              </p>

              {/* Message */}
              <p style={{ margin:'0 0 20px', fontSize:'13.5px', color:'rgba(255,255,255,0.42)', lineHeight:'1.7', textAlign:'center' }}>
                {dialog.message || 'Энэ үйлдлийг гүйцэтгэхдээ итгэлтэй байна уу?'}
              </p>

              {/* Warning box */}
              {dialog.warning && (
                <div style={{
                  background: v.soft,
                  border: `1px solid ${v.border}`,
                  borderLeft: `3px solid ${v.color}`,
                  borderRadius: '12px', padding: '14px 16px',
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  marginBottom: '24px',
                }}>
                  <AlertTriangle size={16} color={v.color} strokeWidth={2} style={{ flexShrink:0, marginTop:'1px' }} />
                  <p style={{ margin:0, fontSize:'13px', color: v.warnText, lineHeight:'1.65' }}>
                    {dialog.warning}
                  </p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ height:'1px', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)' }} />

            {/* Buttons */}
            <div style={{ padding:'20px 32px 28px', display:'flex', gap:'10px' }}>
              <button
                onClick={() => handle(false)}
                style={{
                  flex:1, padding:'13px', fontSize:'14px', borderRadius:'100px',
                  background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)',
                  color:'rgba(255,255,255,0.55)', cursor:'pointer', fontWeight:'500',
                  transition:'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.color='rgba(255,255,255,0.8)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.55)'; }}
              >
                {dialog.cancelText || 'Болих'}
              </button>
              <button
                onClick={() => handle(true)}
                style={{
                  flex:1, padding:'13px', fontSize:'14px', borderRadius:'100px',
                  background: v.btnBg, border:`1px solid ${v.border}`,
                  color:'#fff', cursor:'pointer', fontWeight:'600',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                  transition:'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity='0.85'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity='1';    e.currentTarget.style.transform='translateY(0)'; }}
              >
                {dialog.confirmText || 'Тийм'}
                <Icon size={14} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}