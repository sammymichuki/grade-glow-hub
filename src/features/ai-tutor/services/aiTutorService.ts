import {
  GlowBotMessage,
  SocraticContext,
  SocraticMode,
  SafetyCheckResult,
} from '../types/aiTutor';

// Basic safety blocklist and PII patterns for K-12 COPPA compliance
const PROFANITY_PATTERN = /\b(damn|hell|crap|idiot|stupid|hate|kill|die|shut up)\b/i;
const PII_PHONE_PATTERN = /(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3}[\s-]?\d{3,4}\b/;
const PII_EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

export interface TutorSessionStats {
  messageCount: number;
  tokensUsed: number;
  hintsDelivered: number;
  safetyAlerts: number;
  maxTokens: number;
}

export class AiTutorService {
  private static readonly STORAGE_KEY = 'gradeglow_glowbot_history';
  private static readonly MAX_SESSION_TOKENS = 4000;
  private static tokenCount = 0;

  /**
   * Evaluates input message against Child-Safety & COPPA guidelines
   */
  public static checkSafety(text: string): SafetyCheckResult {
    // 1. Check for PII leaks (phone numbers, emails)
    if (PII_PHONE_PATTERN.test(text) || PII_EMAIL_PATTERN.test(text)) {
      return {
        isSafe: false,
        category: 'pii_leak',
        sanitizedContent: '[Personal info redacted for child safety]',
        advisory: 'Safety notice: Never share phone numbers or email addresses in study chats.',
      };
    }

    // 2. Check for toxic / profanity words
    if (PROFANITY_PATTERN.test(text)) {
      return {
        isSafe: false,
        category: 'profanity',
        sanitizedContent: text.replace(PROFANITY_PATTERN, '***'),
        advisory: 'Notice: Please keep discussions respectful and academic.',
      };
    }

    // 3. Non-academic / gaming distraction filter
    const nonAcademicPattern = /\b(fortnite|minecraft|tiktok|roblox|vbucks|playstation|xbox)\b/i;
    if (nonAcademicPattern.test(text)) {
      return {
        isSafe: true,
        category: 'off_topic',
        sanitizedContent: text,
        advisory: 'Academic reminder: Let us focus our attention on your current study module.',
      };
    }

    return {
      isSafe: true,
      category: 'clean',
      sanitizedContent: text,
    };
  }

