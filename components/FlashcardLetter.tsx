import Button from '@/components/Button';
import { FlashcardProps } from '@/types';
import { audioMap } from '@/utils/audioMap';
import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

const FlashcardLetter: React.FC<FlashcardProps> = ({ letter, onNext, onLearned }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  
  const audioSource = letter.audioUrl ? (audioMap[letter.audioUrl] || letter.audioUrl) : null;
  const player = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(player);

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
  const isLoadingAudio = letter.audioUrl ? !status.isLoaded : false;

  function playSound() {
    if (letter.audioUrl) {
      // Always reset to beginning before playing to ensure replayability
      player.seekTo(0);
      player.play();
    }
  }

  // Reset state when letter changes
  useEffect(() => {
    setShowAnswer(false);
  }, [letter]);

  if (!showAnswer) {
    return (
      <View className="flex-1 justify-center items-center p-8 bg-card rounded-3xl border-2 border-border">
        <Text className="text-9xl font-bold mb-12 text-foreground tracking-wider">{letter.character}</Text>
        <Button 
          variant="primary"
          size="lg"
          title="Show Answer"
          onPress={() => setShowAnswer(true)}
          className="w-full"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center p-8 bg-card rounded-3xl border-2 border-border">
      <Text className="text-7xl font-bold mb-2 text-foreground">{letter.character}</Text>
      <Text className="text-3xl font-semibold mb-2 text-muted-foreground">{letter.name}</Text>
      <View className="flex-row items-center mb-8 bg-muted px-4 py-2 rounded-lg border-2 border-border">
        <Text className="text-muted-foreground mr-2 text-base">Pronunciation:</Text>
        <Text className="font-bold text-xl text-foreground">{letter.pronunciation}</Text>
      </View>
      
      {letter.audioUrl && (
        <Button 
          className="w-20 h-20 rounded-full bg-primary/10 border-primary/20 border-b-primary/20 mb-10 p-0 min-h-0"
          onPress={playSound}
          variant="default"
        >
          {isLoadingAudio ? (
            <ActivityIndicator color={Colors.tint} size="large" />
          ) : (
            <Ionicons name={isPlaying ? "pause" : "volume-high"} size={36} color={Colors.tint} />
          )}
        </Button>
      )}

      <View className="w-full gap-4">
        <Button 
          variant="primary"
          size="lg"
          title="Next Card"
          onPress={onNext}
          className="w-full"
        />
        
        <Button 
          variant="outline-success"
          size="lg"
          title="Mark as Learned"
          onPress={onLearned}
          className="w-full"
        />
      </View>
    </View>
  );
};

export default FlashcardLetter;
