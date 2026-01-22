'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types';
import api from '@/utils/api';

interface TasksResponse {
    tasks: Task[];
    total: number;
    page: number;
    pages: number;
}

interface TaskFilters {
    status?: 'pending' | 'in_progress' | 'done';
    deadline?: 'today' | 'week' | 'overdue';
    project_id?: number | null; // null = no filter, 0 = tasks without project
    page?: number;
    per_page?: number;
}

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [filters, setFilters] = useState<TaskFilters>({ page: 1, per_page: 20 });

    const fetchTasks = useCallback(async (customFilters?: TaskFilters) => {
        try {
            // Only show loading spinner on initial load to prevent flicker
            if (isInitialLoad) {
                setLoading(true);
            }
            const params = new URLSearchParams();
            const activeFilters = customFilters || filters;

            if (activeFilters.status) params.append('status', activeFilters.status);
            if (activeFilters.deadline) params.append('deadline', activeFilters.deadline);
            if (activeFilters.project_id !== undefined && activeFilters.project_id !== null) {
                params.append('project_id', activeFilters.project_id.toString());
            }
            if (activeFilters.page) params.append('page', activeFilters.page.toString());
            if (activeFilters.per_page) params.append('per_page', activeFilters.per_page.toString());

            const response = await api.get<TasksResponse>(`/api/tasks?${params}`);

            setTasks(response.data.tasks || []);
            setPagination({
                total: response.data.total,
                page: response.data.page,
                pages: response.data.pages
            });
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            setTasks([]);
        } finally {
            setLoading(false);
            setIsInitialLoad(false);
        }
    }, [filters, isInitialLoad]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const applyFilters = (newFilters: TaskFilters) => {
        const updatedFilters = { ...filters, ...newFilters, page: 1 };
        setFilters(updatedFilters);
        fetchTasks(updatedFilters);
    };

    const goToPage = (page: number) => {
        const updatedFilters = { ...filters, page };
        setFilters(updatedFilters);
        fetchTasks(updatedFilters);
    };

    const createTask = async (taskData: Partial<Task>) => {
        const response = await api.post('/api/tasks', taskData);
        const newTask = response.data;
        setTasks(prev => [newTask, ...prev]);
        return newTask;
    };

    const updateTask = async (id: number, taskData: Partial<Task>) => {
        const response = await api.put(`/api/tasks/${id}`, taskData);
        const updatedTask = response.data;
        setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
        return updatedTask;
    };

    const deleteTask = async (id: number) => {
        await api.delete(`/api/tasks/${id}`);
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const stats = {
        total: pagination.total,
        completed: tasks.filter(t => t.is_done).length,
        inProgress: tasks.filter(t => !t.is_done && (t.state || 0) > 0).length,
        pending: tasks.filter(t => !t.is_done && (t.state || 0) === 0).length,
    };

    return {
        tasks,
        loading,
        pagination,
        filters,
        fetchTasks,
        applyFilters,
        goToPage,
        createTask,
        updateTask,
        deleteTask,
        stats
    };
}
