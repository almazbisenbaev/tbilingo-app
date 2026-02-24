import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  SharedValue,
  SlideInDown,
  ZoomIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
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

const SPARK_COLORS = ['#F97316', '#FFC800', '#58CC02', '#0EA5E9', '#EC4899', '#A855F7', '#F97316', '#FFC800'];
const SPARK_ANGLES = Array.from({ length: 8 }, (_, i) => (i * Math.PI * 2) / 8);

const SparkParticle = ({
  angle,
  color,
  progress,
}: {
  angle: number;
  color: string;
  progress: SharedValue<number>;
}) => {
  const dist = 52;
  const tx = Math.cos(angle) * dist;
  const ty = Math.sin(angle) * dist;
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p > 0 ? Math.max(0, 1 - p * 1.8) : 0,
      transform: [
        { translateX: tx * p },
        { translateY: ty * p },
        { scale: Math.max(0, 1 - p * 0.6) },
      ],
    };
  });
  return (
    <Animated.View
      style={[{
        position: 'absolute',
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: color,
      }, style]}
    />
  );
};

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
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const flowerRef = useRef<View>(null);

  // Flower level-up animations
  const [displayedLevel, setDisplayedLevel] = useState(memory.correctAnswers);
  const prevCorrectAnswers = useRef(memory.correctAnswers);
  const sparkProgress = useSharedValue(0);
  const flowerOpacity = useSharedValue(1);
  const flowerAnimStyle = useAnimatedStyle(() => ({
    opacity: flowerOpacity.value,
  }));

  useEffect(() => {
    if (memory.correctAnswers > prevCorrectAnswers.current) {
      // Crossfade to new flower image
      flowerOpacity.value = withSequence(
        withTiming(0, { duration: 120 }, (finished) => {
          'worklet';
          if (finished) runOnJS(setDisplayedLevel)(memory.correctAnswers);
        }),
        withTiming(1, { duration: 220 }),
      );
      // Sparks burst
      sparkProgress.value = 0;
      sparkProgress.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    }
    prevCorrectAnswers.current = memory.correctAnswers;
  }, [memory.correctAnswers]);
  const audioSource = phrase.audioUrl ?? null;
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
    <View className="flex-1 w-full bg-card rounded-3xl p-6 border-2 border-border">

        {/* Mastery Flower */}
        <View className='flex justify-center items-center'>
          <Pressable
            ref={flowerRef}
            onPress={() => {
              if (showTooltip) {
                setShowTooltip(false);
              } else {
                flowerRef.current?.measureInWindow((x, y, width, height) => {
                  setTooltipPos({ x, y });
                  setShowTooltip(true);
                });
              }
            }}
          >
            <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}>
              {SPARK_ANGLES.map((angle, i) => (
                <SparkParticle
                  key={i}
                  angle={angle}
                  color={SPARK_COLORS[i % SPARK_COLORS.length]}
                  progress={sparkProgress}
                />
              ))}
              <Animated.View style={flowerAnimStyle}>
                <Image
                  source={flowerImages[Math.min(displayedLevel, 3) as 0 | 1 | 2 | 3]}
                  style={{ width: 60, height: 60 }}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
          </Pressable>

          <Modal
            visible={showTooltip}
            transparent
            animationType="none"
            onRequestClose={() => setShowTooltip(false)}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setShowTooltip(false)}
            >
              <Animated.View
                entering={ZoomIn.duration(120)}
                style={{
                  position: 'absolute',
                  bottom: Dimensions.get('window').height - tooltipPos.y + 8,
                  right: 16,
                  width: 230,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.18,
                  shadowRadius: 12,
                  elevation: 12,
                  borderWidth: 1,
                  borderColor: '#F3F4F6',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Image
                    source={flowerImages[Math.min(memory.correctAnswers, 3) as 0 | 1 | 2 | 3]}
                    style={{ width: 28, height: 28, marginRight: 8 }}
                    resizeMode="contain"
                  />
                  <Text className="text-foreground font-bold text-sm">Mastery level {memory.correctAnswers}/3</Text>
                </View>
                <Text className="text-muted-foreground text-xs leading-relaxed">
                  {memory.correctAnswers >= 3
                    ? 'You\'ve fully memorized this phrase! 🎉'
                    : `Answer correctly ${3 - memory.correctAnswers} more time${3 - memory.correctAnswers === 1 ? '' : 's'} to fully memorize this phrase.`}
                </Text>
              </Animated.View>
            </Pressable>
          </Modal>
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
            <Text className="text-2xl font-medium text-foreground leading-tight text-center">{phrase.english}</Text>
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

        {/* Result Bottom Sheet */}
        {isSubmitted && (
            <Animated.View
                entering={SlideInDown.duration(300).springify().damping(18)}
                style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    right: 12,
                    zIndex: 20,
                    borderRadius: 20,
                    paddingHorizontal: 20,
                    paddingTop: 20,
                    paddingBottom: 20,
                    backgroundColor: isCorrect ? '#f0fdf4' : '#fff1f1',
                    borderWidth: 1.5,
                    borderColor: isCorrect ? '#86efac' : '#fca5a5',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.18,
                    shadowRadius: 20,
                    elevation: 16,
                }}
            >
                <View className="flex-row items-center mb-3">
                    <Text className="text-3xl mr-3">{isCorrect ? '🎉' : '❌'}</Text>
                    <Text className={`text-2xl font-bold ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                        {isCorrect ? 'Correct!' : 'Incorrect'}
                    </Text>
                </View>

                {!isCorrect && (
                    <View className="mb-4 bg-destructive/10 px-4 py-3 rounded-xl border border-destructive/20">
                        <Text className="text-muted-foreground mb-1 font-semibold uppercase tracking-wide text-xs">Correct answer</Text>
                        <Text className="text-base font-bold text-foreground leading-snug">{phrase.georgian}</Text>
                    </View>
                )}

                {phrase.latin && (
                    <Text className="text-muted-foreground mb-4 italic text-base">{phrase.latin}</Text>
                )}

                <Button
                    variant={isCorrect ? 'success' : 'primary'}
                    size="lg"
                    title="Continue"
                    onPress={onNext}
                    className="w-full"
                />
            </Animated.View>
        )}
    </View>
  );
};

export default FlashcardPhrase;
