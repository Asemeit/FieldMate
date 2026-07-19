const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 80;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= MIN_NAME_LENGTH && trimmed.length <= MAX_NAME_LENGTH;
}

export function validationMessage(
  code: 'INVALID_EMAIL' | 'INVALID_PASSWORD' | 'INVALID_NAME' | 'INVALID_INPUT',
  language: 'en' | 'sw'
): string {
  const messages = {
    INVALID_EMAIL: {
      en: 'Enter a valid email address (e.g. name@gmail.com).',
      sw: 'Weka barua pepe sahihi (mf. jina@gmail.com).',
    },
    INVALID_PASSWORD: {
      en: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      sw: `Nenosiri lazima liwe na angalau herufi ${MIN_PASSWORD_LENGTH}.`,
    },
    INVALID_NAME: {
      en: `Name must be ${MIN_NAME_LENGTH}–${MAX_NAME_LENGTH} characters.`,
      sw: `Jina lazima liwe na herufi ${MIN_NAME_LENGTH}–${MAX_NAME_LENGTH}.`,
    },
    INVALID_INPUT: {
      en: 'Please fill all fields correctly.',
      sw: 'Jaza taarifa zote kwa usahihi.',
    },
  };
  return messages[code][language];
}
