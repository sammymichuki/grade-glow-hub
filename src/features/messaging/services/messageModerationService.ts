import { ModerationResult } from '../types/messaging';

const PII_PHONE_PATTERN = /\+?\d(?:[\s.-]?\d){8,}/;
const PII_EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PII_ADDRESS_PATTERN = /\b(?:p\.?o\.?\s*box|road\s+\d+|street\s+\d+|apartment\s+\d+)\b/i;
const PROFANITY_PATTERN = /\b(idiot|stupid|shut\s+up|loser|damn|crap|hate\s+you)\b/i;
const THREAT_PATTERN = /\b(kill|hurt|fight|beat\s+you|threat)\w*\b/i;

/**
 * Independent child-safety moderation for parent–instructor messaging.
 * Runs PII detection first (hard block, nothing is redacted and re-sent),
 * then threat and profanity blocklists before allowing a message through.
 */
export function moderateMessage(text: string): ModerationResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { isAllowed: false, category: 'clean', sanitized: '', advisory: 'Message cannot be empty.' };
  }

  if (PII_PHONE_PATTERN.test(trimmed) || PII_EMAIL_PATTERN.test(trimmed) || PII_ADDRESS_PATTERN.test(trimmed)) {
    return {
      isAllowed: false,
      category: 'pii_leak',
      sanitized: '[redacted]',
      advisory: 'Personal details were detected. Phone numbers, emails and addresses are blocked in this channel.',
    };
  }

  if (THREAT_PATTERN.test(trimmed)) {
    return {
      isAllowed: false,
      category: 'threat',
      sanitized: trimmed.replace(THREAT_PATTERN, '***'),
      advisory: 'This message was blocked by the safety filter. Please rephrase respectfully.',
    };
  }

  if (PROFANITY_PATTERN.test(trimmed)) {
    return {
      isAllowed: false,
      category: 'profanity',
      sanitized: trimmed.replace(PROFANITY_PATTERN, '***'),
      advisory: 'Please keep this conversation respectful and academic.',
    };
  }

  return { isAllowed: true, category: 'clean', sanitized: trimmed };
}
