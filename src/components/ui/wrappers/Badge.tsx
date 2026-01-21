import type { ComponentProps } from 'react';
import { Badge as ShadcnBadge } from '@/components/ui/badge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low' | 'outline';
  className?: string;
}

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  type ShadcnVariant = NonNullable<ComponentProps<typeof ShadcnBadge>['variant']>;
  const variantMap: Record<NonNullable<BadgeProps['variant']>, ShadcnVariant> = {
    default: 'secondary',
    critical: 'destructive',
    high: 'default',
    medium: 'secondary',
    low: 'outline',
    outline: 'outline'
  };

  return (
    <ShadcnBadge variant={variantMap[variant]} className={className}>
      {children}
    </ShadcnBadge>
  );
};
