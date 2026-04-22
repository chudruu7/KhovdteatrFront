import { useState, useEffect, useMemo, useRef } from "react";
import {
  TrendingUp, LayoutGrid, Users, UserPlus,
  Clock4, TriangleAlert, CircleCheck, BellDot,
  ChevronRight, ArrowDownToLine, CirclePlus,
  Clapperboard, Armchair, BadgeDollarSign, Gauge,
  Star, CalendarDays, Activity, RefreshCw,
  ArrowUpRight, ArrowDownRight, Eye, Ticket, X, CalendarPlus,
  CheckCircle2, TimerOff, Ban, Minus
} from "lucide-react";
import { AreaChart, Area, Tooltip } from "recharts";
import { adminAPI } from "../../api/adminAPI";
import LoadingSpinner from "../LoadingSpinner";

const LiquidCard = ({ children, glow, style = {} }) => (
  <div style={{
    position: "relative",
    background: "rgba(255,255,255,0.042)",
    backdropFilter: "blur(28px) saturate(180%)",
    WebkitBackdropFilter: "blur(28px) saturate(180%)",
    border: "1px solid rgba(255,255,255,0.11)",
    borderRadius: 24,
    boxShadow: glow
      ? `0 0 60px ${glow}, inset 0 1.5px 0 rgba(255,255,255,0.13), inset 0 -1px 0 rgba(0,0,0,0.18)`
      : "inset 0 1.5px 0 rgba(255,255,255,0.13), inset 0 -1px 0 rgba(0,0,0,0.18)",
    ...style,
  }}>
    <div style={{ position:"absolute",inset:0,pointerEvents:"none",borderRadius:"inherit",background:"linear-gradient(135deg,rgba(255,255,255,0.07) 0%,transparent 50%,rgba(255,255,255,0.02) 100%)" }}/>
    <div style={{ position:"absolute",top:0,left:"15%",right:"15%",height:1,pointerEvents:"none",background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent)" }}/>
    <div style={{ position:"relative",zIndex:1 }}>{children}</div>
  </div>
);


/* ── GROWTH BADGE: backend label-ийг parse хийж өнгө ялгана ── */
const GrowthBadge = ({ label }) => {
  if (!label || label === '+0%') {
    return (
      <div style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.35)",background:"rgba(255,255,255,0.06)",padding:"3px 8px",borderRadius:20 }}>
        <Minus size={11}/> 0%
      </div>
    );
  }
  const isPos = label.startsWith('+');
  return (
    <div style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:700,color:isPos?"#4ade80":"#f87171",background:isPos?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)",padding:"3px 8px",borderRadius:20 }}>
      {isPos ? <TrendingUp size={11}/> : <ArrowDownRight size={11}/>} {label}
    </div>
  );
};

/* ── SPARKLINE: ResizeObserver патч ── */
const AreaSparkline = ({ values, color, gradientId }) => {
  const data = values.map((v,i) => ({ i, v }));
  const wrapRef = useRef(null);
  const [dims, setDims] = useState({ w:0, h:48 });
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setDims({ w: Math.max(width,1), h: Math.max(height,1) });
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={wrapRef} style={{ height:48, marginLeft:-8, marginRight:-8, marginBottom:-4 }}>
      {dims.w > 0 && (
        <AreaChart width={dims.w} height={dims.h} data={data} margin={{top:4,right:0,bottom:0,left:0}}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5}/>
              <stop offset="100%" stopColor={color} stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{r:3,fill:color,stroke:"rgba(0,0,0,0.5)",strokeWidth:1}} isAnimationActive={false}/>
          <Tooltip content={({active,payload}) => active&&payload?.length ? <div style={{background:"rgba(8,10,18,0.9)",border:`1px solid ${color}55`,borderRadius:8,padding:"3px 9px",fontSize:11,color,fontWeight:700}}>{payload[0].value}</div> : null}/>
        </AreaChart>
      )}
    </div>
  );
};

const OccupancyRing = ({ pct, color }) => {
  const r=16, circ=2*Math.PI*r;
  return (
    <svg width={40} height={40} viewBox="0 0 40 40">
      <circle cx={20} cy={20} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4}/>
      <circle cx={20} cy={20} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round" transform="rotate(-90 20 20)"/>
      <text x={20} y={24} textAnchor="middle" fill="white" fontSize={9} fontWeight={700}>{pct}%</text>
    </svg>
  );
};

