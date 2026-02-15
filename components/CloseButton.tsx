import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable } from 'react-native';

interface CloseButtonProps {
  onPress: () => void;
}

export default function CloseButton({ onPress }: CloseButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="p-2 mr-5 min-h-0 h-auto w-auto"
    >
      <Ionicons name="close" size={24} color="#64748B" />
    </Pressable>
  );
}
