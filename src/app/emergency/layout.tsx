export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConsultantSidebar from '@/components/consultant/ConsultantSidebar'

export default async function EmergencyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('user_type, full_name, company_name').eq('id', user.id).single()

  if (profile?.user_type === 'vendor') redirect('/vendor/emergency')

  return (
    <div className="min-h-screen bg-[#F9F6F0] flex">
      <ConsultantSidebar
        userName={profile?.full_name ?? ''}
        companyName={profile?.company_name ?? ''}
      />
      <main className="flex-1 overflow-auto min-h-screen">{children}</main>
    </div>
  )
}
