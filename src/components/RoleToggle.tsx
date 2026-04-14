import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { appColors } from '../theme/colors';
import { AppText } from './ui/AppText';
import { UserRole } from '../types/auth';

type Props = {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
  variant?: 'light' | 'dark';
};

const roleOrder: UserRole[] = ['passenger', 'driver'];

export function RoleToggle({ value, onChange, disabled = false, variant = 'light' }: Props) {
  const isDark = variant === 'dark';

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      {roleOrder.map((role) => {
        const selected = role === value;

        return (
          <Pressable
            key={role}
            onPress={() => onChange(role)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.option,
              selected
                ? isDark
                  ? styles.optionSelectedDark
                  : styles.optionSelectedLight
                : isDark
                  ? styles.optionIdleDark
                  : styles.optionIdleLight,
              pressed && !disabled ? styles.optionPressed : undefined,
              disabled ? styles.optionDisabled : undefined
            ]}>
            <AppText
              variant="label"
              style={[
                styles.label,
                selected
                  ? isDark
                    ? styles.labelSelectedDark
                    : styles.labelSelectedLight
                  : isDark
                    ? styles.labelIdleDark
                    : styles.labelIdleLight
              ]}>
              {role === 'driver' ? 'Driver' : 'Passenger'}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden'
  },
  containerLight: {
    borderColor: appColors.borderLight,
    backgroundColor: appColors.surfaceLight
  },
  containerDark: {
    borderColor: appColors.borderDark,
    backgroundColor: appColors.surfaceDark
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12
  },
  optionSelectedLight: {
    backgroundColor: appColors.textDark
  },
  optionSelectedDark: {
    backgroundColor: appColors.primary
  },
  optionIdleLight: {
    backgroundColor: appColors.surfaceLight
  },
  optionIdleDark: {
    backgroundColor: appColors.surfaceDark
  },
  optionPressed: {
    opacity: 0.85
  },
  optionDisabled: {
    opacity: 0.6
  },
  labelSelectedLight: {
    color: appColors.textLight
  },
  labelSelectedDark: {
    color: '#04261f'
  },
  labelIdleLight: {
    color: appColors.textDark
  },
  labelIdleDark: {
    color: appColors.textLight
  },
  label: {
    fontSize: 14
  }
});
