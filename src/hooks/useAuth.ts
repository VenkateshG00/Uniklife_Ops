import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Profile } from '../types'

export function useAuthInit() {
  const { setSession, setProfile, setLoading, setInitialized } = useAuthStore()

  useEffect(() => {
    let mounted = true

    async function fetchProfile(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (mounted && data) {
        setProfile(data as unknown as Profile)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      if (session?.user) fetchProfile(session.user.id).finally(() => {
        if (mounted) { setLoading(false); setInitialized(true) }
      })
      else { setLoading(false); setInitialized(true) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setSession, setProfile, setLoading, setInitialized])
}
