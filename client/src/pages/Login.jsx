import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const authLogin = useAuthStore((state) => state.login);
  const authLoginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const loading = useAuthStore((state) => state.loading);
  const navigate = useNavigate();

  useEffect(() => {
    const initGoogle = () => {
      /* global google */
      if (typeof google === 'undefined') {
        setTimeout(initGoogle, 300); // Wait for external identity script load
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
              toast.error(err.message || 'Google Auth verification failed');
            }
          },
        });

        google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'outline', size: 'large', width: 384, alignment: 'center' }
        );
      } catch (err) {
        console.warn('Google Sign-In initialization failed:', err);
      }
    };

    initGoogle();
  }, [authLoginWithGoogle, navigate]);

  const onSubmit = async (data) => {
    try {
      await authLogin({
        email: data.email,
        password: data.password,
      });

      // Save local preferences if Remember Me is ticked
      if (data.rememberMe) {
        localStorage.setItem('remembered_email', data.email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      toast.success('Login successful! Welcome back.');
      navigate('/home');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    }
  };
  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast.error('Password reset is not implemented in this version.');
  };

  const handleDemoLogin = async () => {
    const demoEmail = 'demo@chatflow.com';
    const demoPassword = 'DemoPassword123';
    const authRegister = useAuthStore.getState().register;

    const toastId = toast.loading('Initializing demo session...');
    try {
      // 1. Try to login directly
      await authLogin({ email: demoEmail, password: demoPassword });
      toast.success('Successfully logged in as Demo User!', { id: toastId });
      navigate('/home');
    } catch (err) {
      // 2. If login fails, try to register the demo account automatically
      try {
        await authRegister({
          name: 'Demo User',
          username: 'demouser',
          email: demoEmail,
          password: demoPassword,
        });

        // 3. Log in after registration
        await authLogin({ email: demoEmail, password: demoPassword });
        toast.success('Demo account created and logged in!', { id: toastId });
        navigate('/home');
      } catch (regErr) {
        toast.error(regErr.message || 'Failed to initialize demo session', { id: toastId });
      }
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
        <h2 className="text-2xl font-bold text-white text-center mb-1">Welcome Back</h2>
        <p className="text-slate-400 text-sm text-center mb-6">Log in to continue chatting</p>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <FiMail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="john@gmail.com"
                defaultValue={localStorage.getItem('remembered_email') || ''}
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <button
                onClick={handleForgotPassword}
                className="text-xs text-[#38BDF8] hover:text-blue-400 transition-all font-semibold cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <FiLock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 bg-[#0F172A] text-white rounded-xl border ${errors.password ? 'border-red-500' : 'border-white/5'} focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/30 transition-all text-sm placeholder:text-slate-600`}
                {...register('password', { required: 'Password is required' })}
              />
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              className="w-4 h-4 rounded border-white/5 bg-[#0F172A] text-[#2563EB] focus:ring-[#2563EB]/30 focus:ring-offset-[#1E293B]"
              {...register('rememberMe')}
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-400 hover:text-slate-300 transition-all cursor-pointer">
              Remember Me
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#2563EB]/50 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
          >
            {loading ? 'Logging In...' : 'Log In'}
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
          <div id="google-signin-btn" className="w-full h-[40px]"></div>
        </div>

        {/* Demo Login Button */}
        <button
          onClick={handleDemoLogin}
          type="button"
          className="w-full mt-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl border border-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center text-sm shadow-md"
        >
          Login as Guest / Demo User
        </button>

        {/* Footer Link */}
        <p className="mt-6 text-sm text-slate-400">
          New to ChatFlow?{' '}
          <Link to="/register" className="text-[#38BDF8] hover:text-blue-400 font-semibold transition-all">
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
