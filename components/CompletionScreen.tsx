import Button from '@/components/Button';
import React from 'react';
import { Text, View } from 'react-native';

interface CompletionScreenProps {
  sessionLearnedCount: number;
  totalLearnedCount: number;
  totalItemsCount: number;
  onContinue: () => void;
  onExit: () => void;
}

export default function CompletionScreen({
  sessionLearnedCount,
  totalLearnedCount,
  totalItemsCount,
  onContinue,
  onExit
}: CompletionScreenProps) {
  return (
    <View className="flex-1 bg-background justify-center items-center p-6">
        <View className="w-full max-w-[640px] self-center items-center">
        <View className="items-center mb-8">
            <Text className="text-4xl mb-4">🎉</Text>
            <Text className="text-2xl font-bold text-foreground mb-2">Great work!</Text>
            <Text className="text-lg text-muted-foreground text-center mb-6">You completed this session!</Text>
            
            <View className="bg-card p-6 rounded-2xl border-2 border-b-4 border-border w-full mb-6">
                <Text className="text-lg mb-2 text-foreground">
                    Session progress: <Text className="font-bold text-primary">{sessionLearnedCount}</Text> items mastered
                </Text>
                <Text className="text-lg text-foreground">
                    Total progress: <Text className="font-bold text-primary">{totalLearnedCount}</Text> / <Text className="font-bold">{totalItemsCount}</Text> learned
                </Text>
            </View>
        </View>
        
        <View className="w-full gap-4">
             <Button 
                variant="primary" 
                size="lg" 
                title="Continue Learning" 
                onPress={onContinue}
                className="w-full"
            />
            
            <Button 
                variant="secondary" 
                size="lg" 
                title="Back to Home" 
                onPress={onExit}
                className="w-full"
            />
        </View>
        </View>
   </View>
  );
}
