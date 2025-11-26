const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const OllamaService = require('./ollamaService');
const ElevenLabsService = require('./elevenLabsService');

/**
 * Handler for voice channel operations
 */
class VoiceHandler {
  constructor() {
    this.connection = null;
    this.audioPlayer = createAudioPlayer();
    this.ollamaService = new OllamaService();
    this.elevenLabsService = new ElevenLabsService();
    this.isProcessing = false;

    // Set up audio player event listeners
    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      console.log('Audio player is idle');
    });

    this.audioPlayer.on('error', (error) => {
      console.error('Audio player error:', error);
    });
  }

  /**
   * Join a voice channel
   * @param {VoiceChannel} channel - The voice channel to join
   * @returns {Promise<VoiceConnection>} The voice connection
   */
  async joinChannel(channel) {
    try {
      this.connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });

      // Wait for the connection to be ready
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
      
      // Subscribe the connection to the audio player
      this.connection.subscribe(this.audioPlayer);
      
      console.log(`Joined voice channel: ${channel.name}`);
      return this.connection;
    } catch (error) {
      console.error('Error joining voice channel:', error);
      this.connection?.destroy();
      this.connection = null;
      throw error;
    }
  }

  /**
   * Leave the current voice channel
   */
  leaveChannel() {
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
      console.log('Left voice channel');
    }
  }

  /**
   * Handle wake word detection and play strategy
   */
  async handleWakeWord() {
    if (this.isProcessing) {
      console.log('Already processing a request, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      console.log('Wake word detected! Generating strategy...');
      
      // Generate a CS roulette strategy
      const strategy = await this.ollamaService.generateStrategy();
      console.log('Generated strategy:', strategy);

      // Announce the strategy
      const announcement = `CS Roulette says: ${strategy}`;
      
      // Convert to speech using ElevenLabs
      const audioBuffer = await this.elevenLabsService.textToSpeech(announcement);
      
      // Play the audio
      await this.playAudio(audioBuffer);
      
    } catch (error) {
      console.error('Error handling wake word:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Play audio buffer in the voice channel
   * @param {Buffer} audioBuffer - The audio buffer to play
   */
  async playAudio(audioBuffer) {
    if (!this.connection) {
      console.error('Not connected to a voice channel');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Create a readable stream from the buffer
        const audioStream = Readable.from(audioBuffer);
        
        // Create an audio resource from the stream
        const resource = createAudioResource(audioStream, {
          inputType: 'arbitrary',
        });

        // Play the audio
        this.audioPlayer.play(resource);

        // Wait for the audio to finish playing
        this.audioPlayer.once(AudioPlayerStatus.Idle, () => {
          console.log('Finished playing audio');
          resolve();
        });

        this.audioPlayer.once('error', (error) => {
          console.error('Error playing audio:', error);
          reject(error);
        });
      } catch (error) {
        console.error('Error creating audio resource:', error);
        reject(error);
      }
    });
  }

  /**
   * Check if connected to a voice channel
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.connection !== null && 
           this.connection.state.status === VoiceConnectionStatus.Ready;
  }
}

module.exports = VoiceHandler;
