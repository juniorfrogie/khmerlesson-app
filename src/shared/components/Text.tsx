import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle, type StyleProp } from 'react-native';
import { Colors, FontSize, FontWeight } from '../theme';

export type TextVariant = 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: string;
  weight?: keyof typeof FontWeight;
  style?: StyleProp<TextStyle>;
};

// lineHeight ~1.6x fontSize — enough headroom for Khmer stacked glyphs without excess spacing.
const variantStyles: Record<TextVariant, TextStyle> = {
  hero:     { fontSize: FontSize.hero, fontWeight: FontWeight.extrabold, lineHeight: 56 },
  title:    { fontSize: FontSize.xxl,  fontWeight: FontWeight.bold,      lineHeight: 46 },
  subtitle: { fontSize: FontSize.xl,   fontWeight: FontWeight.semibold,  lineHeight: 36 },
  body:     { fontSize: FontSize.md,   fontWeight: FontWeight.regular,   lineHeight: 26 },
  caption:  { fontSize: FontSize.sm,   fontWeight: FontWeight.regular,   lineHeight: 22 },
  label:    { fontSize: FontSize.xs,   fontWeight: FontWeight.medium,    lineHeight: 20 },
};

export function Text({ variant = 'body', color, weight, style, ...rest }: TextProps) {
  return (
    <RNText
      style={[
        variantStyles[variant],
        { color: color ?? Colors.text.primary },
        weight ? { fontWeight: FontWeight[weight] } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
