import React from 'react';
import { View } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';

export default function CustomTabBar(props: any) {
  return (
    <View className="w-full">
      <View className="w-full max-w-[640px] self-center">
        <BottomTabBar {...props} />
      </View>
    </View>
  );
}
