'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Task } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';

interface TasksResponse {
    tasks: Task[];
    total: number;
    page: number;
    pages: number;
}

interface TaskFilters {
    status?: 'pending' | 'in_progress' | 'done';
    deadline?: 'today' | 'week' | 'overdue';
    page?: number;
    per_page?: number;
}

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [filters, setFilters] = useState<TaskFilters>({ page: 1, per_page: 20 });

    const getAuthHeader = () => {
        const token = sessionStorage.getItem('access_token');
        return { Authorization: `Bearer ${token}` };
    };

    const fetchTasks = useCallback(async (customFilters?: TaskFilters) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            const activeFilters = customFilters || filters;

            if (activeFilters.status) params.append('status', activeFilters.status);
            if (activeFilters.deadline) params.append('deadline', activeFilters.deadline);
            if (activeFilters.page) params.append('page', activeFilters.page.toString());
            if (activeFilters.per_page) params.append('per_page', activeFilters.per_page.toString());

            const response = await axios.get<TasksResponse>(`${API_URL}/api/tasks?${params}`, {
                headers: getAuthHeader()
            });

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
        }
    }, [filters]);

    useEffect(() => {
        fetchTasks();
    }, []);

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
        const response = await axios.post(`${API_URL}/api/tasks`, taskData, {
            headers: getAuthHeader()
        });
        const newTask = response.data;
        setTasks(prev => [newTask, ...prev]);
        return newTask;
    };

    const updateTask = async (id: number, taskData: Partial<Task>) => {
        const response = await axios.put(`${API_URL}/api/tasks/${id}`, taskData, {
            headers: getAuthHeader()
        });
        const updatedTask = response.data;
        setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
        return updatedTask;
    };

    const deleteTask = async (id: number) => {
        await axios.delete(`${API_URL}/api/tasks/${id}`, {
            headers: getAuthHeader()
        });
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
