const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

// Mock axios before requiring the service
const originalAxios = require('axios');

describe('OllamaService', () => {
  let OllamaService;
  let service;

  beforeEach(() => {
    // Clear cache to reload the module
    delete require.cache[require.resolve('../src/services/ollamaService')];
    OllamaService = require('../src/services/ollamaService');
    service = new OllamaService();
  });

  describe('constructor', () => {
    it('should initialize with default host', () => {
      assert.ok(service.host);
    });

    it('should initialize with default model', () => {
      assert.ok(service.model);
    });
  });

  describe('getFallbackStrategy', () => {
    it('should return a string', () => {
      const strategy = service.getFallbackStrategy();
      assert.strictEqual(typeof strategy, 'string');
    });

    it('should return a non-empty strategy', () => {
      const strategy = service.getFallbackStrategy();
      assert.ok(strategy.length > 0);
    });

    it('should return different strategies over multiple calls (randomness)', () => {
      const strategies = new Set();
      // Run multiple times to test randomness
      for (let i = 0; i < 50; i++) {
        strategies.add(service.getFallbackStrategy());
      }
      // Should have at least 2 different strategies
      assert.ok(strategies.size >= 2, 'Should return multiple different strategies');
    });
  });

  describe('generateStrategy', () => {
    it('should return a fallback strategy when Ollama is unavailable', async () => {
      // This will fail to connect to Ollama and should return a fallback
      const strategy = await service.generateStrategy();
      assert.strictEqual(typeof strategy, 'string');
      assert.ok(strategy.length > 0);
    });
  });
});
