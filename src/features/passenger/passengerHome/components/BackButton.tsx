import React from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { styles } from '../styles';

type BackButtonProps = {
  onPress: () => void;
};

export function BackButton({ onPress }: BackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.roundButton,
        pressed ? styles.pressed : undefined,
      ]}
    >
      <ArrowLeft color="#dbeafe" size={18} />
    </Pressable>
  );
}
