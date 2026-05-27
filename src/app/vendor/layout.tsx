export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VendorSidebar from '@/components/vendor/VendorSidebar'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('user_type, full_name, company_name').eq('id', user.id).single()

  if (profile?.user_type !== 'vendor' && profile?.user_type !== 'admin') {
    redirect('/projects')
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex">
      <VendorSidebar
        userName={profile?.full_name ?? ''}
        companyName={profile?.company_name ?? ''}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
