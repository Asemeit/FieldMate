import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authService, MIN_PASSWORD_LENGTH } from '../services/auth';
import { isValidEmail, isValidPassword, validationMessage } from '../lib/validation';
import { Camera, Mail, Lock, ArrowRight } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, resetPassword } = useApp();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
    if (!isValidPassword(newPassword)) {
      setError(validationMessage('INVALID_PASSWORD', language));
      return;
    }

    setIsLoading(true);
    const success = await resetPassword(email, newPassword);
    setIsLoading(false);
    if (success) {
      navigate('/login');
    }
  };

  return (
    <>
      <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg shadow-primary-700/20 mb-3">
            <Camera size={26} className="stroke-[2.5px]" />
          </div>
          <h2 className="text-2xl font-extrabold text-primary-800 tracking-tight leading-none">FieldMate</h2>
          <p className="text-xs text-primary-500 dark:text-primary-400 font-bold uppercase tracking-widest mt-1">
            {language === 'sw' ? 'Weka Nenosiri Jipya' : 'Reset Password'}
          </p>
        </div>

        <div className="card-premium p-7 shadow-premium">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold leading-relaxed mb-5">
            {language === 'sw'
              ? 'Weka barua pepe yako na nenosiri jipya. Akaunti yako itahifadhiwa kwenye kifaa hiki.'
              : 'Enter your email and a new password. Your account is saved locally on this device.'}
          </p>

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
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {language === 'sw' ? 'Nenosiri Jipya' : 'New Password'}
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              className="w-full py-4 bg-primary-700 hover:bg-primary-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-premium active:scale-[0.98] transition-all mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{language === 'sw' ? 'Hifadhi Nenosiri' : 'Save New Password'}</span>
                  <ArrowRight size={18} className="stroke-[2.5px]" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-5 border-t border-gray-100 dark:border-primary-700">
            <Link to="/login" className="text-xs font-extrabold text-primary-600 hover:text-primary-700">
              {language === 'sw' ? '← Rudi kwenye Kuingia' : '← Back to Login'}
            </Link>
          </div>
        </div>
    </>
  );
};

export default ForgotPasswordPage;
