const { EndBehaviorType } = require('@discordjs/voice');
const prism = require('prism-media');
const config = require('../config');

// Audio configuration constants
const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const BYTES_PER_SAMPLE = 2;
const BUFFER_DURATION_SECONDS = 1;
const VOICE_ACTIVITY_THRESHOLD = 0.02;

/**
 * Service for detecting the wake word in voice audio
 * Uses simple audio activity detection as a trigger mechanism
 */
class WakeWordDetector {
  constructor(onWakeWordDetected) {
    this.wakeWord = config.wakeWord;
    this.onWakeWordDetected = onWakeWordDetected;
    this.listeningStreams = new Map();
    this.cooldown = false;
    this.cooldownTime = 5000; // 5 second cooldown between detections
  }

  /**
   * Start listening for voice activity from a user
   * @param {VoiceConnection} connection - The voice connection
   * @param {string} userId - The user ID to listen to
   */
  startListening(connection, userId) {
    if (this.listeningStreams.has(userId)) {
      return;
    }

    try {
      const receiver = connection.receiver;
      
      // Create an audio stream for the user
      const audioStream = receiver.subscribe(userId, {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 1000,
        },
      });

      // Create an Opus decoder
      const opusDecoder = new prism.opus.Decoder({
        rate: SAMPLE_RATE,
        channels: CHANNELS,
        frameSize: 960,
      });

      // Pipe audio through decoder
      const decodedStream = audioStream.pipe(opusDecoder);

      // Buffer to store audio samples
      let audioBuffer = Buffer.alloc(0);
      const bufferThreshold = SAMPLE_RATE * CHANNELS * BYTES_PER_SAMPLE * BUFFER_DURATION_SECONDS;

      decodedStream.on('data', (chunk) => {
        audioBuffer = Buffer.concat([audioBuffer, chunk]);
        
        // Simple voice activity detection
        // Check if there's significant audio activity
        if (audioBuffer.length > bufferThreshold) {
          const hasActivity = this.detectVoiceActivity(audioBuffer);
          if (hasActivity && !this.cooldown) {
            this.triggerWakeWord();
          }
          audioBuffer = Buffer.alloc(0);
        }
      });

      decodedStream.on('end', () => {
        console.log(`Audio stream ended for user: ${userId}`);
        this.listeningStreams.delete(userId);
      });

      decodedStream.on('error', (error) => {
        console.error(`Audio stream error for user ${userId}:`, error);
        this.listeningStreams.delete(userId);
      });

      this.listeningStreams.set(userId, { audioStream, decodedStream });
      console.log(`Started listening to user: ${userId}`);
    } catch (error) {
      console.error('Error starting listener:', error);
    }
  }

  /**
   * Stop listening to a specific user
   * @param {string} userId - The user ID to stop listening to
   */
  stopListening(userId) {
    const streams = this.listeningStreams.get(userId);
    if (streams) {
      streams.audioStream.destroy();
      streams.decodedStream.destroy();
      this.listeningStreams.delete(userId);
      console.log(`Stopped listening to user: ${userId}`);
    }
  }

  /**
   * Stop listening to all users
   */
  stopAll() {
    for (const [userId] of this.listeningStreams) {
      this.stopListening(userId);
    }
  }

  /**
   * Get the number of active listening streams
   * @returns {number} The count of active listeners
   */
  getActiveListenerCount() {
    return this.listeningStreams.size;
  }

  /**
   * Simple voice activity detection
   * @param {Buffer} audioBuffer - The audio buffer to analyze
   * @returns {boolean} True if voice activity is detected
   */
  detectVoiceActivity(audioBuffer) {
    // Calculate RMS (Root Mean Square) of the audio samples
    let sumSquares = 0;
    const samples = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 2);
    
    for (let i = 0; i < samples.length; i++) {
      const normalized = samples[i] / 32768;
      sumSquares += normalized * normalized;
    }
    
    const rms = Math.sqrt(sumSquares / samples.length);
    
    // Threshold for voice activity
    return rms > VOICE_ACTIVITY_THRESHOLD;
  }

  /**
   * Trigger the wake word callback with cooldown
   */
  triggerWakeWord() {
    if (this.cooldown) return;
    
    this.cooldown = true;
    console.log('Voice activity detected - triggering wake word handler');
    
    if (this.onWakeWordDetected) {
      this.onWakeWordDetected();
    }

    // Reset cooldown after delay
    setTimeout(() => {
      this.cooldown = false;
    }, this.cooldownTime);
  }
}

module.exports = WakeWordDetector;
