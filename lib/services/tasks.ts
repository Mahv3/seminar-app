import { createClient } from "@/lib/supabase/client";
import { Database, Task, TaskPriority, TaskStatus } from "@/lib/types/database.types";

export type CreateTaskInput = {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
  estimated_duration?: number;
  tags?: string[];
  natural_language_input?: string;
  assigned_to?: string;
  team_id?: string;
  category_id?: string;
  parent_task_id?: string;
};

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  id: string;
};

export type TaskFilters = {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  teamId?: string;
  categoryId?: string;
  assignedTo?: string;
  createdBy?: string;
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
  limit?: number;
  offset?: number;
};

export class TaskService {
  private supabase = createClient();

  async createTask(input: CreateTaskInput, userId: string): Promise<{ data: Task | null; error: string | null }> {
    try {
      const taskData: Database['public']['Tables']['tasks']['Insert'] = {
        title: input.title,
        description: input.description,
        priority: input.priority || 'medium',
        status: input.status || 'todo',
        due_date: input.due_date,
        estimated_duration: input.estimated_duration,
        tags: input.tags || [],
        natural_language_input: input.natural_language_input,
        ai_generated_fields: {},
        created_by: userId,
        assigned_to: input.assigned_to,
        team_id: input.team_id,
        category_id: input.category_id,
        parent_task_id: input.parent_task_id,
      };

      const { data, error } = await this.supabase
        .from('tasks')
        .insert(taskData)
        .select('*')
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      return { data: null, error: message };
    }
  }

  async getTasks(userId: string, filters?: TaskFilters): Promise<{ data: Task[]; error: string | null }> {
    try {
      let query = this.supabase
        .from('tasks')
        .select('*')
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
        .order('created_at', { ascending: false });

      // Apply filters
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

      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters?.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }

      if (filters?.dueBefore) {
        query = query.lte('due_date', filters.dueBefore);
      }

      if (filters?.dueAfter) {
        query = query.gte('due_date', filters.dueAfter);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
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
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
      return { data: [], error: message };
    }
  }

  async getTask(taskId: string, userId: string): Promise<{ data: Task | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
        .single();

      if (error) {
        console.error('Error fetching task:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch task';
      return { data: null, error: message };
    }
  }

  async updateTask(input: UpdateTaskInput, userId: string): Promise<{ data: Task | null; error: string | null }> {
    try {
      // Verify ownership or assignment
      const { data: existingTask, error: fetchError } = await this.supabase
        .from('tasks')
        .select('created_by, assigned_to')
        .eq('id', input.id)
        .single();

      if (fetchError) {
        return { data: null, error: 'Task not found' };
      }

      if (existingTask.created_by !== userId && existingTask.assigned_to !== userId) {
        return { data: null, error: 'Permission denied' };
      }

      const updateData: Database['public']['Tables']['tasks']['Update'] = {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.priority && { priority: input.priority }),
        ...(input.status && { status: input.status }),
        ...(input.due_date !== undefined && { due_date: input.due_date }),
        ...(input.estimated_duration !== undefined && { estimated_duration: input.estimated_duration }),
        ...(input.tags && { tags: input.tags }),
        ...(input.assigned_to !== undefined && { assigned_to: input.assigned_to }),
        ...(input.category_id !== undefined && { category_id: input.category_id }),
        updated_at: new Date().toISOString(),
      };

      // Set completed_at when status changes to completed
      if (input.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (input.status && ['todo', 'in_progress', 'cancelled'].includes(input.status)) {
        updateData.completed_at = undefined;
      }

      const { data, error } = await this.supabase
        .from('tasks')
        .update(updateData)
        .eq('id', input.id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      return { data: null, error: message };
    }
  }

  async deleteTask(taskId: string, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Verify ownership
      const { data: existingTask, error: fetchError } = await this.supabase
        .from('tasks')
        .select('created_by')
        .eq('id', taskId)
        .single();

      if (fetchError) {
        return { success: false, error: 'Task not found' };
      }

      if (existingTask.created_by !== userId) {
        return { success: false, error: 'Permission denied' };
      }

      const { error } = await this.supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      return { success: false, error: message };
    }
  }

  async duplicateTask(taskId: string, userId: string): Promise<{ data: Task | null; error: string | null }> {
    try {
      const { data: originalTask, error: fetchError } = await this.getTask(taskId, userId);

      if (fetchError || !originalTask) {
        return { data: null, error: fetchError || 'Task not found' };
      }

      const duplicateData: CreateTaskInput = {
        title: `${originalTask.title} (Copy)`,
        description: originalTask.description,
        priority: originalTask.priority,
        status: 'todo',
        estimated_duration: originalTask.estimated_duration,
        tags: originalTask.tags,
        team_id: originalTask.team_id,
        category_id: originalTask.category_id,
      };

      return this.createTask(duplicateData, userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to duplicate task';
      return { data: null, error: message };
    }
  }

  async getTaskStats(userId: string, teamId?: string): Promise<{
    data: {
      total: number;
      completed: number;
      inProgress: number;
      todo: number;
      overdue: number;
    } | null;
    error: string | null;
  }> {
    try {
      let query = this.supabase
        .from('tasks')
        .select('status, due_date')
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`);

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      const now = new Date().toISOString();
      const stats = {
        total: data.length,
        completed: data.filter(t => t.status === 'completed').length,
        inProgress: data.filter(t => t.status === 'in_progress').length,
        todo: data.filter(t => t.status === 'todo').length,
        overdue: data.filter(t => 
          t.due_date && t.due_date < now && t.status !== 'completed'
        ).length,
      };

      return { data: stats, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch task stats';
      return { data: null, error: message };
    }
  }
}