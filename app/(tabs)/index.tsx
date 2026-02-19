import Button from '@/components/Button';
import LevelLink from '@/components/LevelLink';
import { LEVELS } from '@/constants/levels';
import { useAuth } from '@/contexts/AuthContext';
import { auth, db } from '@/firebaseConfig';
import { LevelType } from '@/types';
import { imageMap } from '@/utils/imageMap';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Image } from 'expo-image';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, onSnapshot, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
  const { currentUser, login, signup, resetPassword } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
 
  
  // Data state
  const [levelsData, setLevelsData] = useState<Record<string, {
    totalItems: number;
    learnedItems: number;
    isCompleted: boolean;
    loading: boolean;
    type?: LevelType;
    title?: string;
    description?: string;
    icon?: string;
  }>>({});
  const [globalLoading, setGlobalLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    setGlobalLoading(true);

    const newLevelsData: typeof levelsData = {};

    await Promise.all(LEVELS.map(async (level) => {
      try {
        const targetCourseId = level.courseId || level.id;
        const levelDocRef = doc(db, 'courses', targetCourseId);
        const levelDocSnap = await getDoc(levelDocRef);

        let levelType = level.type;
        let levelTitle = level.title;
        let levelDescription: string | undefined = undefined;
        let levelIcon = level.icon;

        if (levelDocSnap.exists()) {
          const levelData = levelDocSnap.data();
          if (levelData.title) {
            levelTitle = levelData.title as string;
          }
          if (levelData.description) {
            levelDescription = levelData.description as string;
          }
          if (levelData.icon) {
            levelIcon = levelData.icon as string;
          }
          if (levelData.type) {
            levelType = levelData.type as LevelType;
          }
        }

        const itemsRef = collection(db, 'courses', targetCourseId, 'items');
        const q = query(itemsRef);
        const snapshot = await getDocs(q);
        const totalItems = snapshot.docs.length;

        let learnedItems = 0;
        try {
          const progressRef = doc(db, 'users', currentUser.uid, 'progress', targetCourseId);
          const progressSnap = await getDoc(progressRef);
          
          if (progressSnap.exists()) {
            const data = progressSnap.data();
            if (data.learnedItemIds && Array.isArray(data.learnedItemIds)) {
                learnedItems = data.learnedItemIds.length;
            }
          }
        } catch (e) {
          console.error(`Error fetching progress for ${targetCourseId}:`, e);
        }

        newLevelsData[level.id] = {
          totalItems,
          learnedItems,
          isCompleted: totalItems > 0 && learnedItems >= totalItems,
          loading: false,
          type: levelType,
          title: levelTitle,
          description: levelDescription,
          icon: levelIcon,
        };
      } catch (error) {
        console.error(`Error fetching items for level ${level.id}:`, error);
        newLevelsData[level.id] = {
            totalItems: 0,
            learnedItems: 0,
            isCompleted: false,
            loading: false,
            type: level.type,
            title: level.title,
            icon: level.icon
        };
      }
    }));

    setLevelsData(newLevelsData);
    setGlobalLoading(false);
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useFocusEffect(
    useCallback(() => {
      if (!currentUser) return;
      const unsubscribers: Array<() => void> = [];

      LEVELS.forEach((level) => {
        const targetCourseId = level.courseId || level.id;
        const progressRef = doc(db, 'users', currentUser.uid, 'progress', targetCourseId);
        const unsubscribe = onSnapshot(progressRef, (progressSnap) => {
          let learnedItems = 0;
          if (progressSnap.exists()) {
            const data = progressSnap.data();
            if (data.learnedItemIds && Array.isArray(data.learnedItemIds)) {
              learnedItems = data.learnedItemIds.length;
            }
          }

          setLevelsData((prev) => {
            const prevLevel = prev[level.id];
            const totalItems = prevLevel?.totalItems ?? 0;
            return {
              ...prev,
              [level.id]: {
                totalItems,
                learnedItems,
                isCompleted: totalItems > 0 && learnedItems >= totalItems,
                loading: false,
                type: prevLevel?.type ?? level.type,
                title: prevLevel?.title ?? level.title,
                description: prevLevel?.description,
                icon: prevLevel?.icon ?? level.icon,
              },
            };
          });
        });
        unsubscribers.push(unsubscribe);
      });

      return () => {
        unsubscribers.forEach((u) => u());
      };
    }, [currentUser])
  );

  useEffect(() => {
    if (Platform.OS !== 'web' && webClientId) {
      GoogleSignin.configure({
        webClientId,
      });
    }
  }, [webClientId]);

 

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address first");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      Alert.alert("Success", "Password reset email sent! Check your inbox.");
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert("Error", "No account found with this email address");
      } else {
        Alert.alert("Error", "Failed to send reset email. Please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
          await signInWithPopup(auth, provider);
        } catch {
          await signInWithRedirect(auth, provider);
        }
      } else {
        if (typeof (GoogleSignin as any)?.signIn !== 'function') {
          Alert.alert(
            'Google Sign-In not available',
            'Use a development build to test Google Sign-In on Android.'
          );
          return;
        }
        await GoogleSignin.hasPlayServices();
        await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();
        const credential = GoogleAuthProvider.credential(tokens.idToken);
        await signInWithCredential(auth, credential);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

 

  if (!currentUser) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="">
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center"
        >
          <View className="w-full max-w-[640px] self-center px-6">
            <View className="items-center mb-10">
            <Image 
                source={imageMap['/images/logo.svg']} 
                style={{ width: 200, height: 80 }} 
                contentFit="contain" 
            />
            <Text className="text-xl font-bold mt-4 text-foreground">
              {authMode === 'login' ? 'Welcome Back!' : 'Create Account'}
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-muted-foreground mb-1 ml-1">Email</Text>
              <TextInput
                className="w-full bg-white border border-border rounded-xl p-4 text-lg font-medium text-foreground outline-none"
                placeholder="hello@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#737373"
              />
            </View>
            
            <View className="mt-4">
              <Text className="text-muted-foreground mb-1 ml-1">Password</Text>
              <TextInput
                className="w-full bg-white border border-border rounded-xl p-4 text-lg font-medium text-foreground outline-none"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#737373"
              />
            </View>

            {authMode === 'login' && (
              <Button 
                onPress={handleForgotPassword} 
                className="mt-2 items-end min-h-0 h-auto bg-transparent border-0 p-0"
                variant="default"
              >
                <Text className="text-primary font-semibold">Forgot Password?</Text>
              </Button>
            )}

            <Button
              variant="primary"
              size="lg"
              title={authMode === 'login' ? 'Sign In' : 'Sign Up'}
              onPress={handleAuth}
              loading={loading}
              className="mt-6 w-full"
            />

            {authMode === 'login' && (
              <Button
                variant="black"
                size="lg"
                title="Continue with Google"
                onPress={handleGoogleLogin}
                loading={googleLoading}
                className="mt-4 w-full"
              />
            )}

 

            <View className="flex-row justify-center mt-6">
              <Text className="text-muted-foreground">
                {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              </Text>
              <Button 
                onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="min-h-0 h-auto bg-transparent border-0 p-0"
                variant="default"
              >
                <Text className="text-primary font-bold">
                  {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Button>
            </View>
          </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (globalLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#F24822" />
        <Text className="text-muted-foreground mt-4">Loading your progress...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="w-full max-w-[640px] self-center px-4 py-8">
        <View className="items-center mb-12 mt-4">
          <Image 
            source={imageMap['/images/logo.svg']} 
            style={{ width: 120, height: 44 }} 
            contentFit="contain" 
          />
          {(() => {
            const displayName = currentUser?.displayName?.trim();
            const emailName = currentUser?.email ? currentUser.email.split('@')[0] : undefined;
            const nameToShow = displayName && displayName.length > 0 ? displayName : emailName;
            return (
              <Text className="text-muted-foreground mt-3">
                {`Welcome back${nameToShow ? `, ${nameToShow}` : ''}`}
              </Text>
            );
          })()}
        </View>

        {LEVELS.map((level) => {
          const data = levelsData[level.id];
          const isCompleted = data?.isCompleted || false;
          
          // Determine if locked
          let isLocked = false;
          if (level.requiredLevelId) {
             const requiredData = levelsData[level.requiredLevelId];
             // It is locked if required level is not completed
             // BUT, for testing/first run, we might need to handle empty data.
             // If requiredData is missing, assume locked.
             if (!requiredData || !requiredData.isCompleted) {
                 isLocked = true;
             }
          }

          return (
            <LevelLink
              key={level.id}
              href={`/learn/${level.id}` as any} // We need to create this route
              title={data?.title || level.title}
              icon={data?.icon || level.icon}
              disabled={false}
              locked={isLocked}
              isCompleted={isCompleted}
              progress={data?.totalItems ? (data.learnedItems / data.totalItems) * 100 : 0}
              totalItems={data?.totalItems || 0}
              completedItems={data?.learnedItems || 0}
              onLockedClick={() => {
                 Alert.alert("Level Locked", `Complete "${level.requiredLevelTitle}" to unlock this level.`);
              }}
            />
          );
        })}
        </View>

        <View className="w-full max-w-[640px] self-center mb-10">
          <View className="p-6 items-center">
            <Text className="text-xl text-center">
              More levels are on the way. Stay tuned!
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
