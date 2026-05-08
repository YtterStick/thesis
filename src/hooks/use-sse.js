import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api-config';

/**
 * Custom hook for Server-Sent Events (SSE)
 * @param {Object} eventHandlers - Map of event names to callback functions
 * @param {string} userId - Optional userId to identify the connection
 */
export const useSse = (eventHandlers = {}, userId = '') => {
    const eventSourceRef = useRef(null);

    useEffect(() => {
        // Construct the SSE URL with /api context path
        const url = new URL(`${API_BASE_URL}/api/notifications/stream`);
        if (userId) {
            url.searchParams.append('userId', userId);
        }

        console.log(`🔌 Connecting to SSE stream: ${url.toString()}`);

        // Initialize EventSource
        const eventSource = new EventSource(url.toString());
        eventSourceRef.current = eventSource;

        // Default handlers
        eventSource.onopen = () => {
            console.log('✅ SSE Connection opened');
        };

        eventSource.onerror = (error) => {
            console.error('❌ SSE Connection error:', error);
            // EventSource automatically tries to reconnect
        };

        // Custom handlers
        Object.entries(eventHandlers).forEach(([eventName, handler]) => {
            eventSource.addEventListener(eventName, (event) => {
                console.log(`📡 SSE Event received: ${eventName}`, event.data);
                if (handler && typeof handler === 'function') {
                    handler(event.data);
                }
            });
        });

        // Cleanup on unmount
        return () => {
            if (eventSourceRef.current) {
                console.log('🔌 Closing SSE Connection');
                eventSourceRef.current.close();
            }
        };
    }, [userId, JSON.stringify(Object.keys(eventHandlers))]);

    return eventSourceRef.current;
};
