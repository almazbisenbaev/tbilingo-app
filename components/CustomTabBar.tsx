import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

const TAB_BAR_PADDING = 6;
const TAB_GAP = 10;

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [layoutWidth, setLayoutWidth] = useState(0);
  const activeIndex = useRef(new Animated.Value(state.index)).current;

  const activeDescriptor = descriptors[state.routes[state.index]?.key];
  const activeStyle = activeDescriptor?.options?.tabBarStyle as { display?: string } | undefined;
  const isHidden = activeStyle?.display === 'none';

  const tabCount = state.routes.length;
  const tabWidth = useMemo(() => {
    if (!layoutWidth || tabCount === 0) return 0;
    return (layoutWidth - TAB_BAR_PADDING * 2 - TAB_GAP * (tabCount - 1)) / tabCount;
  }, [layoutWidth, tabCount]);

  useEffect(() => {
    Animated.spring(activeIndex, {
      toValue: state.index,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  }, [activeIndex, state.index]);

  if (isHidden) return null;

  const indicatorTranslateX = activeIndex.interpolate({
    inputRange: [0, Math.max(1, tabCount - 1)],
    outputRange: [0, (tabWidth + TAB_GAP) * Math.max(0, tabCount - 1)],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(10, insets.bottom) }]}
      pointerEvents="box-none"
    >
      <View
        style={styles.bar}
        onLayout={(event) => setLayoutWidth(event.nativeEvent.layout.width)}
      >
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.activePill,
              {
                width: tabWidth,
                transform: [{ translateX: indicatorTranslateX }],
              },
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const labelOption = options.tabBarLabel ?? options.title ?? (route.name.charAt(0).toUpperCase() + route.name.slice(1));
          const label = typeof labelOption === 'string' ? labelOption : route.name;
          const isFocused = state.index === index;
          const activeTint = options.tabBarActiveTintColor ?? Colors.tint;
          const inactiveTint = options.tabBarInactiveTintColor ?? '#AB9C94';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const scale = activeIndex.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0.94, 1.08, 0.94],
            extrapolate: 'clamp',
          });
          const labelOpacity = activeIndex.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0.55, 1, 0.55],
            extrapolate: 'clamp',
          });
          const labelTranslateY = activeIndex.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [2, 0, 2],
            extrapolate: 'clamp',
          });

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabButton, { width: tabWidth, marginRight: index === tabCount - 1 ? 0 : TAB_GAP }]}
            >
              <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}
              >
                {options.tabBarIcon?.({
                  focused: isFocused,
                  color: isFocused ? activeTint : inactiveTint,
                  size: 26,
                })}
              </Animated.View>
              <Animated.Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? activeTint : inactiveTint,
                    opacity: labelOpacity,
                    transform: [{ translateY: labelTranslateY }],
                  },
                ]}
              >
                {label}
              </Animated.Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: TAB_BAR_PADDING,
    borderRadius: 22,
    backgroundColor: '#EBE3DD',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activePill: {
    position: 'absolute',
    left: TAB_BAR_PADDING,
    top: TAB_BAR_PADDING,
    bottom: TAB_BAR_PADDING,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconWrap: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
