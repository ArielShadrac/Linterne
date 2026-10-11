
import { useEffect, useState, useCallback } from 'react'

/**
 * Enregistre le service worker en production.
 * Demande au navigateur de conserver les données locales si possible.
 */
export function registerSW() {
  const prod = (import.meta as unknown as {
    env?: { PROD?: boolean }
  }).env?.PROD

  if (!prod || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})

    try {
      navigator.storage?.persist?.()
    } catch {
      // La persistance du stockage n'est pas disponible.
    }
  })
}

/**
 * Indique si l'appareil dispose d'une connexion réseau.
 * Cela ne garantit pas que le réseau donne accès à Internet.
 */
export function useOnline() {
  const [on, setOn] = useState(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setOn(true)
    const handleOffline = () => setOn(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return on
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}

/**
 * Gère l'installation de l'application sur l'écran d'accueil.
 * can : le navigateur propose l'installation.
 * done : l'application est déjà installée.
 */
export function useInstall() {
  const [ev, setEv] = useState<BeforeInstallPromptEvent | null>(null)

  const [done, setDone] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches
  )

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault()
      setEv(event as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => {
      setDone(true)
      setEv(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const install = async () => {
    if (!ev) return

    await ev.prompt()
    setEv(null)
  }

  return {
    can: !!ev && !done,
    done,
    install,
  }
}

/**
 * Enregistre et récupère des valeurs JSON via le service worker.
 * Permet de conserver des données locales entre les rechargements.
 *
 * Utilisation :
 * const { save, load, saving } = useSWData()
 */
export function useSWData() {
  const [saving, setSaving] = useState(false)

  const save = useCallback(
    async (key: string, value: unknown): Promise<boolean> => {
      if (!('serviceWorker' in navigator)) return false

      const registration = await navigator.serviceWorker.ready.catch(
        () => null
      )

      if (!registration?.active) return false

      const worker = registration.active

      return new Promise<boolean>((resolve) => {
        setSaving(true)

        let finished = false
        let timeoutId: ReturnType<typeof setTimeout>

        const finish = (result: boolean) => {
          if (finished) return
          finished = true

          clearTimeout(timeoutId)
          navigator.serviceWorker.removeEventListener('message', handler)
          setSaving(false)
          resolve(result)
        }

        const handler = (event: MessageEvent) => {
          if (
            event.data?.type === 'CACHE_DATA_OK' &&
            event.data.key === key
          ) {
            finish(true)
          }
        }

        timeoutId = setTimeout(() => finish(false), 3000)

        navigator.serviceWorker.addEventListener('message', handler)

        try {
          worker.postMessage({
            type: 'CACHE_DATA',
            key,
            value,
          })
        } catch {
          finish(false)
        }
      })
    },
    []
  )

  const load = useCallback(
    async <T = unknown>(key: string): Promise<T | null> => {
      if (!('serviceWorker' in navigator)) return null

      const registration = await navigator.serviceWorker.ready.catch(
        () => null
      )

      if (!registration?.active) return null

      const worker = registration.active

      return new Promise<T | null>((resolve) => {
        let finished = false
        let timeoutId: ReturnType<typeof setTimeout>

        const finish = (value: T | null) => {
          if (finished) return
          finished = true

          clearTimeout(timeoutId)
          navigator.serviceWorker.removeEventListener('message', handler)
          resolve(value)
        }

        const handler = (event: MessageEvent) => {
          if (
            event.data?.type === 'GET_DATA_RESULT' &&
            event.data.key === key
          ) {
            finish((event.data.value ?? null) as T | null)
          }
        }

        timeoutId = setTimeout(() => finish(null), 2000)

        navigator.serviceWorker.addEventListener('message', handler)

        try {
          worker.postMessage({
            type: 'GET_DATA',
            key,
          })
        } catch {
          finish(null)
        }
      })
    },
    []
  )

  return {
    save,
    load,
    saving,
  }
}
