import { useEffect, useRef, useState } from 'react';
import { getApiUrl } from '@/lib/api-config';

/**
 * Custom hook for Server-Sent Events (SSE)
 * @param {Object} eventHandlers - Map of event names to callback functions
 * @param {string} userId - Optional userId to identify the connection
 */
export const useSse = (eventHandlers = {}, userId = '') => {
    const eventSourceRef = useRef(null);
    const [retryCount, setRetryCount] = useState(0);
    const handlersRef = useRef(eventHandlers);
    
    // Update ref when handlers change to avoid stale closures
    useEffect(() => {
        handlersRef.current = eventHandlers;
    }, [eventHandlers]);

    useEffect(() => {
        if (!userId || userId === 'anonymous') {
            console.log("🔌 SSE: Waiting for valid User ID to connect...");
            return;
        }

        let isMounted = true;
        const baseUrl = getApiUrl('notifications/stream');
        const url = new URL(baseUrl);
        url.searchParams.append('userId', userId);

        console.log(`🔌 SSE: Connecting for User ${userId}... (Attempt ${retryCount + 1})`);

        // Initialize EventSource with credentials support
        const eventSource = new EventSource(url.toString(), { withCredentials: true });
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            console.log("✅ SSE: Connection Established");
            setRetryCount(0); // Reset retry count on success
            if (handlersRef.current.onStatus) handlersRef.current.onStatus('connected');
        };

        // Default handlers
        eventSource.addEventListener('INIT', (event) => {
            console.log("✅ SSE: System Online:", event.data);
            if (handlersRef.current.onStatus) handlersRef.current.onStatus('connected');
        });

        eventSource.addEventListener('heartbeat', () => {
            if (handlersRef.current.onStatus) handlersRef.current.onStatus('connected');
        });

        // Dynamic event handlers
        Object.keys(eventHandlers).forEach((eventName) => {
            if (eventName === 'onStatus') return;
            
            eventSource.addEventListener(eventName, (event) => {
                const handler = handlersRef.current[eventName];
                if (handler && typeof handler === 'function') {
                    let parsedData = event.data;
                    try {
                        if (typeof event.data === 'string' && (event.data.startsWith('{') || event.data.startsWith('['))) {
                            parsedData = JSON.parse(event.data);
                        }
                    } catch (e) {
                        // Not JSON
                    }
                    handler(parsedData);
                }
            });
        });

        eventSource.onerror = (error) => {
            console.error("❌ SSE: Connection Error:", error);
            if (handlersRef.current.onStatus) handlersRef.current.onStatus('error');
            
            eventSource.close();
            
            if (isMounted) {
                const timeout = Math.min(1000 * Math.pow(2, retryCount), 15000);
                console.log(`🔌 SSE: Retrying in ${timeout/1000}s...`);
                setTimeout(() => {
                    if (isMounted) setRetryCount(prev => prev + 1);
                }, timeout);
            }
        };

        return () => {
            isMounted = false;
            if (eventSourceRef.current) {
                console.log("🔌 SSE: Closing connection");
                eventSourceRef.current.close();
            }
        };
    }, [userId, retryCount, JSON.stringify(Object.keys(eventHandlers))]);

    return eventSourceRef.current;
};
