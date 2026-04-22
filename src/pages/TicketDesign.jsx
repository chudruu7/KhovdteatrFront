import { useState } from 'react';

/* ── Real QR code ────────────────────────────────────────────────────── */
function RealQR({ value, size = 80 }) {
  const url =
    `https://api.qrserver.com/v1/create-qr-code/` +
    `?size=${size * 2}x${size * 2}` +
    `&data=${encodeURIComponent(value)}` +
    `&color=1e293b&bgcolor=ffffff&margin=4&format=svg`;
  return (
    <img src={url} width={size} height={size} alt="QR код"
      style={{ display: 'block', borderRadius: 4 }}
    />
  );
}

/* ── Barcode ─────────────────────────────────────────────────────────── */
function Barcode({ value }) {
  const seed = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const bars = [];
  let x = 0;
  for (let i = 0; i < 48; i++) {
    const w = ((seed * (i + 3)) % 3) + 1;
    const h = 20 + ((seed * (i + 7)) % 20);
    if (i % 2 === 0) bars.push({ x, w, h });
    x += w + 1;
  }
  return (
    <svg width="100%" height="36" viewBox={`0 0 ${x} 36`}
      preserveAspectRatio="none" style={{ marginTop: 10, display: 'block' }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={36 - b.h} width={b.w} height={b.h}
          fill="#64748b" opacity={0.5 + (i % 5) * 0.1} rx="0.5" />
      ))}
    </svg>
  );
}

