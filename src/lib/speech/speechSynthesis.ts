// Speech Synthesis & Gemini TTS audio player

class VoiceSpeaker {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voicesLoaded: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
      this.loadVoices();
    }
  }

  private loadVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      this.voicesLoaded = true;
      // Prefer high quality English voices
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel") ||
            v.name.includes("Karen") ||
            v.name.includes("Siri"))
      );
      this.selectedVoice = preferred || voices.find((v) => v.lang.startsWith("en")) || null;
    }
  }

  public stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Speak English text.
   * rate: 0.85 for clear gentle beginner speed, 0.60 for extra slow.
   */
  public async speak(
    text: string,
    options: {
      slow?: boolean;
      useGeminiTTS?: boolean;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): Promise<void> {
    this.stop();

    const { slow = false, useGeminiTTS = false, onStart, onEnd, onError } = options;
    const speed = slow ? 0.60 : 0.85;

    // Try Gemini TTS API only if explicitly requested
    if (useGeminiTTS) {
      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, slow })
        });

        if (response.ok) {
          const blob = await response.blob();
          if (blob && blob.size > 100) {
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            this.currentAudio = audio;

            audio.onplay = () => onStart?.();
            audio.onended = () => {
              this.currentAudio = null;
              URL.revokeObjectURL(audioUrl);
              onEnd?.();
            };
            audio.onerror = () => {
              this.currentAudio = null;
              URL.revokeObjectURL(audioUrl);
              this.fallbackBrowserSpeak(text, speed, onStart, onEnd, onError);
            };

            await audio.play();
            return;
          }
        }
      } catch (e) {
        // Fallback directly to browser voice
      }
    }

    // Always use robust browser Web Speech API
    this.fallbackBrowserSpeak(text, speed, onStart, onEnd, onError);
  }

  private fallbackBrowserSpeak(
    text: string,
    rate: number,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onError?.(new Error("Синтез речи не поддерживается браузером"));
      return;
    }

    // Ensure voices are loaded
    if (!this.selectedVoice) {
      this.loadVoices();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = 1.0;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => {
      this.currentUtterance = null;
      onEnd?.();
    };
    utterance.onerror = (err) => {
      this.currentUtterance = null;
      onError?.(err);
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }
}

export const voiceSpeaker = new VoiceSpeaker();
