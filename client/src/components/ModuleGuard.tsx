import { useAuth } from '../_core/hooks/useAuth';
import { useModules } from '../hooks/useModules';
import { useLocation } from 'wouter';

interface ModuleGuardProps {
  moduleKey: string;
  children: React.ReactNode;
  redirectTo?: string;
}

export function ModuleGuard({
  moduleKey,
  children,
  redirectTo = '/dashboard',
}: ModuleGuardProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { has } = useModules();
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  if (user.role === 'super_admin') {
    return <>{children}</>;
  }
  
  if (!has(moduleKey)) {
    navigate(redirectTo);
    return null;
  }
  
  return <>{children}</>;
}
