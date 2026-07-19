import { useEffect, useState } from 'react';
import { speechService, SpeechDiagnostics } from '../services/speech';

export function useSpeechSupport() {
  const [diagnostics, setDiagnostics] = useState<SpeechDiagnostics>(() =>
    speechService.getDiagnostics()
  );

  useEffect(() => {
    const refresh = () => setDiagnostics(speechService.getDiagnostics());
    refresh();
    return speechService.subscribeVoices(refresh);
  }, []);

  return diagnostics;
}

export function openAppInSystemBrowser() {
  window.open(window.location.href, '_blank', 'noopener,noreferrer');
}
