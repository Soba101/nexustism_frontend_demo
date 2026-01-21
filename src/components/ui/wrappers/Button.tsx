import type { ComponentProps, ComponentType } from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';

interface ButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
  onClick?: () => void;
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
  'aria-label'?: string;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  icon: Icon,
  disabled,
  'aria-label': ariaLabel
}: ButtonProps) => {
  type ShadcnVariant = NonNullable<ComponentProps<typeof ShadcnButton>['variant']>;
  type ShadcnSize = NonNullable<ComponentProps<typeof ShadcnButton>['size']>;
  const variantMap: Record<NonNullable<ButtonProps['variant']>, ShadcnVariant> = {
    primary: 'default',
    secondary: 'secondary',
    outline: 'outline',
    ghost: 'ghost',
    danger: 'destructive'
  };

  const sizeMap: Record<NonNullable<ButtonProps['size']>, ShadcnSize> = {
    sm: 'sm',
    md: 'default',
    lg: 'lg',
    icon: 'icon'
  };

  return (
    <ShadcnButton
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {Icon && <Icon className={`w-4 h-4 ${children ? 'mr-2' : ''}`} />}
      {children}
    </ShadcnButton>
  );
};
