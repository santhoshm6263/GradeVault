import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { ThemeToggle } from './ThemeToggle';
import { GlobalSearch } from './GlobalSearch';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, logout } = useAcademic();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Semesters', path: '/semesters', icon: GraduationCap },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentNavName = navItems.find(item => item.path === location.pathname)?.name || 'GradeVault';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-slate-200/50 dark:border-darkBorder/50 fixed h-full z-30 no-print">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-200/40 dark:border-darkBorder/30 gap-2.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 text-white shadow-md shadow-emerald-500/10">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              GradeVault
            </h1>
            <span className="text-[10px] font-semibold text-primary dark:text-primary-400 tracking-wider uppercase">
              JNTUA R23 CSE
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User profile section at bottom */}
        {profile && (
          <div className="p-4 border-t border-slate-200/40 dark:border-darkBorder/30 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="w-10 h-10 rounded-full border border-slate-200 dark:border-darkBorder bg-slate-100 dark:bg-slate-800"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                  {profile.name}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {profile.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-rose-200/50 dark:border-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold tracking-wide transition-colors duration-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Slide-out Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex no-print">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative flex flex-col w-72 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-darkBorder h-full p-6 shadow-2xl"
            >
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-8">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 text-white shadow-md">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-slate-900 dark:text-white leading-none mb-1">
                    GradeVault
                  </h1>
                  <span className="text-[9px] font-semibold text-primary tracking-wider uppercase">
                    JNTUA R23 CSE
                  </span>
                </div>
              </div>

              <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>

              {profile && (
                <div className="mt-auto border-t border-slate-100 dark:border-darkBorder pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={profile.photoURL}
                      alt={profile.name}
                      className="w-10 h-10 rounded-full border border-slate-200 dark:border-darkBorder bg-slate-100 dark:bg-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                        {profile.name}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-rose-200 dark:border-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content shell */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 border-b border-slate-200/50 dark:border-darkBorder/40 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 gap-4 no-print">
          {/* Left: Mobile hamburger trigger & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 hidden sm:block">
              {currentNavName}
            </h2>
          </div>

          {/* Center: Search Box */}
          <GlobalSearch />

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {profile && (
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="w-9 h-9 rounded-full border border-slate-200 dark:border-darkBorder shadow-sm hidden md:block"
              />
            )}
          </div>
        </header>

        {/* Content View with Page Animations */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
