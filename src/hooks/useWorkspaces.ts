'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { Workspace } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';

export function useWorkspaces(taskId: number | null) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(false);

    const getAuthHeader = () => {
        const token = sessionStorage.getItem('access_token');
        return { Authorization: `Bearer ${token}` };
    };

    const fetchWorkspaces = useCallback(async () => {
        if (!taskId) return;

        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/workspaces/tasks/${taskId}/workspaces`, {
                headers: getAuthHeader()
            });
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

        const response = await axios.post(
            `${API_URL}/api/workspaces/tasks/${taskId}/workspaces`,
            data,
            { headers: getAuthHeader() }
        );
        const newWorkspace = response.data;
        setWorkspaces(prev => [...prev, newWorkspace]);
        return newWorkspace;
    };

    const updateWorkspace = async (id: number, data: Partial<Workspace>) => {
        const response = await axios.put(
            `${API_URL}/api/workspaces/${id}`,
            data,
            { headers: getAuthHeader() }
        );
        const updatedWorkspace = response.data;
        setWorkspaces(prev => prev.map(ws => ws.id === id ? updatedWorkspace : ws));
        return updatedWorkspace;
    };

    const deleteWorkspace = async (id: number) => {
        await axios.delete(`${API_URL}/api/workspaces/${id}`, {
            headers: getAuthHeader()
        });
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
