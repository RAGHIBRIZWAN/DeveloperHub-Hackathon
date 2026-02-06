/**
 * Text-to-Speech Utility
 * Provides AI voice responses using Web Speech API
 */

class TTSService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
    this.isSpeaking = false;
  }

  /**
   * Get available voices
   */
  getVoices() {
    return new Promise((resolve) => {
      let voices = this.synth.getVoices();
      
      if (voices.length) {
        resolve(voices);
      } else {
        // Voices might not be loaded yet
        this.synth.onvoiceschanged = () => {
          voices = this.synth.getVoices();
          resolve(voices);
        };
      }
    });
  }

  /**
   * Select the best voice based on language
   */
  async selectVoice(language = 'en') {
    const voices = await this.getVoices();
    
    // Prefer English voices
    const preferredVoices = [
      'Google US English',
      'Microsoft Zira Desktop',
      'Microsoft David Desktop',
      'Alex',
      'Samantha',
    ];

    // Find preferred voice
    for (const voiceName of preferredVoices) {
      const voice = voices.find(v => v.name.includes(voiceName));
      if (voice) return voice;
    }

    // Fallback to any English voice
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) return englishVoice;

    // Ultimate fallback
    return voices[0];
  }

  /**
   * Speak text with options
   */
  async speak(text, options = {}) {
    const {
      language = 'en',
      rate = 1.0,
      pitch = 1.0,
      volume = 1.0,
      onStart = null,
      onEnd = null,
      onError = null,
    } = options;

    // Stop any current speech
    this.stop();

    if (!text || text.trim().length === 0) {
      return;
    }

    // Clean text for better speech
    const cleanedText = this.cleanTextForSpeech(text);

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      
      // Set voice
      this.selectVoice(language).then(voice => {
        utterance.voice = voice;
        utterance.lang = language === 'ur' ? 'ur-PK' : 'en-US';
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        utterance.onstart = () => {
          this.isSpeaking = true;
          this.currentUtterance = utterance;
          if (onStart) onStart();
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          this.currentUtterance = null;
          if (onEnd) onEnd();
          resolve();
        };

        utterance.onerror = (event) => {
          this.isSpeaking = false;
          this.currentUtterance = null;
          if (onError) onError(event);
          reject(event);
        };

        this.synth.speak(utterance);
      });
    });
  }

  /**
   * Stop current speech
   */
  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  /**
   * Pause current speech
   */
  pause() {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Clean text for better speech output
   */
  cleanTextForSpeech(text) {
    return text
      // Remove markdown formatting
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/#+\s/g, '')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '[code block]')
      .replace(/`[^`]+`/g, 'code')
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, 'link')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if browser supports speech synthesis
   */
  isSupported() {
    return 'speechSynthesis' in window;
  }

  /**
   * Get speaking status
   */
  getSpeakingStatus() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.synth.paused,
      isSupported: this.isSupported(),
    };
  }
}

// Create singleton instance
const ttsService = new TTSService();

export default ttsService;
