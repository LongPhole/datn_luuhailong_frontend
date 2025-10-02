import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Building2,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Calendar,
  UserCircle,
  BarChart3,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useAuth } from '../../stores/authStore';

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string | undefined }>;
  roles?: ('ADMIN' | 'MANAGER' | 'USER')[];
  description?: string;
}

// Role-based navigation items
const navigation: NavItem[] = [
  // ADMIN navigation
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: Home,
    roles: ['ADMIN'],
    description: 'Overview and statistics',
  },
  {
    title: 'Departments',
    href: '/admin/departments',
    icon: Building2,
    roles: ['ADMIN'],
    description: 'Manage departments',
  },
  {
    title: 'Employees',
    href: '/admin/employees',
    icon: Users,
    roles: ['ADMIN'],
    description: 'Manage employees',
  },
  {
    title: 'Attendance',
    href: '/admin/attendances',
    icon: Calendar,
    roles: ['ADMIN'],
    description: 'Attendance records',
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    roles: ['ADMIN'],
    description: 'Analytics and reports',
  },
  {
    title: 'Audit Logs',
    href: '/admin/audit',
    icon: FileText,
    roles: ['ADMIN'],
    description: 'System audit trail',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['ADMIN'],
    description: 'System settings',
  },

  // MANAGER navigation
  {
    title: 'Dashboard',
    href: '/manager/dashboard',
    icon: Home,
    roles: ['MANAGER'],
    description: 'Department overview',
  },
  {
    title: 'My Department',
    href: '/manager/my-department',
    icon: Building2,
    roles: ['MANAGER'],
    description: 'Department details',
  },
  {
    title: 'Employees',
    href: '/manager/employees',
    icon: Users,
    roles: ['MANAGER'],
    description: 'Department employees',
  },
  {
    title: 'Attendance',
    href: '/manager/attendances',
    icon: Calendar,
    roles: ['MANAGER'],
    description: 'Department attendance',
  },
  {
    title: 'Reports',
    href: '/manager/reports',
    icon: BarChart3,
    roles: ['MANAGER'],
    description: 'Department reports',
  },

  // USER navigation
  {
    title: 'My Profile',
    href: '/me/profile',
    icon: UserCircle,
    roles: ['USER'],
    description: 'Personal information',
  },
  {
    title: 'My Attendance',
    href: '/me/attendances',
    icon: Calendar,
    roles: ['USER'],
    description: 'My attendance records',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  collapsed = false,
  onToggleCollapse
}) => {
  const location = useLocation();
  const { user, isAdmin, isManager, isUser } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onToggleCollapse?.();
  };

  // Filter navigation based on user role
  const filteredNavigation = React.useMemo(() => {
    if (!user) return [];

    return navigation.filter(item => {
      if (!item.roles) return true; // No role restriction

      // Check if user's role is in the allowed roles for this nav item
      return item.roles.includes(user.role);
    });
  }, [user]);

  // Get user role display
  const getRoleBadge = () => {
    if (!user) return null;

    const roleColors = {
      ADMIN: 'bg-red-500/10 text-red-600',
      MANAGER: 'bg-blue-500/10 text-blue-600',
      USER: 'bg-green-500/10 text-green-600',
    };

    return (
      <div className={cn('rounded-md px-2 py-1 text-xs font-medium', roleColors[user.role])}>
        {user.role}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'relative flex flex-col border-r border-border bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Collapse Toggle */}
      <div className="flex h-14 items-center justify-end border-b border-border px-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleCollapse}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <UserCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <div className="mt-2">
            {getRoleBadge()}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href ||
                          (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </div>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="border-t border-border p-4">
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">HR Management System</p>
            <p>v1.0.0</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;