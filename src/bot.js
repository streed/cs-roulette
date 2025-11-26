const { Client, GatewayIntentBits, Events, SlashCommandBuilder, REST, Routes, ChannelType } = require('discord.js');
const config = require('./config');
const VoiceHandler = require('./services/voiceHandler');
const WakeWordDetector = require('./services/wakeWordDetector');

class CSRouletteBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.voiceHandler = new VoiceHandler();
    this.wakeWordDetector = null;
    this.currentChannel = null;

    this.setupEventHandlers();
  }

  /**
   * Set up Discord event handlers
   */
  setupEventHandlers() {
    this.client.once(Events.ClientReady, (client) => {
      console.log(`CS Roulette Bot is ready! Logged in as ${client.user.tag}`);
      this.registerCommands();
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await this.handleCommand(interaction);
    });

    // Listen for text messages containing the wake word
    this.client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;
      
      const content = message.content.toLowerCase();
      if (content.includes(config.wakeWord)) {
        console.log(`Wake word detected in text message from ${message.author.tag}`);
        
        // Check if bot is in a voice channel
        if (this.voiceHandler.isConnected()) {
          await this.voiceHandler.handleWakeWord();
        } else if (message.member?.voice?.channel) {
          // Auto-join the user's voice channel if not connected
          await this.joinChannel(message.member.voice.channel);
          await this.voiceHandler.handleWakeWord();
        } else {
          await message.reply('Please join a voice channel first, then type "cs roulette" or use /join to have me join your channel!');
        }
      }
    });

    // Handle voice state updates
    this.client.on(Events.VoiceStateUpdate, (oldState, newState) => {
      // If the bot is in a channel and someone joins/leaves
      if (this.currentChannel) {
        const channel = this.client.channels.cache.get(this.currentChannel);
        
        // If someone joins the channel the bot is in
        if (newState.channelId === this.currentChannel && !newState.member.user.bot) {
          console.log(`User ${newState.member.user.tag} joined the channel`);
          if (this.wakeWordDetector && this.voiceHandler.connection) {
            this.wakeWordDetector.startListening(this.voiceHandler.connection, newState.member.user.id);
          }
        }
        
        // If someone leaves the channel the bot is in
        if (oldState.channelId === this.currentChannel && !oldState.member.user.bot) {
          console.log(`User ${oldState.member.user.tag} left the channel`);
          if (this.wakeWordDetector) {
            this.wakeWordDetector.stopListening(oldState.member.user.id);
          }
        }
        
        // If the bot is alone in the channel (only bot remains)
        if (channel && channel.members.filter(m => !m.user.bot).size === 0) {
          console.log('No users left in channel, leaving...');
          this.leaveChannel();
        }
      }
    });
  }

  /**
   * Register slash commands
   */
  async registerCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join your current voice channel'),
      new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Leave the current voice channel'),
      new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Generate a CS Roulette strategy'),
    ].map(command => command.toJSON());

    try {
      const rest = new REST({ version: '10' }).setToken(config.discord.token);
      console.log('Registering slash commands...');
      
      await rest.put(Routes.applicationCommands(config.discord.clientId), { body: commands });
      
      console.log('Slash commands registered successfully!');
    } catch (error) {
      console.error('Error registering commands:', error);
    }
  }

  /**
   * Handle slash commands
   */
  async handleCommand(interaction) {
    const { commandName } = interaction;

    switch (commandName) {
      case 'join':
        await this.handleJoinCommand(interaction);
        break;
      case 'leave':
        await this.handleLeaveCommand(interaction);
        break;
      case 'roulette':
        await this.handleRouletteCommand(interaction);
        break;
      default:
        await interaction.reply({ content: 'Unknown command!', ephemeral: true });
    }
  }

  /**
   * Handle /join command
   */
  async handleJoinCommand(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      await interaction.reply({ content: 'You need to be in a voice channel first!', ephemeral: true });
      return;
    }

    try {
      await interaction.deferReply();
      await this.joinChannel(voiceChannel);
      await interaction.editReply(`Joined ${voiceChannel.name}! Say "cs roulette" to get a strategy!`);
    } catch (error) {
      console.error('Error joining channel:', error);
      await interaction.editReply('Failed to join the voice channel.');
    }
  }

  /**
   * Handle /leave command
   */
  async handleLeaveCommand(interaction) {
    if (!this.voiceHandler.isConnected()) {
      await interaction.reply({ content: 'I\'m not in a voice channel!', ephemeral: true });
      return;
    }

    this.leaveChannel();
    await interaction.reply('Left the voice channel!');
  }

  /**
   * Handle /roulette command
   */
  async handleRouletteCommand(interaction) {
    await interaction.deferReply();

    try {
      // Generate strategy
      const strategy = await this.voiceHandler.ollamaService.generateStrategy();
      
      // If in voice channel, also speak it
      if (this.voiceHandler.isConnected()) {
        const announcement = `CS Roulette says: ${strategy}`;
        const audioBuffer = await this.voiceHandler.elevenLabsService.textToSpeech(announcement);
        await this.voiceHandler.playAudio(audioBuffer);
      }

      await interaction.editReply(`🎰 **CS Roulette Strategy:**\n${strategy}`);
    } catch (error) {
      console.error('Error generating strategy:', error);
      await interaction.editReply('Failed to generate a strategy. Please try again!');
    }
  }

  /**
   * Join a voice channel
   */
  async joinChannel(channel) {
    await this.voiceHandler.joinChannel(channel);
    this.currentChannel = channel.id;

    // Initialize wake word detector
    this.wakeWordDetector = new WakeWordDetector(() => {
      this.voiceHandler.handleWakeWord();
    });

    // Start listening to all users already in the channel
    for (const [memberId, member] of channel.members) {
      if (!member.user.bot) {
        this.wakeWordDetector.startListening(this.voiceHandler.connection, memberId);
      }
    }
  }

  /**
   * Leave the current voice channel
   */
  leaveChannel() {
    if (this.wakeWordDetector) {
      this.wakeWordDetector.stopAll();
      this.wakeWordDetector = null;
    }
    this.voiceHandler.leaveChannel();
    this.currentChannel = null;
  }

  /**
   * Start the bot
   */
  async start() {
    if (!config.discord.token) {
      console.error('Discord token is not configured! Please set DISCORD_TOKEN in your .env file.');
      process.exit(1);
    }

    try {
      await this.client.login(config.discord.token);
    } catch (error) {
      console.error('Failed to login:', error);
      process.exit(1);
    }
  }
}

// Create and start the bot
const bot = new CSRouletteBot();
bot.start();

module.exports = CSRouletteBot;
