"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { TaskService, CreateTaskInput } from "@/lib/services/tasks";
import { Task } from "@/lib/types/database.types";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, CheckCircle, Clock, AlertTriangle, ListTodo } from "lucide-react";

export default function TasksPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    overdue: 0,
  });

  const taskService = useMemo(() => new TaskService(), []);

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await taskService.getTasks(user.id);
      if (error) {
        setError(error);
      } else {
        setTasks(data);
      }

      // Fetch stats
      const { data: statsData, error: statsError } = await taskService.getTaskStats(user.id);
      if (!statsError && statsData) {
        setStats(statsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  }, [user, taskService]);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, fetchTasks]);

  const handleCreateTask = async (data: CreateTaskInput) => {
    if (!user) return;

    try {
      const { data: newTask, error } = await taskService.createTask(data, user.id);
      if (error) {
        setError(error);
      } else if (newTask) {
        setTasks([newTask, ...tasks]);
        setIsCreateDialogOpen(false);
        // Update stats
        setStats(prev => ({
          ...prev,
          total: prev.total + 1,
          [newTask.status]: prev[newTask.status as keyof typeof prev] + 1,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;

    try {
      const { data: updatedTask, error } = await taskService.updateTask(
        { id: taskId, ...updates },
        user.id
      );
      
      if (error) {
        setError(error);
      } else if (updatedTask) {
        setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
        if (selectedTask?.id === taskId) {
          setSelectedTask(updatedTask);
        }
        // Refetch stats to ensure accuracy
        const { data: statsData } = await taskService.getTaskStats(user.id);
        if (statsData) {
          setStats(statsData);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const { success, error } = await taskService.deleteTask(taskId, user.id);
      if (error) {
        setError(error);
      } else if (success) {
        setTasks(tasks.filter(task => task.id !== taskId));
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleDuplicateTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { data: duplicatedTask, error } = await taskService.duplicateTask(taskId, user.id);
      if (error) {
        setError(error);
      } else if (duplicatedTask) {
        setTasks([duplicatedTask, ...tasks]);
        setStats(prev => ({
          ...prev,
          total: prev.total + 1,
          todo: prev.todo + 1,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate task');
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  const handleEditTask = async (data: CreateTaskInput) => {
    if (!selectedTask || !user) return;

    await handleUpdateTask(selectedTask.id, data);
    setIsEditDialogOpen(false);
    setSelectedTask(null);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <p>Please log in to view your tasks.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks and stay organized</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ListTodo className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-2xl font-bold">{stats.completed}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">{stats.inProgress}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ListTodo className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-2xl font-bold">{stats.todo}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-2xl font-bold">{stats.overdue}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setError(null)}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Task List */}
      <TaskList
        tasks={tasks}
        onTaskClick={handleTaskClick}
        onTaskUpdate={handleUpdateTask}
        onTaskDelete={handleDeleteTask}
        onTaskDuplicate={handleDuplicateTask}
        isLoading={isLoading}
      />

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your list. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update your task details below.
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <TaskForm
              task={selectedTask}
              onSubmit={handleEditTask}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedTask(null);
              }}
              title="Update Task"
              description="Modify your task details below"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}