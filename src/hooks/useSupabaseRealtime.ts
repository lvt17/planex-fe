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

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export function useSupabaseRealtime({
    onEvent,
    onConnect,
    onDisconnect,
    channelName = 'global_updates'
}: UseRealtimeOptions) {
    const [isConnected, setIsConnected] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const retryCountRef = useRef(0);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const subscribe = useCallback(() => {
        if (!isSupabaseConfigured) {
            return null;
        }

        // Clean up existing channel
        if (channelRef.current) {
            channelRef.current.unsubscribe();
        }

        // Clear any pending retry
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
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

                onEvent?.({
                    type: 'notification_received',
                    data: payload.new,
                    timestamp: Date.now()
                });
            })
            .subscribe((status) => {


                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    retryCountRef.current = 0; // Reset retry count on success
                    onConnect?.();
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    setIsConnected(false);
                    onDisconnect?.();

                    // Auto-reconnect with exponential backoff
                    if (retryCountRef.current < MAX_RETRIES) {
                        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current);


                        retryTimeoutRef.current = setTimeout(() => {
                            retryCountRef.current++;
                            subscribe();
                        }, delay);
                    } else {
                        console.error('Supabase Realtime: Max retries reached. Giving up.');
                    }
                }
            });

        return channel;
    }, [onEvent, onConnect, onDisconnect, channelName]);

    useEffect(() => {
        if (!isSupabaseConfigured) return;

        const channel = subscribe();

        return () => {
            // Cleanup
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
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
