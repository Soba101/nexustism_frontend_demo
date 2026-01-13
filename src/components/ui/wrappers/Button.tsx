import { Button as ShadcnButton } from '@/components/ui/button';

interface ButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
  onClick?: () => void;
  icon?: React.ComponentType<any>;
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
  const variantMap: Record<string, any> = {
    primary: 'default',
    secondary: 'secondary',
    outline: 'outline',
    ghost: 'ghost',
    danger: 'destructive'
  };

  const sizeMap: Record<string, any> = {
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
