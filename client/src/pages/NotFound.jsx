import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md p-8 rounded-2xl bg-[#1E293B]/70 border border-white/5 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xl mb-6">
          <FiAlertTriangle className="w-8 h-8" />
        </div>

        <h1 className="text-6xl font-black text-white tracking-wider mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-200 mb-4">Page Not Found</h2>
        
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          The link you followed might be broken, or the page may have been removed. Let's get you back on track.
        </p>

        <Link
          to="/home"
          className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
