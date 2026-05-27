import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // ── Auth required routes ──────────────────────────────────
  const requiresAuth = ['/dashboard', '/projects', '/vendor', '/cart', '/checkout']
  const needsAuth = requiresAuth.some(p => path.startsWith(p))

  if (needsAuth && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(loginUrl)
  }

  // ── Role-based protection (only if logged in) ─────────────
  if (user && needsAuth) {
    const { data: profile } = await supabase
      .from('profiles').select('user_type').eq('id', user.id).single()

    const userType = profile?.user_type

    // Vendor routes → vendors and admins only
    if (path.startsWith('/vendor') && userType !== 'vendor' && userType !== 'admin') {
      return NextResponse.redirect(new URL('/projects', request.url))
    }

    // Project routes → consultants and admins only
    if (path.startsWith('/projects') && userType !== 'consultant' && userType !== 'admin') {
      return NextResponse.redirect(new URL('/vendor/dashboard', request.url))
    }

    // Admin routes → admin only
    if (path.startsWith('/admin') && userType !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // ── Redirect logged-in users away from auth pages ─────────
  const authPages = ['/login', '/register']
  if (authPages.includes(path) && user) {
    const { data: profile } = await supabase
      .from('profiles').select('user_type').eq('id', user.id).single()

    if (profile?.user_type === 'vendor') {
      return NextResponse.redirect(new URL('/vendor/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/projects', request.url))
  }

  return supabaseResponse
}
