import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

import { appColors } from '../../theme/colors';
import { AppText } from './AppText';

type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
};

export function LoadingOverlay({
  visible,
  message = 'Please wait...',
}: LoadingOverlayProps) {
  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <AppText variant="label" style={styles.message}>
            {message}
          </AppText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 5, 7, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    minWidth: 220,
    maxWidth: 320,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: appColors.surfaceLight,
    borderWidth: 1,
    borderColor: appColors.borderLight,
  },
  message: {
    textAlign: 'center',
    color: appColors.textDark,
  },
});
