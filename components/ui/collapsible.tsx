import Button from '@/components/Button';
import { PropsWithChildren, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Button
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}
        variant="default"
        className="min-h-0 h-auto bg-transparent border-0 p-0 w-auto"
      >
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={Colors.icon}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <Text style={styles.titleText}>{title}</Text>
      </Button>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
  titleText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: Colors.text,
  },
});
