import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, View } from 'react-native';
import CardTransition from '../../components/CardTransition';
import CompletionScreen from '../../components/CompletionScreen';
import FlashcardWord from '../../components/FlashcardWord';
import ProgressBar from '../../components/ProgressBar';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { WordItem } from '../../types';
import { imageMap } from '../../utils/imageMap';
import { shuffleArray } from '../../utils/shuffle-array';
import CloseButton from '@/components/CloseButton';

const COURSE_ID = 'words-basic';
const LEVEL_TITLE = 'Basic Words';
const LEVEL_DESCRIPTION = 'Essential vocabulary for daily use';
const LEVEL_ICON = '/images/icon-phrases.svg';

export default function LevelBasicWordsScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  
  // State
  const [items, setItems] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [learnedIds, setLearnedIds] = useState<number[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);
  
  // Gameplay state
  const [isGameplayActive, setIsGameplayActive] = useState(false);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [sessionItems, setSessionItems] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionLearnedIds, setSessionLearnedIds] = useState<number[]>([]); // Items learned in this session
  const [sessionReviewedIds, setSessionReviewedIds] = useState<number[]>([]); // Items reviewed in this session

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const itemsRef = collection(db, 'courses', COURSE_ID, 'items');
        const qItems = query(itemsRef);
        const snapshot = await getDocs(qItems);
        
        const fetchedItems = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const id = typeof docSnap.id === 'string' && !isNaN(Number(docSnap.id)) 
            ? parseInt(docSnap.id) 
            : (docSnap.id as unknown as number);
          
          return {
            id,
            english: data.english,
            georgian: data.georgian,
            latin: data.latin,
            ...data
          } as WordItem;
        });
        
        fetchedItems.sort((a, b) => a.id - b.id);
        setItems(fetchedItems);
      } catch (err: any) {
        console.error("Error fetching items:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Fetch progress
  useEffect(() => {
    const fetchProgress = async () => {
      if (!currentUser) return;
      
      try {
        const progressRef = doc(db, 'users', currentUser.uid, 'progress', COURSE_ID);
        const progressSnap = await getDoc(progressRef);
        
        if (progressSnap.exists()) {
          const data = progressSnap.data();
          const savedLearnedIds = (data.learnedItemIds as string[] || []).map(id => parseInt(id));
          setLearnedIds(savedLearnedIds);
        } else {
          setLearnedIds([]);
        }
        setProgressLoaded(true);
      } catch (err) {
        console.error("Error fetching progress:", err);
      }
    };

    fetchProgress();
  }, [currentUser]);

  const startGameplay = () => {
    // Robust filtering to handle potential string/number ID mismatches
    const unlearnedItems = items.filter(item => !learnedIds.some(id => String(id) === String(item.id)));
    
    if (unlearnedItems.length === 0) {
      Alert.alert(
        "Course Completed", 
        "You have learned all items in this course! Starting a review session.",
        [
            { text: "OK", onPress: () => startReviewSession() }
        ]
      );
      return;
    }

    const shuffled = shuffleArray(unlearnedItems);
    // Select up to 10 items, or fewer if not enough available
    const selected = shuffled.slice(0, 10);
    
    setSessionItems(selected);
    setCurrentIndex(0);
    setSessionLearnedIds([]);
    setSessionReviewedIds([]);
    setIsSessionFinished(false);
    setIsGameplayActive(true);
  };

  const startReviewSession = () => {
      const shuffled = shuffleArray([...items]);
      const selected = shuffled.slice(0, 10);
      setSessionItems(selected);
      setCurrentIndex(0);
      setSessionLearnedIds([]);
      setSessionReviewedIds([]);
      setIsGameplayActive(true);
  };

  const handleNext = () => {
    const currentItem = sessionItems[currentIndex];
    if (!sessionReviewedIds.includes(currentItem.id)) {
        setSessionReviewedIds(prev => [...prev, currentItem.id]);
    }

    if (currentIndex < sessionItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishSession();
    }
  };

  const confirmLearned = async () => {
    const currentItem = sessionItems[currentIndex];
    
    // Update local state immediately for UI responsiveness
    setSessionLearnedIds(prev => [...prev, currentItem.id]);
    setLearnedIds(prev => {
        if (prev.includes(currentItem.id)) return prev;
        return [...prev, currentItem.id];
    });
    if (!sessionReviewedIds.includes(currentItem.id)) {
        setSessionReviewedIds(prev => [...prev, currentItem.id]);
    }

    if (currentUser) {
      try {
        const progressRef = doc(db, 'users', currentUser.uid, 'progress', COURSE_ID);
        
        // Read latest data to avoid race conditions and ensure data integrity
        const snap = await getDoc(progressRef);
        const current = snap.exists() ? (snap.data() as any) : null;
        const currentIds: string[] = current?.learnedItemIds || [];
        
        // Add new ID if not present
        let updatedIds = [...currentIds];
        if (!updatedIds.includes(String(currentItem.id))) {
            updatedIds.push(String(currentItem.id));
        }

        const isFinished = items.length > 0 && updatedIds.length >= items.length;

        await setDoc(progressRef, {
          userId: currentUser.uid,
          courseId: COURSE_ID,
          learnedItemIds: updatedIds,
          isFinished,
          lastUpdated: serverTimestamp(),
          createdAt: current?.createdAt || serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.error("Error saving progress:", e);
      }
    }

    if (currentIndex < sessionItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishSession();
    }
  };

  const handleLearned = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm("Are you sure you want to mark this item as learned?");
      if (confirmed) {
        confirmLearned();
      }
    } else {
      Alert.alert(
        "Mark as Learned",
        "Are you sure you want to mark this item as learned?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Confirm", 
            onPress: confirmLearned
          }
        ]
      );
    }
  };

  const finishSession = () => {
    setIsSessionFinished(true);
  };

  if (loading || !progressLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#F24822" />
        <Text className="mt-4 text-muted-foreground">Loading course...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-background p-6">
        <Text className="text-destructive text-center mb-4">{error}</Text>
        <Button 
          onPress={router.back} 
          variant="secondary"
          title="Go Back"
          className="px-6 py-3"
        />
      </View>
    );
  }

  // Gameplay View
  if (isSessionFinished) {
    return (
      <CompletionScreen
        sessionLearnedCount={sessionLearnedIds.length}
        totalLearnedCount={learnedIds.length}
        totalItemsCount={items.length}
        onContinue={startGameplay}
        onExit={() => router.back()}
      />
    );
  }

  if (isGameplayActive) {
    if (sessionItems.length > 0) {
      const currentItem = sessionItems[currentIndex];
    
      return (
      <View className="flex-1 bg-background safe-area-view">
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* Header */}
        <View className="bg-card border-b border-border">
          <View className="flex-row items-center p-4 w-full max-w-[640px] self-center">
            <CloseButton onPress={() => setIsGameplayActive(false)} />
            <View className="flex-1 mx-2">
              <ProgressBar 
                current={currentIndex} 
                total={sessionItems.length} 
                height={8}
              />
            </View>
            <View className="w-8" />
          </View>
        </View>

        {/* Card Area */}
        <CardTransition key={currentIndex} className="flex-1 p-6 justify-center w-full max-w-[640px] self-center">
            <FlashcardWord 
                word={currentItem}
                onNext={handleNext}
                onLearned={handleLearned}
            />
        </CardTransition>
      </View>
    );
  }
  }

  // Intro/Summary View
  const progressPercent = items.length > 0 ? Math.round((learnedIds.length / items.length) * 100) : 0;
  const isFinished = items.length > 0 && learnedIds.length >= items.length;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ 
        title: LEVEL_TITLE,
        headerBackTitle: 'Learn',
      }} />
      
      <ScrollView className="flex-1">
        <View className="w-full max-w-[640px] self-center p-6">
          <View className="items-center mb-8 mt-4">
           <View className="w-24 h-24 mb-4">
             <Image 
                source={imageMap[LEVEL_ICON] || require('../../assets/images/icon.png')} 
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
             />
           </View>
           <Text className="text-2xl font-bold text-foreground mb-2">{LEVEL_TITLE}</Text>
           <Text className="text-muted-foreground text-center">{LEVEL_DESCRIPTION}</Text>
        </View>

        <View className="bg-card p-6 rounded-2xl border-2 border-border mb-8">
            <View className="flex-row justify-between items-end mb-2">
                <Text className="text-muted-foreground font-medium">Progress</Text>
                <Text className="text-2xl font-bold text-primary">{progressPercent}%</Text>
            </View>
            <ProgressBar current={learnedIds.length} total={items.length} width="100%" height={12} />
            <Text className="text-center text-muted-foreground mt-2 text-sm">
                {learnedIds.length} / {items.length} items learned
            </Text>
        </View>

        {isFinished ? (
                <View className="items-center">
                <Text className="text-xl font-bold text-success mb-2">Course Completed!</Text>
                <Text className="text-muted-foreground text-center mb-6">You have mastered all words in this course.</Text>
                
                <Button 
                    variant="primary"
                    className="mt-6 bg-success border-success border-b-[#3a8a00] w-full"
                    textClassName="text-white"
                    title="Review Course"
                    onPress={startReviewSession}
                    size="lg"
                />
            </View>
        ) : (
            <Button 
                variant="primary"
                size="lg"
                title="Start Session"
                onPress={startGameplay}
                className="w-full"
            />
        )}
        </View>
      </ScrollView>
    </View>
  );
}
