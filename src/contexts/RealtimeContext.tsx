'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

interface RealtimeEvent {
    type: string;
    data: any;
    timestamp: number;
}

interface RealtimeContextType {
    isConnected: boolean;
    addEventListener: (handler: (event: RealtimeEvent) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [eventHandlers, setEventHandlers] = useState<Set<(event: RealtimeEvent) => void>>(new Set());

    // GLOBAL SUBSCRIPTION - Only 1 connection for entire app
    const { isConnected: realtimeConnected } = useSupabaseRealtime({
        channelName: 'app_global',
        onEvent: (event) => {
            // Broadcast event to all registered handlers
            eventHandlers.forEach(handler => {
                try {
                    handler(event);
                } catch (error) {
                    console.error('Error in event handler:', error);
                }
            });
        },
        onConnect: () => {

            setIsConnected(true);
        },
        onDisconnect: () => {

            setIsConnected(false);
        }
    });

    useEffect(() => {
        setIsConnected(realtimeConnected);
    }, [realtimeConnected]);

    const addEventListener = (handler: (event: RealtimeEvent) => void) => {
        setEventHandlers(prev => new Set(prev).add(handler));

        // Return cleanup function
        return () => {
            setEventHandlers(prev => {
                const updated = new Set(prev);
                updated.delete(handler);
                return updated;
            });
        };
    };

    return (
        <RealtimeContext.Provider value={{ isConnected, addEventListener }}>
            {children}
        </RealtimeContext.Provider>
    );
}

export function useRealtime() {
    const context = useContext(RealtimeContext);
    if (!context) {
        throw new Error('useRealtime must be used within RealtimeProvider');
    }
    return context;
}