  /**
   * Generates a Socratic pedagogical response that guides without spoon-feeding
   */
  public static async askGlowBot(
    userQuery: string,
    context: SocraticContext,
    mode: SocraticMode = 'hint'
  ): Promise<GlowBotMessage> {
    const safety = this.checkSafety(userQuery);

    if (!safety.isSafe && safety.category === 'pii_leak') {
      return {
        id: `glowbot-${Date.now()}`,
        role: 'assistant',
        content: `🔒 Child Safety Shield: ${safety.advisory} How can I help you with your ${context.subject} problem instead?`,
        timestamp: Date.now(),
        safetyFlagged: true,
      };
    }

    // Token estimation
    const queryTokens = Math.ceil(userQuery.length / 4) + 60;
    this.tokenCount += queryTokens;

    const lowerQuery = userQuery.toLowerCase();

    // Socratic response logic
    let content = '';
    let quickPrompts: string[] = [];
    let suggestedSteps: string[] = [];
    let conceptTags: string[] = [context.subject, context.topic];

    if (safety.category === 'off_topic') {
      content = `🎮 That sounds like fun during break time! But right now in **${context.subject}**, let's conquer **${context.topic}**. Where are you stuck on this assignment?`;
      quickPrompts = ['Explain the core concept', 'Give me a simple hint', 'Show a real-world example'];
    } else if (mode === 'counter-example') {
      content = `🤔 Great thought! Let's test that hypothesis: What would happen if the value was zero or negative? Does that rule still hold true in ${context.topic}?`;
      quickPrompts = ['I see the contradiction!', 'Can you show me why?', 'Let me rethink my formula'];
    } else if (mode === 'reflection') {
      content = `✨ Outstanding work walking through that step. In your own words, what was the most critical rule you applied here that solved the problem?`;
      quickPrompts = ['Order of operations', 'Conservation of energy', 'Topic sentence connection'];
    } else if (lowerQuery.includes('fraction') || context.topic.toLowerCase().includes('fraction')) {
      content = `📐 Fractions represent parts of a whole. Remember: before we can add or subtract them, what property must the denominators (bottom numbers) share?`;
      suggestedSteps = [
        'Find the Least Common Denominator (LCD)',
        'Convert both fractions to have matching denominators',
        'Add or subtract the numerators only',
        'Simplify the final fraction to lowest terms',
      ];
      quickPrompts = ['How do I find the LCD?', 'What if the denominators are already the same?', 'Let me try step 1'];
      conceptTags.push('Fractions', 'LCD', 'Arithmetic');
    } else if (lowerQuery.includes('photosynthesis') || context.topic.toLowerCase().includes('plant') || context.topic.toLowerCase().includes('photosynthesis')) {
      content = `🌱 Let's think like a botanist! Inside plant cell Chloroplasts, photosynthesis acts like a green solar kitchen. It needs 3 ingredients to bake food (glucose). Can you name the gas and liquid it takes in from its environment?`;
      suggestedSteps = [
        'Identify the raw inputs: Sunlight, Carbon Dioxide ($CO_2$), and Water ($H_2O$)',
        'Locate the factory organelle: Chloroplasts with Chlorophyll pigments',
        'Examine the outputs: Glucose ($C_6H_{12}O_6$) and Oxygen ($O_2$)',
      ];
      quickPrompts = ['What does chlorophyll do?', 'Why do leaves look green?', 'What happens at night?'];
      conceptTags.push('Biology', 'Photosynthesis', 'Chloroplasts');
    } else if (lowerQuery.includes('essay') || lowerQuery.includes('paragraph') || context.subject.toLowerCase().includes('english')) {
      content = `✍️ Great writing starts with a strong backbone! A solid paragraph follows the **P.E.E.L.** structure: Point, Evidence, Explanation, Link. Which of these parts would you like to strengthen first in your draft?`;
      suggestedSteps = [
        'Point: State your main argument clearly in the first sentence',
        'Evidence: Cite a fact, quote, or specific observation',
        'Explanation: Break down why this evidence supports your point',
        'Link: Tie this thought back to the broader essay thesis',
      ];
      quickPrompts = ['How do I write a hook?', 'Give me transition word examples', 'Review my thesis statement'];
      conceptTags.push('Writing', 'Thesis', 'Composition');
    } else if (mode === 'scaffold') {
      content = `🪜 Let's take this one manageable piece at a time for **${context.topic}**:\n\n1. What information or numbers are already given to you in the prompt?\n2. What is the specific question asking you to find?\n\nTell me what you have so far!`;
      quickPrompts = ['Here are the numbers I have', 'I am not sure what is being asked', 'Show me an example first'];
    } else {
      content = `💡 Here is a conceptual hint for **${context.topic}**: Look closely at the relationship between the inputs and outputs. If you break the problem into two smaller parts, what is the first step you can compute?`;
      quickPrompts = ['Break it into smaller steps', 'Give me another hint', 'Is my current answer close?'];
    }

    const message: GlowBotMessage = {
      id: `glowbot-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
      socraticMode: mode,
      conceptTags,
      quickPrompts,
      suggestedSteps: suggestedSteps.length > 0 ? suggestedSteps : undefined,
    };

    this.persistMessage(message);
    return message;
  }

  /**
   * Persists message to local browser cache
   */
  public static persistMessage(msg: GlowBotMessage): void {
    try {
      const existing = this.loadHistory();
      const updated = [...existing, msg].slice(-40); // keep last 40 messages
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // LocalStorage may fail in private mode or quota exceeded
    }
  }

  /**
   * Loads persisted conversation history
   */
  public static loadHistory(): GlowBotMessage[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Clears session chat history
   */
  public static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.tokenCount = 0;
    } catch {
      // ignore
    }
  }

  /**
   * Returns session telemetry statistics
   */
  public static getSessionStats(): TutorSessionStats {
    const history = this.loadHistory();
    return {
      messageCount: history.length,
      tokensUsed: this.tokenCount,
      hintsDelivered: history.filter(m => m.role === 'assistant').length,
      safetyAlerts: history.filter(m => m.safetyFlagged).length,
      maxTokens: this.MAX_SESSION_TOKENS,
    };
  }
}
