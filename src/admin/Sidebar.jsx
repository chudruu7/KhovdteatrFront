import { useState } from "react";
import { ADMIN_DEFAULT_AVATAR } from '../data/avatars';
import {
  LayoutDashboard, Film, Calendar, MapPin,
  Users, Ticket, Percent, BarChart3,
  Settings, Info, Newspaper, ChevronLeft, ChevronRight,
  LogOut, UserCircle
} from 'lucide-react';

const Sidebar = ({ activeModule: externalActive, setActiveModule: externalSet }) => {
  const [activeModule, setActiveModule] = useState(externalActive || 'dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSet = (id) => {
    setActiveModule(id);
    externalSet && externalSet(id);
  };

  const mainItems = [
    { id: 'dashboard', label: 'Хянах самбар', icon: LayoutDashboard, badge: null },
    { id: 'movies', label: 'Кино удирдлага', icon: Film, badge: '12' },
    { id: 'schedule', label: 'Үзвэрийн хуваарь', icon: Calendar, badge: null },
    { id: 'halls', label: 'Танхимууд', icon: MapPin, badge: null },
    { id: 'users', label: 'Хэрэглэгчид', icon: Users, badge: '3' },
    { id: 'tickets', label: 'Тасалбарууд', icon: Ticket, badge: null },
  ];

  const secondaryItems = [
    { id: 'promotions', label: 'Урамшуулал', icon: Percent, badge: 'New' },
    { id: 'news', label: 'Мэдээ, мэдээлэл', icon: Newspaper, badge: null },
    { id: 'cinema', label: 'Байгууллагын мэдээлэл', icon: Info, badge: null },
    { id: 'reports', label: 'Тайлангууд', icon: BarChart3, badge: null },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');

        :root {
          --bg: #0d0d12;
          --surface: #16161e;
          --border: #23232f;
          --gold: #e8b84b;
          --gold-hover: #f5c96b;
          --red: #ff4d4d;
          --text-main: #ffffff;
          --text-muted: #8e8e9e;
          --sidebar-w: ${isCollapsed ? '80px' : '280px'};
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sb-container {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          width: var(--sidebar-w);
          height: 100vh;
          position: fixed;
          left: 0; top: 0;
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--border);
          color: var(--text-main);
          transition: var(--transition);
          z-index: 1000;
        }

        /* Toggle Button */
        .sb-toggle {
          position: absolute;
          right: -12px;
          top: 32px;
          width: 24px;
          height: 24px;
          background: var(--gold);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #000;
          border: none;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          transition: var(--transition);
          z-index: 10;
        }

        .sb-toggle:hover {
          transform: scale(1.1);
          background: var(--gold-hover);
        }

        /* Header */
        .sb-header {
          padding: 20px 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          height: 90px;
          overflow: hidden;
          border-bottom: 1px solid var(--border);
        }

        .sb-logo-img {
          min-width: 55px;
          height: 55px;
          object-fit: contain;
          transition: var(--transition);
        }

        .sb-logo-text {
          display: flex;
          flex-direction: column;
          transition: opacity 0.2s ease;
          opacity: ${isCollapsed ? 0 : 1};
          white-space: nowrap;
          pointer-events: ${isCollapsed ? 'none' : 'auto'};
        }

        .sb-logo-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 16px;
          color: var(--gold);
          text-transform: uppercase;
        }

        .sb-logo-sub {
          font-size: 13px;
          color: var(--text-muted);
          font-family: 'Montserrat', sans-serif;
        }

        /* Navigation */
        .sb-nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 20px 12px;
        }

        .sb-nav::-webkit-scrollbar { width: 4px; }
        .sb-nav::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

        .sb-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #4a4a5e;
          margin: 20px 12px 8px;
          letter-spacing: 1px;
          opacity: ${isCollapsed ? 0 : 1};
          transition: var(--transition);
          white-space: nowrap;
        }

        .sb-divider {
          height: 1px;
          background: var(--border);
          margin: 16px 12px;
          transition: var(--transition);
        }

        .sb-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition);
          margin-bottom: 4px;
          position: relative;
        }

        .sb-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-main);
        }

        .sb-btn.active {
          background: rgba(232, 184, 75, 0.12);
          color: var(--gold);
        }

        .sb-btn-icon { min-width: 22px; height: 22px; }

        .sb-btn-text { 
          font-size: 14px; 
          font-weight: 500; 
          white-space: nowrap;
          opacity: ${isCollapsed ? 0 : 1};
          transition: opacity 0.2s ease;
        }

        .sb-badge {
          position: ${isCollapsed ? 'absolute' : 'static'};
          top: 6px; right: 6px;
          background: var(--gold);
          color: #000;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 6px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        /* Profile Footer */
        .sb-footer {
          padding: 16px;
          background: var(--surface);
          border-top: 1px solid var(--border);
        }

        .sb-profile-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: rgba(0,0,0,0.2);
          border-radius: 14px;
          transition: var(--transition);
          overflow: hidden;
        }

        .sb-admin-avatar {
          min-width: 40px;
          height: 40px;
          border-radius: 10px;
          object-fit: cover;
          border: 2px solid var(--border);
        }

        .sb-admin-info {
          transition: opacity 0.2s ease;
          opacity: ${isCollapsed ? 0 : 1};
          white-space: nowrap;
        }

        .sb-admin-name { font-size: 13px; font-weight: 600; color: #fff; }
        .sb-admin-role { font-size: 10px; color: var(--text-muted); }
      `}</style>

      <div className="sb-container">
        {/* Collapse Button */}
        <button className="sb-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo Section */}
        <div className="sb-header">
          <img src="/kdt.png" alt="KDT Logo" className="sb-logo-img" />
          <div className="sb-logo-text">
            <span className="sb-logo-title">ХОВД АЙМГИЙН</span>
            <span className="sb-logo-sub">Хөгжимт драмын театр</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sb-nav">
          <div className="sb-label">Үндсэн удирдлага</div>
          {mainItems.map((item) => (
            <button
              key={item.id}
              title={isCollapsed ? item.label : ''}
              className={`sb-btn ${activeModule === item.id ? 'active' : ''}`}
              onClick={() => handleSet(item.id)}
            >
              <item.icon className="sb-btn-icon" />
              <span className="sb-btn-text">{item.label}</span>
              {item.badge && <span className="sb-badge">{item.badge}</span>}
            </button>
          ))}

          {/* Divider Line */}
          <div className="sb-divider" />

          <div className="sb-label">Бусад</div>
          {secondaryItems.map((item) => (
            <button
              key={item.id}
              title={isCollapsed ? item.label : ''}
              className={`sb-btn ${activeModule === item.id ? 'active' : ''}`}
              onClick={() => handleSet(item.id)}
            >
              <item.icon className="sb-btn-icon" />
              <span className="sb-btn-text">{item.label}</span>
              {item.badge && (
                <span className="sb-badge" style={{background: 'var(--red)', color: '#fff'}}>
                  {isCollapsed ? '' : item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Profile/Admin Section */}
        <div className="sb-footer">
          <div className="sb-profile-card">
            <img src={ADMIN_DEFAULT_AVATAR} alt="Admin Avatar" className="sb-admin-avatar" />
            <div className="sb-admin-info">
              <div className="sb-admin-name">Админ</div>
              <div className="sb-admin-role">Систем Администратор</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;