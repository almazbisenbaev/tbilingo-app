import Button from '@/components/Button';
import { LevelLinkProps } from '@/types';
import { imageMap } from '@/utils/imageMap';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import CircularProgressBar from './CircularProgressBar';

function resolveIconSource(icon: string): any {
    if (!icon) return null;
    if (icon.startsWith('http://') || icon.startsWith('https://')) {
        return { uri: icon };
    }
    return imageMap[icon] || null;
}

export default function LevelLink({
    href,
    label,
    title,
    icon,
    type,
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

    const iconSource = resolveIconSource(icon);
    const isStory = type === 'story';

    return (
        <View
            className={`bg-white mb-4 rounded-xl border-2 flex flex-col items-center h-auto min-h-0 overflow-hidden ${
                locked ? 'border-gray-100' : 
                'border-transparent'
            } ${disabled ? 'opacity-50' : ''}`}
        >
            {isStory ? (
                // Story levels: full-width cover image, no progress ring
                iconSource && (
                    <Image
                        source={iconSource}
                        style={{ width: '100%', height: 200 }}
                        contentFit="contain"
                    />
                )
            ) : (
                // Non-story levels: circular progress bar with icon inside
                <View className="mb-4 mt-6">
                    <CircularProgressBar 
                        progress={progressPercent} 
                        size={100} 
                        strokeWidth={3}
                        color={isCompleted ? '#58CC0200' : '#F97316'}
                        backgroundColor={isCompleted ? '#58CC0220' : '#E5E5E5'}
                    >
                        <View className="items-center justify-center w-full h-full">
                            {isCompleted ? (
                                <Ionicons name="checkmark" size={40} color="#58CC02" />
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
            )}
            
            <View className={`items-center px-6 ${isStory ? 'pt-4' : ''} pb-6 w-full`}>
                <Text className="text-sm uppercase leading-relaxed text-center text-gray-500 mb-2 mt-2">{label}</Text>
                <Text className={`text-xl font-medium text-center ${isCompleted ? 'text-gray-900' : 'text-gray-900'}`}>{title}</Text>
                {disabled && (
                    <Text className="text-xs text-muted-foreground uppercase">Coming soon</Text>
                )}

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
        </View>
    )
}
