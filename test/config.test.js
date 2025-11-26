const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

describe('Config', () => {
  let config;

  beforeEach(() => {
    delete require.cache[require.resolve('../src/config')];
    config = require('../src/config');
  });

  describe('structure', () => {
    it('should have discord configuration', () => {
      assert.ok(config.discord);
      assert.ok('token' in config.discord);
      assert.ok('clientId' in config.discord);
    });

    it('should have elevenlabs configuration', () => {
      assert.ok(config.elevenlabs);
      assert.ok('apiKey' in config.elevenlabs);
      assert.ok('voiceId' in config.elevenlabs);
      assert.ok('modelId' in config.elevenlabs);
    });

    it('should have ollama configuration', () => {
      assert.ok(config.ollama);
      assert.ok('host' in config.ollama);
      assert.ok('model' in config.ollama);
    });

    it('should have wake word', () => {
      assert.strictEqual(config.wakeWord, 'cs roulette');
    });
  });

  describe('defaults', () => {
    it('should have default ElevenLabs voice ID', () => {
      assert.ok(config.elevenlabs.voiceId);
    });

    it('should have default Ollama host', () => {
      assert.strictEqual(config.ollama.host, 'http://localhost:11434');
    });

    it('should have default Ollama model', () => {
      assert.strictEqual(config.ollama.model, 'llama2');
    });
  });
});
