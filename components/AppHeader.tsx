import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View, Pressable } from 'react-native';

type Props = {
  navigation: any;
  options: any;
  back?: { title?: string; href?: string };
};

export default function AppHeader({ navigation, options, back }: Props) {
  return (
    <View className="bg-card border-b border-border">
      <View className="flex-row items-center p-4 w-full max-w-[640px] self-center">
        {navigation.canGoBack() && (
          <Pressable
            onPress={() => navigation.goBack()}
            className="p-2 mr-5 min-h-0 h-auto w-auto"
          >
            <Ionicons name="chevron-back" size={22} color={Colors.icon} />
          </Pressable>
        )}
        <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
          {options.title ?? ''}
        </Text>
      </View>
    </View>
  );
}
