import Button from '@/components/Button';
import CloseButton from '@/components/CloseButton';
import CompletionScreen from '@/components/CompletionScreen';
import ProgressBar from '@/components/ProgressBar';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebaseConfig';
import { StoryItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { collection, doc, getDocs, query, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';

interface StoryLevelScreenProps {
  courseId: string;
}

export default function StoryLevelScreen({ courseId }: StoryLevelScreenProps) {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [items, setItems] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(query(collection(db, 'courses', courseId, 'items')));
        const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as StoryItem[];
        fetched.sort((a, b) => {
          const na = parseInt(a.id), nb = parseInt(b.id);
          if (!isNaN(na) && !isNaN(nb)) return na - nb;
          return a.id.localeCompare(b.id);
        });
        setItems(fetched);
      } catch (err: any) {
        console.error('Error fetching story items:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [courseId]);

  const goNext = () => {
    setTooltipVisible(false);
    setCurrentIndex(prev => prev + 1);
  };

  const goPrev = () => {
    setTooltipVisible(false);
    setCurrentIndex(prev => prev - 1);
  };

  const handleFinish = async () => {
    if (currentUser) {
      try {
        const progressRef = doc(db, 'users', currentUser.uid, 'progress', courseId);
        await setDoc(progressRef, {
          userId: currentUser.uid,
          courseId,
          isFinished: true,
          lastUpdated: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.error('Error saving story progress:', e);
      }
    }
    setIsFinished(true);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#F24822" />
        <Text className="mt-4 text-muted-foreground">Loading story...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-background p-6">
        <Text className="text-destructive text-center mb-4">{error}</Text>
        <Button onPress={router.back} variant="secondary" title="Go Back" />
      </View>
    );
  }

  if (isFinished) {
    return (
      <CompletionScreen
        sessionLearnedCount={items.length}
        totalLearnedCount={items.length}
        totalItemsCount={items.length}
        onContinue={() => {
          setCurrentIndex(0);
          setTooltipVisible(false);
          setIsFinished(false);
        }}
        onExit={() => router.back()}
      />
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-background p-6">
        <Text className="text-muted-foreground text-center">No story content available yet.</Text>
        <Button onPress={router.back} variant="secondary" title="Go Back" className="mt-4" />
      </View>
    );
  }

  const currentItem = items[currentIndex];
  const isLastSlide = currentIndex === items.length - 1;
  const isFirstSlide = currentIndex === 0;

  return (
    <View className="flex-1 bg-background safe-area-view">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="bg-card border-b border-border">
        <View className="flex-row items-center p-4 w-full max-w-[640px] self-center">
          <CloseButton onPress={() => router.back()} />
          <View className="flex-1 mx-2">
            <ProgressBar current={currentIndex + 1} total={items.length} height={8} />
          </View>
          <Text className="text-muted-foreground text-sm w-12 text-right">
            {currentIndex + 1}/{items.length}
          </Text>
        </View>
      </View>

      {/* Slide */}
      <View className="flex-1 justify-center items-center p-6 w-full max-w-[640px] self-center">
        {currentItem.illustration ? (
          <Image
            source={{ uri: currentItem.illustration }}
            style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 32 }}
            resizeMode="cover"
          />
        ) : null}

        {/* Georgian text + tooltip */}
        <View className="items-center w-full">
          <TouchableOpacity
            onPress={() => setTooltipVisible(v => !v)}
            activeOpacity={0.7}
            style={{ alignItems: 'center' }}
          >
            {/* Tooltip bubble absolutely above the text */}
            {tooltipVisible && (
              <View style={{ position: 'absolute', bottom: '100%', alignItems: 'center', marginBottom: 8, width: '100%' }}>
                <View style={{
                  backgroundColor: '#1a1a1a',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  maxWidth: '90%',
                }}>
                  <Text style={{ color: '#ffffff', fontSize: 15, textAlign: 'center' }}>
                    {currentItem.translation}
                  </Text>
                </View>
                {/* Arrow pointing down */}
                <View style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 8,
                  borderRightWidth: 8,
                  borderTopWidth: 8,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderTopColor: '#1a1a1a',
                }} />
              </View>
            )}

            <Text className="text-2xl font-bold text-foreground text-center">
              {currentItem.text}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation */}
      <View className="bg-card border-t border-border">
        <View className="flex-row items-center justify-between p-4 w-full max-w-[640px] self-center">
          <TouchableOpacity
            onPress={goPrev}
            disabled={isFirstSlide}
            style={{ opacity: isFirstSlide ? 0.25 : 1 }}
          >
            <Ionicons name="arrow-back-circle-outline" size={52} color="#F24822" />
          </TouchableOpacity>

          {isLastSlide ? (
            <Button
              variant="primary"
              size="lg"
              title="Finish"
              onPress={handleFinish}
              className="flex-1 mx-4"
            />
          ) : (
            <TouchableOpacity onPress={goNext}>
              <Ionicons name="arrow-forward-circle-outline" size={52} color="#F24822" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
