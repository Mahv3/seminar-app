"use client";

import { useState } from "react";
import { Task, TaskPriority, TaskStatus } from "@/lib/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Calendar, 
  Clock, 
  MoreHorizontal, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  Circle,
  PlayCircle,
  XCircle,
  AlertCircle,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onTaskDelete?: (taskId: string) => Promise<void>;
  onTaskDuplicate?: (taskId: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const priorityConfig = {
  low: { label: 'Low', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200' },
};

const statusConfig = {
  todo: { label: 'To Do', icon: Circle, color: 'text-gray-500' },
  in_progress: { label: 'In Progress', icon: PlayCircle, color: 'text-blue-500' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-500' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-500' },
};

export function TaskList({ 
  tasks, 
  onTaskClick, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskDuplicate,
  isLoading = false,
  className 
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTasks, setFilteredTasks] = useState(tasks);

  // Filter tasks based on search term
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredTasks(tasks);
      return;
    }

    const filtered = tasks.filter(task =>
      task.title.toLowerCase().includes(term.toLowerCase()) ||
      task.description?.toLowerCase().includes(term.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredTasks(filtered);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (onTaskUpdate) {
      await onTaskUpdate(taskId, { status: newStatus });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const isOverdue = (dueDate: string, status: TaskStatus) => {
    if (status === 'completed' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Header */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? 'No tasks found matching your search.' : 'No tasks yet. Create your first task!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const StatusIcon = statusConfig[task.status].icon;
            const isTaskOverdue = task.due_date && isOverdue(task.due_date, task.status);

            return (
              <Card 
                key={task.id} 
                className={cn(
                  "cursor-pointer hover:shadow-md transition-shadow",
                  task.status === 'completed' && "opacity-75"
                )}
                onClick={() => onTaskClick?.(task)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Title and Status */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newStatus = task.status === 'completed' ? 'todo' : 'completed';
                            handleStatusChange(task.id, newStatus);
                          }}
                          className={cn(
                            "transition-colors",
                            statusConfig[task.status].color
                          )}
                        >
                          <StatusIcon className="h-5 w-5" />
                        </button>
                        <h3 className={cn(
                          "font-medium text-sm",
                          task.status === 'completed' && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h3>
                        {isTaskOverdue && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {/* Priority */}
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", priorityConfig[task.priority].color)}
                        >
                          {priorityConfig[task.priority].label}
                        </Badge>

                        {/* Due Date */}
                        {task.due_date && (
                          <div className={cn(
                            "flex items-center gap-1",
                            isTaskOverdue && "text-red-500"
                          )}>
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.due_date)}
                          </div>
                        )}

                        {/* Duration */}
                        {task.estimated_duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(task.estimated_duration)}
                          </div>
                        )}

                        {/* Assignee */}
                        {task.assigned_to_profile && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assigned_to_profile.full_name || task.assigned_to_profile.email}
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick?.(task);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {onTaskDuplicate && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onTaskDuplicate(task.id);
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onTaskDelete && (
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskDelete(task.id);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}