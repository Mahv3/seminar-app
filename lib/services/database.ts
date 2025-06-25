import { createClient } from "@/lib/supabase/server";
import { Database, Task, Profile, Team, Category, RealtimePayload } from "@/lib/types/database.types";

export type SupabaseClient = ReturnType<typeof createClient>;

export class DatabaseService {
  private supabase: Awaited<SupabaseClient>;

  constructor(supabase: Awaited<SupabaseClient>) {
    this.supabase = supabase;
  }

  // Profile operations
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data;
  }

  // Task operations
  async getTasks(userId: string, filters?: {
    status?: string[];
    priority?: string[];
    teamId?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Task[]> {
    let query = this.supabase
      .from('tasks')
      .select(`
        *,
        created_by_profile:profiles!created_by(*),
        assigned_to_profile:profiles!assigned_to(*),
        category:categories(*),
        team:teams(*)
      `)
      .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters?.priority?.length) {
      query = query.in('priority', filters.priority);
    }

    if (filters?.teamId) {
      query = query.eq('team_id', filters.teamId);
    }

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data || [];
  }

  async getTask(taskId: string): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select(`
        *,
        created_by_profile:profiles!created_by(*),
        assigned_to_profile:profiles!assigned_to(*),
        category:categories(*),
        team:teams(*),
        subtasks:tasks!parent_task_id(*),
        comments:task_comments(*, user:profiles(*))
      `)
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return null;
    }

    return data;
  }

  async createTask(task: Database['public']['Tables']['tasks']['Insert']): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    return data;
  }

  async updateTask(taskId: string, updates: Database['public']['Tables']['tasks']['Update']): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return null;
    }

    return data;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    return true;
  }

  // Team operations
  async getTeams(userId: string): Promise<Team[]> {
    const { data, error } = await this.supabase
      .from('teams')
      .select(`
        *,
        members:team_members(*, user:profiles(*))
      `)
      .eq('team_members.user_id', userId);

    if (error) {
      console.error('Error fetching teams:', error);
      return [];
    }

    return data || [];
  }

  async createTeam(team: Database['public']['Tables']['teams']['Insert']): Promise<Team | null> {
    const { data, error } = await this.supabase
      .from('teams')
      .insert(team)
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return null;
    }

    // Add creator as owner
    if (data) {
      await this.supabase
        .from('team_members')
        .insert({
          team_id: data.id,
          user_id: team.created_by,
          role: 'owner'
        });
    }

    return data;
  }

  // Category operations
  async getCategories(userId: string, teamId?: string): Promise<Category[]> {
    let query = this.supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (teamId) {
      query = query.eq('team_id', teamId);
    } else {
      query = query.is('team_id', null);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data || [];
  }

  async createCategory(category: Database['public']['Tables']['categories']['Insert']): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return null;
    }

    return data;
  }

  // Real-time subscriptions
  subscribeToTasks(userId: string, callback: (payload: RealtimePayload) => void) {
    return this.supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `created_by=eq.${userId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToNotifications(userId: string, callback: (payload: RealtimePayload) => void) {
    return this.supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
}

export async function createDatabaseService(): Promise<DatabaseService> {
  const supabase = await createClient();
  return new DatabaseService(supabase);
}