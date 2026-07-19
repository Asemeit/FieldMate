import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authService, MIN_PASSWORD_LENGTH } from '../services/auth';
import { isValidEmail, isValidPassword, validationMessage } from '../lib/validation';
import { Camera, Mail, Lock, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, language } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const remembered = authService.getRememberedEmail();
    if (remembered) setEmail(remembered);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError(validationMessage('INVALID_EMAIL', language));
      return;
    }
    if (!isValidPassword(password)) {
      setError(validationMessage('INVALID_PASSWORD', language));
      return;
    }

    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (success) {
      navigate('/dashboard');
      return;
    }

    const exists = await authService.accountExists(email);
    setError(
      exists
        ? language === 'sw'
          ? 'Nenosiri si sahihi. Bofya "Umesahau?" kuweka nenosiri jipya.'
          : 'Wrong password for this email. Tap Forgot? to set a new password.'
        : language === 'sw'
          ? 'Hakuna akaunti kwenye kifaa hiki. Jisajili, au tumia "Umesahau?" kuweka nenosiri.'
          : 'No account saved on this browser. Register, or use Forgot? to set a password.'
    );
  };

  return (
    <>
      <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg shadow-primary-700/20 mb-3">
            <Camera size={26} className="stroke-[2.5px]" />
          </div>
          <h2 className="text-2xl font-extrabold text-primary-800 tracking-tight leading-none">FieldMate</h2>
          <p className="text-xs text-primary-500 dark:text-primary-400 font-bold uppercase tracking-widest mt-1">
            {language === 'sw' ? 'Ingia Mfumo' : 'Farmer Access Portal'}
          </p>
        </div>

        <div className="card-premium p-7 shadow-premium">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {language === 'sw' ? 'Barua Pepe' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-primary-900 border border-gray-200 dark:border-primary-600 rounded-2xl text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {language === 'sw' ? 'Nenosiri' : 'Password'}
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                  {language === 'sw' ? 'Umesahau?' : 'Forgot?'}
                </Link>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-primary-900 border border-gray-200 dark:border-primary-600 rounded-2xl text-sm"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-medium">
                {language === 'sw' ? 'Angalau herufi 8' : 'At least 8 characters'}
              </p>
            </div>

            {error && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary-700 hover:bg-primary-600 active:bg-primary-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-premium shadow-primary-700/10 active:scale-[0.98] transition-all duration-200 select-none cursor-pointer mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{language === 'sw' ? 'Ingia Sasa' : 'Login'}</span>
                  <ArrowRight size={18} className="stroke-[2.5px]" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-5 border-t border-gray-100 dark:border-primary-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
              {language === 'sw' ? 'Huna akaunti?' : "Don't have an account?"}{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-extrabold ml-1">
                {language === 'sw' ? 'Fungua Hapa' : 'Register'}
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors uppercase tracking-wider">
            {language === 'sw' ? '← Rudi Mwanzo' : '← Back to Welcome Screen'}
          </Link>
        </div>
    </>
  );
};

export default LoginPage;
