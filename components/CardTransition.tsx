import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

interface CardTransitionProps {
  children: React.ReactNode;
  className?: string;
  style?: object;
}

/**
 * Wrap flashcard content with this component and pass key={currentIndex}
 * from the parent to trigger a slide + fade transition between cards.
 * The outer View handles layout; the inner Animated.View handles animation.
 */
const CardTransition: React.FC<CardTransitionProps> = ({ children, className, style }) => {
  return (
    <View className={className} style={style}>
      <Animated.View
        entering={FadeInRight.duration(260)}
        exiting={FadeOutLeft.duration(180)}
        style={{ flex: 1 }}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export default CardTransition;
