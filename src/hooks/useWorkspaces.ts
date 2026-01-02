'use client';

import { useState, useCallback } from 'react';
import { Workspace } from '@/types';
import api from '@/utils/api';

export function useWorkspaces(taskId: number | null) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchWorkspaces = useCallback(async () => {
        if (!taskId) return;

        try {
            setLoading(true);
            const response = await api.get(`/api/workspaces/tasks/${taskId}/workspaces`);
            setWorkspaces(response.data || []);
        } catch (error) {
            console.error('Failed to fetch workspaces:', error);
            setWorkspaces([]);
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    const createWorkspace = async (data: Partial<Workspace>) => {
        if (!taskId) return;

        const response = await api.post(
            `/api/workspaces/tasks/${taskId}/workspaces`,
            data
        );
        const newWorkspace = response.data;
        setWorkspaces(prev => [...prev, newWorkspace]);
        return newWorkspace;
    };

    const updateWorkspace = async (id: number, data: Partial<Workspace>) => {
        const response = await api.put(
            `/api/workspaces/${id}`,
            data
        );
        const updatedWorkspace = response.data;
        setWorkspaces(prev => prev.map(ws => ws.id === id ? updatedWorkspace : ws));
        return updatedWorkspace;
    };

    const deleteWorkspace = async (id: number) => {
        await api.delete(`/api/workspaces/${id}`);
        setWorkspaces(prev => prev.filter(ws => ws.id !== id));
    };

    const progress = workspaces.length > 0
        ? workspaces.reduce((sum, ws) => sum + (ws.loading || 0), 0) / workspaces.length
        : 0;

    return {
        workspaces,
        loading,
        progress,
        fetchWorkspaces,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace
    };
}
