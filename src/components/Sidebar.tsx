'use client';

import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { 
  LayoutDashboard, 
  Receipt, 
  FolderTree, 
  BarChart3,
  Menu,
  X,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/lib/store';

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavLink = ({ href, icon, label, isActive, onClick }: NavLinkProps) => (
  <Link
    href={href}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export default function Sidebar() {
  const t = useTranslations('navigation');
  const tAuth = useTranslations('auth');
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isSidebarOpen, toggleSidebar } = useAppStore();

  const navItems = [
    { href: '/transactions', icon: <Receipt size={20} />, label: t('transactions') },
    { href: '/categories', icon: <FolderTree size={20} />, label: t('categories') },
    { href: '/budget', icon: <LayoutDashboard size={20} />, label: t('budget') },
    { href: '/annual-review', icon: <BarChart3 size={20} />, label: t('annualReview') },
  ];

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Menu button - always visible on mobile when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 lg:hidden transition-transform hover:scale-105"
        >
          <Menu size={24} className="text-gray-900 dark:text-gray-100" />
        </button>
      )}

      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black z-40 lg:hidden transition-opacity duration-300 ease-in-out ${
          isSidebarOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        style={{ willChange: 'opacity' }}
        onClick={toggleSidebar}
      />
      
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 flex flex-col ${
          isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Budget Manager</h1>
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded lg:hidden"
          >
            <X size={20} className="text-gray-900 dark:text-gray-100" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href}
              onClick={handleNavClick}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>{tAuth('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Floating Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 dark:bg-blue-700 text-white rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all hover:scale-110 active:scale-95"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
      </button>
    </>
  );
}
