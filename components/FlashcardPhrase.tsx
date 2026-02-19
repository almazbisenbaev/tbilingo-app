import Button from '@/components/Button';
import { audioMap } from '@/utils/audioMap';
import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { PhraseItem, PhraseMemory } from '../types';
import { normalizeForComparison, processGeorgianSentence, removePunctuation } from '../utils/georgian-text-utils';
import { shuffleArray } from '../utils/shuffle-array';

interface FlashcardPhraseProps {
  phrase: PhraseItem;
  memory: PhraseMemory;
  onNext: () => void;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
}

interface WordObj {
  id: string;
  word: string;
  disabled: boolean;
}

const flowerImages = {
  0: require('../public/images/flower-0.png'),
  1: require('../public/images/flower-1.png'),
  2: require('../public/images/flower-2.png'),
  3: require('../public/images/flower-3.png'),
};

const FlashcardPhrase: React.FC<FlashcardPhraseProps> = ({ 
  phrase, 
  memory,
  onNext, 
  onCorrectAnswer,
  onWrongAnswer
}) => {
  const [availableWords, setAvailableWords] = useState<WordObj[]>([]);
  const [selectedWords, setSelectedWords] = useState<WordObj[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const audioSource = phrase.audioUrl ? (audioMap[phrase.audioUrl] || phrase.audioUrl) : null;
  const player = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(player);

  // Initialize words when phrase changes
  useEffect(() => {
    const words = processGeorgianSentence(phrase.georgian);
    const fakeWords = Array.isArray(phrase.fakeWords) ? phrase.fakeWords : [];
    const cleanedFakeWords = fakeWords
      .map((w) => removePunctuation(w).toLowerCase())
      .filter((w) => w.length > 0);
    const allWords = [...words, ...cleanedFakeWords];
    const shuffled = shuffleArray(allWords);
    
    // Create unique objects for each word instance
    const wordObjects = shuffled.map((w, i) => ({
      id: `${w}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      word: w,
      disabled: false
    }));

    setAvailableWords(wordObjects);
    setSelectedWords([]);
    setIsSubmitted(false);
    setIsCorrect(false);
  }, [phrase.id, phrase.georgian, phrase.fakeWords]);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: false,
          shouldRouteThroughEarpiece: false,
        });
      } catch (error) {
        console.error('Failed to set audio mode:', error);
      }
    };
    setupAudio();
  }, []);

  const isPlaying = status.playing;
  const isLoadingAudio = phrase.audioUrl ? !status.isLoaded : false;

  function playSound() {
    if (phrase.audioUrl) {
      player.seekTo(0);
      player.play();
    }
  }

  const handleWordSelect = (wordObj: WordObj) => {
    if (isSubmitted) return;
    setAvailableWords(prev =>
      prev.map(w => (w.id === wordObj.id ? { ...w, disabled: true } : w))
    );
    setSelectedWords(prev => [...prev, wordObj]);
  };

  const handleWordDeselect = (wordObj: WordObj) => {
    if (isSubmitted) return;
    setSelectedWords(prev => prev.filter(w => w.id !== wordObj.id));
    setAvailableWords(prev =>
      prev.map(w => (w.id === wordObj.id ? { ...w, disabled: false } : w))
    );
  };

  const handleSubmit = () => {
    if (selectedWords.length === 0) return;
    
    const constructedSentence = selectedWords.map(w => w.word).join(' ');
    const normalizedConstructed = normalizeForComparison(constructedSentence);
    const normalizedCorrect = normalizeForComparison(phrase.georgian);
    
    const isAnswerCorrect = normalizedConstructed === normalizedCorrect;
    
    setIsCorrect(isAnswerCorrect);
    setIsSubmitted(true);
    
    if (isAnswerCorrect) {
      onCorrectAnswer();
    } else {
      onWrongAnswer();
    }
  };

  return (
    <View className="flex-1 w-full bg-card rounded-3xl p-6 border-2 border-border mx-2 my-4">
        {/* Mastery Flower */}
        <View className='flex justify-end'>
          <Image
            source={flowerImages[Math.min(memory.correctAnswers, 3) as 0 | 1 | 2 | 3]}
            style={{ width: 60, height: 60 }}
            resizeMode="contain"
            className='ml-auto'
          />
        </View>
        {/* <View className="flex-row items-center mb-6 justify-between bg-muted p-3 rounded-xl border border-border">
            <Image
                source={flowerImages[Math.min(memory.correctAnswers, 3) as 0 | 1 | 2 | 3]}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
            />
            <Text className="text-muted-foreground text-sm font-semibold">{memory.correctAnswers}/3 mastery</Text>
        </View> */}

        <View className="mb-6 flex-1 justify-center">
            <Text className="text-3xl font-bold text-foreground leading-tight text-center">{phrase.english}</Text>
        </View>

        {phrase.audioUrl && (
            <View className="items-center mb-6">
                <Button 
                    className="w-20 h-20 rounded-full bg-primary/10 border-primary/20 border-b-primary/20 p-0 min-h-0"
                    onPress={playSound}
                    variant="default"
                >
                    {isLoadingAudio ? (
                        <ActivityIndicator color={Colors.tint} size="large" />
                    ) : (
                        <Ionicons name={isPlaying ? "pause" : "volume-high"} size={36} color={Colors.tint} />
                    )}
                </Button>
            </View>
        )}

        {/* Construction Area (Answer Box) */}
        <View className="mb-6 w-full bg-muted rounded-2xl p-4 border-2 border-border">
            {/* <Text className="text-muted-foreground text-xs mb-3 font-bold uppercase tracking-wider">Your answer:</Text> */}
            <View className="min-h-[120px] flex-row flex-wrap gap-3 items-start w-full">
                {selectedWords.length === 0 ? (
                    <Text className="text-muted-foreground italic text-lg">Tap words below...</Text>
                ) : (
                    selectedWords.map((wordObj) => (
                        <Button 
                            key={wordObj.id}
                            onPress={() => handleWordDeselect(wordObj)}
                            className={`bg-card px-4 py-3 min-h-0 h-auto ${isSubmitted ? 'opacity-100' : ''}`}
                            disabled={isSubmitted}
                            title={wordObj.word}
                            variant="default"
                            textClassName="text-foreground font-bold text-lg"
                        />
                    ))
                )}
            </View>
        </View>

        {/* Word Bank */}
        <View className="flex-row flex-wrap gap-3 justify-center mb-8">
            {availableWords.map((wordObj) => (
                <Button 
                    key={wordObj.id}
                    onPress={() => handleWordSelect(wordObj)}
                    className={`bg-muted px-4 py-3 min-h-0 h-auto ${wordObj.disabled ? 'border-b-0' : ''}`}
                    disabled={isSubmitted || wordObj.disabled}
                    title={wordObj.word}
                    variant="default"
                    textClassName={`font-bold text-lg ${wordObj.disabled ? 'text-muted-foreground' : 'text-foreground'}`}
                />
            ))}
        </View>

        {/* Action Button */}
        <View className="mt-auto">
            {!isSubmitted && (
                <Button 
                    variant={selectedWords.length > 0 ? "primary" : "default"}
                    size="lg"
                    title="Check Answer"
                    onPress={handleSubmit}
                    disabled={selectedWords.length === 0}
                    className={`w-full ${selectedWords.length === 0 ? 'bg-muted-foreground/30 border-muted-foreground/30' : ''}`}
                    textClassName={selectedWords.length === 0 ? 'text-muted-foreground' : ''}
                />
            )}
        </View>

        {/* Result Overlay */}
        {isSubmitted && (
            <View className="absolute inset-0 rounded-3xl p-6 z-10 justify-center items-center bg-card/95 backdrop-blur-sm">
                <View className="items-center w-full max-w-xs">
                    <Text className="text-7xl mb-6">{isCorrect ? '🎉' : '❌'}</Text>
                    <Text className={`text-3xl font-bold mb-4 ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                        {isCorrect ? 'Correct!' : 'Incorrect'}
                    </Text>
                    
                    {!isCorrect && (
                        <View className="mb-8 items-center bg-destructive/10 p-6 rounded-2xl w-full border border-destructive/20">
                            <Text className="text-muted-foreground mb-2 font-semibold uppercase tracking-wide text-xs">Correct answer</Text>
                            <Text className="text-xl font-bold text-center text-foreground leading-snug">{phrase.georgian}</Text>
                        </View>
                    )}

                    {phrase.latin && (
                        <Text className="text-muted-foreground mb-8 italic text-lg">{phrase.latin}</Text>
                    )}
                    
                    <Button 
                        variant={isCorrect ? "success" : "primary"}
                        size="lg"
                        title="Continue"
                        onPress={onNext}
                        className="w-full"
                    />
                </View>
            </View>
        )}
    </View>
  );
};

export default FlashcardPhrase;
