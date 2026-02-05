/**
 * Utility functions for processing Georgian text for the Essential Phrases level
 */

/**
 * Extracts individual words from a Georgian sentence
 * @param sentence - The Georgian sentence to split
 * @returns Array of words
 */
export function extractWordsFromGeorgian(sentence: string): string[] {
  if (!sentence || typeof sentence !== 'string') {
    return [];
  }

  // Split by whitespace and filter out empty strings
  return sentence
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Removes punctuation from Georgian words while preserving Georgian characters
 * @param word - The word to clean
 * @returns Cleaned word without punctuation
 */
export function removePunctuation(word: string): string {
  if (!word || typeof word !== 'string') {
    return '';
  }

  // Keep Georgian letters, ASCII letters/numbers, and apostrophes (' and ’)
  // Remove other punctuation and symbols
  return word.replace(/[^\u10A0-\u10FF\u0041-\u005A\u0061-\u007A\u0030-\u0039'’]/g, '');
}

/**
 * Processes Georgian sentence into clean words for the word-button gameplay
 * @param sentence - The Georgian sentence
 * @returns Array of cleaned words
 */
export function processGeorgianSentence(sentence: string): string[] {
  const words = extractWordsFromGeorgian(sentence);
  return words
    .map(word => removePunctuation(word).toLowerCase())
    .filter(word => word.length > 0);
}

/**
 * Normalizes text for comparison (removes punctuation and extra spaces)
 * @param text - Text to normalize
 * @returns Normalized text
 */
export function normalizeForComparison(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    // Keep apostrophes while removing other punctuation
    .replace(/[^'\u2019\u10A0-\u10FF\u0041-\u005A\u0061-\u007A\u0030-\u0039\s]/g, '')
    .replace(/\s+/g, ' ') // Normalize spaces
    .toLowerCase();
}
