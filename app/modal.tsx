import Button from '@/components/Button';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <View className="w-full max-w-md bg-card p-8 rounded-3xl border-2 border-b-4 border-border items-center">
        <Text className="text-2xl font-bold text-foreground mb-4">This is a modal</Text>
        <Text className="text-muted-foreground text-center mb-8 text-lg">
          This screen is presented as a modal using Expo Router.
        </Text>
        
        <Link href="../" asChild>
          <Button
            variant="primary"
            size="lg"
            title="Dismiss"
            className="w-full"
          />
        </Link>
      </View>
    </View>
  );
}
