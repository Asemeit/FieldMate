import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Mail, Phone, MapPin, MessageCircle, Copy, Check } from 'lucide-react';

const SUPPORT_EMAIL = 'zalphaprecious@gmail.com';
const SUPPORT_PHONE = '+254 734678790';

export const SupportPage: React.FC = () => {
  const { language, showToast } = useApp();
  const isSw = language === 'sw';
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      showToast(isSw ? 'Barua pepe imenakiliwa' : 'Email copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(isSw ? 'Imeshindwa kunakili' : 'Could not copy email', 'error');
    }
  };

  const faqs: { q: string; a: string }[] = isSw
    ? [
        { q: 'Nimesahau nenosiri langu?', a: 'Kwenye ukurasa wa kuingia, gusa "Umesahau?" na weka barua pepe yako na nenosiri jipya.' },
        { q: 'Sauti haifanyi kazi?', a: 'Nenda Mipangilio → Jaribu Sauti. Tumia Chrome na hakikisha sauti ya kifaa imewashwa.' },
        { q: 'Data yangu iko wapi?', a: 'Kila kivinjari na kifaa kina hifadhidata yake. Tumia Chrome tu kwenye localhost:5173.' },
        { q: 'Mazao gani yanaweza kuchunguzwa?', a: 'Mahindi, viazi, nyanya, ngano, na maharagwe. ML inafanya kazi vizuri kwa mahindi, viazi, na nyanya.' },
      ]
    : [
        { q: 'I forgot my password?', a: 'On the login page, tap Forgot? and enter your email with a new password (8+ characters).' },
        { q: 'Voice is not working?', a: 'Go to Settings → Test Audio. Use Chrome and check your device volume.' },
        { q: 'Where is my data stored?', a: 'Each browser and device has its own storage. Always use Chrome at http://localhost:5173.' },
        { q: 'Which crops can I scan?', a: 'Maize, potato, tomato, wheat, and beans. ML works best on maize, potato, and tomato.' },
      ];

  return (
    <div className="flex flex-col gap-4 pb-8">
      <h1 className="text-lg font-extrabold text-primary-800 dark:text-primary-50">
        {isSw ? 'Msaada na Mawasiliano' : 'Help & Contact Support'}
      </h1>

      <div className="card-premium p-5 border-primary-100">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <MessageCircle size={16} className="text-primary-600" />
          {isSw ? 'Wasiliana Nasi' : 'Contact Us'}
        </h3>

        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 p-3 bg-primary-50/60 dark:bg-primary-900/60 rounded-2xl border border-primary-100 dark:border-primary-700">
            <Mail size={18} className="text-primary-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase">{isSw ? 'Barua pepe' : 'Email'}</p>
              <p className="text-sm font-semibold text-primary-800 dark:text-primary-100 break-all">{SUPPORT_EMAIL}</p>
            </div>
            <button
              type="button"
              onClick={copyEmail}
              className="p-2 rounded-xl bg-white dark:bg-primary-800 border border-primary-200 dark:border-primary-600 text-primary-700 dark:text-primary-200 shrink-0"
              title={isSw ? 'Nakili' : 'Copy'}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=FieldMate%20Support`}
            className="w-full py-3.5 bg-primary-700 text-white rounded-2xl text-sm font-bold text-center active:scale-95 transition-transform"
          >
            {isSw ? 'Tuma Barua Pepe' : 'Send Email'}
          </a>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-primary-900 rounded-2xl border border-gray-100 dark:border-primary-700">
            <Phone size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{isSw ? 'Simu (saa za kazi)' : 'Phone (office hours)'}</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{SUPPORT_PHONE}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-primary-900 rounded-2xl border border-gray-100 dark:border-primary-700">
            <MapPin size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{isSw ? 'Eneo' : 'Location'}</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Eldoret, Uasin Gishu County, Kenya</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isSw
                  ? 'Wasiliana na afisa wa kilimo wa eneo lako kwa ushauri wa shambani.'
                  : 'Contact your local agricultural extension officer for in-field advice.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-premium p-5 border-primary-100">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
          {isSw ? 'Maswali Yanayoulizwa Mara kwa Mara' : 'Frequently Asked Questions'}
        </h3>
        <div className="flex flex-col gap-4">
          {faqs.map((item) => (
            <div key={item.q}>
              <p className="text-sm font-bold text-primary-800 dark:text-primary-100">{item.q}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      <Link
        to="/"
        className="text-center text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
      >
        {isSw ? '← Rudi Mwanzo' : '← Back to Welcome'}
      </Link>
    </div>
  );
};

export default SupportPage;
