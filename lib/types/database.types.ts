export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type NotificationType = 'reminder' | 'deadline' | 'team_update' | 'system';
export type TeamRole = 'owner' | 'admin' | 'member';
export type SummaryType = 'daily' | 'weekly' | 'monthly';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  work_style: Record<string, any>;
  notification_settings: {
    email_notifications: boolean;
    push_notifications: boolean;
    reminder_frequency: string;
  };
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
  team_id?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  tags: string[];
  ai_generated_fields: Record<string, any>;
  natural_language_input?: string;
  created_by: string;
  assigned_to?: string;
  team_id?: string;
  category_id?: string;
  parent_task_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TaskHistory {
  id: string;
  task_id: string;
  changed_by: string;
  change_type: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  read_at?: string;
  created_at: string;
}

export interface AISummary {
  id: string;
  user_id: string;
  summary_type: SummaryType;
  summary_data: Record<string, any>;
  insights: Record<string, any>;
  created_at: string;
}

export interface UserAnalytics {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;
  created_at: string;
}

// Database interface for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Team, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      team_members: {
        Row: TeamMember;
        Insert: Omit<TeamMember, 'id' | 'joined_at'> & {
          id?: string;
          joined_at?: string;
        };
        Update: Partial<Omit<TeamMember, 'id' | 'joined_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Category, 'id' | 'created_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Task, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      task_history: {
        Row: TaskHistory;
        Insert: Omit<TaskHistory, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: never;
      };
      task_comments: {
        Row: TaskComment;
        Insert: Omit<TaskComment, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<TaskComment, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      ai_summaries: {
        Row: AISummary;
        Insert: Omit<AISummary, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: never;
      };
      user_analytics: {
        Row: UserAnalytics;
        Insert: Omit<UserAnalytics, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: never;
      };
    };
  };
}