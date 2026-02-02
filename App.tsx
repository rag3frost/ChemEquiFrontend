
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileText, 
  ChevronRight, 
  Clock, 
  BarChart3, 
  Zap, 
  Droplet, 
  Thermometer, 
  ArrowRight,
  Upload,
  X,
  FileSpreadsheet,
  Download,
  MoreVertical,
  Activity,
  History,
  LayoutDashboard,
  ArrowUpRight,
  User,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  Settings,
  Plus,
  FileDown,
  Sun,
  Moon,
  UserPlus,
  LogIn,
  AlertCircle,
  Layers,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
  TrendingUp,
  PieChart,
  BarChart2
} from 'lucide-react';
import { AnalyticsData, DatasetHistoryItem, AuthState } from './types';
import { apiService } from './services/api';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { StatsCard } from './components/StatsCard';
import { Chart, MultiLineChart, DonutChart, HistogramChart, GroupedBarChart } from './components/Charts';
import { DashboardHeader } from './components/DashboardHeader';
import { Progress } from './components/Progress';
import { COLORS } from './constants';

const AnimatedNumber: React.FC<{ value: number; duration?: number; decimals?: number }> = ({ value, duration = 1500, decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const valueRef = useRef(0);

  useEffect(() => {
    let animationFrame: number;
    let startTimestamp: number | null = null;
    const startValue = valueRef.current;
    const endValue = value;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      
      // Super smooth easeOutExpo easing
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue + (endValue - startValue) * easing;
      
      setDisplayValue(current);
      valueRef.current = current;

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };
    
    animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  const formattedValue = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return <span className="tabular-nums font-black tabular-nums">{formattedValue}</span>;
};

// Page types for login flow
type AuthPage = 'login' | 'signup' | 'forgot-password' | 'reset-password';

// Check if URL has reset password token
const getResetTokenFromURL = (): { uidb64: string; token: string } | null => {
  const path = window.location.pathname;
  const match = path.match(/\/reset-password\/([^/]+)\/([^/]+)/);
  if (match) {
    return { uidb64: match[1], token: match[2] };
  }
  return null;
};

const LoginPage: React.FC<{ onLoginSuccess: (user: string) => void }> = ({ onLoginSuccess }) => {
  const resetToken = getResetTokenFromURL();
  const [currentPage, setCurrentPage] = useState<AuthPage>(resetToken ? 'reset-password' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const success = await apiService.login(email, password);
      if (success) {
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }
        onLoginSuccess(email);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('A network error occurred. Please verify the backend API is reachable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const result = await apiService.signup(email, password);
      if (result.success) {
        setSuccessMsg(result.message);
        setCurrentPage('login');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const result = await apiService.forgotPassword(email);
      if (result.success) {
        setSuccessMsg(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }
    
    try {
      if (!resetToken) {
        setError('Invalid reset link');
        setIsLoading(false);
        return;
      }

      const result = await apiService.resetPassword(resetToken.uidb64, resetToken.token, password);
      if (result.success) {
        setSuccessMsg(result.message);
        // Clear the URL and redirect to login after a delay
        setTimeout(() => {
          window.history.replaceState({}, '', '/');
          setCurrentPage('login');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchPage = (page: AuthPage) => {
    setCurrentPage(page);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
    // Clear URL if going back from reset password
    if (page === 'login') {
      window.history.replaceState({}, '', '/');
    }
  };

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#0a0a0a]">
      {/* Main Container with border */}
      <div className="w-full max-w-[1050px] bg-[#0f0f10] border border-[#1f1f23] rounded-[20px] p-3 sm:p-4">
        <div className="grid lg:grid-cols-[1fr,1.1fr] gap-0">
          
          {/* Left Side - Image Card */}
          <div className="hidden lg:block">
            <div className="relative h-full min-h-[560px] rounded-[16px] overflow-hidden border border-[#1a1a1e]">
              {/* Animated background image */}
              <img 
                src="/login-bg.png" 
                alt="Industrial Analytics Background" 
                className="absolute inset-0 w-[120%] h-[120%] object-cover"
                style={{
                  animation: 'slowDrift 20s ease-in-out infinite alternate'
                }}
              />
              
              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col p-7 z-10">
                {/* Top - Precision Analysis with line */}
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-semibold tracking-[0.2em] text-[#d4e04b] uppercase">
                    Precision Analysis
                  </span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-[#d4e04b]/40 to-transparent"></div>
                </div>
                
                {/* Bottom - Text content */}
                <div className="mt-auto">
                  <h1 className="text-[40px] font-bold text-white leading-[1.05] mb-4 italic" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    Master Your<br />Industrial<br />Analytics
                  </h1>
                  <p className="text-[#9a9a9e] text-[14px] leading-[1.6] max-w-[320px]">
                    Leverage advanced data visualization and real-time monitoring to optimize your chemical plant performance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex items-center justify-center px-4 sm:px-8 lg:px-12 py-8 lg:py-0">
            <div className="w-full max-w-[380px]">
              {/* Logo */}
              <div className="flex items-center gap-2.5 mb-10">
                <div className="w-9 h-9 bg-[#d4e04b] rounded-lg flex items-center justify-center text-black font-bold text-base">
                  C
                </div>
                <span className="text-lg font-semibold text-white tracking-tight">ChemEquip</span>
              </div>

              {/* Login Form */}
              {currentPage === 'login' && (
                <>
                  <div className="mb-7">
                    <h2 className="text-[34px] font-bold text-white italic mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Welcome Back</h2>
                    <p className="text-[#6b6b70] text-[14px]">Enter your email and password to access your account</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-medium text-[#e0e0e2] mb-2">Email</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent border border-[#2a2a2e] rounded-lg px-4 py-3 text-white placeholder:text-[#4a4a4e] focus:outline-none focus:border-[#3a3a3e] transition-all text-[14px]"
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-[#e0e0e2] mb-2">Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-transparent border border-[#2a2a2e] rounded-lg px-4 py-3 pr-11 text-white placeholder:text-[#4a4a4e] focus:outline-none focus:border-[#3a3a3e] transition-all text-[14px]"
                          placeholder="Enter your password"
                          required
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a5a5e] hover:text-[#8a8a8e] transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-4 h-4 rounded border ${rememberMe ? 'bg-[#d4e04b] border-[#d4e04b]' : 'border-[#3a3a3e] bg-transparent'} flex items-center justify-center transition-all`}>
                          {rememberMe && <span className="text-black text-[10px]">✓</span>}
                        </div>
                        <input 
                          type="checkbox" 
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="sr-only"
                        />
                        <span className="text-[13px] text-[#6b6b70]">Remember me</span>
                      </label>
                      <button 
                        type="button"
                        onClick={() => switchPage('forgot-password')}
                        className="text-[13px] text-[#6b6b70] hover:text-white transition-colors"
                      >
                        Forgot Password
                      </button>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] p-3.5 rounded-lg flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {successMsg && (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-[13px] p-3.5 rounded-lg flex items-start gap-2.5">
                        <div className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0 text-[9px]">✓</div>
                        <span>{successMsg}</span>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-[#d4e04b] hover:bg-[#c9d545] text-black font-semibold py-3.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px] mt-1"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </form>

                  <p className="text-center text-[#6b6b70] text-[14px] mt-7">
                    Don't have an account?{' '}
                    <button 
                      onClick={() => switchPage('signup')}
                      className="text-white font-semibold hover:underline"
                    >
                      Sign Up
                    </button>
                  </p>
                </>
              )}

              {/* Signup Form */}
              {currentPage === 'signup' && (
                <>
                  <div className="mb-7">
                    <h2 className="text-[34px] font-bold text-white italic mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Get Started</h2>
                    <p className="text-[#6b6b70] text-[14px]">Create your industrial analytics account</p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-medium text-[#e0e0e2] mb-2">Email</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent border border-[#2a2a2e] rounded-lg px-4 py-3 text-white placeholder:text-[#4a4a4e] focus:outline-none focus:border-[#3a3a3e] transition-all text-[14px]"
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-[#e0e0e2] mb-2">Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-transparent border border-[#2a2a2e] rounded-lg px-4 py-3 pr-11 text-white placeholder:text-[#4a4a4e] focus:outline-none focus:border-[#3a3a3e] transition-all text-[14px]"
                          placeholder="Create a password"
                          required
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a5a5e] hover:text-[#8a8a8e] transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] p-3.5 rounded-lg flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {successMsg && (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-[13px] p-3.5 rounded-lg flex items-start gap-2.5">
                        <div className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0 text-[9px]">✓</div>
                        <span>{successMsg}</span>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-[#d4e04b] hover:bg-[#c9d545] text-black font-semibold py-3.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px]"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </form>

                  <p className="text-center text-[#6b6b70] text-[14px] mt-7">
                    Already have an account?{' '}
                    <button 
                      onClick={() => switchPage('login')}
                      className="text-white font-semibold hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                </>
              )}

              {/* Forgot Password Form */}
              {currentPage === 'forgot-password' && (
                <>
                  <button 
                    onClick={() => switchPage('login')}
                    className="flex items-center gap-2 text-[#6b6b70] hover:text-white mb-7 transition-colors text-[13px]"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to login</span>
                  </button>

                  <div className="mb-7">
                    <h2 className="text-[34px] font-bold text-white italic mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Reset Password</h2>
                    <p className="text-[#6b6b70] text-[14px]">Enter your email and we'll send you a reset link</p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-medium text-[#e0e0e2] mb-2">Email</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent border border-[#2a2a2e] rounded-lg px-4 py-3 text-white placeholder:text-[#4a4a4e] focus:outline-none focus:border-[#3a3a3e] transition-all text-[14px]"
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] p-3.5 rounded-lg flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {successMsg && (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-[13px] p-3.5 rounded-lg flex items-start gap-2.5">
                        <div className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0 text-[9px]">✓</div>
                        <span>{successMsg}</span>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-[#d4e04b] hover:bg-[#c9d545] text-black font-semibold py-3.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px]"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* Reset Password Form */}
              {currentPage === 'reset-password' && (
                <>
                  <button 
                    onClick={() => switchPage('login')}
                    className="flex items-center gap-2 text-[#8a8a8e] hover:text-white transition-colors text-[14px] mb-6"
                  >
                    <ArrowLeft size={18} />
                    <span>Back to Login</span>
                  </button>

                  <h2 style={{ fontFamily: 'Georgia, serif' }} className="text-[28px] text-white font-normal mb-3 leading-tight">
                    Create New Password
                  </h2>
                  <p className="text-[#8a8a8e] text-[14px] mb-8">
                    Enter your new password below
                  </p>

                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-medium text-[#e0e0e2] mb-2">New Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-transparent border border-[#2a2a2e] rounded-lg px-4 py-3 text-white placeholder:text-[#4a4a4e] focus:outline-none focus:border-[#3a3a3e] transition-all pr-12 text-[14px]"
                          placeholder="Enter new password"
                          required
                          minLength={8}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a4a4e] hover:text-[#8a8a8e] transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-[#e0e0e2] mb-2">Confirm Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-transparent border border-[#2a2a2e] rounded-lg px-4 py-3 text-white placeholder:text-[#4a4a4e] focus:outline-none focus:border-[#3a3a3e] transition-all pr-12 text-[14px]"
                          placeholder="Confirm new password"
                          required
                          minLength={8}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a4a4e] hover:text-[#8a8a8e] transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] p-3.5 rounded-lg flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {successMsg && (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-[13px] p-3.5 rounded-lg flex items-start gap-2.5">
                        <div className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0 text-[9px]">✓</div>
                        <span>{successMsg}</span>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-[#d4e04b] hover:bg-[#c9d545] text-black font-semibold py-3.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px]"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animation for image drift */}
      <style>{`
        @keyframes slowDrift {
          0% {
            transform: translate(0%, 0%) scale(1.1);
          }
          100% {
            transform: translate(-10%, -10%) scale(1.15);
          }
        }
      `}</style>
    </div>
  );
};

const UploadModal: React.FC<{ isOpen: boolean; onClose: () => void; onUploadComplete: (data: AnalyticsData) => void }> = ({ isOpen, onClose, onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 5;
      });
    }, 100);

    try {
      const data = await apiService.uploadCSV(file);
      setProgress(100);
      setTimeout(() => {
        onUploadComplete(data);
        onClose();
        setIsUploading(false);
        setFile(null);
        setProgress(0);
      }, 500);
    } catch (error) {
      alert('Upload failed. Please ensure the CSV file is valid and the server is connected.');
      setIsUploading(false);
    } finally {
      clearInterval(interval);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md cursor-pointer" onClick={onClose} />
      <div className="relative bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl sm:rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 sm:p-10">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight">Upload Dataset</h2>
            <button onClick={onClose} className="p-2 sm:p-3 text-textMuted-light dark:text-textMuted-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark transition-all rounded-2xl hover:bg-muted-light dark:hover:bg-muted-dark">
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>

          {!isUploading ? (
            <div className="space-y-4 sm:space-y-6">
              <div className={`border-2 border-dashed border-border-light dark:border-border-dark rounded-2xl sm:rounded-[32px] p-6 sm:p-12 flex flex-col items-center justify-center gap-3 sm:gap-4 transition-all hover:border-primary/50 group bg-muted-light dark:bg-muted-dark relative`}>
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-primary rounded-xl sm:rounded-[24px] flex items-center justify-center text-black group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                  <Upload size={24} className="sm:w-8 sm:h-8" />
                </div>
                <div className="text-center">
                  <p className="text-base sm:text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark">Drag & Drop CSV or <span className="text-primary-dark underline cursor-pointer">Browse</span></p>
                  <p className="text-xs sm:text-sm text-textMuted-light dark:text-textMuted-dark mt-1">Industrial data logs (.csv)</p>
                </div>
                <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
              </div>

              {file && (
                <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-muted-light dark:bg-muted-dark rounded-xl sm:rounded-[24px] border border-border-light dark:border-border-dark">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-light dark:bg-surface-dark text-textPrimary-light dark:text-textPrimary-dark rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                    <FileSpreadsheet size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark truncate">{file.name}</p>
                    <p className="text-[10px] sm:text-xs text-textMuted-light dark:text-textMuted-dark">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="text-textMuted-light dark:text-textMuted-dark hover:text-danger p-2 shrink-0">
                    <X size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}

              <Button variant="primary" className="w-full py-4 sm:py-5 text-base sm:text-xl font-bold shadow-xl shadow-primary/20" disabled={!file} onClick={handleUpload}>
                Start Analysis
              </Button>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center text-center space-y-8">
              <div className="w-24 h-24 bg-primary/20 rounded-[32px] flex items-center justify-center relative">
                <BarChart3 className="text-textPrimary-light dark:text-textPrimary-dark animate-bounce" size={40} />
                <div className="absolute -inset-2 border-4 border-primary/30 rounded-[40px] animate-[spin_3s_linear_infinite]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-textPrimary-light dark:text-textPrimary-dark">Parsing CSV</h3>
                <p className="text-sm text-textMuted-light dark:text-textMuted-dark">Analyzing column patterns for {file?.name}...</p>
              </div>
              <div className="w-full max-w-sm">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest">Efficiency</span>
                  <span className="text-xs font-black text-primary">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type DashboardTab = 'analytics' | 'visualizations' | 'trends';

const TabButton: React.FC<{
  tab: DashboardTab;
  activeTab: DashboardTab;
  onClick: (tab: DashboardTab) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ tab, activeTab, onClick, icon, label }) => {
  const isActive = activeTab === tab;
  return (
    <button
      onClick={() => onClick(tab)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
        isActive
          ? 'bg-primary/90 backdrop-blur-md text-black shadow-lg shadow-primary/20 border border-white/20'
          : 'bg-white/5 backdrop-blur-md border border-border-light dark:border-border-dark text-textPrimary-light dark:text-textPrimary-dark hover:bg-muted-light dark:hover:bg-muted-dark'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

const Dashboard: React.FC<{ onLogout: () => void; isDarkMode: boolean; toggleTheme: () => void; username: string }> = ({ onLogout, isDarkMode, toggleTheme, username }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [history, setHistory] = useState<DatasetHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>('analytics');

  const loadData = useCallback(async (id?: string) => {
    setIsLoading(true);
    try {
      const analyticsResult = await apiService.getAnalytics(id);
      setData(analyticsResult);
    } catch (err) {
      console.error('Analytics Loading Error:', err);
      // Set data to null if no analytics available (new user)
      setData(null);
    }
    
    try {
      const historyResult = await apiService.getHistory();
      setHistory(historyResult);
    } catch (err) {
      console.error('History Loading Error:', err);
      setHistory([]);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 text-center space-y-4 theme-transition">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-textMuted-light dark:text-textMuted-dark animate-pulse font-bold tracking-tight">Syncing with Industrial Control Systems...</p>
      </div>
    );
  }

  // Empty state - no data uploaded yet
  if (!data) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark theme-transition">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 overflow-x-hidden">
          <DashboardHeader 
            onUploadClick={() => setIsUploadModalOpen(true)} 
            onLogout={onLogout} 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            analyticsData={null}
          />
          
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center">
              <Upload size={40} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight mb-2">No Data Yet</h2>
              <p className="text-textMuted-light dark:text-textMuted-dark max-w-md">Upload a CSV file to start analyzing your industrial equipment data</p>
            </div>
            <Button 
              onClick={() => setIsUploadModalOpen(true)}
              icon={<Upload size={18} />}
              className="px-8 py-4"
            >
              Upload Dataset
            </Button>
          </div>
        </main>
        
        <UploadModal 
          isOpen={isUploadModalOpen} 
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={(newData) => {
            setData(newData);
            loadData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark theme-transition">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 overflow-x-hidden">
        <DashboardHeader 
          onUploadClick={() => setIsUploadModalOpen(true)} 
          onLogout={onLogout} 
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          analyticsData={data}
          username={username}
        />
        
        <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-10 mt-4 sm:mt-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tighter">Equipment Analytics Hub</h1>
            <p className="text-sm sm:text-base text-textMuted-light dark:text-textMuted-dark mt-1 font-medium italic truncate">Monitoring: {data?.filename || 'System Overview'}</p>
          </div>
          
          {/* Professional Tab Navigation */}
          <div className="flex items-center gap-1 sm:gap-2 p-1.5 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark w-fit">
            <TabButton
              tab="analytics"
              activeTab={activeTab}
              onClick={setActiveTab}
              icon={<BarChart2 size={18} />}
              label="Analytics"
            />
            <TabButton
              tab="visualizations"
              activeTab={activeTab}
              onClick={setActiveTab}
              icon={<PieChart size={18} />}
              label="Visualizations"
            />
            <TabButton
              tab="trends"
              activeTab={activeTab}
              onClick={setActiveTab}
              icon={<TrendingUp size={18} />}
              label="Trends"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-9 space-y-8 lg:space-y-12 order-2 lg:order-1">
            
            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
            <>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <Card className="group relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 sm:mb-8">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted-light dark:bg-muted-dark rounded-xl sm:rounded-2xl flex items-center justify-center text-textMuted-light dark:text-textMuted-dark transition-transform group-hover:scale-110"><Settings size={18} className="sm:w-5 sm:h-5" /></div>
                </div>
                <h4 className="text-[10px] sm:text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Record Count</h4>
                <div className="flex items-baseline gap-2 mt-1 sm:mt-2">
                  <span className="text-3xl sm:text-5xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tighter">
                    <AnimatedNumber value={data?.total_records || 0} />
                  </span>
                </div>
                <div className="mt-4 sm:mt-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] sm:text-[10px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest">Efficiency</span>
                    <span className="text-[9px] sm:text-[10px] font-black text-textPrimary-light dark:text-textPrimary-dark tabular-nums">{data?.total_records} ENTITIES</span>
                  </div>
                  <div className="flex gap-0.5 sm:gap-1">
                    {[...Array(8)].map((_, i) => {
                      const level = Math.min(Math.ceil((data?.total_records || 0) / 100), 8);
                      return (
                        <div key={i} className={`h-1 sm:h-1.5 w-full rounded-full transition-all duration-1000 ${i < level ? 'bg-textPrimary-light dark:bg-textPrimary-dark' : 'bg-muted-light dark:bg-muted-dark'}`} />
                      );
                    })}
                  </div>
                </div>
              </Card>

              <Card className="group relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 sm:mb-8">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-textPrimary-light dark:text-textPrimary-dark transition-transform group-hover:scale-110"><Activity size={18} className="sm:w-5 sm:h-5" /></div>
                </div>
                <h4 className="text-[10px] sm:text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Metrics Tracked</h4>
                <div className="flex items-baseline gap-2 mt-1 sm:mt-2">
                  <span className="text-3xl sm:text-5xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tighter">
                    <AnimatedNumber value={data?.numeric_columns_count || 0} />
                  </span>
                </div>
                <div className="mt-4 sm:mt-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] sm:text-[10px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest">Signal Depth</span>
                    <span className="text-[9px] sm:text-[10px] font-black text-primary tabular-nums">{data?.numeric_columns_count} PARAMETERS</span>
                  </div>
                  <div className="flex gap-0.5 sm:gap-1">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className={`h-1 sm:h-1.5 w-full rounded-full transition-all duration-1000 ${i < (data?.numeric_columns_count || 0) ? 'bg-primary' : 'bg-muted-light dark:bg-muted-dark'}`} />
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="group relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 sm:mb-8">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-textPrimary-light dark:text-textPrimary-dark transition-transform group-hover:scale-110"><Layers size={18} className="sm:w-5 sm:h-5" /></div>
                </div>
                <h4 className="text-[10px] sm:text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Entity Categories</h4>
                <div className="flex items-baseline gap-2 mt-1 sm:mt-2">
                  <span className="text-3xl sm:text-5xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tighter">
                    <AnimatedNumber value={data?.categorical_columns_count || 0} />
                  </span>
                </div>
                <div className="mt-4 sm:mt-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] sm:text-[10px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest">Classification</span>
                    <span className="text-[9px] sm:text-[10px] font-black text-secondary tabular-nums">{data?.categorical_columns_count} TYPES</span>
                  </div>
                  <div className="flex gap-0.5 sm:gap-1">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className={`h-1 sm:h-1.5 w-full rounded-full transition-all duration-1000 ${i < (data?.categorical_columns_count || 0) ? 'bg-secondary' : 'bg-muted-light dark:bg-muted-dark'}`} />
                    ))}
                  </div>
                </div>
              </Card>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight">Industrial Parameters</h2>
                <div className="h-px bg-border-light dark:bg-border-dark flex-1 ml-2 sm:ml-4"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {data?.statistics.map((stat, idx) => (
                  <Card key={idx} className="group">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all group-hover:scale-110 ${stat.column === 'Flowrate' ? 'bg-secondary/20 text-secondary' : stat.column === 'Pressure' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>
                        {stat.column === 'Flowrate' ? <Droplet size={20} className="sm:w-6 sm:h-6" /> : stat.column === 'Pressure' ? <Activity size={20} className="sm:w-6 sm:h-6" /> : <Thermometer size={20} className="sm:w-6 sm:h-6" />}
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-textMuted-light dark:text-textMuted-dark font-bold uppercase tracking-widest">Mean Value</span>
                    </div>
                    <p className="text-textMuted-light dark:text-textMuted-dark text-[10px] sm:text-xs font-bold uppercase tracking-widest">{stat.column}</p>
                    <div className="mt-1 sm:mt-2 flex items-baseline gap-1">
                      <span className="text-2xl sm:text-4xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight">
                        <AnimatedNumber value={stat.mean} decimals={1} />
                      </span>
                      <span className="text-xs sm:text-sm text-textMuted-light dark:text-textMuted-dark font-bold">{stat.unit}</span>
                    </div>
                    
                    <div className="mt-4 sm:mt-6 mb-4 sm:mb-8">
                       <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] sm:text-[10px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest">Active Range</span>
                        <span className="text-[9px] sm:text-[10px] font-black text-textPrimary-light dark:text-textPrimary-dark opacity-60 tabular-nums uppercase">{stat.mean} / {stat.max} {stat.unit}</span>
                      </div>
                      <div className="flex gap-0.5 sm:gap-1">
                        {[...Array(8)].map((_, i) => {
                          const level = Math.ceil((stat.mean / stat.max) * 8);
                          const colorClass = stat.column === 'Flowrate' ? 'bg-secondary' : stat.column === 'Pressure' ? 'bg-accent' : 'bg-primary';
                          return (
                            <div key={i} className={`h-1 sm:h-1.5 w-full rounded-full transition-all duration-1000 ${i < level ? colorClass : 'bg-muted-light dark:bg-muted-dark'}`} />
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border-light dark:border-border-dark grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-3">
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-textMuted-light dark:text-textMuted-dark uppercase font-bold mb-0.5 sm:mb-1">Median</p>
                        <p className="text-sm sm:text-base font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight">
                          {stat.median} {stat.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-textMuted-light dark:text-textMuted-dark uppercase font-bold mb-0.5 sm:mb-1">Std Dev</p>
                        <p className="text-sm sm:text-base font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight">
                          {stat.std} {stat.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-textMuted-light dark:text-textMuted-dark uppercase font-bold mb-0.5 sm:mb-1">Minimum</p>
                        <p className="text-sm sm:text-base font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight">
                          {stat.min} {stat.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-textMuted-light dark:text-textMuted-dark uppercase font-bold mb-0.5 sm:mb-1">Maximum</p>
                        <p className="text-sm sm:text-base font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight">
                          {stat.max} {stat.unit}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
            </>
            )}

            {/* TRENDS TAB - Parameter Statistics (inside grid) */}
            {activeTab === 'trends' && data?.statistics && data.statistics.length > 0 && (
              <section className="my-8">
                <div className="flex items-center gap-2 mb-4 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight">Parameter Statistics</h2>
                  <div className="h-px bg-border-light dark:bg-border-dark flex-1 ml-2 sm:ml-4"></div>
                </div>
                <Card title="Parameter Metrics" subtitle="Compare mean, median, std, min, max for each parameter">
                  <MultiLineChart
                    datasets={[
                      {
                        label: 'Mean',
                        data: data.statistics.map(stat => ({ timestamp: stat.column, value: stat.mean })),
                        color: '#0F8F7A',
                        unit: data.statistics[0]?.unit || ''
                      },
                      {
                        label: 'Median',
                        data: data.statistics.map(stat => ({ timestamp: stat.column, value: stat.median })),
                        color: '#2B5BC7',
                        unit: data.statistics[0]?.unit || ''
                      },
                      {
                        label: 'Std Dev',
                        data: data.statistics.map(stat => ({ timestamp: stat.column, value: stat.std })),
                        color: '#D9772F',
                        unit: data.statistics[0]?.unit || ''
                      },
                      {
                        label: 'Min',
                        data: data.statistics.map(stat => ({ timestamp: stat.column, value: stat.min })),
                        color: '#0D7F5F',
                        unit: data.statistics[0]?.unit || ''
                      },
                      {
                        label: 'Max',
                        data: data.statistics.map(stat => ({ timestamp: stat.column, value: stat.max })),
                        color: '#D32F4A',
                        unit: data.statistics[0]?.unit || ''
                      }
                    ]}
                    isDarkMode={isDarkMode}
                  />
                </Card>
              </section>
            )}

            {/* VISUALIZATIONS TAB */}
            {activeTab === 'visualizations' && (
            <>
              {/* Pie/Donut Charts Section */}
              {data?.chart_data?.pie_charts && data.chart_data.pie_charts.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight">Category Distribution</h2>
                    <div className="h-px bg-border-light dark:bg-border-dark flex-1 ml-2 sm:ml-4"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.chart_data.pie_charts.map((chart, idx) => (
                      <Card key={`pie-${idx}`} title={chart.label} subtitle="Distribution breakdown">
                        <DonutChart 
                          data={chart.data}
                          label={chart.label}
                          isDarkMode={isDarkMode}
                        />
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Grouped Bar Charts Section */}
              {data?.chart_data?.grouped_bar_charts && data.chart_data.grouped_bar_charts.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight">Metric Comparisons</h2>
                    <div className="h-px bg-border-light dark:bg-border-dark flex-1 ml-2 sm:ml-4"></div>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {data.chart_data.grouped_bar_charts.map((chart, idx) => (
                      <Card key={`grouped-${idx}`} title={chart.title} subtitle={`Comparing metrics grouped by ${chart.group_by}`}>
                        <GroupedBarChart 
                          groups={chart.groups}
                          datasets={chart.datasets}
                          title={chart.title}
                          groupBy={chart.group_by}
                          isDarkMode={isDarkMode}
                        />
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Histogram Section */}
              {data?.chart_data?.histograms && data.chart_data.histograms.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight">Value Distributions</h2>
                    <div className="h-px bg-border-light dark:bg-border-dark flex-1 ml-2 sm:ml-4"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.chart_data.histograms.map((hist, idx) => (
                      <Card key={`hist-${idx}`} title={hist.column} subtitle="Frequency distribution">
                        <HistogramChart 
                          bins={hist.bins}
                          column={hist.column}
                          stats={hist.stats}
                          isDarkMode={isDarkMode}
                        />
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Original Bar Charts Section */}
              <section className="grid grid-cols-1 gap-6 sm:gap-8">
               {data?.chart_data?.bar_charts?.map((chart, idx) => (
                <Card key={`bar-${idx}`} title={chart.label} subtitle="Asset Density Analysis">
                  <Chart 
                    data={chart.data} 
                    type="bar" 
                    dataKey="value" 
                    categoryKey="name" 
                    unit="Units"
                    isDarkMode={isDarkMode}
                  />
                </Card>
              ))}
              </section>
            </>
            )}
          </div>

          <aside className="lg:col-span-3 space-y-6 lg:space-y-8 order-1 lg:order-2">
            <Card title="Archive" subtitle="Historical report logs">
              {/* Dataset Limit Indicator */}
              <div className="mb-4 pb-4 border-b border-border-light dark:border-border-dark">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">Storage Used</span>
                  <span className={`text-xs font-black ${history.length >= 5 ? 'text-danger' : history.length >= 4 ? 'text-warning' : 'text-primary'}`}>
                    {history.length}/5 datasets
                  </span>
                </div>
                <div className="w-full h-2 bg-muted-light dark:bg-muted-dark rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      history.length >= 5 ? 'bg-danger' : history.length >= 4 ? 'bg-warning' : 'bg-primary'
                    }`}
                    style={{ width: `${(history.length / 5) * 100}%` }}
                  />
                </div>
                {history.length >= 5 && (
                  <p className="text-[10px] text-danger mt-1.5 font-medium">Limit reached. Oldest will be replaced on upload.</p>
                )}
              </div>
              
              <div className="space-y-2 sm:space-y-4">
                {history.length > 0 ? (
                  history.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => loadData(String(item.id))}
                      className="w-full flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl sm:rounded-3xl hover:bg-muted-light dark:hover:bg-muted-dark transition-all border border-transparent hover:border-border-light/40 dark:hover:border-border-dark/40 group text-left"
                    >
                      <div className="mt-0.5 sm:mt-1 w-8 h-8 sm:w-10 sm:h-10 bg-muted-light dark:bg-muted-dark group-hover:bg-surface-light dark:group-hover:bg-surface-dark rounded-xl sm:rounded-2xl flex items-center justify-center text-textMuted-light dark:text-textMuted-dark group-hover:text-primary shadow-sm transition-all shrink-0">
                        <FileSpreadsheet size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark truncate group-hover:text-primary transition-colors">{item.filename || item.file_name}</p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                          <p className="text-[9px] sm:text-[10px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-tighter shrink-0">{item.record_count || item.total_records} ROWS</p>
                          <div className="flex gap-0.5 w-8 sm:w-12 h-1 shrink-0">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className={`h-full w-full rounded-full ${i < 3 ? 'bg-primary/40' : 'bg-muted-light dark:bg-muted-dark'}`} />
                            ))}
                          </div>
                          <p className="text-[9px] sm:text-[10px] text-textMuted-light dark:text-textMuted-dark opacity-60 ml-auto hidden xs:block">{new Date(item.upload_time).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-textMuted-light dark:text-textMuted-dark text-center py-4">No recent history found.</p>
                )}
                
                <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-border-light dark:border-border-dark">
                  <Button variant="outline" className="w-full text-xs py-2.5 sm:py-3 rounded-xl sm:rounded-2xl" icon={<History size={14} />}>Detailed Log</Button>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 dark:bg-gradient-to-br dark:from-[#1C1C1F] dark:via-[#141416] dark:to-[#1C1C1F] border border-border-light dark:border-border-dark overflow-hidden relative group">
              <div className="relative z-10 space-y-3 sm:space-y-4">
                <h4 className="text-lg sm:text-xl font-bold tracking-tight text-textPrimary-light dark:text-textPrimary-dark">System Help</h4>
                <p className="text-xs sm:text-sm text-textMuted-light dark:text-textMuted-dark">Documentation and expert engineering support available.</p>
                <Button variant="primary" className="w-full py-3 sm:py-4 font-bold rounded-xl sm:rounded-2xl text-sm sm:text-base">Technical Support</Button>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 transition-transform group-hover:scale-110"><HelpCircle size={48} className="sm:w-[60px] sm:h-[60px] text-textMuted-light dark:text-textMuted-dark" /></div>
            </Card>
          </aside>
        </div>

        {/* TRENDS TAB - Full-Width Parameter Charts Section */}
        {activeTab === 'trends' && data?.chart_data?.line_charts && data.chart_data.line_charts.length > 0 && (
          <section className="mt-8 lg:mt-12">
            <div className="flex items-center gap-2 mb-4 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight">Live Parameter Trends</h2>
              <div className="h-px bg-border-light dark:bg-border-dark flex-1 ml-2 sm:ml-4"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {data.chart_data.line_charts.map((chart, idx) => {
                const chartColor = chart.label.includes('Flowrate') ? '#A7E8C3' : 
                                   chart.label.includes('Pressure') ? '#F2C94C' : 
                                   '#E6F76A';
                return (
                  <Card key={`line-${idx}`} title={chart.label} subtitle="Operational Performance">
                    <Chart 
                      data={chart.data} 
                      type="area" 
                      dataKey="value" 
                      categoryKey="timestamp" 
                      color={chartColor}
                      unit={chart.label.includes('Flowrate') ? 'm³/h' : chart.label.includes('Pressure') ? 'bar' : '°C'}
                      isDarkMode={isDarkMode}
                    />
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Parameter Comparison Chart - Part of TRENDS TAB */}
        {activeTab === 'trends' && data?.chart_data?.line_charts && data.chart_data.line_charts.length > 0 && (
          <section className="mt-8 lg:mt-12">
            <div className="flex items-center gap-2 mb-4 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-textPrimary-light dark:text-textPrimary-dark tracking-tight">Parameter Comparison</h2>
              <div className="h-px bg-border-light dark:bg-border-dark flex-1 ml-2 sm:ml-4"></div>
            </div>
            <Card title="Flowrate vs Pressure vs Temperature" subtitle="Comparative analysis of key parameters">
              <MultiLineChart
                datasets={data.chart_data.line_charts.map(chart => ({
                  label: chart.label,
                  data: chart.data,
                  color: chart.label.includes('Flowrate') ? '#7FBF9A' : chart.label.includes('Pressure') ? '#D4A43A' : '#C4D44A',
                  unit: chart.label.includes('Flowrate') ? 'm³/h' : chart.label.includes('Pressure') ? 'bar' : '°C'
                }))}
                isDarkMode={isDarkMode}
              />
            </Card>
          </section>
        )}

      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={(newData) => {
          setData(newData);
          loadData(); // Reload history too
        }}
      />
    </div>
  );
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const [auth, setAuth] = useState<AuthState>(() => {
    const savedToken = localStorage.getItem('access_token');
    return {
      isLoggedIn: !!savedToken,
      username: '',
      authHeader: savedToken ? `Bearer ${savedToken}` : null
    };
  });

  const handleLoginSuccess = (user: string) => {
    const token = localStorage.getItem('access_token');
    setAuth({
      isLoggedIn: true,
      username: user,
      authHeader: token ? `Bearer ${token}` : null
    });
  };

  const handleLogout = () => {
    apiService.logout();
    setAuth({
      isLoggedIn: false,
      username: '',
      authHeader: null
    });
  };

  return (
    <div className="text-textPrimary-light dark:text-textPrimary-dark selection:bg-primary selection:text-black theme-transition">
      {auth.isLoggedIn ? (
        <Dashboard 
          onLogout={handleLogout} 
          isDarkMode={isDarkMode} 
          username={auth.username}
          toggleTheme={toggleTheme} 
        />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}
