import { useAuthStore } from '../store/authStore.js';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiCalendar, FiClock } from 'react-icons/fi';

const Profile = () => {
  const { user } = useAuthStore();

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 bg-[#090D1A] flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl p-8 rounded-2xl bg-[#1E293B]/70 border border-white/5 backdrop-blur-xl shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/5 pb-4">User Profile</h2>

        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
          {/* Avatar frame */}
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-[#2563EB]/40 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center font-bold text-4xl border-2 border-white/5 shadow-xl">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#1E293B]" title="Online"></div>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-white">{user?.name}</h3>
            <p className="text-sm text-slate-400">@{user?.username}</p>
            <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/35">
              Active Session
            </span>
          </div>
        </div>

        {/* Profile details */}
        <div className="space-y-4">
          
          <div className="p-4 rounded-xl bg-[#0F172A]/50 border border-white/5 flex items-center gap-4">
            <FiMail className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Email Address</p>
              <p className="text-sm text-slate-200">{user?.email}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0F172A]/50 border border-white/5 flex items-center gap-4">
            <FiUser className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">User Bio</p>
              <p className="text-sm text-slate-200 italic">{user?.bio || 'No bio written yet.'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0F172A]/50 border border-white/5 flex items-center gap-4">
            <FiCalendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Account Created</p>
              <p className="text-sm text-slate-200">{formattedDate}</p>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
