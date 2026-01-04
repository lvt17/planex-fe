export interface Task {
    id: number;
    user_id: number;
    name: string;
    content?: string;
    deadline?: string;
    price?: number;
    state?: number; // 0-100 progress
    is_done: boolean;
    client_num?: string;
    client_mail?: string;
    noted?: string;
    show_in_portfolio: boolean;
    portfolio_thumbnail?: string;
    created_at: string;
    team_name?: string;
    project_id?: number;
    creator_id?: number;
    subtask_count?: number;
    comment_count?: number;
}

export interface User {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    created_at: string;
    title?: string;
    badges?: string[];
    access_count?: number;
}

export interface Workspace {
    id: number;
    mini_task: string;
    content?: string;
    loading?: number;
    is_done: boolean;
}

export interface Whiteboard {
    id: number;
    user_id: number;
    name: string;
    description?: string;
    data?: Record<string, unknown>;
    created_at: string;
    updated_at?: string;
}

export interface Project {
    id: number;
    name: string;
    description?: string;
    user_id?: number;
    team_id?: number;
    team_name?: string;
    created_at: string;
    task_count: number;
}
