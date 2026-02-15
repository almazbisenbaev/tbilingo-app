import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import CompletionScreen from '../../components/CompletionScreen';
import FlashcardPhrase from '../../components/FlashcardPhrase';
import ProgressBar from '../../components/ProgressBar';
import { useAuth } from '../../contexts/AuthContext';
import { auth, db } from '../../firebaseConfig';
import { PhraseItem, PhraseMemory } from '../../types';
import { imageMap } from '../../utils/imageMap';
import { shuffleArray } from '../../utils/shuffle-array';

const COURSE_ID = 'pronouns-2';
const LEVEL_TITLE = 'Pronouns 2';
const LEVEL_DESCRIPTION = 'More practice with Georgian pronouns using phrase construction';
const LEVEL_ICON = '/images/icon-phrases.svg';

export default function LevelPronouns2Screen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const [items, setItems] = useState<PhraseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [learnedIds, setLearnedIds] = useState<number[]>([]);
  const [phrasesMemory, setPhrasesMemory] = useState<Record<number, PhraseMemory>>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  
  const [isGameplayActive, setIsGameplayActive] = useState(false);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [sessionItems, setSessionItems] = useState<PhraseItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionLearnedIds, setSessionLearnedIds] = useState<number[]>([]); 
  const [sessionReviewedIds, setSessionReviewedIds] = useState<number[]>([]);

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
            latin: data.latin || '',
            fakeWords: Array.isArray(data.fakeWords) ? data.fakeWords : [],
            ...data
          } as PhraseItem;
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

          const itemProgress = data.itemProgress || {};
          setPhrasesMemory(prev => {
              const newMemory = { ...prev };
              Object.keys(itemProgress).forEach(key => {
                  const id = parseInt(key);
                  const isLearned = savedLearnedIds.includes(id);
                  let correct = itemProgress[key] || 0;
                  if (isLearned) correct = 3;
                  newMemory[id] = { correctAnswers: correct, isLearned };
              });
              return newMemory;
          });
        } else {
          setLearnedIds([]);
          setPhrasesMemory({});
        }
        setProgressLoaded(true);
      } catch (err) {
        console.error("Error fetching progress:", err);
      }
    };

    fetchProgress();
  }, [currentUser]);

  useEffect(() => {
      if (items.length > 0 && progressLoaded) {
          setPhrasesMemory(prev => {
              const nextMemory = { ...prev };
              items.forEach(item => {
                  if (!nextMemory[item.id]) {
                       const isLearned = learnedIds.includes(item.id);
                       nextMemory[item.id] = { correctAnswers: isLearned ? 3 : 0, isLearned };
                  }
              });
              return nextMemory;
          });
      }
  }, [items, progressLoaded, learnedIds]);

  const startGameplay = () => {
    const unlearnedItems = items.filter(item => !learnedIds.some(id => String(id) === String(item.id)));
    
    if (unlearnedItems.length === 0) {
      Alert.alert(
        "Course Completed", 
        "You have learned all phrases in this course! Starting a review session.",
        [
            { text: "OK", onPress: () => startReviewSession() }
        ]
      );
      return;
    }

    const shuffled = shuffleArray(unlearnedItems);
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

  const handlePhraseCorrect = async () => {
      const currentItem = sessionItems[currentIndex];
      const currentMemory = phrasesMemory[currentItem.id] || { correctAnswers: 0, isLearned: false };
      const nextCorrect = Math.min(3, currentMemory.correctAnswers + 1);
      const nextLearned = nextCorrect >= 3;

      setPhrasesMemory(prev => ({
          ...prev,
          [currentItem.id]: { correctAnswers: nextCorrect, isLearned: nextLearned }
      }));

      if (nextLearned && !learnedIds.includes(currentItem.id)) {
          setLearnedIds(prev => [...prev, currentItem.id]);
          setSessionLearnedIds(prev => [...prev, currentItem.id]);
      }
      
      if (!sessionReviewedIds.includes(currentItem.id)) {
        setSessionReviewedIds(prev => [...prev, currentItem.id]);
      }

      if (currentUser) {
          try {
              const progressRef = doc(db, 'users', currentUser.uid, 'progress', COURSE_ID);
              
              const snap = await getDoc(progressRef);
              const currentDoc = snap.exists() ? (snap.data() as any) : null;
              const currentIds: string[] = currentDoc?.learnedItemIds || [];
              const currentItemProgress = currentDoc?.itemProgress || {};

              let updatedIds = [...currentIds];
              if (nextLearned) {
                  if (!updatedIds.includes(String(currentItem.id))) {
                      updatedIds.push(String(currentItem.id));
                  }
              }

              const updatedItemProgress = { ...currentItemProgress, [String(currentItem.id)]: nextCorrect };

              const isFinished = currentDoc?.isFinished === true || (items.length > 0 && updatedIds.length >= items.length);

              await setDoc(progressRef, {
                  userId: currentUser.uid,
                  courseId: COURSE_ID,
                  learnedItemIds: updatedIds,
                  itemProgress: updatedItemProgress,
                  isFinished,
                  lastUpdated: serverTimestamp(),
                  createdAt: currentDoc?.createdAt || serverTimestamp()
              }, { merge: true });
          } catch (e) {
              console.error("Error saving progress:", e);
          }
      }
  };

  const handlePhraseWrong = async () => {
      const currentItem = sessionItems[currentIndex];
      const currentMemory = phrasesMemory[currentItem.id] || { correctAnswers: 0, isLearned: false };
      const nextCorrect = Math.max(0, currentMemory.correctAnswers - 1);
      const nextLearned = nextCorrect >= 3;
      
      setPhrasesMemory(prev => ({
          ...prev,
          [currentItem.id]: { correctAnswers: nextCorrect, isLearned: nextLearned }
      }));

      if (!nextLearned && learnedIds.includes(currentItem.id)) {
          setLearnedIds(prev => prev.filter(id => id !== currentItem.id));
          setSessionLearnedIds(prev => prev.filter(id => id !== currentItem.id));
      }

      if (auth.currentUser) {
          try {
              const progressRef = doc(db, 'users', auth.currentUser.uid, 'progress', COURSE_ID);
              
              const snap = await getDoc(progressRef);
              const currentDoc = snap.exists() ? (snap.data() as any) : null;
              const currentIds: string[] = currentDoc?.learnedItemIds || [];
              const currentItemProgress = currentDoc?.itemProgress || {};

              let updatedIds = [...currentIds];
              if (!nextLearned) {
                   updatedIds = updatedIds.filter(id => id !== String(currentItem.id));
              }
              
              const updatedItemProgress = { ...currentItemProgress, [String(currentItem.id)]: nextCorrect };

              const isFinished = currentDoc?.isFinished === true || (items.length > 0 && updatedIds.length >= items.length);

              await setDoc(progressRef, {
                  userId: auth.currentUser.uid,
                  courseId: COURSE_ID,
                  learnedItemIds: updatedIds,
                  itemProgress: updatedItemProgress,
                  isFinished,
                  lastUpdated: serverTimestamp(),
                  createdAt: currentDoc?.createdAt || serverTimestamp()
              }, { merge: true });

          } catch (e) {
              console.error("Error saving progress (wrong answer):", e);
          }
      }
  };

  const finishSession = () => {
    setIsSessionFinished(true);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#F24822" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-background p-4">
        <Text className="text-destructive text-lg text-center mb-4">Error loading course</Text>
        <Text className="text-muted-foreground text-center mb-4">{error}</Text>
        <Button 
          className="px-6 py-3"
          variant="primary"
          onPress={() => router.back()}
          title="Go Back"
        />
      </View>
    );
  }

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

  if (isGameplayActive && sessionItems.length > 0) {
    const currentItem = sessionItems[currentIndex];
    
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        
        <View className="bg-card border-b border-border">
          <View className="flex-row items-center p-4 w-full max-w-[640px] self-center">
            <Button 
              onPress={() => setIsGameplayActive(false)} 
              className="p-2 mr-5 min-h-0 h-auto w-auto bg-transparent border-0" 
              variant="default"
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </Button>
            <View className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <View 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${((currentIndex) / sessionItems.length) * 100}%` }}
              />
            </View>
            <Text className="ml-5 font-semibold">
              {currentIndex + 1} / {sessionItems.length}
            </Text>
          </View>
        </View>

        <View className="flex-1 p-6 justify-center w-full max-w-[640px] self-center">
           <FlashcardPhrase
              phrase={currentItem}
              memory={phrasesMemory[currentItem.id] || { correctAnswers: 0, isLearned: false }}
              onNext={handleNext}
              onCorrectAnswer={handlePhraseCorrect}
              onWrongAnswer={handlePhraseWrong}
            />
        </View>
      </View>
    );
  }

  const progressPercent = items.length > 0 ? Math.round((learnedIds.length / items.length) * 100) : 0;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ 
        title: LEVEL_TITLE,
        headerShown: true,
        headerBackTitle: 'Back'
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
          <Text className="text-2xl font-bold text-foreground mb-2 text-center">{LEVEL_TITLE}</Text>
          <Text className="text-muted-foreground text-center">{LEVEL_DESCRIPTION}</Text>
        </View>

        <View className="bg-card p-6 rounded-2xl border-2 border-border mb-8">
          <View className="flex-row justify-between items-end mb-2">
            <Text className="text-sm font-medium text-muted-foreground">Course Progress</Text>
            <Text className="text-2xl font-bold text-primary">{progressPercent}%</Text>
          </View>
          
          <ProgressBar current={learnedIds.length} total={items.length} height={10} />
          
          <Text className="mt-3 text-center text-sm text-muted-foreground">
            {learnedIds.length} / {items.length} phrases learned
          </Text>
        </View>

        <Button
          variant="primary"
          size="lg"
          title={progressPercent === 100 ? 'Review All' : 'Start Learning'}
          onPress={startGameplay}
          className="w-full mb-4"
        />
        
        {progressPercent === 100 && (
           <Button 
             variant="default"
             size="lg"
             className="w-full border-primary/20"
             textClassName="text-primary"
             title="Practice Session"
             onPress={startReviewSession}
           />
        )}
        </View>
      </ScrollView>
    </View>
  );
}
