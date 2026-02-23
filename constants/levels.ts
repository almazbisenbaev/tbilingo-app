import { LevelType } from '@/types';

export interface LevelConfig {
  id: string;
  courseId?: string; // If different from id
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
    title: 'Alphabet', 
    icon: '/images/icon-alphabet.svg', 
    type: 'characters' 
  },
  { 
    id: '2', 
    courseId: 'words-basic', 
    title: 'Basic Words', 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '1', 
    requiredLevelTitle: 'Learn Alphabet', 
    type: 'words' 
  },
  { 
    id: '3', 
    courseId: 'phrases-essential', 
    title: 'Essential Phrases', 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '2', 
    requiredLevelTitle: 'Learn Basic Words', 
    type: 'phrases' 
  },
  { 
    id: '4', 
    courseId: 'numbers', 
    title: 'Numbers', 
    icon: '/images/icon-numbers.svg', 
    requiredLevelId: '3', 
    requiredLevelTitle: 'Learn Essential Phrases', 
    type: 'numbers' 
  },
  { 
    id: '5', 
    courseId: 'greetings', 
    title: "Greetings", 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '4', 
    requiredLevelTitle: 'Learn Numbers', 
    type: 'phrases' 
  },
  { 
    id: '6', 
    courseId: 'pronouns', 
    title: "Pronouns", 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '5', 
    requiredLevelTitle: 'Learn Greetings', 
    type: 'words' 
  },
  { 
    id: '7', 
    courseId: 'pronouns-2', 
    title: "Pronouns 2", 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '6', 
    requiredLevelTitle: 'Learn Pronouns', 
    type: 'phrases' 
  },
  { 
    id: '8', 
    courseId: 'family-friends', 
    title: "Family & Friends", 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '7', 
    requiredLevelTitle: 'Learn Pronouns 2', 
    type: 'phrases' 
  },
  { 
    id: '9', 
    courseId: 'family-friends-2', 
    title: "Family & Friends 2", 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '8', 
    requiredLevelTitle: 'Learn Family & Friends', 
    type: 'phrases' 
  },
  { 
    id: '10', 
    courseId: 'story-1', 
    title: "Story 1", 
    icon: '/images/icon-phrases.svg', 
    requiredLevelId: '9', 
    requiredLevelTitle: 'Learn Family & Friends 2', 
    type: 'story' 
  },
];
