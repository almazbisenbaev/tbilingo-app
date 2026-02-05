import Button from '@/components/Button';
import { Colors } from '@/constants/theme';
import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

type DeferredPrompt = any;

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPrompt | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as DeferredPrompt);
      setVisible(true);
    };
    const onAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', onAppInstalled as EventListener);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', onAppInstalled as EventListener);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <View className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl shadow px-4 py-3 w-[95%] max-w-[560px]">
      <View className="flex-row items-center justify-between">
        <Text className="text-foreground font-semibold">Install this app</Text>
        <View className="flex-row gap-2">
          <Button
            onPress={handleInstall}
            variant="primary"
            className="min-h-0 h-auto w-auto px-3 py-2"
            title="Install"
          />
          <Button
            onPress={() => setVisible(false)}
            variant="default"
            className="min-h-0 h-auto w-auto px-3 py-2"
          >
            <Text style={{ color: Colors.text }}>Dismiss</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
