/**
 * useSSE - React hook for Server-Sent Events (SSE) connection
 * Manages SSE connection, auto-reconnection, and event handling
 */
import { useEffect, useRef, useState, useCallback } from 'react';

interface SSEEvent {
    type: string;
    data: any;
    timestamp: number;
}

type EventHandler = (event: SSEEvent) => void;

interface UseSSEOptions {
    url: string;
    token?: string | null;
    onEvent?: EventHandler;
    onConnect?: () => void;
    onDisconnect?: () => void;
    reconnectInterval?: number;
}

export function useSSE({
    url,
    token,
    onEvent,
    onConnect,
    onDisconnect,
    reconnectInterval = 3000
}: UseSSEOptions) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const shouldReconnectRef = useRef(true);

    const connect = useCallback(() => {
        if (!token) {
            console.log('SSE: No token provided, skipping connection');
            return;
        }

        // Clean up existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        try {
            // Create SSE connection with auth token
            const eventSource = new EventSource(`${url}?token=${token}`);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('SSE: Connected');
                setIsConnected(true);
                setError(null);
                onConnect?.();
            };

            eventSource.onerror = (err) => {
                console.error('SSE: Connection error', err);
                setIsConnected(false);
                setError(new Error('SSE connection failed'));
                onDisconnect?.();

                // Auto-reconnect
                if (shouldReconnectRef.current) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('SSE: Attempting to reconnect...');
                        connect();
                    }, reconnectInterval);
                }
            };

            // Listen for all event types
            const eventTypes = [
                'user_updated',
                'user_deleted',
                'task_created',
                'task_updated',
                'task_deleted',
                'survey_submitted',
                'report_submitted',
                'chat_message',
                'team_updated'
            ];

            eventTypes.forEach(type => {
                eventSource.addEventListener(type, (e: MessageEvent) => {
                    try {
                        const eventData: SSEEvent = JSON.parse(e.data);
                        console.log(`SSE: Received ${type}`, eventData);
                        onEvent?.(eventData);
                    } catch (err) {
                        console.error('SSE: Failed to parse event data', err);
                    }
                });
            });

            // Handle generic messages
            eventSource.onmessage = (e: MessageEvent) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.type === 'connected') {
                        console.log('SSE: Connection confirmed', data);
                    }
                } catch (err) {
                    // Ignore parse errors for keep-alive messages
                }
            };

        } catch (err) {
            console.error('SSE: Failed to create connection', err);
            setError(err as Error);
        }
    }, [url, token, onEvent, onConnect, onDisconnect, reconnectInterval]);

    const disconnect = useCallback(() => {
        shouldReconnectRef.current = false;

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setIsConnected(false);
    }, []);

    useEffect(() => {
        shouldReconnectRef.current = true;
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        error,
        reconnect: connect,
        disconnect
    };
}
