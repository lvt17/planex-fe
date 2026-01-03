import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeEvent {
    type: string;
    data: any;
    timestamp: number;
}

type EventHandler = (event: RealtimeEvent) => void;

interface UseRealtimeOptions {
    onEvent?: EventHandler;
    onConnect?: () => void;
    onDisconnect?: () => void;
    channelName?: string;
}

export function useSupabaseRealtime({
    onEvent,
    onConnect,
    onDisconnect,
    channelName = 'global_updates'
}: UseRealtimeOptions) {
    const [isConnected, setIsConnected] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const subscribe = useCallback(() => {
        // Clean up existing channel
        if (channelRef.current) {
            channelRef.current.unsubscribe();
        }

        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        channel
            // 1. Listen to Database Changes (Insert/Update/Delete)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task' }, (payload) => {
                console.log('Supabase: Task change', payload);
                const eventType = payload.eventType === 'INSERT' ? 'task_created' :
                    payload.eventType === 'UPDATE' ? 'task_updated' : 'task_deleted';
                onEvent?.({
                    type: eventType,
                    data: payload.new || payload.old,
                    timestamp: Date.now()
                });
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
                console.log('Supabase: New chat message', payload);
                onEvent?.({
                    type: 'chat_message',
                    data: payload.new,
                    timestamp: Date.now()
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
                console.log('Supabase: User updated', payload);
                onEvent?.({
                    type: 'user_updated',
                    data: payload.new,
                    timestamp: Date.now()
                });
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_surveys' }, (payload) => {
                onEvent?.({
                    type: 'survey_submitted',
                    data: payload.new,
                    timestamp: Date.now()
                });
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bug_reports' }, (payload) => {
                onEvent?.({
                    type: 'report_submitted',
                    data: payload.new,
                    timestamp: Date.now()
                });
            })
            // 2. Listen to Manual Broadcasts (if needed)
            .on('broadcast', { event: 'custom_event' }, ({ payload }) => {
                console.log('Supabase: Custom event', payload);
                onEvent?.(payload);
            })
            .subscribe((status) => {
                console.log(`Supabase Realtime Status: ${status}`);
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    onConnect?.();
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    setIsConnected(false);
                    onDisconnect?.();
                }
            });

        return channel;
    }, [onEvent, onConnect, onDisconnect, channelName]);

    useEffect(() => {
        const channel = subscribe();
        return () => {
            channel.unsubscribe();
        };
    }, [subscribe]);

    return {
        isConnected,
        supabase
    };
}
