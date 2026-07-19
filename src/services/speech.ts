type SpeechLang = 'en' | 'sw';
type PlayState = 'playing' | 'paused' | 'stopped';

export type SpeechDiagnostics = {
  apiAvailable: boolean;
  voiceCount: number;
  canSpeak: boolean;
  hintEn: string;
  hintSw: string;
};

const USE_AUDIO_FALLBACK_KEY = 'fieldmate_use_audio_tts';
/** Google TTS proxy limit per request — long readouts are split into chunks. */
const TTS_CHUNK_SIZE = 180;

function splitTextForSpeech(text: string, maxLen = TTS_CHUNK_SIZE): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    const window = remaining.slice(0, maxLen);
    let splitAt = -1;

    for (const sep of ['. ', '; ', ', ']) {
      const idx = window.lastIndexOf(sep);
      if (idx > maxLen * 0.35) {
        splitAt = idx + sep.length;
        break;
      }
    }

    if (splitAt <= 0) {
      const spaceIdx = window.lastIndexOf(' ');
      splitAt = spaceIdx > 0 ? spaceIdx + 1 : maxLen;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  return chunks.filter(Boolean);
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private activeAudio: HTMLAudioElement | null = null;
  private activeBlobUrl: string | null = null;
  private rate = 0.9;
  private pitch = 1.0;
  private selectedVoiceName: string | null = null;
  private playStateListeners: ((state: PlayState) => void)[] = [];
  private voiceListeners: (() => void)[] = [];
  private errorListeners: ((message: string) => void)[] = [];
  private speakGeneration = 0;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
      this.synth.addEventListener('voiceschanged', () => {
        this.voiceListeners.forEach((listener) => listener());
      });
    }
  }

  public addErrorListener(listener: (message: string) => void) {
    this.errorListeners.push(listener);
  }

  public removeErrorListener(listener: (message: string) => void) {
    this.errorListeners = this.errorListeners.filter((l) => l !== listener);
  }

  public prime() {
    if (!this.synth) return;
    this.synth.getVoices();
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.synth?.getVoices() ?? [];
  }

  public subscribeVoices(listener: () => void): () => void {
    this.voiceListeners.push(listener);
    return () => {
      this.voiceListeners = this.voiceListeners.filter((l) => l !== listener);
    };
  }

  public setVoiceName(name: string | null) {
    this.selectedVoiceName = name && name.trim() ? name.trim() : null;
  }

  public setRate(rate: number) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  public setPitch(pitch: number) {
    this.pitch = Math.max(0.5, Math.min(2.0, pitch));
  }

  public addPlayStateListener(listener: (state: PlayState) => void) {
    this.playStateListeners.push(listener);
  }

  public removePlayStateListener(listener: (state: PlayState) => void) {
    this.playStateListeners = this.playStateListeners.filter((l) => l !== listener);
  }

  public getDiagnostics(): SpeechDiagnostics {
    const apiAvailable = !!this.synth;
    const voiceCount = this.getVoices().length;
    const useFallback = this.shouldUseAudioFallback();
    return {
      apiAvailable,
      voiceCount,
      canSpeak: apiAvailable || navigator.onLine,
      hintEn: useFallback
        ? 'Using online voice (Chrome speech engine unavailable on this PC).'
        : apiAvailable
          ? voiceCount === 0
            ? 'Tap Test Audio once to load Windows voices.'
            : ''
          : 'Speech is not supported in this browser.',
      hintSw: useFallback
        ? 'Inatumia sauti ya mtandaoni (Chrome haiwezi kusema kwenye PC hii).'
        : apiAvailable
          ? voiceCount === 0
            ? 'Gusa Jaribu Sauti mara moja kupakia sauti.'
            : ''
          : 'Sauti haitumiki kwenye kivinjari hiki.',
    };
  }

  public isSupported(): boolean {
    return !!this.synth || navigator.onLine;
  }

  private shouldUseAudioFallback(): boolean {
    // Local Windows voices available — keep one consistent voice for scan + results.
    if (this.getVoices().length > 0) return false;
    try {
      return sessionStorage.getItem(USE_AUDIO_FALLBACK_KEY) === '1';
    } catch {
      return false;
    }
  }

  private markAudioFallbackPreferred() {
    try {
      sessionStorage.setItem(USE_AUDIO_FALLBACK_KEY, '1');
    } catch {
      // ignore
    }
  }

  private clearAudioFallbackPreference() {
    try {
      sessionStorage.removeItem(USE_AUDIO_FALLBACK_KEY);
    } catch {
      // ignore
    }
  }

  private notifyState(state: PlayState) {
    this.playStateListeners.forEach((listener) => listener(state));
  }

  private notifyError(message: string) {
    console.error('[FieldMate Speech]', message);
    this.errorListeners.forEach((listener) => listener(message));
  }

  private logState(label: string) {
    if (!this.synth) return;
    const s = this.synth;
    console.log(
      `[FieldMate Speech] ${label} — speaking:${s.speaking} pending:${s.pending} paused:${s.paused}`
    );
  }

  private revokeBlobUrl() {
    if (this.activeBlobUrl) {
      URL.revokeObjectURL(this.activeBlobUrl);
      this.activeBlobUrl = null;
    }
  }

  private stopAll() {
    this.speakGeneration += 1;
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.activeAudio) {
      this.activeAudio.onerror = null;
      this.activeAudio.onended = null;
      this.activeAudio.pause();
      this.activeAudio.src = '';
      this.activeAudio = null;
    }
    this.revokeBlobUrl();
    this.activeUtterance = null;
    this.notifyState('stopped');
  }

  private buildFallbackUrl(text: string, lang: SpeechLang): string {
    const tl = lang === 'sw' ? 'sw' : 'en';
    const q = encodeURIComponent(text);
    return `/api/tts?ie=UTF-8&client=gtx&tl=${tl}&q=${q}`;
  }

  private async fetchTtsBlob(text: string, lang: SpeechLang): Promise<string | null> {
    try {
      const res = await fetch(this.buildFallbackUrl(text, lang));
      if (!res.ok) {
        console.warn('[FieldMate Speech] TTS fetch failed:', res.status);
        return null;
      }
      const blob = await res.blob();
      if (!blob.size) return null;
      return URL.createObjectURL(blob);
    } catch (err) {
      console.warn('[FieldMate Speech] TTS fetch error:', err);
      return null;
    }
  }

  private playAudioChunk(
    text: string,
    lang: SpeechLang,
    generation: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (generation !== this.speakGeneration || !navigator.onLine) {
        resolve(false);
        return;
      }

      void this.fetchTtsBlob(text, lang).then((blobUrl) => {
        if (!blobUrl || generation !== this.speakGeneration) {
          if (blobUrl) URL.revokeObjectURL(blobUrl);
          resolve(false);
          return;
        }

        this.revokeBlobUrl();
        this.activeBlobUrl = blobUrl;

        const audio = new Audio(blobUrl);
        this.activeAudio = audio;
        audio.playbackRate = this.rate;
        let settled = false;

        const finish = (ok: boolean) => {
          if (settled || generation !== this.speakGeneration) return;
          settled = true;
          resolve(ok);
        };

        audio.onplay = () => {
          if (generation !== this.speakGeneration) return;
          this.notifyState('playing');
        };

        audio.onended = () => {
          if (generation !== this.speakGeneration) return;
          this.activeAudio = null;
          this.revokeBlobUrl();
          finish(true);
        };

        audio.onerror = () => {
          if (generation !== this.speakGeneration) return;
          this.activeAudio = null;
          this.revokeBlobUrl();
          finish(false);
        };

        void audio.play().catch(() => finish(false));
      });
    });
  }

  /** Online audio fallback when Chrome speech engine is stuck. */
  private async speakViaAudioSequence(
    chunks: string[],
    lang: SpeechLang,
    generation: number
  ): Promise<boolean> {
    if (generation !== this.speakGeneration || !navigator.onLine) {
      return false;
    }

    console.log('[FieldMate Speech] Using online audio fallback (via server proxy)');

    for (const chunk of chunks) {
      if (generation !== this.speakGeneration) return false;
      const ok = await this.playAudioChunk(chunk, lang, generation);
      if (!ok) return false;
    }

    if (generation === this.speakGeneration) {
      this.notifyState('stopped');
    }
    return true;
  }

  private pickVoice(lang: SpeechLang): SpeechSynthesisVoice | undefined {
    const voices = this.getVoices();
    if (voices.length === 0) return undefined;

    if (this.selectedVoiceName) {
      const selected = voices.find((v) => v.name === this.selectedVoiceName);
      if (selected?.localService) return selected;
    }

    // One consistent Windows voice — Zira first so scan + results match.
    return (
      voices.find((v) => v.localService && /Microsoft Zira/i.test(v.name)) ||
      voices.find((v) => v.localService && /Microsoft David/i.test(v.name)) ||
      voices.find((v) => v.localService && v.lang.startsWith('en')) ||
      (lang === 'sw' ? voices.find((v) => v.lang.startsWith('sw')) : undefined)
    );
  }

  private speakWebSpeechSequence(
    chunks: string[],
    lang: SpeechLang,
    generation: number,
    onFirstStart: () => void
  ) {
    if (!this.synth || generation !== this.speakGeneration || chunks.length === 0) return;

    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel();
    }

    const voice = this.pickVoice(lang);
    let index = 0;
    let firstChunkStarted = false;

    const speakNextChunk = () => {
      if (!this.synth || generation !== this.speakGeneration || index >= chunks.length) {
        if (index >= chunks.length && generation === this.speakGeneration) {
          this.activeUtterance = null;
          this.notifyState('stopped');
        }
        return;
      }

      const text = chunks[index];
      index += 1;

      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance;
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;
      utterance.lang = lang === 'sw' ? 'sw-KE' : 'en-US';
      utterance.volume = 1;

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || utterance.lang;
      }

      utterance.onstart = () => {
        if (generation !== this.speakGeneration) return;
        if (!firstChunkStarted) {
          firstChunkStarted = true;
          onFirstStart();
          this.clearAudioFallbackPreference();
        }
        this.notifyState('playing');
      };

      utterance.onend = () => {
        if (generation !== this.speakGeneration) return;
        if (index < chunks.length) {
          speakNextChunk();
        } else {
          this.activeUtterance = null;
          this.notifyState('stopped');
        }
      };

      utterance.onerror = (event) => {
        if (generation !== this.speakGeneration) return;
        if (event.error === 'interrupted' || event.error === 'canceled') return;
        console.warn('[FieldMate Speech] Web speech error:', event.error);
        this.activeUtterance = null;
      };

      this.synth.resume();
      this.synth.speak(utterance);
      // Chrome on Windows bug fix — unpause the speech engine
      this.synth.pause();
      this.synth.resume();
    };

    speakNextChunk();
    this.logState('web speech queued');
  }

  public speak(text: string, lang: SpeechLang) {
    const sanitizedText = text
      .replace(/[*#_\-\[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!sanitizedText) return;

    this.speakGeneration += 1;
    const generation = this.speakGeneration;
    let started = false;
    const chunks = splitTextForSpeech(sanitizedText);

    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }

    console.log(
      '[FieldMate Speech] Speak requested —',
      this.getVoices().length,
      'voices,',
      chunks.length,
      'chunk(s)'
    );

    const runAudioFallback = () => {
      void this.speakViaAudioSequence(chunks, lang, generation).then((ok) => {
        if (!ok && generation === this.speakGeneration) {
          this.notifyError(
            'Voice unavailable. Connect to internet, or use Microsoft Edge. Also check Windows Volume Mixer — Chrome may be muted.'
          );
        }
      });
    };

    // Skip broken Chrome engine if we already know it fails on this PC
    if (this.shouldUseAudioFallback()) {
      void this.speakViaAudioSequence(chunks, lang, generation).then((ok) => {
        if (!ok) {
          this.notifyError('Voice needs internet. Connect to Wi‑Fi and try again.');
        }
      });
      return;
    }

    this.prime();
    this.logState('on click');

    if (!this.synth || this.getVoices().length === 0) {
      this.markAudioFallbackPreferred();
      runAudioFallback();
      return;
    }

    this.speakWebSpeechSequence(chunks, lang, generation, () => {
      started = true;
      console.log('[FieldMate Speech] Web speech started');
    });

    // Long readouts can delay onstart — do not switch engines while speech is queued
    window.setTimeout(() => {
      if (generation !== this.speakGeneration || started) return;
      if (this.synth && (this.synth.speaking || this.synth.pending)) {
        started = true;
        return;
      }

      this.logState('web speech stuck — switching to audio fallback');
      this.markAudioFallbackPreferred();
      if (this.synth) {
        this.synth.cancel();
      }
      this.activeUtterance = null;
      runAudioFallback();
    }, 1500);
  }

  public pause() {
    if (this.activeAudio && !this.activeAudio.paused) {
      this.activeAudio.pause();
      this.notifyState('paused');
      return;
    }
    if (!this.synth) return;
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.notifyState('paused');
    }
  }

  public resume() {
    if (this.activeAudio?.paused) {
      void this.activeAudio.play();
      this.notifyState('playing');
      return;
    }
    if (!this.synth) return;
    if (this.synth.paused) {
      this.synth.resume();
      this.notifyState('playing');
    }
  }

  public stop() {
    this.stopAll();
  }

  public isSpeaking(): boolean {
    return !!(
      (this.synth && this.synth.speaking) ||
      (this.activeAudio && !this.activeAudio.paused)
    );
  }

  public isPaused(): boolean {
    return !!(
      (this.synth && this.synth.paused) ||
      (this.activeAudio?.paused && (this.activeAudio.currentTime ?? 0) > 0)
    );
  }
}

export const speechService = new SpeechService();
export default speechService;
