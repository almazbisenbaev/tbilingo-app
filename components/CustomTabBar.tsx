import React from 'react';
import { View } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';

export default function CustomTabBar(props: any) {
  return (
    <View className="w-full self-center">
      <BottomTabBar {...props} />
    </View>
  );
}
