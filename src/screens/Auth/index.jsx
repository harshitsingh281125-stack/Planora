import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plane, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setMessage('Check your email for the confirmation link!');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email');
      setLoading(false);
      return;
    }

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the password reset link!');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setMessage('');
    setShowForgotPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl"></div>
        
        {/* Floating plane decorations */}
        <div className="absolute top-20 left-20 opacity-10">
          <Plane className="w-16 h-16 text-white rotate-45" />
        </div>
        <div className="absolute bottom-32 right-24 opacity-10">
          <Plane className="w-12 h-12 text-white -rotate-12" />
        </div>
        <div className="absolute top-1/3 right-1/4 opacity-5">
          <Plane className="w-24 h-24 text-white rotate-[30deg]" />
        </div>
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl mb-4 shadow-lg shadow-cyan-500/30">
              <Plane className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Planora</h1>
            <p className="text-gray-500 mt-2 text-sm">
              {showForgotPassword 
                ? 'Reset your password' 
                : isLogin 
                  ? 'Welcome back! Plan your next adventure.' 
                  : 'Create an account to start planning.'}
            </p>
          </div>

          {/* Error & Message display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-700 text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit}>
            {/* Email field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all outline-none text-gray-800"
                />
              </div>
            </div>

            {/* Password field */}
            {!showForgotPassword && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all outline-none text-gray-800"
                  />
                </div>
              </div>
            )}

            {/* Confirm Password field (Sign up only) */}
            {!isLogin && !showForgotPassword && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all outline-none text-gray-800"
                  />
                </div>
              </div>
            )}

            {/* Forgot Password link */}
            {isLogin && !showForgotPassword && (
              <div className="text-right mb-6">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-cyan-600 hover:text-cyan-500 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {showForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle mode / Back button */}
          <div className="mt-6 text-center">
            {showForgotPassword ? (
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to sign in
              </button>
            ) : (
              <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  onClick={toggleMode}
                  className="text-cyan-600 hover:text-cyan-500 font-semibold transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-white/50 text-xs mt-6">
          Plan your perfect trip with Planora
        </p>
      </div>
    </div>
  );
};

export default Auth;