/* ── CSS ─────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
.tc-root *, .tc-root *::before, .tc-root *::after { box-sizing:border-box; margin:0; padding:0; }
.tc-root { display:flex; flex-direction:column; align-items:center; padding:2rem 1rem; font-family:'Inter',-apple-system,sans-serif; background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); min-height:100vh; }
.tc-success { text-align:center; margin-bottom:2rem; animation:slideUp .5s ease both; }
.tc-check { width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,#10b981,#059669); display:flex; align-items:center; justify-content:center; margin:0 auto 1rem; box-shadow:0 10px 25px -5px rgba(16,185,129,.5); animation:pulse 2s infinite; }
.tc-success-title { font-size:1.875rem; font-weight:700; color:white; margin-bottom:.5rem; letter-spacing:-.025em; }
.tc-success-sub { font-size:.875rem; color:rgba(255,255,255,.8); }
.tc-email-badge { display:inline-flex; align-items:center; gap:.5rem; margin-top:.75rem; padding:.45rem 1rem; border-radius:9999px; background:rgba(16,185,129,.2); color:#6ee7b7; font-size:.78rem; font-weight:500; }
.tc-wrap { width:100%; max-width:480px; filter:drop-shadow(0 25px 50px -12px rgba(0,0,0,.5)); animation:slideUp .6s .1s ease both; }
.tc-body { background:white; border-radius:28px 28px 0 0; overflow:hidden; position:relative; }
.tc-body::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg,#667eea,#764ba2,#ec4899); z-index:10; }
.tc-poster { position:relative; height:200px; overflow:hidden; background:#1a1a1a; }
.tc-poster img { width:100%; height:100%; object-fit:cover; }
.tc-poster-gradient { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.8) 0%,rgba(0,0,0,.2) 50%,transparent 100%); }
.tc-poster-title { position:absolute; bottom:1.5rem; left:1.5rem; right:1.5rem; font-size:1.75rem; font-weight:700; color:white; line-height:1.2; letter-spacing:-.025em; text-shadow:0 4px 6px rgba(0,0,0,.3); }
.tc-poster-badge { position:absolute; top:1rem; right:1rem; padding:.35rem .75rem; border-radius:9999px; background:rgba(255,255,255,.95); font-size:.75rem; font-weight:600; color:#1a1a1a; }
.tc-info { padding:1.5rem; background:white; }
.tc-cinema { display:flex; align-items:center; gap:.5rem; font-size:.75rem; font-weight:500; color:#64748b; margin-bottom:1.5rem; text-transform:uppercase; letter-spacing:.05em; }
.tc-cinema-dot { width:6px; height:6px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); flex-shrink:0; }
.tc-grid { display:flex; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; margin-bottom:1.5rem; background:#f8fafc; }
.tc-cell { flex:1; padding:1rem .75rem; border-right:1px solid #e2e8f0; display:flex; flex-direction:column; gap:.25rem; align-items:center; text-align:center; }
.tc-cell:last-child { border-right:none; }
.tc-cell-lbl { font-size:.6rem; font-weight:600; letter-spacing:.05em; text-transform:uppercase; color:#94a3b8; }
.tc-cell-val { font-family:'JetBrains Mono',monospace; font-size:.9rem; font-weight:600; color:#1e293b; line-height:1.2; }
.tc-seats { display:flex; align-items:center; gap:.75rem; margin-bottom:1.5rem; flex-wrap:wrap; }
.tc-seats-lbl { font-size:.7rem; font-weight:600; letter-spacing:.05em; text-transform:uppercase; color:#94a3b8; }
.tc-seat { display:inline-block; padding:.4rem .9rem; border-radius:12px; background:white; font-family:'JetBrains Mono',monospace; font-size:.8rem; font-weight:600; color:black; }
.tc-types { display:flex; gap:.5rem; flex-wrap:wrap; margin-bottom:1.5rem; }
.tc-type { display:inline-block; padding:.4rem .9rem; border-radius:9999px; font-size:.75rem; font-weight:500; }
.tc-type-adult { background:#f1f5f9; color:#334155; border:1px solid #006eff; }
.tc-type-child  { background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; }
.tc-price { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.25rem; border-radius:16px; background:white; color:black; }
.tc-price-lbl { font-size:.75rem; font-weight:600; letter-spacing:.05em; text-transform:uppercase; opacity:.9; }
.tc-price-val { font-size:1.75rem; font-weight:700; letter-spacing:-.025em; }
.tc-perf { display:flex; align-items:center; background:white; }
.tc-perf-line { flex:1; border-top:2px dashed #e2e8f0; }
.tc-perf-hole { width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); flex-shrink:0; }
.tc-perf-hole.l { margin-left:-12px; }
.tc-perf-hole.r { margin-right:-12px; }
.tc-stub { background:white; border-radius:0 0 28px 28px; padding:1.5rem; display:flex; gap:1.5rem; border-top:1px solid #e2e8f0; }
.tc-qr { flex-shrink:0; padding:.75rem; background:white; border:1px solid #e2e8f0; border-radius:16px; box-shadow:0 4px 6px -1px rgba(0,0,0,.1); }
.tc-qr-label { font-size:.6rem; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:#94a3b8; text-align:center; margin-top:.5rem; }
.tc-stub-info { flex:1; min-width:0; }
.tc-order-row { display:flex; align-items:center; gap:.5rem; }
.tc-order-id { font-family:'JetBrains Mono',monospace; font-size:.85rem; font-weight:600; color:#1e293b; cursor:pointer; user-select:all; padding:.5rem .75rem; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; transition:all .2s; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tc-order-id:hover { background:#f1f5f9; border-color:#94a3b8; }
.tc-copy-btn { padding:.5rem .7rem; background:#667eea; color:white; border:none; border-radius:8px; cursor:pointer; font-size:.75rem; font-weight:600; transition:all .2s; white-space:nowrap; flex-shrink:0; }
.tc-copy-btn:hover { background:#5567d4; }
.tc-notice { display:flex; align-items:flex-start; gap:.5rem; padding:.75rem; background:#fef3c7; border:1px solid #fde68a; border-radius:10px; margin-top:.75rem; }
.tc-notice-icon { font-size:14px; flex-shrink:0; margin-top:1px; }
.tc-notice-text { font-size:.7rem; color:#92400e; line-height:1.4; }
.tc-actions { display:flex; gap:1rem; margin-top:2rem; width:100%; max-width:480px; }
.tc-btn { flex:1; padding:.875rem; border-radius:9999px; cursor:pointer; font-family:'Inter',sans-serif; font-size:.875rem; font-weight:600; letter-spacing:.025em; transition:all .2s; border:none; }
.tc-btn-home { background:rgba(255,255,255,.2); backdrop-filter:blur(8px); color:white; border:1px solid rgba(255,255,255,.3); }
.tc-btn-home:hover { background:rgba(255,255,255,.3); transform:translateY(-1px); }
.tc-btn-save { background:white; color:#1e293b; box-shadow:0 10px 25px -5px rgba(0,0,0,.2); }
.tc-btn-save:hover { transform:translateY(-2px); box-shadow:0 15px 30px -5px rgba(0,0,0,.3); }
@keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse { 0%,100%{box-shadow:0 10px 25px -5px rgba(16,185,129,.5)} 50%{box-shadow:0 20px 35px -5px rgba(16,185,129,.7)} }
@media(max-width:480px){
  .tc-poster-title{font-size:1.5rem}
  .tc-stub{flex-direction:column;align-items:center;text-align:center}
}
`;

/* ══ MAIN ══════════════════════════════════════════════════════════════ */
export default function TicketDesign({
  orderId       = 'TK-2026-00847',
  movie         = { title: 'Кино', posterUrl: '', rating: '13+' },
  date          = '2026-03-17',
  time          = '19:00',
  hall          = 'Танхим А',
  seats         = ['J6', 'J7'],
  tickets       = [],
  totalPrice    = 0,
  cinemaName    = 'ХОВД АЙМАГ ХӨГЖИМТ КИНО ТЕАТР',
  customerEmail,   // зөвхөн "рүү илгээгдлээ" текстэд харуулна
  onHome,
}) {
  const [copied, setCopied] = useState(false);

  const money      = (n) => Number(n).toLocaleString('mn-MN') + '₮';
  const adultCount = tickets.filter(t => t.type === 'adult').length;
  const childCount = tickets.filter(t => t.type === 'child').length;
  const qrData     = `${orderId}|${date}|${time}|${seats.join(',')}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(orderId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tc-root">
      <style>{CSS}</style>

      {/* ── Success header ── */}
      <div className="tc-success">
        <div className="tc-check">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"
            stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="tc-success-title">Захиалга амжилттай!</h2>
        <p className="tc-success-sub">Тасалбарын мэдээлэл и-мэйл рүү илгээгдлээ</p>

        {/* Имэйл хаяг харуулна — backend илгээдэг учир статус шаардлагагүй */}
        {customerEmail && (
          <div className="tc-email-badge">
            ✅ {customerEmail} рүү илгээгдлээ
          </div>
        )}
      </div>

      {/* ── Ticket ── */}
      <div className="tc-wrap">
        <div className="tc-body">

          {/* Poster */}
          <div className="tc-poster">
            {movie.posterUrl
              ? <img src={movie.posterUrl} alt={movie.title} draggable={false}
                  onError={e => { e.target.style.display = 'none'; }} />
              : <div style={{ width:'100%', height:'100%',
                  background:'linear-gradient(135deg,#667eea 0%,#764ba2 50%,#ec4899 100%)' }} />
            }
            <div className="tc-poster-gradient" />
            {movie.rating && <div className="tc-poster-badge">{movie.rating}</div>}
            <div className="tc-poster-title">{movie.title}</div>
          </div>

          {/* Info */}
          <div className="tc-info">
            <div className="tc-cinema">
              <div className="tc-cinema-dot" />
              {cinemaName}
            </div>

            <div className="tc-grid">
              <div className="tc-cell">
                <span className="tc-cell-lbl">Огноо</span>
                <span className="tc-cell-val">{date}</span>
              </div>
              <div className="tc-cell">
                <span className="tc-cell-lbl">Цаг</span>
                <span className="tc-cell-val">{time}</span>
              </div>
              <div className="tc-cell">
                <span className="tc-cell-lbl">Танхим</span>
                <span className="tc-cell-val">{hall}</span>
              </div>
            </div>

            <div className="tc-seats">
              <span className="tc-seats-lbl">Суудал</span>
              {seats.map(s => <span key={s} className="tc-seat">{s}</span>)}
            </div>

            {(adultCount > 0 || childCount > 0) && (
              <div className="tc-types">
                {adultCount > 0 && <span className="tc-type tc-type-adult">👤 Том хүн × {adultCount}</span>}
                {childCount > 0 && <span className="tc-type tc-type-child">🧒 Хүүхэд × {childCount}</span>}
              </div>
            )}

            <div className="tc-price">
              <span className="tc-price-lbl">Нийт төлбөр</span>
              <span className="tc-price-val">{money(totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Perforated divider */}
        <div className="tc-perf">
          <div className="tc-perf-hole l" />
          <div className="tc-perf-line" />
          <div className="tc-perf-hole r" />
        </div>

        {/* Stub */}
        <div className="tc-stub">
          <div style={{ flexShrink: 0 }}>
            <div className="tc-qr">
              <RealQR value={qrData} size={80} />
            </div>
            <div className="tc-qr-label">Скан хийх</div>
          </div>
          <div className="tc-stub-info">
            <div className="tc-order-row">
              <div className="tc-order-id" title={orderId}>{orderId}</div>
              <button className="tc-copy-btn" onClick={handleCopy}>
                {copied ? '✓' : '⎘ Хуулах'}
              </button>
            </div>
            <div className="tc-notice">
              <span className="tc-notice-icon">⚠️</span>
              <span className="tc-notice-text">
                Кино эхлэхээс <strong>15 минутын өмнө</strong> ирнэ үү.
                Тасалбар буцаах боломжгүй.
              </span>
            </div>
            <Barcode value={orderId} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="tc-actions">
        <button className="tc-btn tc-btn-home" onClick={onHome}>
          ← Нүүр хуудас
        </button>
        <button className="tc-btn tc-btn-save" onClick={() => window.print()}>
          ↓ Хадгалах
        </button>
      </div>
    </div>
  );
}