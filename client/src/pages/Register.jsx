import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const authRegister = useAuthStore((state) => state.register);
  const authLoginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const loading = useAuthStore((state) => state.loading);
  const navigate = useNavigate();

  const password = watch('password');

  useEffect(() => {
    const initGoogle = () => {
      /* global google */
      if (typeof google === 'undefined') {
        setTimeout(initGoogle, 300); // Wait for script load
        return;
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1068832626600-k8f623ve5h1eb228v2d561miv0k7t74f.apps.googleusercontent.com';

      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              await authLoginWithGoogle(response.credential);
              toast.success('Successfully authenticated with Google!');
              navigate('/home');
            } catch (err) {
              toast.error(err.message || 'Google signup failed');
            }
          },
        });

        google.accounts.id.renderButton(
          document.getElementById('google-signup-btn'),
          { theme: 'outline', size: 'large', width: '380' }
        );
      } catch (err) {
        console.warn('Google Sign-In initialization failed:', err);
      }
    };

    initGoogle();
  }, [authLoginWithGoogle, navigate]);

  const onSubmit = async (data) => {
    try {
      await authRegister({
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
      });
      toast.success('Registration successful! Welcome to ChatFlow.');
      navigate('/home');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl bg-[#1E293B]/70 border border-white/5 backdrop-blur-xl shadow-2xl flex flex-col items-center"
      >
        {/* App Branding */}
        <div className="w-12 h-12 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
          <FiMessageSquare className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white text-center mb-1">Create an Account</h2>
        <p className="text-slate-400 text-sm text-center mb-6">Join ChatFlow and connect instantly</p>

        {/* Form Registration */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <FiUser className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="John Doe"
                className={`w-full pl-10 pr-4 py-2.5 bg-[#0F172A] text-white rounded-xl border ${errors.name ? 'border-red-500' : 'border-white/5'} focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/30 transition-all text-sm placeholder:text-slate-600`}
                {...register('name', { required: 'Name is required' })}
              />
            </div>
            {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <FiUser className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="johndoe"
                className={`w-full pl-10 pr-4 py-2.5 bg-[#0F172A] text-white rounded-xl border ${errors.username ? 'border-red-500' : 'border-white/5'} focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/30 transition-all text-sm placeholder:text-slate-600`}
                {...register('username', {
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' }
                })}
              />
            </div>
            {errors.username && <p className="text-red-400 text-xs mt-1.5">{errors.username.message}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <FiMail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="john@gmail.com"
                className={`w-full pl-10 pr-4 py-2.5 bg-[#0F172A] text-white rounded-xl border ${errors.email ? 'border-red-500' : 'border-white/5'} focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/30 transition-all text-sm placeholder:text-slate-600`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Please enter a valid email address'
                  }
                })}
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <FiLock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 bg-[#0F172A] text-white rounded-xl border ${errors.password ? 'border-red-500' : 'border-white/5'} focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/30 transition-all text-sm placeholder:text-slate-600`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
              />
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <FiLock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 bg-[#0F172A] text-white rounded-xl border ${errors.confirmPassword ? 'border-red-500' : 'border-white/5'} focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/30 transition-all text-sm placeholder:text-slate-600`}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match'
                })}
              />
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#2563EB]/50 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center w-full my-4">
          <div className="flex-1 border-t border-white/5"></div>
          <span className="px-3 text-xs text-slate-500 uppercase font-semibold">Or</span>
          <div className="flex-1 border-t border-white/5"></div>
        </div>

        {/* Google Authentication Anchor Button */}
        <div className="w-full flex justify-center">
          <div id="google-signup-btn" className="w-full max-w-xs h-[40px]"></div>
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-[#38BDF8] hover:text-blue-400 font-semibold transition-all">
            Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
