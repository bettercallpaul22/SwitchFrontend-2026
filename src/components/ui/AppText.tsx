import React from 'react';
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import { appColors } from '../../theme/colors';

type TextVariant = 'title' | 'subtitle' | 'label' | 'body' | 'caption' | 'button';
type TextSizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'metric';
type AppTextVariant = TextVariant | TextSizeVariant;

type Props = TextProps & {
  variant?: AppTextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
};

const variantStyles = StyleSheet.create<Record<AppTextVariant, TextStyle>>({
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: appColors.textDark
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
    color: appColors.textSubtle
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: appColors.textDark
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    color: appColors.textDark
  },
  caption: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    color: appColors.textSubtle
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: appColors.textLight
  },
  xs: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: appColors.textSubtle
  },
  sm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: appColors.textSubtle
  },
  md: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    color: appColors.textDark
  },
  lg: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
    color: appColors.textDark
  },
  xl: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: appColors.textDark
  },
  xxl: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: appColors.textDark
  },
  metric: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: appColors.textDark
  }
});

export function AppText({ variant = 'body', color, style, ...rest }: Props) {
  return <Text {...rest} style={[variantStyles[variant], color ? { color } : undefined, style]} />;
}
