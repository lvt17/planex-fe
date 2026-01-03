import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';
import { Project } from '@/types';
import { toast } from 'react-hot-toast';

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/projects');
            setProjects(response.data);
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách projects');
            console.error('Failed to fetch projects:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const createProject = async (name: string, description?: string) => {
        try {
            const response = await api.post('/api/projects', { name, description });
            setProjects(prev => [response.data, ...prev]);
            toast.success('Tạo project thành công');
            return response.data;
        } catch (err) {
            toast.error('Không thể tạo project');
            throw err;
        }
    };

    const updateProject = async (id: number, data: Partial<Project>) => {
        try {
            const response = await api.put(`/api/projects/${id}`, data);
            setProjects(prev => prev.map(p => p.id === id ? response.data : p));
            toast.success('Cập nhật project thành công');
            return response.data;
        } catch (err) {
            toast.error('Không thể cập nhật project');
            throw err;
        }
    };

    const deleteProject = async (id: number) => {
        try {
            await api.delete(`/api/projects/${id}`);
            setProjects(prev => prev.filter(p => p.id !== id));
            toast.success('Xóa project thành công');
        } catch (err) {
            toast.error('Không thể xóa project');
            throw err;
        }
    };

    return {
        projects,
        loading,
        error,
        fetchProjects,
        createProject,
        updateProject,
        deleteProject,
    };
}
