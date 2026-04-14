import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../../components/ui/AppText';

type DriverProfileSectionHeaderProps = {
  onBack?: () => void;
};

export function DriverProfileSectionHeader({ onBack }: DriverProfileSectionHeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.row}>
        <View style={styles.leftWrap}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : undefined]}>
              <ArrowLeft color="#f8fafc" size={18} />
            </Pressable>
          ) : null}

          <View style={styles.brandRow}>
            <AppText variant="xxl" style={styles.switchText}>
              Switch
            </AppText>
            <AppText variant="xxl" style={styles.driverText}>
              Driver
            </AppText>
          </View>
        </View>

        <View style={styles.languageWrap}>
          <View style={styles.flagTrack}>
            <View style={styles.flagStripe} />
          </View>
          <AppText variant="label" style={styles.languageText}>
            EN
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#000000'
  },
  row: {
    minHeight: 94,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  leftWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    flex: 1,
    marginRight: 12
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.28)',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 1
  },
  switchText: {
    color: '#004f57',
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '800'
  },
  driverText: {
    color: '#f8fafc',
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '800'
  },
  languageWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  flagTrack: {
    width: 82,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#1f6f38',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  flagStripe: {
    width: 24,
    height: '100%',
    backgroundColor: '#e5e7eb'
  },
  languageText: {
    color: '#f8fafc',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800'
  },
  pressed: {
    opacity: 0.82
  }
});
