# CS Roulette Discord Bot

A Discord bot that listens to voice channels and generates fun Counter-Strike roulette strategies using AI. Say "cs roulette" in a voice channel or text chat, and the bot will generate and announce a creative CS strategy!

## Features

- **Voice Channel Integration**: Join voice channels and listen for the wake word
- **Wake Word Detection**: Responds to "cs roulette" in both voice and text
- **AI-Powered Strategies**: Uses Ollama (local LLM) to generate creative CS roulette strategies
- **Text-to-Speech**: Uses ElevenLabs API to speak strategies in voice channels
- **Slash Commands**: Easy-to-use Discord slash commands

## Commands

- `/join` - Join your current voice channel
- `/leave` - Leave the current voice channel
- `/roulette` - Generate a CS Roulette strategy (works in text channels too)

## Prerequisites

- Node.js 18 or higher
- A Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- ElevenLabs API Key (from [ElevenLabs](https://elevenlabs.io/))
- Ollama running locally (from [Ollama](https://ollama.ai/))

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/streed/cs-roulette.git
   cd cs-roulette
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment example and configure:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your credentials:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   DISCORD_CLIENT_ID=your_discord_client_id
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ELEVENLABS_VOICE_ID=your_preferred_voice_id
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=llama2
   ```

5. Make sure Ollama is running:
   ```bash
   ollama serve
   ```

6. Start the bot:
   ```bash
   npm start
   ```

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Copy the token and add it to your `.env` file
5. Enable the following intents:
   - Message Content Intent
   - Server Members Intent (optional)
6. Go to OAuth2 > URL Generator
7. Select scopes: `bot`, `applications.commands`
8. Select permissions: `Connect`, `Speak`, `Send Messages`, `Use Slash Commands`
9. Use the generated URL to invite the bot to your server

## How It Works

1. **Join a Voice Channel**: Use `/join` or type "cs roulette" while in a voice channel
2. **Trigger the Bot**: Say or type "cs roulette"
3. **Get a Strategy**: The bot generates a fun strategy using Ollama and announces it in the voice channel using ElevenLabs TTS

## Example Strategies

- "Everyone buys Negevs and holds W key rushing the bomb site!"
- "Pistols only round - may the best aim win!"
- "All five players stack into one smoke and pop out together!"
- "Zeus and knife only - become the electrical ninjas!"

## Fallback Mode

If Ollama is unavailable, the bot will use a set of pre-defined fallback strategies to ensure it always responds.

## License

ISC