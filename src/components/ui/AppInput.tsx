import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';

import { appColors } from '../../theme/colors';
import { AppText } from './AppText';

type InputVariant = 'light' | 'dark';

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  hint?: string;
  error?: string | null;
  variant?: InputVariant;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function AppInput({
  label,
  hint,
  error,
  variant = 'light',
  leftAccessory,
  rightAccessory,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const isDark = variant === 'dark';

  const textColor = isDark ? appColors.textLight : appColors.textDark;
  const placeholderTextColor = isDark ? '#7e8793' : '#94a3b8';
  const borderColor = error ? appColors.danger : focused ? appColors.primary : isDark ? appColors.borderDark : appColors.borderLight;
  const backgroundColor = isDark ? appColors.backgroundDark : appColors.surfaceLight;

  return (
    <View style={containerStyle}>
      {label ? (
        <AppText variant="label" style={[styles.label, { color: textColor }]}>
          {label}
        </AppText>
      ) : null}
      <View style={[styles.shell, { borderColor, backgroundColor }]}>
        {leftAccessory ? (
          <View style={[styles.leftAccessory, { borderRightColor: isDark ? appColors.borderDark : appColors.borderLight }]}>
            {leftAccessory}
          </View>
        ) : null}
        <TextInput
          {...rest}
          style={[styles.input, { color: textColor }, inputStyle]}
          placeholderTextColor={placeholderTextColor}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {rightAccessory ? <View style={styles.rightAccessory}>{rightAccessory}</View> : null}
      </View>
      {error ? (
        <AppText variant="caption" style={styles.errorText}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={isDark ? appColors.textMuted : appColors.textSubtle} style={styles.hintText}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 10
  },
  shell: {
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 36,
    overflow: 'hidden'
  },
  leftAccessory: {
    width: 44,
    borderRightWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rightAccessory: {
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 0,
    textAlignVertical: 'center'
  },
  hintText: {
    marginTop: 8
  },
  errorText: {
    marginTop: 8,
    color: appColors.danger
  }
});
