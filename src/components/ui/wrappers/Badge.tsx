import { Badge as ShadcnBadge } from '@/components/ui/badge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low' | 'outline';
  className?: string;
}

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  const variantMap: Record<string, any> = {
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
