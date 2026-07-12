import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useThemeStore } from '../../store/themeStore.js';
import { FiLogOut, FiUser, FiMessageSquare, FiSun, FiMoon } from 'react-icons/fi';
import { IoSparkles } from 'react-icons/io5';
import toast from 'react-hot-toast';

const Navbar = ({ onAIToggle }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error(error.message || 'Logout failed');
    }
  };

  return (
    <nav className="glass-panel sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between border-b border-white/5">
      {/* Brand logo */}
      <Link to="/home" className="flex items-center gap-2 text-white font-bold text-xl tracking-wide group">
        <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
          <FiMessageSquare className="w-5 h-5 text-white" />
        </div>
        <span className="logo-gradient">
          ChatFlow
        </span>
      </Link>

      {/* User options */}
      <div className="flex items-center gap-4">
        {user && (
          <Link
            to="/profile"
            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl bg-[#1E293B] hover:bg-[#334155]/50 border border-white/5 transition-all duration-200"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden sm:inline text-sm font-semibold text-slate-200">{user.name}</span>
          </Link>
        )}

        {/* AI Drawer Toggle Button */}
        <button
          onClick={onAIToggle}
          className="p-3 rounded-xl bg-blue-500/10 text-[#38BDF8] hover:bg-blue-500 hover:text-white border border-blue-500/20 transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center"
          title="AI Coding Partner"
        >
          <IoSparkles className="w-4 h-4" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-3 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#334155] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 transition-all duration-300 shadow-md cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <FiSun className="w-4 h-4 text-amber-400" /> : <FiMoon className="w-4 h-4 text-indigo-500" />}
        </button>

        <button
          onClick={handleLogout}
          className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all duration-300 shadow-md shadow-red-500/5 cursor-pointer"
          title="Logout"
        >
          <FiLogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
