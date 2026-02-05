import React from 'react';
import { View, Text } from 'react-native';
import { ProgressBarProps } from '@/types';

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  showNumbers = false,
  width = '100%',
  height = 6
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <View className="flex-col" style={{ width: width as any }}>
      <View className="bg-muted rounded-full overflow-hidden border-2 border-muted" style={{ height }}>
        <View
          className="bg-primary h-full rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>
      {showNumbers && (
        <Text className="text-xs text-muted-foreground mt-1">
          {current} / {total}
        </Text>
      )}
    </View>
  );
};

export default ProgressBar;
