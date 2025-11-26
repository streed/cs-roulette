const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

describe('ElevenLabsService', () => {
  let ElevenLabsService;
  let service;

  beforeEach(() => {
    delete require.cache[require.resolve('../src/services/elevenLabsService')];
    ElevenLabsService = require('../src/services/elevenLabsService');
    service = new ElevenLabsService();
  });

  describe('constructor', () => {
    it('should initialize with base URL', () => {
      assert.strictEqual(service.baseUrl, 'https://api.elevenlabs.io/v1');
    });

    it('should have a voice ID', () => {
      assert.ok(service.voiceId);
    });
  });

  describe('textToSpeech', () => {
    it('should throw error when API key is not configured', async () => {
      // Ensure no API key is set
      service.apiKey = null;
      
      await assert.rejects(
        async () => await service.textToSpeech('test'),
        /ElevenLabs API key is not configured/
      );
    });
  });

  describe('getVoices', () => {
    it('should throw error when API key is not configured', async () => {
      service.apiKey = null;
      
      await assert.rejects(
        async () => await service.getVoices(),
        /ElevenLabs API key is not configured/
      );
    });
  });
});
