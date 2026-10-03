import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import muleLogo from '@/data/ucm_mule_logo.png';
import { apiFetch, ApiError } from '@/lib/api';
import { SeoHead } from '../components/SeoHead';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const lateToken = searchParams.get('late') || '';
  const isLateRegistration = lateToken.length > 0;
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        const data = await apiFetch<{ message?: string }>('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        setSuccess(
          data.message || 'If an account exists for that email, we sent a password reset link.'
        );
      } else if (isLateRegistration) {
        await register(email, password, lateToken);
        navigate('/onboarding');
      } else {
        const { isAdmin, isScanner } = await login(email, password);
        navigate(isScanner ? '/scan' : isAdmin ? '/admin' : '/dashboard');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand flex items-center justify-center px-4 py-8">
      <SeoHead
        title={
          isForgotPassword
            ? 'Forgot password | Mule Hacks 2026'
            : isLateRegistration
              ? 'Late registration | Mule Hacks 2026'
              : 'Sign in | Mule Hacks 2026'
        }
        description={
          isLateRegistration
            ? 'Create your Mule Hacks 2026 account and finish onboarding.'
            : 'Sign in to your Mule Hacks 2026 account. Registration is closed.'
        }
        noIndex
      />
      <div className="w-full max-w-md relative">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="text-white/80 hover:text-white flex items-center gap-2 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center mx-auto shadow-[0_0_24px_rgba(0,0,0,0.8)] ring-2 ring-white/15">
                <img
                  src={muleLogo}
                  alt="MuleHacks"
                  className="w-16 h-16 object-contain"
                />
              </div>
            </motion.div>

            <h2 className="text-3xl text-white mb-2">
              {isForgotPassword
                ? 'Forgot password'
                : isLateRegistration
                  ? 'Join Mule Hacks'
                  : 'Welcome Back'}
            </h2>
            <p className="text-white/80">
              {isForgotPassword
                ? 'Enter the email you registered with and we will send a reset link'
                : isLateRegistration
                  ? 'Create your account to get started'
                  : 'Sign in to your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/90 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/30 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
                  placeholder="you@university.edu"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <label className="block text-white/90 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-black/30 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {!isForgotPassword && !isLateRegistration && (
              <div className="text-right -mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/30 border border-white/20 rounded-lg p-3 text-white text-sm"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/30 border border-white/20 rounded-lg p-3 text-white text-sm"
              >
                {success}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#6b0000] hover:bg-[#8b0000] text-white py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(107,0,0,0.5),0_0_40px_rgba(107,0,0,0.3),0_0_60px_rgba(107,0,0,0.2)] hover:shadow-[0_0_30px_rgba(139,0,0,0.6),0_0_60px_rgba(139,0,0,0.4),0_0_80px_rgba(139,0,0,0.3)]"
            >
              {loading
                ? 'Please wait...'
                : isForgotPassword
                  ? 'Send reset link'
                  : isLateRegistration
                    ? 'Create Account'
                    : 'Sign In'}
            </motion.button>
          </form>

          <div className="mt-6 text-center space-y-3">
            {isLateRegistration ? (
              <Link to="/auth" className="text-white/80 hover:text-white transition-colors">
                Already have an account? Sign in
              </Link>
            ) : (
              <p className="text-white/70 text-sm">Registration is closed.</p>
            )}
            {isForgotPassword && (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccess('');
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                Back to sign in
              </button>
            )}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-white/70 text-sm mt-6"
        >
          By continuing, you agree to Mule Hacks' Terms of Service and Privacy Policy
        </motion.p>
      </div>
    </div>
  );
}
