import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const SPARK_COLORS = ['#22C55E', '#16A34A', '#4ADE80', '#86EFAC', '#15803D', '#BBF7D0'];
const PARTICLE_COUNT = 32;

interface ParticleConfig {
  angle: number;
  distance: number;
  color: string;
  delay: number;
  size: number;
}

// Pre-generate particle configs once (evenly spread + slight jitter)
const PARTICLES: ParticleConfig[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const base = (i / PARTICLE_COUNT) * Math.PI * 2;
  const jitter = (((i * 7 + 3) % 5) / 5 - 0.5) * 0.5; // deterministic jitter
  const angle = base + jitter;
  return {
    angle,
    distance: 160 + ((i * 17) % 100), // 160–260px
    color: SPARK_COLORS[i % SPARK_COLORS.length],
    delay: (i * 9) % 80,              // 0–80ms stagger
    size: 8 + ((i * 5) % 16),         // 8–23px circles
  };
});

// ─── Single particle ─────────────────────────────────────────────────────────

interface ParticleProps {
  config: ParticleConfig;
  onComplete?: () => void;
}

function Particle({ config, onComplete }: ParticleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withTiming(
        1,
        { duration: 750, easing: Easing.out(Easing.cubic) },
        finished => {
          if (finished && onComplete) runOnJS(onComplete)();
        },
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => {
    const tx = Math.cos(config.angle) * config.distance * progress.value;
    const ty = Math.sin(config.angle) * config.distance * progress.value;
    // Fade out in the second half of the animation
    const opacity = progress.value < 0.4
      ? 1
      : 1 - (progress.value - 0.4) / 0.6;

    return {
      opacity,
      transform: [{ translateX: tx }, { translateY: ty }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: config.size,
          height: config.size,
          backgroundColor: config.color,
          borderRadius: config.size / 2,
        },
        animStyle,
      ]}
    />
  );
}

// ─── Burst container ─────────────────────────────────────────────────────────

interface SparkBurstProps {
  /** When true the burst is mounted and plays immediately. Unmount to reset. */
  visible: boolean;
  onComplete?: () => void;
}

export default function SparkBurst({ visible, onComplete }: SparkBurstProps) {
  if (!visible) return null;

  // Only the last particle fires onComplete so we don't call it multiple times
  const lastIndex = PARTICLES.length - 1;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Center point from which all particles originate */}
      <View style={styles.origin}>
        {PARTICLES.map((config, i) => (
          <Particle
            key={i}
            config={config}
            onComplete={i === lastIndex ? onComplete : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  origin: {
    position: 'absolute',
    // Roughly vertically centered in the card
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },
});
