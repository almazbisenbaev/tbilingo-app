import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const router = useRouter();

  const performLogout = async () => {
    try {
      setLoading(true);
      setShowSignOutModal(false);
      await logout();
      router.replace('/');
    } catch {
      setShowSignOutModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowSignOutModal(true);
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
      {/* Sign Out Confirmation Modal */}
      <Modal
        transparent
        visible={showSignOutModal}
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowSignOutModal(false)}
        >
          <Pressable
            onPress={() => {}}
            className="bg-card rounded-3xl p-6 mx-6 w-full max-w-sm border-2 border-border"
          >
            <Text className="text-2xl font-bold text-foreground mb-2 text-center">Sign Out</Text>
            <Text className="text-muted-foreground text-base text-center mb-6">
              Are you sure you want to sign out?
            </Text>
            <View className="gap-3">
              <Button
                variant="black"
                size="lg"
                title="Sign Out"
                onPress={performLogout}
                loading={loading}
              />
              <Button
                variant="default"
                size="lg"
                title="Cancel"
                onPress={() => setShowSignOutModal(false)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <View className="flex-1 p-6 w-full max-w-[640px] self-center">
        <Text className="text-3xl font-bold mb-8 text-foreground">Settings</Text>
        
        <View className="mb-8 bg-card p-4 rounded-2xl border-2 border-border">
          <Text className="text-muted-foreground mb-1 text-sm uppercase tracking-wider">Signed in as</Text>
          <Text className="text-xl font-semibold text-foreground">{currentUser.email}</Text>
        </View>

        <Button 
          variant="black"
          size="lg"
          title="Sign Out"
          onPress={handleLogout}
          loading={loading}
          className=""
          textClassName=""
        />

        <View className="mt-auto items-center mb-4">
          <Text className="text-muted-foreground text-sm">Author: <a target="_blank" href="https://www.threads.com/@almazbisenbaev">Almaz Bisenbaev</a></Text>
          <Text className="text-muted-foreground/50 text-xs mt-1">v1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
