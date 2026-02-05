import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import Button from './Button';

type Props = {
  navigation: any;
  options: any;
  back?: { title?: string; href?: string };
};

export default function AppHeader({ navigation, options, back }: Props) {
  return (
    <View className="bg-background border-b border-border">
      <View className="w-full max-w-[640px] self-center px-4 py-3 flex-row items-center gap-2">
        {navigation.canGoBack() && (
          <Button
            onPress={() => navigation.goBack()}
            variant="default"
            className="min-h-0 h-auto w-auto bg-transparent border-0 p-2"
          >
            <Ionicons name="chevron-back" size={22} color={Colors.icon} />
          </Button>
        )}
        <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
          {options.title ?? ''}
        </Text>
      </View>
    </View>
  );
}
