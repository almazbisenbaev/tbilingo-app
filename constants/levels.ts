import { LevelType } from '@/types';

export interface LevelConfig {
  id: string;
  courseId?: string; // If different from id
  label?: string;
  title: string;
  icon: string;
  requiredLevelId?: string;
  requiredLevelTitle?: string;
  type?: LevelType; // Default type (can be overridden by Firestore)
}

export const LEVELS: LevelConfig[] = [
  { 
    id: '1', 
    courseId: 'alphabet', 
    label: 'Flashcards', 
    title: 'Alphabet', 
    icon: '/images/icon-alphabet.svg', 
    type: 'characters' 
  },
  { 
    id: '2', 
    courseId: 'words-basic', 
    label: 'Flashcards', 
    title: 'Basic Words', 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '1', 
    requiredLevelTitle: 'Learn Alphabet', 
    type: 'words' 
  },
  { 
    id: '3', 
    courseId: 'phrases-essential', 
    label: 'Phrases', 
    title: 'Essential Phrases', 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '2', 
    requiredLevelTitle: 'Learn Basic Words', 
    type: 'phrases' 
  },
  { 
    id: '4', 
    courseId: 'story-1', 
    label: 'Story', 
    title: "Story: My name is Nino", 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '3', 
    requiredLevelTitle: 'Learn Essential Phrases', 
    type: 'story' 
  },
  { 
    id: '5', 
    courseId: 'numbers', 
    label: 'Flashcards', 
    title: 'Numbers', 
    icon: '/images/icon-numbers.svg', 
    requiredLevelId: '4', 
    requiredLevelTitle: 'Read the story', 
    type: 'numbers' 
  },
  { 
    id: '6', 
    courseId: 'greetings', 
    label: 'Phrases', 
    title: "Greetings", 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '5', 
    requiredLevelTitle: 'Learn Numbers', 
    type: 'phrases' 
  },
  { 
    id: '7', 
    courseId: 'pronouns', 
    label: 'Flashcards', 
    title: "Pronouns", 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '6', 
    requiredLevelTitle: 'Learn Greetings', 
    type: 'words' 
  },
  { 
    id: '8', 
    courseId: 'pronouns-2', 
    label: 'Phrases', 
    title: "Pronouns 2", 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '7', 
    requiredLevelTitle: 'Learn Pronouns', 
    type: 'phrases' 
  },
  { 
    id: '9', 
    courseId: 'family-friends', 
    label: 'Flashcards', 
    title: "Family & Friends", 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '8', 
    requiredLevelTitle: 'Learn Pronouns 2', 
    type: 'words' 
  },
  { 
    id: '10', 
    courseId: 'family-friends-2', 
    label: 'Phrases', 
    title: "Family & Friends 2", 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '9', 
    requiredLevelTitle: 'Learn Family & Friends', 
    type: 'phrases' 
  },
];
