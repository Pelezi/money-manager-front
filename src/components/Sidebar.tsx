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
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavLink = ({ href, icon, label, isActive }: NavLinkProps) => (
  <Link
    href={href}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-600 font-medium'
        : 'text-gray-700 hover:bg-gray-100'
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

  if (!isSidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 lg:hidden"
      >
        <Menu size={24} />
      </button>
    );
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={toggleSidebar}
      />
      
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Budget Manager</h1>
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-gray-100 rounded lg:hidden"
          >
            <X size={20} />
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
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>{tAuth('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
