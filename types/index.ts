export interface AlphabetItem {
  id: number;
  character: string;
  name: string;
  pronunciation: string;
  audioUrl?: string;
}

export interface NumberItem {
  id: number;
  number: string;
  translation: string;
  translationLatin: string;
  audioUrl?: string;
}

export interface WordItem {
  id: number;
  english: string;
  georgian: string;
  latin: string;
  audioUrl?: string;
}

export interface PhraseItem {
  id: number;
  english: string;
  georgian: string;
  latin: string;
  fakeWords: string[];
  audioUrl?: string;
}

export interface PhraseMemory {
  correctAnswers: number;
  isLearned: boolean;
}

export interface StoryItem {
  id: string;
  illustration: string;
  text: string;
  translation: string;
}

export type LevelType = 'characters' | 'numbers' | 'words' | 'phrases' | 'story';

export interface LevelLinkProps {
  href: string;
  title: string;
  icon: string;
  disabled: boolean;
  locked?: boolean;
  isCompleted?: boolean;
  progress?: number;
  totalItems?: number;
  completedItems?: number;
  onLockedClick?: () => void;
}

export interface FlashcardProps {
  letter: AlphabetItem;
  onNext: () => void;
  onLearned: () => void;
}

export interface FlashcardNumberProps {
  number: NumberItem;
  onNext: () => void;
  onLearned: () => void;
}

export interface BasicWordsComponentProps {
  word: WordItem;
  onNext: () => void;
  onLearned: () => void;
}

export interface FlashcardWordProps {
  word: WordItem;
  onNext: () => void;
  onLearned: () => void;
}

export interface ProgressBarProps {
  current: number;
  total: number;
  showNumbers?: boolean;
  width?: string | number; // Changed to string | number for RN
  height?: number;
}
