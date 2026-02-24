import Button from '@/components/Button';

import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { FlashcardNumberProps } from '../types';

const FlashcardNumber: React.FC<FlashcardNumberProps> = ({ number, onNext, onLearned }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const audioSource = number.audioUrl ?? null;
  const player = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(player);

  // Reset state when number changes
  useEffect(() => {
    setShowAnswer(false);
    setShowTransliteration(false);
  }, [number]);

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
  const isLoadingAudio = number.audioUrl ? !status.isLoaded : false;

  function playSound() {
    if (number.audioUrl) {
      player.seekTo(0);
      player.play();
    }
  }

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleShowTransliteration = () => {
    setShowTransliteration(true);
  };

  return (
    <View className="flex-1 w-full max-w-md mx-auto p-6 bg-card rounded-3xl border-2 border-border justify-center my-4">
      <View className="items-center justify-center w-full">
        {!showAnswer ? (
          // Front Side
          <View className="items-center w-full py-4">
             <View className="mb-16 bg-muted w-40 h-40 rounded-full items-center justify-center border border-border">
                <Text className="text-8xl font-bold text-foreground">{number.number}</Text>
             </View>
             
             <Button 
                variant="primary"
                size="lg"
                title="Show Answer"
                onPress={handleShowAnswer}
                className="w-full"
             />
          </View>
        ) : (
          // Back Side
          <View className="items-center w-full py-2">
            <Text className="text-7xl font-bold text-foreground mb-2">{number.number}</Text>
            <Text className="text-4xl text-primary font-bold mb-6 text-center">{number.translation}</Text>
            
            <View className="w-full mb-8 items-center h-20 justify-center">
              {showTransliteration ? (
                <View className="items-center bg-muted px-8 py-4 rounded-2xl border border-border w-full">
                   <Text className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Pronunciation</Text>
                   <Text className="text-2xl font-bold text-foreground">{number.translationLatin}</Text>
                </View>
              ) : (
                <Button 
                   variant="default"
                   size="sm"
                   title="Show Pronunciation"
                   onPress={handleShowTransliteration}
                   className="rounded-full bg-muted border-muted"
                   textClassName="text-muted-foreground"
                />
              )}
            </View>

            {number.audioUrl && (
              <Button 
                className="w-20 h-20 rounded-full bg-primary/10 border-primary/20 border-b-primary/20 mb-8 p-0 min-h-0"
                onPress={playSound}
                variant="default"
              >
                {isLoadingAudio ? (
                  <ActivityIndicator color="#F97316" size="large" />
                ) : (
                  <Ionicons name={isPlaying ? "pause" : "volume-high"} size={36} color="#F97316" />
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
        )}
      </View>
    </View>
  );
};

export default FlashcardNumber;