const deriveBookingStatus = (booking) => {
  if (booking.status==="cancelled") return "cancelled";
  if (booking.showDatetime) return new Date(booking.showDatetime)>new Date() ? "active" : "used";
  if (booking.status==="confirmed") return "active";
  if (booking.status==="pending") return "pending";
  return "active";
};

const STATUS_CFG = {
  active:    { bg:"rgba(16,185,129,0.14)",  color:"#34d399", Icon:CheckCircle2, label:"Идэвхтэй"      },
  used:      { bg:"rgba(107,114,128,0.14)", color:"#9ca3af", Icon:TimerOff,     label:"Ашиглагдсан"   },
  pending:   { bg:"rgba(245,158,11,0.14)",  color:"#fbbf24", Icon:Clock4,       label:"Хүлээгдэж буй" },
  cancelled: { bg:"rgba(239,68,68,0.14)",   color:"#f87171", Icon:Ban,          label:"Цуцлагдсан"    },
};

const ALERT_CFG = {
  warning: { border:"rgba(245,158,11,0.28)",  bg:"rgba(245,158,11,0.07)",  iconBg:"rgba(245,158,11,0.15)",  iconColor:"#fbbf24", Icon:TriangleAlert },
  success: { border:"rgba(16,185,129,0.28)",  bg:"rgba(16,185,129,0.07)",  iconBg:"rgba(16,185,129,0.15)",  iconColor:"#34d399", Icon:CircleCheck   },
  info:    { border:"rgba(56,189,248,0.28)",  bg:"rgba(56,189,248,0.07)",  iconBg:"rgba(56,189,248,0.15)",  iconColor:"#38bdf8", Icon:Activity      },
};

