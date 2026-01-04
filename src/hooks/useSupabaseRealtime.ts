import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';
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
        if (!isSupabaseConfigured) {
            console.warn('Supabase Realtime: Not configured');
            return null;
        }

        // Clean up existing channel
        if (channelRef.current) {
            channelRef.current.unsubscribe();
        }

        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        channel
            // OPTIMIZED: Only subscribe to critical tables
            // 1. Chat messages (real-time chat)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages'
            }, (payload) => {
                console.log('Supabase: New chat message', payload);
                onEvent?.({
                    type: 'chat_message',
                    data: payload.new,
                    timestamp: Date.now()
                });
            })
            // 2. Notifications
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications'
            }, (payload) => {
                console.log('Supabase: New notification', payload);
                onEvent?.({
                    type: 'notification_received',
                    data: payload.new,
                    timestamp: Date.now()
                });
            })
            .subscribe((status) => {
                console.log(`Supabase Realtime: ${status}`);
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
        if (!isSupabaseConfigured) return;

        const channel = subscribe();

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, [subscribe]);

    return {
        isConnected,
        supabase
    };
}
