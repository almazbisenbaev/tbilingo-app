import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const performLogout = async () => {
    try {
      setLoading(true);
      await logout();
      router.replace('/');
    } catch {
      Alert.alert("Error", "Failed to log out");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm("Are you sure you want to sign out?") : true;
      if (confirmed) {
        performLogout();
      }
      return;
    }

    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: performLogout
        }
      ]
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-muted-foreground text-lg text-center">Please log in to view settings.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-6 w-full max-w-[640px] self-center">
        <Text className="text-3xl font-bold mb-8 text-foreground">Settings</Text>
        
        <View className="mb-8 bg-card p-4 rounded-2xl border-2 border-b-4 border-border">
          <Text className="text-muted-foreground mb-1 text-sm uppercase tracking-wider">Signed in as</Text>
          <Text className="text-xl font-semibold text-foreground">{currentUser.email}</Text>
        </View>

        <Button 
          variant="default"
          size="lg"
          title="Sign Out"
          onPress={handleLogout}
          loading={loading}
          className="bg-destructive/10 border-destructive/20 border-b-destructive/30"
          textClassName="text-destructive"
        />

        <View className="mt-auto items-center mb-4">
          <Text className="text-muted-foreground text-sm">Author: <a target="_blank" href="https://www.threads.com/@almazbisenbaev">Almaz Bisenbaev</a></Text>
          <Text className="text-muted-foreground/50 text-xs mt-1">v1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
