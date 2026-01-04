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

    // TEMPORARY: Disable Supabase Realtime due to connection instability
    // The app will fall back to polling for chat updates
    // TODO: Re-enable after fixing Supabase connection issues

    useEffect(() => {
        console.log('Supabase Realtime: Disabled (using polling fallback)');
        return () => {
            // Cleanup if needed
        };
    }, []);

    return {
        isConnected: false, // Always return false to use polling fallback
        supabase
    };
}
