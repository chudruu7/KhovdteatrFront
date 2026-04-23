import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import MyBookingHeader from '../components/Header';
import TicketDesign from './TicketDesign';
import QPayModal from '../components/QPayModal';


const TIMEOUT_SECS = 600;
const API_BASE_URL = 'https://khovdteatrbackend.onrender.com/';

const PRICES = {
  standard: { adult: 15000, child: 8000 },
  prime:    { adult: 20000, child: 10000 },
};


const MONGOLIA_MS = 8 * 60 * 60 * 1000;
const utcToMN = (iso) => {
  const d = new Date(new Date(iso).getTime() + MONGOLIA_MS);
  return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
};
const getMovieId = (m) => m?._id || m?.id || null;

const getHeaders = () => {
  const h = { 'Content-Type': 'application/json' };
  const t = localStorage.getItem('token');
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
};
const handleResponse = async (res) => {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `Алдаа (${res.status})`);
  return data;
};
const money = (n = 0) => n.toLocaleString() + '₮';
const isPast = (timeStr, dateStr) => {
  if (new Date().toISOString().split('T')[0] !== dateStr) return false;
  const [h, m] = timeStr.split(':').map(Number);
  const t = new Date(); t.setHours(h, m, 0, 0);
  return t < new Date();
};
const weekDays = () => {
  const SHORT = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return { fullDate: d.toISOString().split('T')[0], short: SHORT[d.getDay()], num: d.getDate(), month: d.getMonth() + 1 };
  });
};
const genOrderId = () => 'TK-' + Date.now().toString(36).toUpperCase().slice(-5) + '-' + Math.random().toString(36).toUpperCase().slice(2, 6);
// ═══════════════════════════════════════════════════════
// SEAT LAYOUT — зургийн A-V баганы дагуу яг тодорхойлсон
// ═══════════════════════════════════════════════════════

// Суудлын тодорхойлолтын төрөл:
// { num: number }           — суудал
// { num: null, phantom: true } — харагдахгүй хоосон зай
// { num: number, broken: true } — эвдэрсэн/disabled суудал

