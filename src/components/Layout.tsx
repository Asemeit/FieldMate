import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { OnboardingTour } from './OnboardingTour';
import { ThemeToggle } from './ThemeToggle';
import {
  Home,
  CloudSun,
  Camera,
  History,
  Settings,
  Shield,
  Wifi,
  WifiOff,
  Globe,
  LogOut,
  RefreshCw,
  ChevronLeft,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const APP_ROUTES = ['/dashboard', '/detect', '/weather', '/history', '/settings', '/admin'];
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];
const INFO_ROUTES = ['/about', '/support'];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const {
    language,
    setLanguage,
    isOnline,
    isSyncing,
    syncCount,
    user,
    isAdmin,
    logout,
    toast,
    hideToast,
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isAppRoute =
    APP_ROUTES.includes(currentPath) || currentPath.startsWith('/results/');
  const isAuthRoute = AUTH_ROUTES.includes(currentPath);
  const isInfoRoute = INFO_ROUTES.includes(currentPath);
  const isLanding = currentPath === '/';

  const renderNavItem = (
    path: string,
    labelEn: string,
    labelSw: string,
    Icon: React.ComponentType<{ size?: number; className?: string }>,
    tourId: string
  ) => {
    const isActive = currentPath === path;
    const label = language === 'sw' ? labelSw : labelEn;

    return (
      <Link
        to={path}
        data-tour={tourId}
        className={`nav-item ${isActive ? 'nav-item-active text-primary-700 dark:text-primary-300' : 'text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-300'}`}
      >
        <div className={`p-1.5 rounded-xl transition-all duration-150 ${isActive ? 'bg-primary-100/30 dark:bg-primary-800/50' : ''}`}>
          <Icon size={24} className={isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'} />
        </div>
        <span className="text-[10px] md:text-xs font-semibold leading-tight">{label}</span>
      </Link>
    );
  };

  const toastBanner = toast ? (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm px-4">
      <div
        className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-lg border ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-50'
            : toast.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-950 dark:bg-red-950 dark:border-red-800 dark:text-red-50'
            : 'bg-blue-50 border-blue-200 text-blue-950 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-50'
        }`}
      >
        <p className="text-sm font-semibold flex-1 leading-snug">{toast.message}</p>
        <button type="button" onClick={hideToast} className="text-gray-500 font-bold text-xs p-1">
          ✕
        </button>
      </div>
    </div>
  ) : null;

  const languageToggle = (
    <button
      type="button"
      onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
      className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold border ${
        isLanding
          ? 'bg-white/15 border-white/25 text-white hover:bg-white/25'
          : 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-200 border-primary-200 dark:border-primary-600'
      }`}
    >
      <Globe size={14} />
      <span>{language === 'en' ? 'EN' : 'SW'}</span>
    </button>
  );

  const publicBackTo =
    currentPath === '/support' && user
      ? '/settings'
      : isInfoRoute && user
        ? '/dashboard'
        : '/';

  const publicHeader = (
    <header
      className={`shrink-0 px-4 py-3 flex items-center justify-between border-b ${
        isLanding
          ? 'border-white/10 bg-transparent absolute top-0 left-0 right-0 z-20'
          : 'border-primary-100 dark:border-primary-700 bg-white dark:bg-primary-800'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {!isLanding && (
          <button
            type="button"
            onClick={() => navigate(publicBackTo)}
            className="p-2 -ml-2 rounded-xl text-primary-700 dark:text-primary-200 hover:bg-primary-50 dark:hover:bg-primary-700"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isLanding
                ? 'bg-primary-400 text-primary-900'
                : 'bg-gradient-to-br from-primary-500 to-primary-700 text-white'
            }`}
          >
            <Camera size={18} className="stroke-[2.5px]" />
          </div>
          <span
            className={`font-extrabold text-lg tracking-tight truncate ${
              isLanding ? 'text-white' : 'text-primary-800 dark:text-primary-50'
            }`}
          >
            FieldMate
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle compact variant={isLanding ? 'hero' : 'default'} />
        {languageToggle}
      </div>
    </header>
  );

  const phoneShell = (
    <div className="phone-shell relative flex flex-col w-full max-w-md min-h-[calc(100dvh-1rem)] sm:min-h-[calc(100dvh-2rem)] max-h-[920px] rounded-[2rem] border border-primary-200 dark:border-primary-700 shadow-2xl overflow-hidden bg-primary-50 dark:bg-primary-900">
      {isAppRoute ? (
        <>
          <header className="shrink-0 bg-white dark:bg-primary-800 border-b border-primary-100 dark:border-primary-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white">
                <Camera size={20} className="stroke-[2.5px]" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-primary-800 dark:text-primary-50 leading-none block">
                  FieldMate
                </span>
                <span className="text-[10px] text-primary-500 dark:text-primary-400 font-bold uppercase tracking-widest">
                  Advisor
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isSyncing && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-lg text-xs font-semibold">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>{syncCount}</span>
                </div>
              )}

              {languageToggle}
              <ThemeToggle compact />

              <div
                className={`flex items-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold border ${
                  isOnline
                    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950 border-red-100 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}
              >
                {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              </div>

              {user && (
                <button
                  type="button"
                  onClick={() => logout().then(() => navigate('/'))}
                  className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          </header>

          <main className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-4">{children}</main>

          <nav className="shrink-0 bg-white dark:bg-primary-800 border-t border-primary-100 dark:border-primary-700 px-2 py-2 flex items-center justify-around">
            {renderNavItem('/dashboard', 'Home', 'Nyumbani', Home, 'home')}
            {renderNavItem('/weather', 'Weather', 'Hali ya Hewa', CloudSun, 'weather')}

            <Link to="/detect" data-tour="diagnose" className="flex flex-col items-center -mt-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-white flex items-center justify-center border-4 border-white dark:border-primary-800 shadow-lg">
                <Camera size={24} />
              </div>
              <span className="text-[10px] text-primary-800 dark:text-primary-200 font-extrabold mt-1">
                {language === 'sw' ? 'Magonjwa' : 'Diagnose'}
              </span>
            </Link>

            {renderNavItem('/history', 'History', 'Kumbukumbu', History, 'history')}
            {isAdmin && renderNavItem('/admin', 'Admin', 'Msimamizi', Shield, 'admin')}
            {renderNavItem('/settings', 'Settings', 'Mipangilio', Settings, 'settings')}
          </nav>

          {user && <OnboardingTour />}
        </>
      ) : (
        <>
          {publicHeader}
          <main
            className={`flex-1 min-h-0 overflow-y-auto flex flex-col ${
              isLanding ? 'relative' : isAuthRoute ? 'px-4 py-6 justify-center' : 'px-4 py-5'
            }`}
          >
            {children}
          </main>
        </>
      )}
    </div>
  );

  return (
    <div className="app-viewport min-h-screen bg-slate-200 dark:bg-primary-900 flex justify-center items-start px-2 py-2 sm:py-4">
      {toastBanner}
      {phoneShell}
    </div>
  );
};

export default Layout;
