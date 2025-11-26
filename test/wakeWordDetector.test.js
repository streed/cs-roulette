const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

describe('WakeWordDetector', () => {
  let WakeWordDetector;
  let detector;
  let callbackCalled;

  beforeEach(() => {
    delete require.cache[require.resolve('../src/services/wakeWordDetector')];
    WakeWordDetector = require('../src/services/wakeWordDetector');
    callbackCalled = false;
    detector = new WakeWordDetector(() => {
      callbackCalled = true;
    });
  });

  describe('constructor', () => {
    it('should initialize with wake word', () => {
      assert.strictEqual(detector.wakeWord, 'cs roulette');
    });

    it('should initialize with callback', () => {
      assert.ok(detector.onWakeWordDetected);
    });

    it('should start with no listening streams', () => {
      assert.strictEqual(detector.listeningStreams.size, 0);
    });

    it('should start with cooldown disabled', () => {
      assert.strictEqual(detector.cooldown, false);
    });
  });

  describe('detectVoiceActivity', () => {
    it('should detect high activity audio', () => {
      // Create a buffer with high amplitude samples
      const buffer = Buffer.alloc(48000);
      const samples = new Int16Array(buffer.buffer);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.sin(i * 0.1) * 10000; // High amplitude sine wave
      }
      
      const hasActivity = detector.detectVoiceActivity(Buffer.from(buffer));
      assert.strictEqual(hasActivity, true);
    });

    it('should not detect silence', () => {
      // Create a buffer with near-zero samples
      const buffer = Buffer.alloc(48000);
      const samples = new Int16Array(buffer.buffer);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.random() * 10 - 5; // Very low amplitude noise
      }
      
      const hasActivity = detector.detectVoiceActivity(Buffer.from(buffer));
      assert.strictEqual(hasActivity, false);
    });
  });

  describe('triggerWakeWord', () => {
    it('should call the callback when triggered', () => {
      detector.triggerWakeWord();
      assert.strictEqual(callbackCalled, true);
    });

    it('should set cooldown after trigger', () => {
      detector.triggerWakeWord();
      assert.strictEqual(detector.cooldown, true);
    });

    it('should not call callback during cooldown', () => {
      detector.triggerWakeWord();
      callbackCalled = false;
      detector.triggerWakeWord();
      assert.strictEqual(callbackCalled, false);
    });
  });

  describe('stopAll', () => {
    it('should clear all listening streams', () => {
      // Manually add some entries to test via internal state for setup
      // This is acceptable for test setup as we need to simulate state
      detector.listeningStreams.set('user1', { audioStream: { destroy: () => {} }, decodedStream: { destroy: () => {} } });
      detector.listeningStreams.set('user2', { audioStream: { destroy: () => {} }, decodedStream: { destroy: () => {} } });
      
      // Verify initial state using public method
      assert.strictEqual(detector.getActiveListenerCount(), 2);
      
      detector.stopAll();
      
      // Verify using public method
      assert.strictEqual(detector.getActiveListenerCount(), 0);
    });
  });

  describe('getActiveListenerCount', () => {
    it('should return 0 when no listeners are active', () => {
      assert.strictEqual(detector.getActiveListenerCount(), 0);
    });
  });
});
