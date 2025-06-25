import React from "react";
import { TeamRole } from "@/lib/types/database.types";

// Define permissions for the application
export enum Permission {
  // Task permissions
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',
  
  // Team permissions
  TEAM_CREATE = 'team:create',
  TEAM_READ = 'team:read',
  TEAM_UPDATE = 'team:update',
  TEAM_DELETE = 'team:delete',
  TEAM_INVITE = 'team:invite',
  TEAM_REMOVE_MEMBER = 'team:remove_member',
  
  // Admin permissions
  USER_MANAGE = 'user:manage',
  ANALYTICS_VIEW = 'analytics:view',
  SYSTEM_CONFIG = 'system:config',
}

// Role-based permissions mapping
const rolePermissions: Record<TeamRole, Permission[]> = {
  owner: [
    // Task permissions
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    
    // Team permissions
    Permission.TEAM_CREATE,
    Permission.TEAM_READ,
    Permission.TEAM_UPDATE,
    Permission.TEAM_DELETE,
    Permission.TEAM_INVITE,
    Permission.TEAM_REMOVE_MEMBER,
    
    // Admin permissions
    Permission.USER_MANAGE,
    Permission.ANALYTICS_VIEW,
    Permission.SYSTEM_CONFIG,
  ],
  
  admin: [
    // Task permissions
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    
    // Team permissions
    Permission.TEAM_READ,
    Permission.TEAM_UPDATE,
    Permission.TEAM_INVITE,
    Permission.TEAM_REMOVE_MEMBER,
    
    // Limited admin permissions
    Permission.ANALYTICS_VIEW,
  ],
  
  member: [
    // Basic task permissions
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    
    // Basic team permissions
    Permission.TEAM_READ,
  ],
};

export class RBACService {
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(userRole: TeamRole, permission: Permission): boolean {
    const permissions = rolePermissions[userRole] || [];
    return permissions.includes(permission);
  }

  /**
   * Check if a user has any of the specified permissions
   */
  static hasAnyPermission(userRole: TeamRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Check if a user has all of the specified permissions
   */
  static hasAllPermissions(userRole: TeamRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Get all permissions for a role
   */
  static getPermissions(userRole: TeamRole): Permission[] {
    return rolePermissions[userRole] || [];
  }

  /**
   * Check if a user can perform an action on a resource
   */
  static canPerformAction(
    userRole: TeamRole,
    action: Permission,
    resourceOwnerId?: string,
    userId?: string
  ): boolean {
    // Check basic permission
    if (!this.hasPermission(userRole, action)) {
      return false;
    }

    // For resource-specific actions, check ownership
    if (resourceOwnerId && userId) {
      // Owner can always perform actions on their own resources
      if (resourceOwnerId === userId) {
        return true;
      }

      // For other users, check if they have elevated permissions
      if (userRole === 'owner' || userRole === 'admin') {
        return true;
      }

      // Members can only act on their own resources
      return false;
    }

    return true;
  }

  /**
   * Filter items based on user permissions
   */
  static filterByPermission<T extends { created_by?: string }>(
    items: T[],
    userRole: TeamRole,
    userId: string,
    permission: Permission
  ): T[] {
    if (!this.hasPermission(userRole, permission)) {
      return [];
    }

    // Owners and admins can see everything
    if (userRole === 'owner' || userRole === 'admin') {
      return items;
    }

    // Members can only see their own items
    return items.filter(item => item.created_by === userId);
  }
}

/**
 * React hook for RBAC
 */
export function useRBAC(userRole: TeamRole) {
  return {
    hasPermission: (permission: Permission) => 
      RBACService.hasPermission(userRole, permission),
    
    hasAnyPermission: (permissions: Permission[]) => 
      RBACService.hasAnyPermission(userRole, permissions),
    
    hasAllPermissions: (permissions: Permission[]) => 
      RBACService.hasAllPermissions(userRole, permissions),
    
    canPerformAction: (
      action: Permission,
      resourceOwnerId?: string,
      userId?: string
    ) => RBACService.canPerformAction(userRole, action, resourceOwnerId, userId),
  };
}

/**
 * Higher-order component for protecting routes/components
 */
export function withRBAC<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: Permission[]
) {
  return function ProtectedComponent(props: P & { userRole: TeamRole }) {
    const { userRole, ...componentProps } = props;
    
    if (!RBACService.hasAllPermissions(userRole, requiredPermissions)) {
      return (
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access this resource.
          </p>
        </div>
      );
    }

    return <Component {...(componentProps as P)} />;
  };
}