const ROW_CELLS = [
{ label: '1-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
{ label: '2-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
{ label: '3-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
{ label: '4-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
{ label: '0-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
{ label: '5-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
{ label: '6-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
{ label: '7-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
{ label: '8-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
{ label: '9-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
{ label: '10-р эгнээ', left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
{ 
  label: '11-р эгнээ', 
  left:  [22,21,20,19,18,17,16,15,14,13,12].map(num => ({ num })), 
  right: [
    {num:11},{num:10},{num:9},{num:8},{num:7},
    {num:6},{num:5},{num:4},{num:3},{num:2},
    {num:1, broken:true}
  ]
},

  // 12р эгнээ
  // Зүүн: A,B хоосон → C=11,D=10,E=9,F=8,G=7,H=6,I=5 → J,K хоосон
  // Баруун: L,M хоосон → N=4,O=3,P=2,Q=1 → R,S,T,U,V хоосон
  {
    label: '12-р эгнээ',
    left:  [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:11},{num:10},{num:9},{num:8},{num:7},{num:6},{num:5},
      {num:null,phantom:true},{num:null,phantom:true},
    ],
    right: [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:4},{num:3},{num:2},{num:1},
      {num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},
    ],
  },

  // 13р эгнээ
  // Зүүн: A,B хоосон → C=13..I=7, J=6(disabled), K хоосон
  // Баруун: L хоосон → M=5(disabled) → N=4..Q=1 → R..V хоосон
  {
    label: '13-р эгнээ',
    left:  [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:13},{num:12},{num:11},{num:10},{num:9},{num:8},{num:7},
      {num:6,broken:true},
      {num:null,phantom:true},
    ],
    right: [
      {num:null,phantom:true},
      {num:5,broken:true},
      {num:4},{num:3},{num:2},{num:1},
      {num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},
    ],
  },

  // 14р эгнээ
  // Зүүн: A,B хоосон → C=12..I=6 → J,K хоосон
  // Баруун: L хоосон → M=5(disabled) → N=4..Q=1 → R..V хоосон
  {
    label: '14-р эгнээ',
    left:  [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:12},{num:11},{num:10},{num:9},{num:8},{num:7},{num:6},
      {num:null,phantom:true},{num:null,phantom:true},
    ],
    right: [
      {num:null,phantom:true},
      {num:5,broken:true},
      {num:4},{num:3},{num:2},{num:1},
      {num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},
    ],
  },

  // 15р эгнээ
  // Зүүн: A,B хоосон → C=11..H=6, I=5(disabled) → J,K хоосон
  // Баруун: L,M хоосон → N=4..Q=1 → R..V хоосон
  {
    label: '15-р эгнээ',
    left:  [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:11},{num:10},{num:9},{num:8},{num:7},{num:6},
      {num:5,broken:true},
      {num:null,phantom:true},{num:null,phantom:true},
    ],
    right: [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:4},{num:3},{num:2},{num:1},
      {num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},
    ],
  },

  // 16р эгнээ
  // Зүүн: A,B хоосон → C=9..H=4 → I,J,K хоосон
  // Баруун: L,M хоосон → N=3,O=2,P=1 → Q..V хоосон
  {
    label: '16-р эгнээ',
    left:  [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:9},{num:8},{num:7},{num:6},{num:5},{num:4},
      {num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},
    ],
    right: [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:3},{num:2},{num:1},
      {num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},
    ],
  },
];

// Эгнээний суудлуудыг үүсгэх хэрэгсэл функц
// left талаас [max..min], дараа нь gap, right талаас [max..min]
function buildRowSeats(leftRange, rightRange) {
  const left = [];
  for (let i = leftRange[0]; i >= leftRange[1]; i--) {
    left.push({ num: i });
  }
  const right = [];
  for (let i = rightRange[0]; i >= rightRange[1]; i--) {
    right.push({ num: i });
  }
  return { left, right };
}

// Seat ID: "1эг-15" хэлбэрт
function makeSeatId(rowLabel, num) {
  return `${rowLabel.replace('-р эгнээ', 'эг')}-${num}`;
}

/* ══ CSS ══════════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}

:root,
.dark {
  --bg:#22242f; --sidebar:#1e2029; --panel:#2a2d3b; --card:#30334a;
  --teal:#1de9b6; --teal-bg:rgba(29,233,182,.15);
  --coral:#e8607a; --coral-bg:rgba(232,96,122,.80);
  --avail:#393c52; --text:#d8dce8; --sub:#6b7080; --sub2:#9498ae;
  --border:rgba(255,255,255,.07); --border2:rgba(255,255,255,.14);
  --hero-overlay:rgba(34,36,47,.85);
  --screen-lbl:#6b7080;
  --inp-bg:#30334a; --inp-border:rgba(255,255,255,.07);
  --back-btn-color:#9498ae; --back-btn-border:rgba(255,255,255,.07);
  --warn-bg:rgba(255,179,71,.04); --warn-border:rgba(255,179,71,.17);
  --modal-bg:#2a2d3b;
  --cart-bg:#2a2d3b; --cart-border:rgba(255,255,255,.14);
  --stype-bg:#2a2d3b;
  --mobile-menu-bg:rgba(0,0,0,.95);
}

.light {
  --bg:#f0f2f7; --sidebar:#ffffff; --panel:#ffffff; --card:#f6f7fb;
  --teal:#0bbfa0; --teal-bg:rgba(11,191,160,.12);
  --coral:#e8607a; --coral-bg:rgba(232,96,122,.75);
  --avail:#dde0ec; --text:#1a1d2e; --sub:#7a7f99; --sub2:#555a75;
  --border:rgba(0,0,0,.08); --border2:rgba(0,0,0,.13);
  --hero-overlay:rgba(240,242,247,.82);
  --screen-lbl:#9498ae;
  --inp-bg:#f0f2f7; --inp-border:rgba(0,0,0,.1);
  --back-btn-color:#555a75; --back-btn-border:rgba(0,0,0,.12);
  --warn-bg:rgba(255,179,71,.07); --warn-border:rgba(255,179,71,.3);
  --modal-bg:#ffffff;
  --cart-bg:#ffffff; --cart-border:rgba(0,0,0,.12);
  --stype-bg:#ffffff;
  --mobile-menu-bg:rgba(255,255,255,.97);
}

body,#root{background:var(--bg);min-height:100vh}

.bk{font-family:'Nunito Sans',sans-serif;color:var(--text);background:var(--bg);min-height:100vh;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes popIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}

.bk-page{display:flex;min-height:calc(100vh - 7rem);animation:fadeIn .4s ease;}

.bk-aside{width:310px;flex-shrink:0;background:var(--sidebar);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;position:sticky;top:7rem;height:calc(100vh - 7rem);align-self:flex-start;}
.bk-poster-box{position:relative;width:100%;flex:0 0 auto;overflow:hidden;}
.bk-poster-box img{width:100%;height:100%;object-fit:cover;display:block;}
.bk-poster-box::before{content:'';position:absolute;inset:0 0 auto 0;height:40%;background:linear-gradient(to bottom,var(--sidebar) 0%,transparent 100%);z-index:1;pointer-events:none;}
.bk-poster-box::after{content:'';position:absolute;inset:auto 0 0 0;height:40%;background:linear-gradient(to top,var(--sidebar) 0%,transparent 100%);z-index:1;pointer-events:none;}
.bk-play{position:absolute;bottom:1.1rem;left:50%;transform:translateX(-50%);z-index:2;width:52px;height:52px;border-radius:50%;background:var(--coral);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 7px rgba(232,96,122,.18),0 6px 24px rgba(232,96,122,.42);transition:transform .2s,box-shadow .2s;}
.bk-play:hover{transform:translateX(-50%) scale(1.1);box-shadow:0 0 0 10px rgba(232,96,122,.2),0 8px 32px rgba(232,96,122,.58);}
.bk-info{padding:.85rem 1.5rem 1.5rem;display:flex;flex-direction:column;gap:.9rem;overflow-y:auto;flex:1;}
.bk-info::-webkit-scrollbar{width:3px}.bk-info::-webkit-scrollbar-thumb{background:rgba(128,128,128,.2);border-radius:2px}
.bk-info-lbl{font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sub);margin-bottom:.3rem;}
.bk-info-val{font-size:.85rem;color:var(--text);line-height:1.6;font-weight:400}
.bk-info-desc{font-size:.82rem;color:var(--sub2);line-height:1.65;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden;}

.bk-main{flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative;}
.bk-hero{position:relative;overflow:hidden;min-height:185px;flex-shrink:0;}
.bk-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center top;filter:brightness(.3) saturate(.75);z-index:0;}
.light .bk-hero-bg{filter:brightness(.45) saturate(.5);}
.bk-hero-fade{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 0%,var(--bg) 100%);z-index:1;}
.dark .bk-hero-fade{background:linear-gradient(to bottom,rgba(34,36,47,.2) 0%,rgba(34,36,47,.75) 55%,var(--bg) 100%);}
.light .bk-hero-fade{background:linear-gradient(to bottom,rgba(240,242,247,.1) 0%,rgba(240,242,247,.7) 55%,var(--bg) 100%);}
.bk-hero-content{position:relative;z-index:2;padding:1.6rem 2.2rem 1.4rem;display:flex;flex-direction:column;gap:1rem;}
.bk-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap;}
.bk-title{font-size:2.2rem;font-weight:800;color:var(--text);line-height:1.1;letter-spacing:-.025em;}
.bk-hero .bk-title{color:#fff;}
.bk-title-right{display:flex;align-items:center;gap:.7rem;flex-shrink:0;padding-top:.3rem;}
.bk-dur{display:flex;align-items:center;gap:.4rem;font-size:.8rem;color:rgba(255,255,255,.7);font-weight:600;}
.bk-badge{padding:.28rem .75rem;border-radius:20px;border:1.5px solid var(--teal);color:var(--teal);font-size:.7rem;font-weight:700;letter-spacing:.04em;}

.bk-schedule{display:flex;align-items:flex-start;gap:0;background:rgba(128,128,128,.06);border:1px solid var(--border2);border-radius:14px;padding:1.1rem 1.4rem;}
.bk-date-col{flex:1;min-width:0;}
.bk-sched-lbl{font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--teal);margin-bottom:.75rem;display:flex;align-items:center;gap:.4rem;}
.bk-sched-lbl::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--teal);flex-shrink:0;}
.bk-days{display:flex;gap:.4rem;overflow-x:auto;}
.bk-days::-webkit-scrollbar{display:none}
.bk-day{display:flex;flex-direction:column;align-items:center;gap:.1rem;min-width:50px;padding:.5rem .4rem .55rem;border-radius:8px;cursor:pointer;background:rgba(128,128,128,.07);border:1px solid transparent;transition:all .15s;}
.bk-day:hover{background:rgba(128,128,128,.14);border-color:var(--border2);}
.bk-day-s{font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--sub2);transition:color .15s;}
.bk-day-n{font-family:'DM Mono',monospace;font-size:1.2rem;font-weight:600;color:var(--text);opacity:.65;transition:color .15s;}
.bk-day.d-sel{background:rgba(29,233,182,.18);border-color:rgba(29,233,182,.45);box-shadow:0 0 12px rgba(29,233,182,.15);}
.bk-day.d-sel .bk-day-s,.bk-day.d-sel .bk-day-n{color:var(--teal);opacity:1;}
.bk-sched-div{width:1px;background:var(--border2);margin:0 1.75rem;align-self:stretch;flex-shrink:0;}
.bk-time-col{flex:1;min-width:0;}
.bk-times{display:flex;gap:.5rem;flex-wrap:wrap;}
.bk-time{display:flex;flex-direction:column;align-items:center;gap:.05rem;padding:.5rem .9rem .55rem;border-radius:8px;cursor:pointer;border:1px solid var(--border2);background:rgba(128,128,128,.06);transition:all .15s;min-width:62px;}
.bk-time:hover:not(.t-past){border-color:rgba(29,233,182,.4);background:rgba(29,233,182,.08);}
.bk-time-f{font-size:.5rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sub2);}
.bk-time-v{font-family:'DM Mono',monospace;font-size:.92rem;font-weight:600;color:var(--text);}
.bk-time.t-sel{background:var(--teal);border-color:var(--teal);box-shadow:0 0 14px rgba(29,233,182,.3);}
.bk-time.t-sel .bk-time-f,.bk-time.t-sel .bk-time-v{color:#0f261c;font-weight:700}
.bk-time.t-past{opacity:.2;cursor:not-allowed;}
.bk-fixed{display:flex;align-items:center;gap:.7rem;}
.bk-fixed-chip{padding:.5rem 1rem;border-radius:8px;background:var(--teal);font-family:'DM Mono',monospace;font-size:.95rem;font-weight:700;color:#0f261c;}
.bk-fixed-note{font-size:.72rem;color:var(--sub);font-style:italic;}

/* ══ SEAT MAP ══════════════════════════════════════════════════════════════ */
.bk-map-wrap{flex:1;padding:0 2.2rem 5rem;background:var(--bg);display:flex;flex-direction:column;}
.bk-screen{text-align:center;margin-bottom:1.5rem;padding-top:1.5rem;}
.bk-screen-line{width:78%;height:4px;margin:0 auto .45rem;background:linear-gradient(90deg,transparent 0%,var(--coral) 20%,var(--coral) 80%,transparent 100%);border-radius:3px 3px 0 0;box-shadow:0 0 26px rgba(232,96,122,.28);}
.bk-screen-lbl{font-size:.58rem;font-weight:600;letter-spacing:.45em;text-transform:uppercase;color:var(--screen-lbl);}

.bk-rows{display:flex;flex-direction:column;gap:3px;flex:1;}
.bk-row{display:flex;align-items:center;gap:6px;}

.bk-rl{font-family:'DM Mono',monospace;font-size:.6rem;color:var(--sub);width:76px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.bk-rl-left{text-align:right;}
.bk-rl-right{text-align:left;}

/* Суудлын container — голын зай ТОГТМОЛ байхаар */
.bk-seats { 
  display:flex; align-items:center; flex:1; 
  justify-content:center; min-width:0; overflow:hidden; 
}
.bk-seats-left  { 
  display:flex; justify-content:flex-end; 
  gap:2px; flex:1; min-width:0; overflow:hidden; 
}
.bk-seats-right { 
  display:flex; justify-content:flex-start; 
  gap:2px; flex:1; min-width:0; overflow:hidden; 
}
.bk-aisle{width:10px;flex-shrink:0;}

.bk-s{position:relative;width:30px;height:26px;border:none;cursor:pointer;flex-shrink:0;border-radius:5px 5px 3px 3px;background:var(--avail);transition:background .1s,transform .1s;font-family:'DM Mono',monospace;font-size:.52rem;color:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;}
.light .bk-s{color:rgba(0,0,0,.35);}
.bk-s::after{content:'';position:absolute;inset:auto 2px -2px 2px;height:2px;background:rgba(0,0,0,.18);border-radius:0 0 2px 2px;}
.bk-s:hover:not(.s-tk):not(.s-broken){background:#474d66;transform:translateY(-2px);}
.light .bk-s:hover:not(.s-tk):not(.s-broken){background:#bbbfda;}
.bk-s.s-tk{background:var(--coral-bg);cursor:not-allowed;color:rgba(255,255,255,.1);}
.bk-s.s-broken{background:#1e2029;cursor:not-allowed;opacity:0.35;border:1px dashed rgba(255,255,255,.12);}
.light .bk-s.s-broken{background:#d0d2dc;border:1px dashed rgba(0,0,0,.15);}
.bk-s.s-ch{background:var(--teal) !important;box-shadow:0 0 12px rgba(29,233,182,.4);transform:translateY(-2px);color:rgba(15,38,28,.45) !important;}
.bk-s.s-ch-child{background:#a78bfa !important;box-shadow:0 0 12px rgba(167,139,250,.4);transform:translateY(-2px);color:rgba(30,16,64,.45) !important;}

/* Эгнээний container */
.bk-rows{display:flex;flex-direction:column;gap:3px;flex:1;}
.bk-row{display:flex;align-items:center;gap:6px;}

/* Эгнээний үсэг/тоо (хоёр тал) */
.bk-rl{
  font-family:'DM Mono',monospace;
  font-size:.6rem;
  color:var(--sub);
  width:76px;
  flex-shrink:0;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.bk-rl-left{ text-align:right; }
.bk-rl-right{ text-align:left; }

/* Суудлуудын container */
.bk-seats{display:flex;align-items:center;flex:1;}
.bk-seats-left{flex:1;display:flex;justify-content:flex-end;gap:2px;}
.bk-seats-right{flex:1;display:flex;justify-content:flex-start;gap:2px;}

/* Голын зай */
.bk-aisle{width:10px;flex-shrink:0;}

/* Суудал */
.bk-s{
  position:relative;
  width:30px;
  height:26px;
  border:none;
  cursor:pointer;
  flex-shrink:0;
  border-radius:5px 5px 3px 3px;
  background:var(--avail);
  transition:background .1s,transform .1s;
  font-family:'DM Mono',monospace;
  font-size:.52rem;
  color:rgba(255,255,255,.25);
  display:flex;
  align-items:center;
  justify-content:center;
}
.light .bk-s{color:rgba(0,0,0,.35);}
.bk-s::after{
  content:'';
  position:absolute;
  inset:auto 2px -2px 2px;
  height:2px;
  background:rgba(0,0,0,.18);
  border-radius:0 0 2px 2px;
}
.bk-s:hover:not(.s-tk){background:#474d66;transform:translateY(-2px);}
.light .bk-s:hover:not(.s-tk){background:#bbbfda;}
.bk-s.s-tk{background:var(--coral-bg);cursor:not-allowed;color:rgba(255,255,255,.1);}
.bk-s.s-ch{background:var(--teal) !important;box-shadow:0 0 12px rgba(29,233,182,.4);transform:translateY(-2px);color:rgba(15,38,28,.45) !important;}
.bk-s.s-ch-child{background:#a78bfa !important;box-shadow:0 0 12px rgba(167,139,250,.4);transform:translateY(-2px);color:rgba(30,16,64,.45) !important;}

/* ══ BOTTOM BAR ══════════════════════════════════════════════════════════ */
.bk-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:1.1rem;padding-top:1rem;border-top:1px solid var(--border);gap:.75rem;flex-wrap:wrap;}
.bk-legend{display:flex;gap:1.4rem;flex-wrap:wrap;}
.bk-leg{display:flex;align-items:center;gap:.5rem;}
.bk-leg-dot{width:26px;height:20px;border-radius:4px 4px 3px 3px;flex-shrink:0;}
.bk-leg-lbl{font-size:.73rem;color:var(--sub2);}

/* ══ SHOPPING CART ═══════════════════════════════════════════════════════ */
.bk-cart{position:fixed;z-index:200;width:340px;background:var(--cart-bg);border:1px solid var(--cart-border);border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.25);overflow:hidden;animation:slideIn .3s ease;backdrop-filter:blur(12px);user-select:none;}
.dark .bk-cart{box-shadow:0 20px 50px rgba(0,0,0,.65);}
.bk-cart-handle{display:flex;justify-content:space-between;align-items:center;padding:13px 16px;background:linear-gradient(135deg,var(--teal) 0%,#13c4a3 100%);cursor:grab;}
.bk-cart-handle:active{cursor:grabbing;}
.bk-cart-handle-left{display:flex;align-items:center;gap:10px;color:#0f261c;}
.bk-cart-grip{display:flex;flex-direction:column;gap:3px;opacity:.5;}
.bk-cart-grip span{display:block;width:16px;height:2px;background:#0f261c;border-radius:2px;}
.bk-cart-icon{font-size:1.1rem;}
.bk-cart-count{background:rgba(0,0,0,.18);padding:3px 10px;border-radius:20px;font-size:.78rem;font-weight:700;}
.bk-cart-total-chip{font-size:.95rem;font-weight:800;}
.bk-cart-toggle{background:rgba(0,0,0,.12);border:none;color:#0f261c;width:28px;height:28px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.8rem;transition:background .15s;}
.bk-cart-toggle:hover{background:rgba(0,0,0,.22);}
.bk-cart-body{max-height:380px;overflow-y:auto;}
.bk-cart-body::-webkit-scrollbar{width:4px;}
.bk-cart-body::-webkit-scrollbar-thumb{background:rgba(128,128,128,.2);border-radius:2px;}
.bk-cart-items{padding:12px 14px;}
.bk-cart-item{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--border);animation:fadeIn .2s ease;}
.bk-cart-item:last-child{border-bottom:none;}
.bk-cart-seat-id{font-family:'DM Mono',monospace;font-size:.85rem;font-weight:700;color:var(--teal);margin-bottom:5px;}
.bk-cart-type-row{display:flex;gap:5px;}
.bk-cart-type-btn{padding:3px 9px;border-radius:20px;border:1px solid var(--border2);background:transparent;color:var(--sub2);font-size:.65rem;font-weight:600;cursor:pointer;transition:all .13s;}
.bk-cart-type-btn:hover:not(.on){border-color:var(--sub2);color:var(--text);}
.bk-cart-type-btn.on{background:var(--teal);border-color:var(--teal);color:#0f261c;font-weight:700;}
.bk-cart-type-btn.child-on{background:#a78bfa;border-color:#a78bfa;color:#1e1040;}
.bk-cart-right{display:flex;align-items:center;gap:8px;}
.bk-cart-price{font-size:.88rem;font-weight:700;color:var(--text);white-space:nowrap;}
.bk-cart-rm{width:26px;height:26px;border-radius:50%;border:1px solid var(--border);background:transparent;color:var(--sub);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.7rem;transition:all .13s;}
.bk-cart-rm:hover{background:var(--coral);border-color:var(--coral);color:#fff;}
.bk-cart-summary{padding:10px 14px 14px;border-top:1px solid var(--border2);background:rgba(0,0,0,.06);}
.dark .bk-cart-summary{background:rgba(0,0,0,.15);}
.bk-cart-sum-row{display:flex;justify-content:space-between;padding:4px 0;font-size:.78rem;color:var(--sub);}
.bk-cart-total-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0 0;border-top:1px solid var(--border);margin-top:6px;font-weight:700;}
.bk-cart-total-label{color:var(--text);font-size:.88rem;}
.bk-cart-total-amt{color:var(--teal);font-size:1.1rem;}

/* ══ SEAT TYPE SELECTOR ══════════════════════════════════════════════════ */
.bk-stype-selector{position:absolute;top:-46px;left:50%;transform:translateX(-50%);z-index:20;min-width:130px;}
.bk-stype-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;border:none;border-radius:25px;cursor:pointer;font-size:.68rem;font-weight:600;transition:all .2s;box-shadow:0 3px 10px rgba(0,0,0,.2);width:100%;}
.dark .bk-stype-btn{box-shadow:0 3px 10px rgba(0,0,0,.35);}
.bk-stype-btn.adult{background:linear-gradient(135deg,#1de9b6 0%,#13c4a3 100%);color:#0f261c;}
.bk-stype-btn.child{background:linear-gradient(135deg,#a78bfa 0%,#8b5cf6 100%);color:#fff;}
.bk-stype-btn:hover{transform:translateY(-2px);box-shadow:0 5px 14px rgba(0,0,0,.28);}
.bk-stype-label{flex:1;text-align:left;}
.bk-stype-dropdown{position:absolute;top:calc(100% + 6px);left:0;right:0;background:var(--stype-bg);border:1px solid var(--border2);border-radius:12px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.22);animation:slideDown .18s ease;z-index:30;}
.dark .bk-stype-dropdown{box-shadow:0 10px 28px rgba(0,0,0,.55);}
.bk-stype-header{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:rgba(128,128,128,.08);border-bottom:1px solid var(--border);}
.bk-stype-seat{font-family:'DM Mono',monospace;font-weight:700;color:var(--teal);font-size:.88rem;}
.bk-stype-close{background:transparent;border:none;color:var(--sub);cursor:pointer;font-size:.75rem;padding:3px 7px;border-radius:4px;}
.bk-stype-close:hover{background:rgba(128,128,128,.12);color:var(--text);}
.bk-stype-option{display:flex;align-items:center;gap:10px;padding:11px 12px;width:100%;border:none;background:transparent;cursor:pointer;transition:background .13s;border-bottom:1px solid var(--border);}
.bk-stype-option:last-child{border-bottom:none;}
.bk-stype-option:hover{background:rgba(128,128,128,.07);}
.bk-stype-option.selected{background:rgba(29,233,182,.08);}
.bk-stype-icon{font-size:1.1rem;}
.bk-stype-info{flex:1;display:flex;flex-direction:column;gap:1px;text-align:left;}
.bk-stype-title{color:var(--text);font-weight:600;font-size:.78rem;}
.bk-stype-price{color:var(--teal);font-size:.68rem;font-weight:600;}
.bk-stype-check{color:var(--teal);font-weight:700;}
.bk-stype-note{padding:8px 12px;background:rgba(0,0,0,.06);color:var(--sub);font-size:.62rem;text-align:center;border-top:1px solid var(--border);}

/* ══ STEP 2 ══════════════════════════════════════════════════════════════ */
.bk-error{background:rgba(232,96,122,.1);border:1px solid rgba(232,96,122,.3);border-radius:9px;padding:.85rem 1.1rem;color:#e8607a;font-size:.82rem;margin-bottom:1rem;display:flex;align-items:center;gap:.6rem;}
.bk-s2{padding:2rem 2.2rem;max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:1.25rem;animation:slideUp .4s ease;}
.bk-card{background:var(--panel);border:1px solid var(--border);border-radius:11px;padding:1.75rem;box-shadow:0 2px 12px rgba(0,0,0,.05);}
.dark .bk-card{box-shadow:none;}
.bk-card-title{font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:1.4rem;}
.bk-field{display:flex;flex-direction:column;gap:.4rem;margin-bottom:1rem;}
.bk-field:last-child{margin-bottom:0}
.bk-field label{font-size:.62rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--sub);}
.bk-inp{background:var(--inp-bg);border:1px solid var(--inp-border);border-radius:7px;color:var(--text);padding:.78rem 1.05rem;font-family:'Nunito Sans',sans-serif;font-size:.9rem;outline:none;width:100%;transition:border-color .15s;}
.bk-inp:focus{border-color:rgba(29,233,182,.5);}
.bk-inp::placeholder{color:var(--sub);}
.bk-g2{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
.bk-acts{display:flex;gap:.75rem;margin-top:1.1rem;}
.bk-back{padding:.75rem 1.4rem;border-radius:7px;cursor:pointer;background:transparent;border:1px solid var(--back-btn-border);color:var(--back-btn-color);font-family:'Nunito Sans',sans-serif;font-size:.88rem;font-weight:600;transition:all .15s;}
.bk-back:hover{border-color:var(--border2);color:var(--text);}
.bk-pay{flex:1;padding:.75rem;border-radius:7px;cursor:pointer;background:var(--teal);border:none;color:#0f261c;font-family:'Nunito Sans',sans-serif;font-size:.92rem;font-weight:800;box-shadow:0 4px 18px rgba(29,233,182,.28);transition:all .2s;}
.bk-pay:hover{box-shadow:0 6px 26px rgba(29,233,182,.44);}
.bk-pay:disabled{opacity:.45;cursor:not-allowed;}
.bk-orow{display:flex;justify-content:space-between;align-items:center;padding:.55rem 0;border-bottom:1px solid var(--border);font-size:.84rem;}
.bk-orow:last-child{border-bottom:none}
.bk-orow span:first-child{color:var(--sub);}
.bk-orow span:last-child{color:var(--text);font-weight:600;}
.bk-ototal{display:flex;justify-content:space-between;align-items:center;padding-top:.9rem;margin-top:.25rem;border-top:1px solid var(--border);font-size:1rem;font-weight:700;}
.bk-ototal-a{color:var(--teal);font-size:1.15rem;}
.bk-warn{background:var(--warn-bg);border:1px solid var(--warn-border);border-radius:9px;padding:.9rem 1.1rem;}
.bk-warn-t{font-size:.72rem;font-weight:700;color:#e09a30;margin-bottom:.45rem;}
.bk-warn ul{list-style:disc;padding-left:1.1rem;}
.bk-warn li{font-size:.72rem;color:rgba(180,130,50,.85);line-height:1.65;}
.light .bk-warn li{color:#a07020;}

/* ══ STEP 3 ══════════════════════════════════════════════════════════════ */
.bk-s3{display:flex;justify-content:center;align-items:center;min-height:80vh;padding:2rem;}
.bk-s3-box{max-width:440px;width:100%;text-align:center;animation:popIn .5s cubic-bezier(.175,.885,.32,1.275);}

/* ══ MODALS ══════════════════════════════════════════════════════════════ */
.bk-ov{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.6);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:1rem;}
.bk-modal{background:var(--modal-bg);border:1px solid var(--border2);border-radius:13px;width:100%;max-width:440px;padding:1.8rem;animation:popIn .3s cubic-bezier(.175,.885,.32,1.275);box-shadow:0 20px 50px rgba(0,0,0,.2);}
.dark .bk-modal{box-shadow:0 20px 50px rgba(0,0,0,.65);}
.bk-modal-t{font-size:1.05rem;font-weight:700;color:var(--text);margin-bottom:1.1rem;}
.bk-modal-notice{background:rgba(255,179,71,.05);border:1px solid rgba(255,179,71,.2);border-radius:9px;padding:.9rem;margin-bottom:1.1rem;font-size:.78rem;color:#c08020;line-height:1.7;}
.dark .bk-modal-notice{color:rgba(255,179,71,.85);}
.bk-chk{display:flex;align-items:flex-start;gap:.7rem;cursor:pointer;font-size:.8rem;color:var(--text);margin-bottom:1.25rem;}
.bk-chk input{margin-top:3px;accent-color:var(--teal);}
.bk-mbtns{display:flex;gap:.7rem;}
.bk-mc{flex:1;padding:.7rem;border-radius:7px;cursor:pointer;background:transparent;border:1px solid var(--border);color:var(--sub2);font-family:'Nunito Sans',sans-serif;font-size:.82rem;font-weight:600;transition:all .15s;}
.bk-mc:hover{border-color:var(--border2);color:var(--text);}
.bk-mo{flex:2;padding:.7rem;border-radius:7px;cursor:pointer;background:var(--teal);border:none;color:#0f261c;font-family:'Nunito Sans',sans-serif;font-size:.84rem;font-weight:800;box-shadow:0 4px 16px rgba(29,233,182,.28);transition:all .15s;}
.bk-mo:disabled{opacity:.3;cursor:not-allowed;box-shadow:none;}

@media(max-width:960px){
  .bk-seats-left  { gap:1px; }
  .bk-seats-right { gap:1px; }
  .bk-aisle { width:6px; }
}
@media(max-width:640px){
  .bk-seats-left  { gap:1px; }
  .bk-seats-right { gap:1px; }
  .bk-aisle { width:4px; }
}
`;

/* ══ TRAILER MODAL ═══════════════════════════════════════════════════════ */
function TrailerModal({ trailerUrl, onClose, movieTitle }) {
  const modalRef = useRef(null);
  const embedUrl = useMemo(() => {
    if (!trailerUrl) return null;
    if (trailerUrl.includes('embed')) return trailerUrl.split('?')[0];
    const short = trailerUrl.match(/youtu\.be\/([^?]+)/);
    if (short) return `https://www.youtube.com/embed/${short[1]}`;
    const full  = trailerUrl.match(/[?&]v=([^&]+)/);
    if (full)  return `https://www.youtube.com/embed/${full[1]}`;
    return trailerUrl;
  }, [trailerUrl]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onOut = (e) => { if (modalRef.current && !modalRef.current.contains(e.target)) onClose(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onOut);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onOut);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const backdropVariants = { hidden:{opacity:0}, visible:{opacity:1,transition:{duration:.25}}, exit:{opacity:0,transition:{duration:.2}} };
  const modalVariants    = { hidden:{opacity:0,scale:.85,y:40}, visible:{opacity:1,scale:1,y:0,transition:{duration:.4,ease:'backOut'}}, exit:{opacity:0,scale:.85,y:40,transition:{duration:.25}} };

  return (
    <AnimatePresence>
      <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
        style={{position:'fixed',inset:0,zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem'}}>
        <motion.div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.88)',backdropFilter:'blur(14px)'}}
          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/>
        <motion.div ref={modalRef} variants={modalVariants} initial="hidden" animate="visible" exit="exit"
          style={{position:'relative',width:'100%',maxWidth:900,background:'#111318',borderRadius:20,overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,.8)',border:'1px solid rgba(255,255,255,.1)'}}>
          <motion.div initial={{y:-18,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:.18}}
            style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 1.4rem',background:'linear-gradient(to right,#0d0f14,#1a1d25)',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
            <span style={{color:'#fff',fontWeight:700,fontSize:'1rem'}}>{movieTitle||'Trailer'} — Official Trailer</span>
            <motion.button onClick={onClose} whileHover={{scale:1.12}} whileTap={{scale:.9}}
              style={{background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.15)',color:'#fff',width:34,height:34,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </motion.button>
          </motion.div>
          <motion.div style={{position:'relative',aspectRatio:'16/9',background:'#000'}} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.28}}>
            {embedUrl ? (
              <iframe src={`${embedUrl}?autoplay=1&rel=0`} style={{width:'100%',height:'100%',border:'none',display:'block'}}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen title={movieTitle||'Trailer'}/>
            ) : (
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#64748b',fontSize:'.9rem',padding:'2rem',textAlign:'center'}}>
                Энэ киноны trailer бүртгэлгүй байна.
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ══ SEAT TYPE SELECTOR ══════════════════════════════════════════════════ */
function SeatTypeSelector({ seatId, currentType, onTypeChange, displayLabel, prices }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  return (
    <div className="bk-stype-selector" ref={ref}>
      <button className={`bk-stype-btn ${currentType}`} onClick={() => setOpen(!open)}>
        {currentType==='adult'
          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="9.5" y1="13.5" x2="14.5" y2="13.5"/></svg>
        }
        <span className="bk-stype-label">{currentType==='adult'?'Том хүн':'Хүүхэд'}</span>
        <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor"><path d={open?"M1 7 L5 3 L9 7":"M1 3 L5 7 L9 3"}/></svg>
      </button>
      {open && (
        <div className="bk-stype-dropdown">
          <div className="bk-stype-header">
            <span className="bk-stype-seat">{displayLabel}</span>
            <button className="bk-stype-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          {[
            {type:'adult', label:'Том хүн', price:prices?.adult||15000},
            {type:'child', label:'Хүүхэд',  price:prices?.child||8000},
          ].map(o => (
            <button key={o.type} className={`bk-stype-option ${currentType===o.type?'selected':''}`}
              onClick={() => { onTypeChange(seatId, o.type); setOpen(false); }}>
              <span className="bk-stype-icon">
                {o.type==='adult'
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="9.5" y1="13.5" x2="14.5" y2="13.5"/></svg>
                }
              </span>
              <div className="bk-stype-info">
                <span className="bk-stype-title">{o.label}</span>
                <span className="bk-stype-price">{money(o.price)}</span>
              </div>
              {currentType===o.type && <span className="bk-stype-check">✓</span>}
            </button>
          ))}
          <div className="bk-stype-note">ⓘ Хүүхэд: 3–12 нас</div>
        </div>
      )}
    </div>
  );
}

/* ══ SHOPPING CART ═══════════════════════════════════════════════════════ */
function ShoppingCart({ seats, onUpdateType, onRemoveSeat, prices, totalPrice, onNext, timeChosen }) {
  const [expanded, setExpanded] = useState(true);
  const [pos,      setPos]      = useState({ x:null, y:null });
  const dragging   = useRef(false);
  const startMouse = useRef({});
  const startPos   = useRef({});
  const cartRef    = useRef(null);

  useEffect(() => {
    const el = cartRef.current;
    if (!el || pos.x !== null) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: window.innerWidth-rect.width-20, y: window.innerHeight-rect.height-20 });
  }, [seats.length]);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - startMouse.current.x;
    const dy = e.clientY - startMouse.current.y;
    const el = cartRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x:Math.max(0,Math.min(window.innerWidth-rect.width, startPos.current.x+dx)), y:Math.max(0,Math.min(window.innerHeight-rect.height, startPos.current.y+dy)) });
  }, []);
  const onMouseUp = useCallback(() => { dragging.current=false; window.removeEventListener('mousemove',onMouseMove); window.removeEventListener('mouseup',onMouseUp); }, [onMouseMove]);
  const onMouseDown = useCallback((e) => {
    if (e.button!==0) return; e.preventDefault(); dragging.current=true;
    startMouse.current={x:e.clientX,y:e.clientY}; startPos.current={x:pos.x||0,y:pos.y||0};
    window.addEventListener('mousemove',onMouseMove); window.addEventListener('mouseup',onMouseUp);
  }, [pos,onMouseMove,onMouseUp]);
  useEffect(() => () => { window.removeEventListener('mousemove',onMouseMove); window.removeEventListener('mouseup',onMouseUp); }, []);

  if (seats.length===0) return null;
  const adultSeats=seats.filter(s=>s.type==='adult'), childSeats=seats.filter(s=>s.type==='child');
  const style = pos.x!==null ? {left:pos.x,top:pos.y,bottom:'auto',right:'auto'} : {bottom:20,right:20};

  return (
    <div className="bk-cart" ref={cartRef} style={style}>
      <div className="bk-cart-handle" onMouseDown={onMouseDown}>
        <div className="bk-cart-handle-left">
          <div className="bk-cart-grip"><span/><span/><span/></div>
          <span className="bk-cart-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9h20M2 9l2 10h16l2-10M2 9l1-5h18l1 5M9 15v2M15 15v2"/></svg>
          </span>
          <span className="bk-cart-count">{seats.length} суудал</span>
          <span className="bk-cart-total-chip">{money(totalPrice)}</span>
        </div>
        <button className="bk-cart-toggle" onClick={e=>{e.stopPropagation();setExpanded(!expanded);}}>
          {expanded?'▼':'▲'}
        </button>
      </div>
      {expanded && (
        <div className="bk-cart-body">
          <div className="bk-cart-items">
            {seats.map(s=>(
              <div key={s.id} className="bk-cart-item">
                <div>
                  <div className="bk-cart-seat-id">{s.id}</div>
                  <div className="bk-cart-type-row">
                    <button className={`bk-cart-type-btn ${s.type==='adult'?'on':''}`} onClick={()=>onUpdateType(s.id,'adult')}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle',marginRight:'3px'}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Том хүн
                    </button>
                    <button className={`bk-cart-type-btn ${s.type==='child'?'child-on':''}`} onClick={()=>onUpdateType(s.id,'child')}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle',marginRight:'3px'}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="9.5" y1="13.5" x2="14.5" y2="13.5"/></svg>
                      Хүүхэд
                    </button>
                  </div>
                </div>
                <div className="bk-cart-right">
                  <span className="bk-cart-price">{money(s.type==='adult'?prices.adult:prices.child)}</span>
                  <button className="bk-cart-rm" onClick={()=>onRemoveSeat(s.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <div className="bk-cart-summary">
            <div className="bk-cart-sum-row"><span>Том хүн ({adultSeats.length})</span><span>{money(adultSeats.length*prices.adult)}</span></div>
            <div className="bk-cart-sum-row"><span>Хүүхэд ({childSeats.length})</span><span>{money(childSeats.length*prices.child)}</span></div>
            <div className="bk-cart-total-row"><span className="bk-cart-total-label">Нийт дүн</span><span className="bk-cart-total-amt">{money(totalPrice)}</span></div>
            <button style={{width:'100%',marginTop:'12px',padding:'.7rem',borderRadius:'10px',background:'var(--teal)',border:'none',cursor:'pointer',color:'#0f261c',fontFamily:'Nunito Sans,sans-serif',fontSize:'.88rem',fontWeight:800,boxShadow:'0 4px 16px rgba(29,233,182,.3)',opacity:!timeChosen?.4:1}}
              disabled={!timeChosen} onClick={onNext}>
              {!timeChosen?'⚠ Цаг сонгоно уу':'Үргэлжлүүлэх →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ SEAT MAP COMPONENT ══════════════════════════════════════════════════ */
// Зургийн схемийн дагуу суудлын зураглалыг дүрслэх
function SeatMap({ seats, onToggle, onTypeChange, takenSeats, prices }) {
  const has     = id => seats.some(s => s.id === id);
  const getType = id => seats.find(s => s.id === id)?.type || 'adult';

  const renderCell = (rowDef, cell) => {
    // Phantom: харагдахгүй хоосон зай
    if (cell.phantom) {
  return (
    <div
      key={`ph-${rowDef.label}-${cell._key}`}
      className="bk-s"
      style={{ visibility: 'hidden', pointerEvents: 'none' }}
    />
  );
}

    const id     = makeSeatId(rowDef.label, cell.num);
    const broken = !!cell.broken;
    const taken  = takenSeats.has(id);
    const chosen = has(id);
    const type   = getType(id);
    const cls    = [
      'bk-s',
      broken ? 's-broken' : taken ? 's-tk' : '',
      chosen && type === 'child' ? 's-ch-child' : chosen ? 's-ch' : '',
    ].filter(Boolean).join(' ');

return (
  <div key={`cell-${id}`} style={{ position: 'relative' }}>
        {chosen && !broken && (
          <SeatTypeSelector
            seatId={id}
            currentType={type}
            onTypeChange={onTypeChange}
            displayLabel={id}
            prices={prices}
          />
        )}
        <button
          className={cls}
          onClick={() => !taken && !broken && onToggle(id)}
          disabled={taken || broken}
          title={broken ? `${id} — эвдэрсэн` : id}
        >
          {cell.num}
        </button>
      </div>
    );
  };

  return (
    <div className="bk-rows">
      {ROW_CELLS.map((rowDef) => (
        <div key={rowDef.label} className="bk-row">
          <div className="bk-rl bk-rl-left">{rowDef.label}</div>
          <div className="bk-seats">
            <div className="bk-seats-left">
             {rowDef.left.map((cell, i) => renderCell(rowDef, { ...cell, _key: `L${i}` }))}
            </div>
            <div className="bk-aisle" />
            <div className="bk-seats-right">
              {rowDef.right.map((cell, i) => renderCell(rowDef, { ...cell, _key: `R${i}` }))}
            </div>
          </div>
          <div className="bk-rl bk-rl-right">{rowDef.label}</div>
        </div>
      ))}
    </div>
  );
}
/* ══ STEP 1 ══════════════════════════════════════════════════════════════ */
function Step1({ movie, fromSchedule, availableSchedules, seats, onToggle, onTypeChange, onRemoveSeat, totalPrice, onNext, days, onDate, onTime, takenSeats, prices }) {
  const [showTrailer, setShowTrailer] = useState(false);
  const [timeChosen,  setTimeChosen]  = useState(fromSchedule);
  const handleDate = d => { setTimeChosen(false); onDate(d); };
  const handleTime = (t,schedId) => { setTimeChosen(true); onTime(t,schedId); };
  const posterSrc = movie.posterUrl||'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80';
  const heroBg    = movie.backdropUrl||movie.posterUrl||'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=60';

  return (
    <div className="bk-page">
      {/* Sidebar */}
      <aside className="bk-aside">
        <div className="bk-poster-box" style={{aspectRatio:'2/3'}}>
          <img src={posterSrc} alt={movie.title} onError={e=>{e.target.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80';}}/>
          <button className="bk-play" onClick={() => setShowTrailer(true)} aria-label="Trailer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
        <div className="bk-info">
          {movie.director&&<div><div className="bk-info-lbl">Найруулагч</div><div className="bk-info-val">{movie.director}</div></div>}
          {(movie.cast||movie.starring)&&<div><div className="bk-info-lbl">Жүжигчид</div><div className="bk-info-val">{movie.cast||movie.starring}</div></div>}
          {movie.genre&&<div><div className="bk-info-lbl">Ангилал</div><div className="bk-info-val">{Array.isArray(movie.genre)?movie.genre.join(', '):movie.genre}</div></div>}
          {(movie.description||movie.overview)&&<div><div className="bk-info-lbl">Тайлбар</div><div className="bk-info-desc">{movie.description||movie.overview}</div></div>}
        </div>
      </aside>

      {/* Main */}
      <main className="bk-main">
        {/* Hero */}
        <div className="bk-hero">
          <div className="bk-hero-bg" style={{backgroundImage:`url(${heroBg})`}}/>
          <div className="bk-hero-fade"/>
          <div className="bk-hero-content">
            <div className="bk-title-row">
              <h1 className="bk-title">{movie.title}</h1>
              <div className="bk-title-right">
                {movie.duration&&<div className="bk-dur"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>{movie.duration}</div>}
                {movie.rating&&<div className="bk-badge">{movie.rating}</div>}
              </div>
            </div>
            {/* Хуваарь */}
            <div className="bk-schedule">
              <div className="bk-date-col">
                <div className="bk-sched-lbl">Хуваарьт өдрүүд</div>
                <div className="bk-days">
                  {days.map(d=>(
                    <button key={d.fullDate} className={`bk-day ${movie.selectedDate===d.fullDate?'d-sel':''}`} onClick={()=>handleDate(d.fullDate)}>
                      <span className="bk-day-s">{d.short}</span>
                      <span className="bk-day-n">{d.num}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bk-sched-div"/>
              <div className="bk-time-col">
                <div className="bk-sched-lbl">Үзвэрийн цаг</div>
                {fromSchedule ? (
                  <div className="bk-fixed"><div className="bk-fixed-chip">{movie.selectedTime}</div><span className="bk-fixed-note">Тогтоогдсон өдөр</span></div>
                ) : (
                  <div className="bk-times">
                    {availableSchedules.length===0 ? (
                      <span style={{fontSize:'.75rem',color:'var(--sub)',fontStyle:'italic'}}>Энэ өдөр хуваарь байхгүй</span>
                    ) : availableSchedules.map(sched=>{
                      const time=utcToMN(sched.showTime), past=isPast(time,movie.selectedDate), active=movie.selectedTime===time;
                      return (
                        <button key={sched._id} className={`bk-time ${active?'t-sel':''} ${past?'t-past':''}`}
                          onClick={()=>!past&&handleTime(time,sched._id)} disabled={past}>
                          <span className="bk-time-f"></span>
                          <span className="bk-time-v">{time}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Суудлын зураглал */}
        <div className="bk-map-wrap">
          <div className="bk-screen">
            <div className="bk-screen-line"/>
            <span className="bk-screen-lbl">Ү Н Д С Э Н Д Э Л Г Э Ц</span>
          </div>

          {/* Суудлын схем - зургийн дагуу */}
          <SeatMap
            seats={seats}
            onToggle={onToggle}
            onTypeChange={onTypeChange}
            takenSeats={takenSeats}
            prices={prices}
          />

          {/* Доод хэсэг: тайлбар, анхааруулга */}
          <div className="bk-bottom">
            <div className="bk-legend">
              {[
                {bg:'var(--teal)',        lbl:'Том хүн'},
                {bg:'#a78bfa',           lbl:'Хүүхэд'},
                {bg:'var(--avail)',       lbl:'Сул'},
                {bg:'var(--coral-bg)',   lbl:'Захиалгатай'},
              ].map(({bg,lbl})=>(
                <div key={lbl} className="bk-leg">
                  <div className="bk-leg-dot" style={{background:bg}}/>
                  <span className="bk-leg-lbl">{lbl}</span>
                </div>
              ))}
            </div>
            {!timeChosen&&<span style={{fontSize:'.7rem',color:'var(--coral)',fontWeight:700}}>⚠ Цаг сонгоно уу</span>}
          </div>
        </div>
      </main>

      {/* Худалдааны тэрэг */}
      <ShoppingCart
        seats={seats}
        onUpdateType={onTypeChange}
        onRemoveSeat={onRemoveSeat}
        prices={prices}
        totalPrice={totalPrice}
        onNext={onNext}
        timeChosen={timeChosen}
      />

      {/* Trailer modal */}
      {showTrailer&&<TrailerModal trailerUrl={movie.trailerUrl||movie.trailer} movieTitle={movie.title} onClose={()=>setShowTrailer(false)}/>}
    </div>
  );
}

/* ══ STEP 2 ══════════════════════════════════════════════════════════════ */
function Step2({ form, onChange, onSubmit, loading, error, onBack, movie, seats, totalPrice, prices }) {
  const adultCount = seats.filter(s=>s.type==='adult').length;
  const childCount = seats.filter(s=>s.type==='child').length;
  return (
    <div>
      <div className="bk-s2">
        {error && (
          <div className="bk-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
            {error}
          </div>
        )}
        <div className="bk-card">
          <div className="bk-card-title">Хувийн мэдээлэл</div>
          <form onSubmit={onSubmit}>
            <div className="bk-field"><label>Таны нэр</label><input name="name" required value={form.name} onChange={onChange} className="bk-inp" placeholder="Нэрээ оруулах"/></div>
            <div className="bk-g2">
              <div className="bk-field"><label>Утасны дугаар</label><input name="phone" required value={form.phone} onChange={onChange} type="tel" className="bk-inp" placeholder="9911-xxxx"/></div>
              <div className="bk-field"><label>Имэйл хаяг</label><input name="email" required value={form.email} onChange={onChange} type="email" className="bk-inp" placeholder="name@example.com"/></div>
            </div>
            <div className="bk-acts">
              <button type="button" className="bk-back" onClick={onBack}>← Буцах</button>
              <button type="submit" className="bk-pay" disabled={loading}>
                {loading ? 'Боловсруулж байна…' : (
                  <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'.5rem'}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    QPay-р төлөх · {money(totalPrice)}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bk-card">
          <div style={{fontSize:'.6rem',fontWeight:700,letterSpacing:'.15em',textTransform:'uppercase',color:'var(--sub)',marginBottom:'1rem'}}>Захиалгын тойм</div>
          {[
            ['Кино',    movie.title],
            ['Огноо',   movie.selectedDate],
            ['Цаг',     movie.selectedTime],
            ['Суудлууд',seats.map(s=>s.id).join(', ')],
            ['Том хүн', adultCount>0?`${adultCount} × ${money(prices.adult)}`:null],
            ['Хүүхэд',  childCount>0?`${childCount} × ${money(prices.child)}`:null],
          ].filter(([,v])=>v).map(([k,v])=>(<div key={k} className="bk-orow"><span>{k}</span><span>{v}</span></div>))}
          <div className="bk-ototal"><span>Нийт дүн</span><span className="bk-ototal-a">{money(totalPrice)}</span></div>
        </div>

        <div className="bk-warn">
          <div className="bk-warn-t">⚠ Анхааруулга</div>
          <ul>
            <li>Кино, огноо, цагаа сайтар шалгана уу.</li>
            <li>QPay QR-г уншуулснаар төлбөр автоматаар баталгаажна.</li>
            <li>Төлбөр төлсний дараа тасалбар буцаах боломжгүй.</li>
            <li>Цаг эхлэхээс 10 минутын өмнө ирнэ үү.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ══ STEP 3 ══════════════════════════════════════════════════════════════ */
function Step3({ navigate, orderId, movie, seats, totalPrice, cinemaName, customerEmail, customerName }) {
  const adultSeats = seats.filter(s=>s.type==='adult');
  const childSeats = seats.filter(s=>s.type==='child');
  return (
    <div style={{padding:'2rem 1rem',display:'flex',justifyContent:'center'}}>
      <TicketDesign
        orderId={orderId}
        movie={{title:movie.title,posterUrl:movie.posterUrl,rating:movie.rating}}
        date={movie.selectedDate}
        time={movie.selectedTime}
        hall={movie.hall?.hallName||movie.hall?.name||'Танхим А'}
        seats={seats.map(s=>s.id)}
        tickets={[
          ...(adultSeats.length>0?[{type:'adult',count:adultSeats.length}]:[]),
          ...(childSeats.length>0?[{type:'child',count:childSeats.length}]:[]),
        ]}
        totalPrice={totalPrice}
        cinemaName={cinemaName}
        customerEmail={customerEmail}
        customerName={customerName}
        onHome={()=>navigate('/')}
      />
    </div>
  );
}

/* ══ CONFIRM MODAL ═══════════════════════════════════════════════════════ */
function ConfirmModal({ movie, onClose, onOk }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="bk-ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="bk-modal">
        <div className="bk-modal-t">Тасалбар баталгаажуулах</div>
        <div className="bk-modal-notice"><strong>{movie.title}</strong><br/>{movie.selectedDate} · {movie.selectedTime}<br/>Төлбөр төлсний дараа тасалбар буцаах болон цаг солих боломжгүй.</div>
        <label className="bk-chk"><input type="checkbox" checked={ok} onChange={e=>setOk(e.target.checked)}/><span>Дээрх нөхцлийг уншиж ойлгосон бөгөөд зөвшөөрч байна.</span></label>
        <div className="bk-mbtns"><button className="bk-mc" onClick={onClose}>Буцах</button><button className="bk-mo" onClick={onOk} disabled={!ok}>Үргэлжлүүлэх →</button></div>
      </div>
    </div>
  );
}

/* ══ MAIN PAGE ═══════════════════════════════════════════════════════════ */
export default function BookingPage() {
  const location     = useLocation();
  const navigate     = useNavigate();
  const days         = useMemo(() => weekDays(), []);
  const fromSchedule = !!(location.state?.scheduleId || location.state?.fromSchedule);

  const [movie, setMovie] = useState({
    id:null, title:'Кино ачаалж байна…', selectedTime:'', selectedDate:days[0]?.fullDate||'',
    posterUrl:'', backdropUrl:'', trailerUrl:'', duration:'', genre:'', rating:'',
    director:'', cast:'', description:'', scheduleId:null, hall:null,
  });
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [prices,     setPrices]     = useState(PRICES.standard);
  const [step,       setStep]       = useState(1);
  const [seats,      setSeats]      = useState([]);
  const [takenSeats, setTakenSeats] = useState(new Set());
  const [form,       setForm]       = useState({ name:'', email:'', phone:'' });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [orderId,    setOrderId]    = useState(null);
  const [timeLeft,   setTLeft]      = useState(null);
  const [modal,      setModal]      = useState(false);
  const [showQPay,   setShowQPay]   = useState(false);
  const [pendingId,  setPendingId]  = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
   const today = days[0]?.fullDate || new Date().toISOString().split('T')[0];
  const raw = location.state?.movie || { /* fallback */ };
    const src = {
    ...raw,
    id: getMovieId(raw),
    scheduleId: raw.scheduleId || location.state?.scheduleId,  // ← засвар
  };
    setMovie(src);
  const mid = getMovieId(raw);
  if (mid) {
    fetchSchedulesForDate(mid, src.selectedDate).then(scheds => {
      setAvailableSchedules(scheds);
      const targetSched = src.scheduleId
        ? (scheds.find(s => String(s._id) === String(src.scheduleId)) || scheds[0])
        : scheds[0];
      if (targetSched) {
        const t = utcToMN(targetSched.showTime);
        setMovie(p => ({...p, selectedTime: t, scheduleId: targetSched._id}));
        setPrices(parseInt(t.split(':')[0], 10) >= 18 ? PRICES.prime : PRICES.standard);
        fetchTakenSeats(targetSched._id);
      }
    });
  }
}, [location]);

  const fetchTakenSeats = async (scheduleId) => {
    if (!scheduleId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/schedules/seats/${scheduleId}`, {headers:getHeaders()});
      if (!res.ok) return;
      const data = await res.json();
      setTakenSeats(new Set(data.soldSeats||data.seats||data.takenSeats||[]));
    } catch {}
  };

  const fetchSchedulesForDate = async (movieId, date) => {
    if (!movieId||!date) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/schedules?date=${date}`, {headers:getHeaders()});
      if (!res.ok) return [];
      const data = await res.json();
      const list = Array.isArray(data)?data:data.schedules||data.data||[];
      return list.filter(s=>String(s.movie?._id??s.movie??'')===String(movieId))
                 .sort((a,b)=>new Date(a.showTime)-new Date(b.showTime));
    } catch { return []; }
  };

  const doTimeout = useCallback(() => {
    clearInterval(timerRef.current); timerRef.current=null;
    setStep(1); setSeats([]); setForm({name:'',email:'',phone:''});
    setTLeft(null); setModal(false); setError(null); setShowQPay(false);
  }, []);
useEffect(() => {
  if (!movie?.scheduleId) return;

  const interval = setInterval(() => {
    fetchTakenSeats(movie.scheduleId);
  }, 10000);

  return () => clearInterval(interval);
}, [movie?.scheduleId]);
  useEffect(() => {
    if (step===2&&timeLeft===null) setTLeft(TIMEOUT_SECS);
    if (step!==2) { clearInterval(timerRef.current); timerRef.current=null; setTLeft(null); return; }
    if (step===2&&timeLeft>0&&!timerRef.current) {
      timerRef.current=setInterval(()=>setTLeft(p=>{if(!p||p<=1){doTimeout();return 0;}return p-1;}),1000);
    }
  }, [step,timeLeft]);
  useEffect(()=>()=>clearInterval(timerRef.current),[]);

  const toggleSeat     = useCallback(id => setSeats(p => p.find(s=>s.id===id) ? p.filter(s=>s.id!==id) : [...p,{id,type:'adult'}]), []);
  const changeSeatType = useCallback((id,type) => setSeats(p => p.map(s=>s.id===id?{...s,type}:s)), []);
  const removeSeat     = useCallback(id => setSeats(p => p.filter(s=>s.id!==id)), []);

  const handleDate = useCallback(async date => {
    setSeats([]); setAvailableSchedules([]); setTakenSeats(new Set());
    setMovie(p=>({...p,selectedDate:date,selectedTime:'',scheduleId:null}));
    const mid=getMovieId(movie);
    if (mid) {
      const scheds=await fetchSchedulesForDate(mid,date);
      setAvailableSchedules(scheds);
      if (scheds.length>0) {
        const first=scheds[0], t=utcToMN(first.showTime);
        setMovie(p=>({...p,selectedDate:date,selectedTime:t,scheduleId:first._id}));
        setPrices(parseInt(t.split(':')[0],10)>=18?PRICES.prime:PRICES.standard);
        fetchTakenSeats(first._id);
      }
    }
  }, [movie]);

  const handleTime = useCallback((time,scheduleId) => {
    if (isPast(time,movie.selectedDate)) return;
    setSeats([]);
    setMovie(p=>({...p,selectedTime:time,scheduleId}));
    setPrices(parseInt(time.split(':')[0],10)>=18?PRICES.prime:PRICES.standard);
    fetchTakenSeats(scheduleId);
  }, [movie.selectedDate]);

  const handleCheckout = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
   const freshRes = await fetch(`${API_BASE_URL}/schedules/seats/${movie.scheduleId}`, {
    headers: getHeaders()
  });
  const freshData = await freshRes.json();
  const freshTaken = new Set(freshData.soldSeats || []);
const conflict = seats.find(s => freshTaken.has(s.id));
  if (conflict) {
    setTakenSeats(freshTaken); // UI шинэчлэх
    setSeats(prev => prev.filter(s => !freshTaken.has(s.id))); // давхардсан суудал хасах
    setError(`"${conflict.id}" суудал саяхан өөр хүн захиалсан байна. Дахин сонгоно уу.`);
    setLoading(false);
    return;
  }
    if (!movie.scheduleId) {
      setError('Цаг сонгоогүй байна. Цагаа сонгоно уу.');
      setLoading(false); return;
    }

    try {
      const payload = {
        scheduleId: movie.scheduleId,
        movieId:    getMovieId(movie),
        movieTitle: movie.title,
        date:       movie.selectedDate,
        time:       movie.selectedTime,
        seats:      seats.map(s=>({seatId:s.id,type:s.type})),
        totalPrice,
        customer:   form,
        status:     'pending',
        ...(movie.hall?{hall:movie.hall}:{}),
      };

      let bookId;
      try {
        const res  = await fetch(`${API_BASE_URL}/bookings`, {method:'POST',headers:getHeaders(),body:JSON.stringify(payload)});
        const data = await handleResponse(res);
        bookId = data.bookingId || data.booking?._id || data._id || genOrderId();
      } catch {
        bookId = genOrderId();
      }

      setPendingId(bookId);
      setShowQPay(true);
    } catch (err) {
      setError(err.message || 'Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  const handleQPaySuccess = useCallback(async () => {
    setShowQPay(false);
    setOrderId(pendingId);
    clearInterval(timerRef.current);
    timerRef.current = null;
    setTLeft(null);
    setStep(3);
  }, [pendingId]);

  const handleQPayClose = useCallback(() => {
    setShowQPay(false);
  }, []);

  const totalPrice = useMemo(()=>seats.reduce((a,s)=>a+(s.type==='adult'?prices.adult:prices.child),0),[seats,prices]);

  return (
    <div className="bk">
      <style>{CSS}</style>
      <MyBookingHeader timeLeft={timeLeft}/>
      <div style={{paddingTop:'7rem'}}>
        {step===1 && (
          <Step1
            movie={movie}
            fromSchedule={fromSchedule}
            availableSchedules={availableSchedules}
            seats={seats}
            onToggle={toggleSeat}
            onTypeChange={changeSeatType}
            onRemoveSeat={removeSeat}
            totalPrice={totalPrice}
            onNext={()=>seats.length>0&&setModal(true)}
            days={days}
            onDate={handleDate}
            onTime={handleTime}
            takenSeats={takenSeats}
            prices={prices}
          />
        )}
        {step===2 && (
          <Step2
            form={form}
            onChange={e=>setForm(p=>({...p,[e.target.name]:e.target.value}))}
            onSubmit={handleCheckout}
            loading={loading}
            error={error}
            onBack={()=>{setStep(1);setError(null);}}
            movie={movie}
            seats={seats}
            totalPrice={totalPrice}
            prices={prices}
          />
        )}
        {step===3 && (
          <Step3
            navigate={navigate}
            orderId={orderId}
            movie={movie}
            seats={seats}
            totalPrice={totalPrice}
            cinemaName='ХОВД АЙМАГ ХӨГЖИМТ КИНО ТЕАТР'
            customerEmail={form.email}
            customerName={form.name}
          />
        )}
      </div>

      {modal && (
        <ConfirmModal
          movie={movie}
          onClose={()=>setModal(false)}
          onOk={()=>{setModal(false);setStep(2);window.scrollTo({top:0,behavior:'smooth'});}}
        />
      )}

      {showQPay && (
        <QPayModal
          bookingId={pendingId}
          amount={totalPrice}
          seats={seats.map(s=>s.id)}
          movieTitle={movie.title}
          onSuccess={handleQPaySuccess}
          onClose={handleQPayClose}
        />
      )}
    </div>
  );
}