const MoviePoster = ({ src, title }) => {
  const [err, setErr] = useState(false);
  if (src && !err) return <img src={src} alt={title} onError={()=>setErr(true)} style={{width:44,height:60,borderRadius:10,objectFit:"cover",flexShrink:0,border:"1px solid rgba(255,255,255,0.1)"}}/>;
  const palettes = ["#1e3a8a,#7c3aed","#064e3b,#0e7490","#7c2d12,#be185d","#1e1b4b,#4f1d96"];
  const idx = (title?.charCodeAt(0)||0)%palettes.length;
  return <div style={{width:44,height:60,borderRadius:10,flexShrink:0,background:`linear-gradient(160deg,${palettes[idx]})`,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,0.1)"}}><Clapperboard size={16} style={{color:"rgba(255,255,255,0.45)"}}/></div>;
};

const btnSec = { display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:13,fontSize:13,fontWeight:600,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.72)",cursor:"pointer" };
const btnPri = { display:"flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:13,fontSize:13,fontWeight:700,background:"linear-gradient(135deg,#7c3aed,#be185d)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",cursor:"pointer",boxShadow:"0 4px 24px rgba(124,58,237,0.4)" };

export default function DashboardModule({ onOpenScheduleModal, onNavigateToSchedule }) {
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState(null);
  const [sparks,  setSparks]  = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [bookings,  setBookings]  = useState([]);
  const [alerts,    setAlerts]    = useState([]);
  const [tab,       setTab]       = useState("all");
  const [error,     setError]     = useState(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const toChartValues = (arr) => (!arr || arr.length === 0) ? [0, 0] : arr;

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true); setError(null);
      const [s, sh, b, a, sp] = await Promise.all([
        adminAPI.getDashboardStats().catch(()=>null),
        adminAPI.getRecentShowtimes().catch(()=>[]),
        adminAPI.getRecentBookings().catch(()=>[]),
        adminAPI.getAlerts().catch(()=>[]),
        adminAPI.getSparklines().catch(()=>null),
      ]);
      setStats(s); setShowtimes(sh||[]); setBookings(b||[]); setAlerts(a||[]); setSparks(sp||null);
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  };

  const analytics = useMemo(() => {
    if (!stats) return null;
    return {
      avgTicket: stats.avgTicketPrice ?? 0,
      totalRev:  stats.totalRevenue   ?? 0,
      projected: stats.projectedRevenue ?? 0,
    };
  }, [stats]);

  const todayHasSchedule = showtimes.length > 0;
  const handleOpenSchedule = () => {
    if (typeof onOpenScheduleModal==="function") onOpenScheduleModal();
    else if (typeof onNavigateToSchedule==="function") onNavigateToSchedule();
  };

  const filteredBookings = useMemo(() => {
    if (tab==="all") return bookings;
    return bookings.filter(b => deriveBookingStatus(b)===tab);
  }, [bookings, tab]);

  if (loading) return <LoadingSpinner/>;

  /* ── Stat cards: sparkline backend-с, growth badge backend-с ── */
  const EMPTY_SPARK = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  const statCards = [
    {
      label:"Өнөөдрийн орлого", value:stats?.todayRevenue||"₮ 0",
      growth: stats?.revenueGrowth||"+0%",
      Icon:BadgeDollarSign,
      spark: toChartValues(sparks?.revenue || EMPTY_SPARK),
      accent:"#10b981", glow:"rgba(16,185,129,0.2)", gradId:"sparkGreen",
    },
    {
      label:"Нийт тасалбар", value:`${stats?.totalTickets||0}`,
      growth: stats?.ticketsGrowth||"+0%",
      Icon:Ticket,
      spark: toChartValues(sparks?.tickets || EMPTY_SPARK),
      accent:"#38bdf8", glow:"rgba(56,189,248,0.2)", gradId:"sparkBlue",
    },
    {
      label:"Танхим дүүргэлт", value:stats?.occupancyRate||"0%",
      growth: stats?.occupancyGrowth||"+0%",
      Icon:Gauge,
      spark: toChartValues(sparks?.occupancy || EMPTY_SPARK),
      accent:"#a78bfa", glow:"rgba(167,139,250,0.2)", gradId:"sparkPurple",
    },
    {
      label:"Шинэ хэрэглэгчид", value:`${stats?.newUsers||0}`,
      growth: stats?.usersGrowth||"+0%",
      Icon:UserPlus,
      spark: toChartValues(sparks?.users || EMPTY_SPARK),
      accent:"#fb923c", glow:"rgba(251,146,60,0.2)", gradId:"sparkOrange",
    },
  ];

  return (
    <div style={{ minHeight:"100vh",fontFamily:"'DM Sans',sans-serif",padding:"28px 24px 48px",position:"relative",color:"#fff" }}>
      <div style={{ position:"relative",zIndex:1,maxWidth:1400,margin:"0 auto" }}>

        {!todayHasSchedule && !alertDismissed && (
          <div style={{ position:"relative",marginBottom:20,padding:"18px 24px",borderRadius:18,background:"rgba(245,158,11,0.09)",border:"1px solid rgba(245,158,11,0.35)",backdropFilter:"blur(16px)",display:"flex",alignItems:"center",gap:16,boxShadow:"0 0 40px rgba(245,158,11,0.1)" }}>
            <div style={{ position:"relative",flexShrink:0 }}>
              <div style={{ width:44,height:44,borderRadius:12,background:"rgba(245,158,11,0.15)",display:"flex",alignItems:"center",justifyContent:"center" }}><CalendarDays size={20} style={{color:"#fbbf24"}}/></div>
              <span style={{ position:"absolute",top:-3,right:-3,width:10,height:10,borderRadius:"50%",background:"#f59e0b",animation:"pulseRing 1.4s ease-out infinite" }}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700,fontSize:14,color:"#fde68a",marginBottom:2 }}>Өнөөдрийн үзвэрийн хуваарь байхгүй байна</div>
              <div style={{ fontSize:12.5,color:"rgba(255,255,255,0.5)" }}>Нэг ч үзвэрийн цаг оруулаагүй байна. Одоо хуваарь нэмнэ үү.</div>
            </div>
            <button onClick={handleOpenSchedule} style={{ display:"flex",alignItems:"center",gap:6,flexShrink:0,padding:"9px 18px",borderRadius:12,fontSize:13,fontWeight:700,background:"linear-gradient(135deg,#d97706,#b45309)",border:"none",color:"#fff",cursor:"pointer",boxShadow:"0 4px 16px rgba(217,119,6,0.4)" }}><CalendarPlus size={15}/> Хуваарь нэмэх</button>
            <button onClick={()=>setAlertDismissed(true)} style={{ padding:6,borderRadius:8,background:"transparent",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",flexShrink:0 }}><X size={16}/></button>
          </div>
        )}

        {error && <div style={{ marginBottom:16,padding:"12px 20px",borderRadius:12,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#f87171",fontSize:13 }}><strong>Алдаа:</strong> {error}</div>}

        {/* HEADER */}
        <LiquidCard style={{ padding:"28px 32px",marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16 }}>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4 }}>
                <Clapperboard size={18} style={{color:"#a78bfa"}}/>
                <span style={{ fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.35)" }}>Кино театрын удирдлага</span>
              </div>
              <h1 style={{ fontSize:26,fontWeight:800,letterSpacing:"-0.02em",margin:0 }}>Сайн байна уу, Админ</h1>
              <p style={{ color:"rgba(255,255,255,0.42)",fontSize:14,margin:"4px 0 0" }}>
                Өнөөдөр <span style={{color:"#a78bfa",fontWeight:700}}>{stats?.totalTickets||0}</span> захиалга ирлээ
              </p>
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={fetchAll} style={btnSec}><RefreshCw size={14}/> Шинэчлэх</button>
              <button style={btnSec}><ArrowDownToLine size={14}/> Тайлан</button>
              <button onClick={handleOpenSchedule} style={btnPri}><CirclePlus size={15}/> Шинэ үзвэр</button>
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:24 }}>
            {[
              { label:"Нийт кино",      value:stats?.totalMovies||0,                    icon:Clapperboard, color:"#a78bfa" },
              { label:"Идэвхтэй үзвэр", value:stats?.activeShows||0,                    icon:CalendarDays, color:"#34d399" },
              { label:"Нийт хэрэглэгч", value:(stats?.totalUsers||0).toLocaleString(), icon:Users,        color:"#38bdf8" },
              { label:"Дундаж үнэлгээ", value:`${stats?.avgRating||0}`,                 icon:Star,         color:"#fbbf24" },
            ].map(({ label,value,icon:Icon,color },i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.045)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ padding:8,borderRadius:10,background:`${color}1a` }}><Icon size={16} style={{color}}/></div>
                <div>
                  <div style={{ fontSize:18,fontWeight:800,color,lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.38)",marginTop:3 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </LiquidCard>

        {/* ANALYTICS CARDS */}
        {analytics && (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20 }}>
            {[
              { icon:Eye, iconColor:"#10b981", glowColor:"#10b981", label:"Дундаж тасалбарын үнэ", value:`₮ ${analytics.avgTicket.toLocaleString()}`, sub: stats?.ticketPriceGrowth ? `${stats.ticketPriceGrowth} өчигдрөөс` : "Өнөөдрийн байдлаар", subColor: stats?.ticketPriceGrowth?.startsWith('-') ? "#f87171" : "#10b981" },
              { icon:TrendingUp, iconColor:"#fbbf24", glowColor:"#be185d", label:"Нийт орлого", value:`₮ ${((analytics.totalRev||0)/1_000_000).toFixed(1)}M`, sub:"Нийт хуримтлагдсан", subColor:"#fbbf24" },
              { icon:ArrowUpRight, iconColor:"#a78bfa", glowColor:"#7c3aed", label:"Төсөөлөгдөж буй орлого", value:`₮ ${analytics.projected}M`, sub:"сар эцэст", subColor:"#a78bfa" },
            ].map(({ icon:Icon, iconColor, glowColor, label, value, sub, subColor },i) => (
              <LiquidCard key={i} style={{ padding:"28px 26px" }}>
                <div style={{ position:"absolute",bottom:"-50%",right:"-20%",width:"80%",height:"160%",borderRadius:"50%",background:`radial-gradient(circle at 50% 50%,${glowColor||iconColor}28 0%,transparent 65%)`,filter:"blur(40px)",pointerEvents:"none" }}/>
                <div style={{ position:"relative",zIndex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:18 }}>
                    <div style={{ padding:8,borderRadius:10,background:`${iconColor}18` }}><Icon size={15} style={{color:iconColor}}/></div>
                    <span style={{ fontSize:10.5,color:"rgba(255,255,255,0.42)",fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase" }}>{label}</span>
                  </div>
                  <div style={{ fontSize:34,fontWeight:800,letterSpacing:"-0.03em",lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:12,color:subColor||"rgba(255,255,255,0.38)",marginTop:10,fontWeight:500 }}>{sub}</div>
                </div>
              </LiquidCard>
            ))}
          </div>
        )}

        {/* STAT CARDS — бодит backend өсөлт/бууралт */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20 }}>
          {statCards.map(({ label,value,growth,Icon,spark,accent,glow,gradId },i) => (
            <LiquidCard key={i} glow={glow} style={{ padding:"22px 24px" }}>
              <div style={{ position:"absolute",bottom:"-40%",right:"-15%",width:"75%",height:"120%",borderRadius:"50%",background:`radial-gradient(circle,${accent}22 0%,transparent 70%)`,filter:"blur(28px)",pointerEvents:"none" }}/>
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14 }}>
                <div style={{ padding:10,borderRadius:12,background:`${accent}1e` }}><Icon size={20} style={{color:accent}}/></div>
                {/* Бодит өсөлт/бууралт — backend-с */}
                <GrowthBadge label={growth}/>
              </div>
              <div style={{ fontSize:26,fontWeight:800,letterSpacing:"-0.02em",marginBottom:2 }}>{value}</div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.42)",marginBottom:10 }}>{label}</div>
              <AreaSparkline values={spark} color={accent} gradientId={gradId}/>
              <div style={{ marginTop:8,fontSize:11,color:"rgba(255,255,255,0.28)",borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:8 }}>
                Өчигдрөөс харьцуулбал
              </div>
            </LiquidCard>
          ))}
        </div>

        {/* SCHEDULE + ALERTS */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 340px",gap:20,marginBottom:20 }}>
          <LiquidCard style={{ padding:"26px 28px" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ padding:8,borderRadius:10,background:"rgba(56,189,248,0.12)" }}><CalendarDays size={16} style={{color:"#38bdf8"}}/></div>
                <span style={{ fontWeight:700,fontSize:15 }}>Өнөөдрийн үзвэрийн хуваарь</span>
              </div>
              <button onClick={()=>typeof onNavigateToSchedule==="function"&&onNavigateToSchedule()} style={{ display:"flex",alignItems:"center",gap:4,color:"rgba(255,255,255,0.36)",fontSize:12,background:"none",border:"none",cursor:"pointer" }}>Бүгдийг харах <ChevronRight size={14}/></button>
            </div>
            {!todayHasSchedule ? (
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",gap:14 }}>
                <div style={{ width:56,height:56,borderRadius:16,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.22)",display:"flex",alignItems:"center",justifyContent:"center" }}><CalendarDays size={24} style={{color:"#fbbf24"}}/></div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontWeight:700,fontSize:14,color:"rgba(255,255,255,0.7)",marginBottom:6 }}>Өнөөдрийн хуваарь байхгүй</div>
                  <div style={{ fontSize:12,color:"rgba(255,255,255,0.38)" }}>Шинэ үзвэрийн цаг нэмж хуваарь үүсгэнэ үү</div>
                </div>
                <button onClick={handleOpenSchedule} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 20px",borderRadius:12,fontSize:13,fontWeight:700,background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.3)",color:"#fbbf24",cursor:"pointer" }}><CalendarPlus size={14}/> Хуваарь нэмэх</button>
              </div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {showtimes.map(show => {
                  const pct=parseInt(show.occupancy);
                  const occColor=pct>=85?"#f87171":pct>=60?"#fbbf24":"#34d399";
                  return (
                    <div key={show.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:16,background:"rgba(255,255,255,0.038)",border:"1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                        <MoviePoster src={show.poster} title={show.movie}/>
                        <div>
                          <div style={{ fontWeight:700,fontSize:14 }}>{show.movie}</div>
                          <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:3,display:"flex",alignItems:"center",gap:5 }}><Armchair size={11}/> {show.hall}<span style={{opacity:0.4}}>·</span><Clock4 size={11}/> {show.time}</div>
                          {show.genre && <span style={{ marginTop:5,display:"inline-block",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:99,background:"rgba(167,139,250,0.15)",color:"#c4b5fd" }}>{show.genre}</span>}
                        </div>
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:5 }}>{show.seats}/{show.totalSeats} суудал</div>
                          <div style={{ width:80,height:4,borderRadius:99,background:"rgba(255,255,255,0.08)",overflow:"hidden" }}><div style={{ height:"100%",width:show.occupancy,borderRadius:99,background:`linear-gradient(90deg,${occColor}99,${occColor})` }}/></div>
                        </div>
                        <OccupancyRing pct={pct} color={occColor}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </LiquidCard>

          <LiquidCard style={{ padding:"26px 24px" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ padding:8,borderRadius:10,background:"rgba(239,68,68,0.12)" }}><BellDot size={16} style={{color:"#f87171"}}/></div>
                <span style={{ fontWeight:700,fontSize:15 }}>Мэдэгдэл</span>
              </div>
              {alerts.length>0 && <div style={{ fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:99,background:"rgba(239,68,68,0.15)",color:"#f87171" }}>{alerts.length}</div>}
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {alerts.map(a => {
                const c=ALERT_CFG[a.type]||ALERT_CFG.info;
                return (
                  <div key={a.id} style={{ padding:"14px",borderRadius:16,background:c.bg,border:`1px solid ${c.border}` }}>
                    <div style={{ display:"flex",gap:10 }}>
                      <div style={{ padding:7,borderRadius:10,background:c.iconBg,flexShrink:0 }}><c.Icon size={14} style={{color:c.iconColor}}/></div>
                      <div>
                        <p style={{ fontSize:12.5,color:"rgba(255,255,255,0.88)",margin:0,lineHeight:1.45 }}>{a.message}</p>
                        <p style={{ fontSize:11,color:"rgba(255,255,255,0.3)",margin:"5px 0 0" }}>{a.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:16,padding:"18px 16px",borderRadius:18,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)",marginBottom:14 }}>Энэ долоо хоног</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,textAlign:"center" }}>
                <div><div style={{ fontSize:22,fontWeight:800 }}>{(stats?.activeShows||0)*7}</div><div style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>Нийт үзвэр</div></div>
                <div><div style={{ fontSize:22,fontWeight:800 }}>{stats?.occupancyRate||"0%"}</div><div style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>Дундаж дүүргэлт</div></div>
              </div>
              <div style={{ marginTop:14,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.07)",textAlign:"center" }}>
                <div style={{ fontSize:18,fontWeight:800,color:stats?.weeklyGrowth?.startsWith('-')?"#f87171":"#4ade80" }}>{stats?.weeklyGrowth||"+0%"}</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>Өмнөх долоо хоногоос</div>
              </div>
            </div>
          </LiquidCard>
        </div>

        {/* BOOKINGS TABLE */}
        <LiquidCard style={{ padding:"26px 28px" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ padding:8,borderRadius:10,background:"rgba(167,139,250,0.12)" }}><Activity size={16} style={{color:"#a78bfa"}}/></div>
              <span style={{ fontWeight:700,fontSize:15 }}>Сүүлийн захиалгууд</span>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
              {[{key:"all",label:"Бүгд"},{key:"active",label:"Идэвхтэй"},{key:"used",label:"Ашиглагдсан"},{key:"pending",label:"Хүлээгдэж буй"},{key:"cancelled",label:"Цуцлагдсан"}].map(({key,label}) => (
                <button key={key} onClick={()=>setTab(key)} style={{ padding:"5px 13px",borderRadius:99,fontSize:12,fontWeight:600,border:"1px solid",borderColor:tab===key?"rgba(167,139,250,0.5)":"rgba(255,255,255,0.08)",background:tab===key?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.04)",color:tab===key?"#c4b5fd":"rgba(255,255,255,0.38)",cursor:"pointer",transition:"all 0.15s" }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                  {["Хэрэглэгч","Кино","Суудал","Дүн","Хугацаа","Төлөв"].map(h => (
                    <th key={h} style={{ textAlign:"left",paddingBottom:12,paddingRight:16,fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(255,255,255,0.28)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length===0 ? (
                  <tr><td colSpan={6} style={{ textAlign:"center",padding:"36px 0",color:"rgba(255,255,255,0.3)",fontSize:13 }}>Захиалга олдсонгүй</td></tr>
                ) : filteredBookings.map(b => {
                  const st=deriveBookingStatus(b);
                  const cfg=STATUS_CFG[st]||STATUS_CFG.active;
                  const SIcon=cfg.Icon;
                  return (
                    <tr key={b.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.045)" }}>
                      <td style={{ padding:"13px 16px 13px 0",fontSize:13.5,fontWeight:600 }}>{b.customer}</td>
                      <td style={{ padding:"13px 16px 13px 0",fontSize:13,color:"rgba(255,255,255,0.58)" }}>{b.movie}</td>
                      <td style={{ padding:"13px 16px 13px 0",fontSize:13,color:"rgba(255,255,255,0.58)" }}>{b.seats}</td>
                      <td style={{ padding:"13px 16px 13px 0",fontSize:13.5,fontWeight:700,color:"#4ade80" }}>{b.amount}</td>
                      <td style={{ padding:"13px 16px 13px 0",fontSize:12,color:"rgba(255,255,255,0.36)" }}>{b.time}</td>
                      <td style={{ padding:"13px 0" }}><span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:99,fontSize:12,fontWeight:600,background:cfg.bg,color:cfg.color }}><SIcon size={11}/>{cfg.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </LiquidCard>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }
        tr:hover td { background:rgba(255,255,255,0.012); }
      `}</style>
    </div>
  );
}