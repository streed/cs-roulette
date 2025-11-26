const axios = require('axios');
const config = require('../config');

/**
 * Service for interacting with Ollama API to generate CS roulette strategies
 */
class OllamaService {
  constructor() {
    this.host = config.ollama.host;
    this.model = config.ollama.model;
  }

  /**
   * Generate a CS roulette strategy using Ollama
   * @returns {Promise<string>} The generated strategy
   */
  async generateStrategy() {
    const prompt = `You are a Counter-Strike tactical advisor. Generate a fun and creative "CS Roulette" strategy for a team. 
    
A CS Roulette strategy is a challenge or unconventional playstyle that teams can use for fun. Examples include:
- "Pistols only round"
- "Everyone buys a shotgun and rushes B"
- "Stack all 5 players in one smoke"
- "Only Zeus and knife"
- "Everyone plays with inverted mouse"

Generate ONE short, fun, and playable CS roulette strategy. Keep the response to 1-2 sentences maximum. Be creative but keep it achievable in a real game. Just give the strategy, no introduction or explanation needed.`;

    try {
      const response = await axios.post(`${this.host}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.9,
          top_p: 0.9,
        },
      });

      return response.data.response.trim();
    } catch (error) {
      console.error('Error generating strategy from Ollama:', error.message);
      // Fallback strategies if Ollama is unavailable
      return this.getFallbackStrategy();
    }
  }

  /**
   * Get a random fallback strategy if Ollama is unavailable
   * @returns {string} A random fallback strategy
   */
  getFallbackStrategy() {
    const fallbackStrategies = [
      'Everyone buys Negevs and holds W key rushing the bomb site!',
      'Pistols only round - may the best aim win!',
      'All five players stack into one smoke and pop out together!',
      'Zeus and knife only - become the electrical ninjas!',
      'Everyone buys a Scout and goes for jumping headshots only!',
      'Decoy grenades only for utility - confuse the enemy!',
      'All players must stay crouched the entire round!',
      'Shotgun rush through mid - no stopping allowed!',
      'Everyone plays with their monitors turned off for 10 seconds at round start!',
      'Spin in a circle three times before peeking any angle!',
    ];
    
    return fallbackStrategies[Math.floor(Math.random() * fallbackStrategies.length)];
  }
}

module.exports = OllamaService;
