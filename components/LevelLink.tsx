import Button from '@/components/Button';
import { LevelLinkProps } from '@/types';
import { imageMap } from '@/utils/imageMap';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import CircularProgressBar from './CircularProgressBar';

export default function LevelLink({
    href,
    title,
    icon,
    disabled = false,
    locked = false,
    isCompleted: isCompletedProp = false,
    progress = 0,
    totalItems = 0,
    completedItems = 0,
    onLockedClick
}: LevelLinkProps) {
    const router = useRouter();
    const isCompleted = isCompletedProp || progress === 100;
    
    // Calculate progress percentage for circular bar
    const progressPercent = isCompleted ? 100 : (progress || 0);

    // No-op; keep to satisfy potential prop expectation

    const iconSource = imageMap[icon] || null;

    return (
        <View
            className={`p-6 mb-4 rounded-xl border-2 flex flex-col items-center h-auto min-h-0 ${
                locked ? 'border-gray-100' : 
                isCompleted ? 'bg-success/10 border-success/10' : 
                'bg-card border-gray-100'
            } ${disabled ? 'opacity-50' : ''}`}
        >
            <View className="mb-4">
                <CircularProgressBar 
                    progress={progressPercent} 
                    size={100} 
                    strokeWidth={3}
                    color={isCompleted ? '#58CC0200' : '#F97316'}
                    backgroundColor={isCompleted ? '#58CC0200' : '#E5E5E5'}
                >
                    <View className="items-center justify-center w-full h-full">
                        {isCompleted ? (
                            <Ionicons name="checkmark-circle" size={48} color="#58CC02" />
                        ) : iconSource && (
                            <Image 
                                source={iconSource} 
                                style={{ 
                                    width: 48, 
                                    height: 48,
                                }} 
                                contentFit="contain" 
                            />
                        )}
                    </View>
                </CircularProgressBar>
            </View>
            
            <View className="items-center">
                <Text className={`text-lg font-semibold text-center ${isCompleted ? 'text-success' : 'text-gray-900'}`}>{title}</Text>
                {disabled && (
                    <Text className="text-xs text-muted-foreground uppercase">Coming soon</Text>
                )}
            </View>

            {!locked && !disabled && !isCompleted && (
                <View className="w-full mt-6">
                    <Button 
                        variant="primary"
                        size="md"
                        title={completedItems && completedItems > 0 ? 'Continue learning' : 'Learn now'}
                        onPress={() => router.push(href as any)}
                        className="w-full"
                    />
                </View>
            )}
        </View>
    )
}
