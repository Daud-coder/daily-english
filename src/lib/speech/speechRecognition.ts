// Speech Recognition helper for Web Speech API

// Declare webkitSpeechRecognition for TypeScript
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface SpeechRecognitionHandlers {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (errorMsg: string, isSupported: boolean) => void;
  onStart: () => void;
  onEnd: () => void;
}

export class VoiceRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private handlers: SpeechRecognitionHandlers;
  private lang: string;

  constructor(handlers: SpeechRecognitionHandlers, lang: string = "en-US") {
    this.handlers = handlers;
    this.lang = lang;
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      this.handlers.onError(
        "Ваш браузер не поддерживает голосовой ввод. Для лучшей работы откройте приложение в Google Chrome или Safari.",
        false
      );
      return;
    }

    try {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.lang;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.handlers.onStart();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        this.handlers.onResult(currentText.trim(), Boolean(finalTranscript));
      };

      this.recognition.onerror = (event: any) => {
        let message = "Произошла ошибка распознавания речи.";
        if (event.error === "not-allowed") {
          message = "Доступ к микрофону запрещен. Пожалуйста, разрешите доступ к микрофону в настройках браузера.";
        } else if (event.error === "no-speech") {
          message = "Речь не обнаружена. Попробуйте сказать ближе к микрофону.";
        } else if (event.error === "audio-capture") {
          message = "Микрофон не найден или занят другим приложением.";
        } else if (event.error === "network") {
          message = "Ошибка сети при распознавании. Проверьте интернет-соединение.";
        }
        this.handlers.onError(message, true);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.handlers.onEnd();
      };
    } catch (err) {
      console.error("SpeechRecognition init error:", err);
      this.handlers.onError("Не удалось инициализировать микрофон.", true);
    }
  }

  public setLanguage(lang: string) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start() {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (err) {
        console.warn("Recognition already started or error:", err);
      }
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn("Recognition stop error:", err);
      }
    }
  }

  public get active(): boolean {
    return this.isListening;
  }

  public isSupported(): boolean {
    return typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }
}
