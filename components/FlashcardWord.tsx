import Button from '@/components/Button';
import { FlashcardWordProps } from '@/types';
import { audioMap } from '@/utils/audioMap';
import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

const FlashcardWord: React.FC<FlashcardWordProps> = ({ word, onNext, onLearned }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const audioSource = word.audioUrl ? (audioMap[word.audioUrl] || word.audioUrl) : null;
  const player = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(player);

  // Reset state when word changes
  useEffect(() => {
    setShowAnswer(false);
    setShowTransliteration(false);
  }, [word]);

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
  const isLoadingAudio = word.audioUrl ? !status.isLoaded : false;

  function playSound() {
    if (word.audioUrl) {
      player.seekTo(0);
      player.play();
    }
  }

  if (!showAnswer) {
    return (
      <View className="flex-1 justify-center items-center p-8 bg-card rounded-3xl border-2 border-b-4 border-border mx-2 my-4">
        <Text className="text-4xl font-bold mb-12 text-center text-foreground leading-tight">{word.english}</Text>
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
    <View className="flex-1 justify-center items-center p-8 bg-card rounded-3xl border-2 border-b-4 border-border mx-2 my-4">
      <Text className="text-2xl font-medium mb-4 text-muted-foreground">{word.english}</Text>
      <Text className="text-5xl font-bold mb-8 text-center text-foreground">{word.georgian}</Text>
      
      <View className="h-16 mb-8 justify-center w-full items-center">
        {showTransliteration ? (
           <View className="flex-row items-center bg-muted px-6 py-3 rounded-xl border-2 border-border">
             <Text className="text-muted-foreground mr-2 text-sm uppercase tracking-wider">Latin:</Text>
             <Text className="font-bold text-xl text-foreground">{word.latin}</Text>
           </View>
        ) : (
          <Button 
            variant="default"
            size="sm"
            title="Show Pronunciation"
            onPress={() => setShowTransliteration(true)}
            className="rounded-full bg-muted border-muted"
            textClassName="text-muted-foreground"
          />
        )}
      </View>

      {word.audioUrl && (
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

export default FlashcardWord;
