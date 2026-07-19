import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MIN_PASSWORD_LENGTH } from '../services/auth';
import { isValidEmail, isValidName, isValidPassword, validationMessage } from '../lib/validation';
import { Camera, Mail, User, Lock, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, language } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidName(name)) {
      setError(validationMessage('INVALID_NAME', language));
      return;
    }
    if (!isValidEmail(email)) {
      setError(validationMessage('INVALID_EMAIL', language));
      return;
    }
    if (!isValidPassword(password)) {
      setError(validationMessage('INVALID_PASSWORD', language));
      return;
    }

    setIsLoading(true);
    const success = await register(name, email, password);
    setIsLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setError(
        language === 'sw'
          ? 'Usajili umeshindwa. Barua pepe tayari inaweza kuwa imesajiliwa — jaribu kuingia au tumia "Umesahau?"'
          : 'Registration failed. This email may already exist — try Login or use Forgot? to reset your password.'
      );
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
            {language === 'sw' ? 'Jisajili Mfumo' : 'Register Account'}
          </p>
        </div>

        <div className="card-premium p-7 shadow-premium">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {language === 'sw' ? 'Jina Kamili' : 'Farmer Full Name'}
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder={language === 'sw' ? 'Ingiza jina lako' : 'e.g. John Doe'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-primary-900 border border-gray-200 dark:border-primary-600 rounded-2xl text-sm"
                />
              </div>
            </div>

            {/* Email Address */}
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

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {language === 'sw' ? 'Nenosiri Kipya' : 'Choose Password'}
              </label>
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

            {/* Action Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary-700 hover:bg-primary-600 active:bg-primary-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-premium shadow-primary-700/10 active:scale-[0.98] transition-all duration-200 select-none cursor-pointer mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{language === 'sw' ? 'Kamilisha Usajili' : 'Create Account'}</span>
                  <ArrowRight size={18} className="stroke-[2.5px]" />
                </>
              )}
            </button>
          </form>

          {/* Helper links */}
          <div className="text-center mt-6 pt-5 border-t border-gray-100 dark:border-primary-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
              {language === 'sw' ? 'Tayari una akaunti?' : 'Already registered?'}{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-extrabold ml-1">
                {language === 'sw' ? 'Ingia Hapa' : 'Login'}
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

export default RegisterPage;
