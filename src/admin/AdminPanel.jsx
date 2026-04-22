import { useState } from 'react';
import { Settings, Bell, Search } from 'lucide-react';
import Sidebar from './Sidebar';
import DashboardModule from './modules/DashboardModule';
import MovieManagementModule from './modules/MoviemanagementModule';
import NewsManagementModule from './modules/Newsmanagementmodule';
import CinemaInfoModule from './modules/CinemaInfoModule';
import ScheduleManagementModule from './modules/ScheduleManagementModule';
import TicketManagementModule from './modules/TicketManagementModule';
import CleanupNotification from './CleanupNotification';
import { ToastContainer } from './Toast';
import { ConfirmModalContainer } from './modals/ConfirmModal';
import ReportsModule from './modules/ReportsModule';
// ✅ ScheduleModal import
import ScheduleModal from './modals/ScheduleModal';

const AdminPanel = () => {
  const [activeModule, setActiveModule] = useState('dashboard');

  // ✅ ScheduleModal state — Dashboard-аас нээх боломжтой болгоно
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleModalKey,  setScheduleModalKey]  = useState(0); // re-mount for fresh state

  // Dashboard-аас "Шинэ үзвэр" / "Хуваарь нэмэх" дарахад нээнэ
  const handleOpenScheduleModal = () => {
    setScheduleModalKey(k => k + 1); // fresh mount
    setScheduleModalOpen(true);
  };

  // Schedule хуудас руу шилжинэ (sidebar-ийн "schedule" tab)
  const handleNavigateToSchedule = () => {
    setActiveModule('schedule');
  };

  // Modal хаагдсаны дараа — Dashboard refresh хийхийн тулд key ашиглана
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  const handleScheduleSaved = (msg) => {
    setScheduleModalOpen(false);
    // Dashboard-ийг дахин ачаалж шинэ хуваарийг харуулна
    setDashboardRefreshKey(k => k + 1);
    // Toast байвал дуудаж болно — ScheduleManagementModule-тай ижил pattern
    console.log('[AdminPanel] Schedule saved:', msg);
  };

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          // ✅ Prop-уудыг дамжуулна
          <DashboardModule
            key={dashboardRefreshKey}
            onOpenScheduleModal={handleOpenScheduleModal}
            onNavigateToSchedule={handleNavigateToSchedule}
          />
        );
      case 'movies':   return <MovieManagementModule />;
      case 'schedule': return <ScheduleManagementModule />;
      case 'tickets':  return <TicketManagementModule />;
      case 'news':     return <NewsManagementModule />;
      case 'cinema':   return <CinemaInfoModule />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center mx-auto mb-6">
                <Settings className="w-12 h-12 text-slate-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Хөгжүүлэлт явагдаж байна</h2>
              <p className="text-slate-400 max-w-md">
                "{activeModule}" модуль хөгжүүлэлтийн явцад байна.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <ConfirmModalContainer>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />

        <main className="ml-0 lg:ml-72 min-h-screen">
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-lg border-b border-slate-700">
            <div className="px-8 py-4 flex items-center justify-between">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Хайх (кино, хэрэглэгч, тасалбар...)"
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors relative">
                    <Bell className="w-6 h-6 text-slate-400" />
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-800"></span>
                  </button>
                </div>
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">₮ 12.5M</div>
                    <div className="text-xs text-slate-400">Энэ сар</div>
                  </div>
                  <div className="h-8 w-px bg-slate-700"></div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">+24%</div>
                    <div className="text-xs text-slate-400">Өсөлт</div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <CleanupNotification />

          {/* Page Content */}
          <div className="p-6 lg:p-8">
            {renderContent()}
          </div>

          {/* Footer */}
          <footer className="px-8 py-6 border-t border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-slate-500">
              <p>© 2026 Ховд аймгийн ХДТ Admin. Бүх эрх хуулиар хамгаалагдсан.</p>
              <div className="flex items-center gap-6 mt-2 md:mt-0">
                <span>Систем v2.4.1</span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Систем идэвхтэй
                </span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* ✅ ScheduleModal — Dashboard-аас нээгдэнэ */}
      {scheduleModalOpen && (
        <ScheduleModal
          key={scheduleModalKey}
          editing={null}
          preselectedMovieId={null}
          onClose={() => setScheduleModalOpen(false)}
          onSaved={handleScheduleSaved}
        />
      )}

      {/* Toast — хамгийн сүүлд */}
      <ToastContainer />
    </ConfirmModalContainer>
  );
};

export default AdminPanel;