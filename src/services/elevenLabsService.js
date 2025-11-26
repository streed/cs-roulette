const axios = require('axios');
const config = require('../config');

// ElevenLabs model configuration
const DEFAULT_MODEL_ID = 'eleven_monolingual_v1';

/**
 * Service for interacting with ElevenLabs API for text-to-speech
 */
class ElevenLabsService {
  constructor() {
    this.apiKey = config.elevenlabs.apiKey;
    this.voiceId = config.elevenlabs.voiceId;
    this.modelId = config.elevenlabs.modelId || DEFAULT_MODEL_ID;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  /**
   * Convert text to speech using ElevenLabs API
   * @param {string} text - The text to convert to speech
   * @returns {Promise<Buffer>} Audio buffer in MP3 format
   */
  async textToSpeech(text) {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key is not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${this.voiceId}`,
        {
          text: text,
          model_id: this.modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          responseType: 'arraybuffer',
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error calling ElevenLabs API:', error.message);
      throw error;
    }
  }

  /**
   * Get available voices from ElevenLabs
   * @returns {Promise<Array>} Array of available voices
   */
  async getVoices() {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key is not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      return response.data.voices;
    } catch (error) {
      console.error('Error fetching voices from ElevenLabs:', error.message);
      throw error;
    }
  }
}

module.exports = ElevenLabsService;
