'use client'

import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Pusher real-time subscription hook.
 * Gracefully degrades when Pusher is not configured.
 */
export function useRealtime(
    channelName: string,
    events: Record<string, () => void>
) {
    const queryClient = useQueryClient()

    const handleEvent = useCallback(
        (eventName: string) => {
            const handler = events[eventName]
            if (handler) {
                handler()
            }
        },
        [events]
    )

    useEffect(() => {
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
        const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

        if (!pusherKey || !pusherCluster) {
            console.info('[Realtime] Pusher not configured, using polling fallback')
            return
        }

        let pusherInstance: unknown = null

        const initPusher = async () => {
            try {
                const Pusher = (await import('pusher-js')).default
                pusherInstance = new Pusher(pusherKey, {
                    cluster: pusherCluster,
                })

                const channel = (pusherInstance as { subscribe: (name: string) => { bind: (event: string, cb: () => void) => void } }).subscribe(channelName)

                Object.keys(events).forEach((eventName) => {
                    channel.bind(eventName, () => handleEvent(eventName))
                })
            } catch (error) {
                console.warn('[Realtime] Pusher initialization failed:', error)
            }
        }

        initPusher()

        return () => {
            if (pusherInstance) {
                (pusherInstance as { disconnect: () => void }).disconnect()
            }
        }
    }, [channelName, handleEvent]) // eslint-disable-line react-hooks/exhaustive-deps

    // Helper to invalidate queries on real-time events
    const invalidateOnEvent = useCallback(
        (queryKey: string[]) => {
            queryClient.invalidateQueries({ queryKey })
        },
        [queryClient]
    )

    return { invalidateOnEvent }
}
