import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'
import { createServerClient as _createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import type { CookieOptions } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createBrowserClient() {
  return _createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export function createServerClient(cookieStore: any) {
  return _createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value },
      set(name: string, value: string, options: CookieOptions) {
        try { cookieStore.set({ name, value, ...options }) } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try { cookieStore.set({ name, value: '', ...options }) } catch {}
      },
    },
  })
}

export async function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const supabase = _createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) { return request.cookies.get(name)?.value },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })
  await supabase.auth.getSession()
  return { supabase, response }
}
