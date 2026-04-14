import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { appColors } from '../../theme/colors';
import { AppText } from './AppText';

type ButtonVariant = 'green' | 'white' | 'danger' | 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';
type ButtonWidth = 'fullWidth' | 'medium';

type Props = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: ButtonWidth;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

const buttonColors = {
  green: {
    background: appColors.primary,
    border: appColors.primary,
    text: appColors.textLight,
  },
  white: {
    background: appColors.surfaceLight,
    border: appColors.borderLight,
    text: appColors.textDark,
  },
  danger: {
    background: appColors.danger,
    border: appColors.danger,
    text: appColors.textLight,
  },
} as const;

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  small: {
    height: 40,
    maxHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  medium: {
    height: 40,
    maxHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  large: {
    height: 40,
    maxHeight: 40,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
};

const widthStyles: Record<ButtonWidth, ViewStyle> = {
  fullWidth: {
    width: '100%',
  },
  medium: {
    width: 'auto',
    minWidth: 220,
    alignSelf: 'center',
  },
};

function resolveVariant(variant: ButtonVariant): keyof typeof buttonColors {
  if (variant === 'danger') {
    return 'danger';
  }

  if (variant === 'white' || variant === 'ghost') {
    return 'white';
  }

  return 'green';
}

export function AppButton({
  title,
  variant = 'green',
  size = 'medium',
  width = 'fullWidth',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  containerStyle,
  ...rest
}: Props) {
  const palette = buttonColors[resolveVariant(variant)];
  const isDisabled = disabled || loading;

  return (
    <View style={[styles.container, widthStyles[width], containerStyle]}>
      <Pressable
        {...rest}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.button,
          sizeStyles[size],
          {
            backgroundColor: palette.background,
            borderColor: palette.border,
          },
          pressed && !isDisabled ? styles.buttonPressed : undefined,
          isDisabled ? styles.buttonDisabled : undefined,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : (
          <View style={styles.content}>
            {leftIcon}
            <AppText variant="button" style={[styles.title, { color: palette.text }]}>
              {title}
            </AppText>
            {rightIcon}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  button: {
    width: '100%',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
});
