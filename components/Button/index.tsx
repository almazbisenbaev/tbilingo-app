import React, { forwardRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import './button.css';
import { clsx, type ClassValue } from 'clsx';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'primary' | 'secondary' | 'black' | 'success' | 'outline-success';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  loading?: boolean;
  textClassName?: string;
  children?: React.ReactNode;
}

function cx(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const indicatorByVariant: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: '#334155',
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  black: '#FFFFFF',
  success: '#FFFFFF',
  'outline-success': '#22C55E',
};

const Button = forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      title,
      loading = false,
      className,
      textClassName,
      disabled,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);

    const rootClass = cx(
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      disabled && 'btn--disabled',
      isPressed && 'btn--pressed',
      className
    );

    const textClass = cx('btn__text', `btn__text--${variant}`, `btn__text--${size}`, textClassName);

    return (
      <TouchableOpacity
        ref={ref}
        activeOpacity={1}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        disabled={disabled || loading}
        className={rootClass}
        style={style}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={indicatorByVariant[variant]} />
        ) : (
          children || (title ? <Text className={textClass}>{title}</Text> : null)
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

export default Button;
