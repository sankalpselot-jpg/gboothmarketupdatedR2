'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Send, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  open:     { label: 'Awaiting Reply', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  replied:  { label: 'Vendor Replied', cls: 'bg-blue-50 text-blue-700 border-blue-200',       icon: MessageSquare },
  accepted: { label: 'Quote Accepted', cls: 'bg-green-50 text-green-700 border-green-200',    icon: CheckCircle },
  declined: { label: 'Declined',       cls: 'bg-red-50 text-red-700 border-red-200',          icon: XCircle },
  expired:  { label: 'Expired',        cls: 'bg-gray-50 text-gray-500 border-gray-200',       icon: Clock },
}

export default function MyQuotesPage() {
  const db = useMemo(() => createClient() as any, [])
  const [threads,    setThreads]    = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [messages,   setMessages]   = useState<Record<string, any[]>>({})
  const [reply,      setReply]      = useState('')
  const [sending,    setSending]    = useState(false)
  const [userId,     setUserId]     = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await db.from('quote_threads')
        .select('*, vendor_profiles(company_name, is_verified), vendor_products(name, price_per_day, base_currency), projects(name)')
        .eq('consultant_id', user.id)
        .order('updated_at', { ascending: false })
      setThreads((data || []).map((t: any) => ({
        ...t,
        vendor_profiles: Array.isArray(t.vendor_profiles) ? t.vendor_profiles[0] : t.vendor_profiles,
        vendor_products: Array.isArray(t.vendor_products) ? t.vendor_products[0] : t.vendor_products,
        projects:        Array.isArray(t.projects)        ? t.projects[0]        : t.projects,
      })))
      setLoading(false)
    }
    load()
  }, [db])

  const loadMessages = async (threadId: string) => {
    if (messages[threadId]) return
    const { data } = await db.from('quote_messages')
      .select('*').eq('thread_id', threadId).order('created_at', { ascending: true })
    setMessages(prev => ({ ...prev, [threadId]: data || [] }))
  }

  const toggleThread = async (threadId: string) => {
    if (expanded === threadId) { setExpanded(null); return }
    setExpanded(threadId)
    await loadMessages(threadId)
    // Mark as read
    await db.from('quote_threads').update({ status: 'open' }).eq('id', threadId).eq('status', 'replied')
  }

  const sendReply = async (threadId: string) => {
    if (!reply.trim() || !userId) return
    setSending(true)
    const { data, error } = await db.from('quote_messages').insert({
      thread_id:   threadId,
      sender_id:   userId,
      sender_role: 'consultant',
      message:     reply.trim(),
    }).select().single()
    if (error) { toast.error(error.message); setSending(false); return }
    setMessages(prev => ({ ...prev, [threadId]: [...(prev[threadId] || []), data] }))
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, updated_at: new Date().toISOString() } : t))
    setReply('')
    toast.success('Message sent to vendor')
    setSending(false)
  }

  const acceptQuote = async (thread: any) => {
    const lastMsg = (messages[thread.id] || []).slice().reverse().find((m: any) => m.quoted_price)
    if (!lastMsg) { toast.error('No price quote found in this thread'); return }
    await db.from('quote_threads').update({ status: 'accepted' }).eq('id', thread.id)
    setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, status: 'accepted' } : t))
    toast.success('Quote accepted! Proceed to your project to checkout.')
  }

  if (loading) return <div className="p-8 text-[#6B6B6B] text-sm">Loading quotes…</div>

  return (
    <div className="p-8 max-w-[800px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-navy">My Quote Requests</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Track enquiries and vendor responses</p>
        </div>
        <Link href="/browse" className="text-sm text-gold hover:text-gold-light transition-colors">
          Browse products →
        </Link>
      </div>

      {threads.length === 0 ? (
        <div className="bg-white border border-[#DDD8CF] rounded-2xl p-12 text-center">
          <MessageSquare size={36} className="mx-auto mb-4 text-[#DDD8CF]" />
          <h2 className="font-display font-bold text-lg text-navy mb-2">No quote requests yet</h2>
          <p className="text-[#6B6B6B] text-sm mb-5">
            Visit a product page and click "Request Quote" to start a conversation with a vendor.
          </p>
          <Link href="/browse" className="bg-navy text-white font-bold px-5 py-2.5 rounded-lg text-sm inline-block hover:bg-navy-light transition-colors">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map(thread => {
            const cfg       = STATUS_CONFIG[thread.status] || STATUS_CONFIG.open
            const Icon      = cfg.icon
            const isOpen    = expanded === thread.id
            const threadMsgs= messages[thread.id] || []
            const lastQuote = threadMsgs.slice().reverse().find((m: any) => m.quoted_price)

            return (
              <div key={thread.id} className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden">
                {/* Thread header */}
                <button onClick={() => toggleThread(thread.id)} className="w-full text-left px-5 py-4 hover:bg-cream/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-navy rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {thread.vendor_profiles?.company_name?.[0]?.toUpperCase() || 'V'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-navy text-[14px] truncate">
                          {thread.vendor_profiles?.company_name || 'Vendor'}
                        </p>
                        <p className="text-[12px] text-[#6B6B6B] truncate">
                          {thread.vendor_products?.name || thread.subject || 'Quote request'}
                          {thread.projects?.name && ` · ${thread.projects.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {lastQuote && (
                        <span className="text-[13px] font-bold text-navy">
                          {lastQuote.quoted_currency === 'INR' ? '₹' : lastQuote.quoted_currency === 'GBP' ? '£' : '€'}
                          {lastQuote.quoted_price?.toLocaleString()}/day
                        </span>
                      )}
                      <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                      {isOpen ? <ChevronUp size={16} className="text-[#6B6B6B]" /> : <ChevronDown size={16} className="text-[#6B6B6B]" />}
                    </div>
                  </div>
                </button>

                {/* Thread messages */}
                {isOpen && (
                  <div className="border-t border-[#DDD8CF]">
                    {/* Product context */}
                    {thread.vendor_products && (
                      <div className="px-5 py-3 bg-cream/50 border-b border-[#DDD8CF] flex items-center gap-3">
                        <Package size={14} className="text-gold flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-medium text-navy truncate">{thread.vendor_products.name}</p>
                          <p className="text-[11.5px] text-[#6B6B6B]">Listed at {thread.vendor_products.base_currency === 'INR' ? '₹' : '€'}{thread.vendor_products.price_per_day?.toLocaleString()}/day</p>
                        </div>
                        <Link href={`/browse/products/${thread.vendor_product_id}`}
                          className="text-[12px] text-gold hover:text-gold-light transition-colors flex-shrink-0">
                          View product →
                        </Link>
                      </div>
                    )}

                    {/* Messages */}
                    <div className="p-5 space-y-4 max-h-[340px] overflow-y-auto">
                      {threadMsgs.length === 0 ? (
                        <p className="text-[#6B6B6B] text-sm text-center py-4">Loading messages…</p>
                      ) : threadMsgs.map((msg: any) => {
                        const isMe = msg.sender_role === 'consultant'
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${isMe ? 'bg-navy text-white' : 'bg-[#F5F2EC] text-navy'}`}>
                              <p className="text-[13px] leading-relaxed">{msg.message}</p>
                              {msg.quoted_price && (
                                <div className={`mt-2 pt-2 border-t ${isMe ? 'border-white/20' : 'border-[#DDD8CF]'}`}>
                                  <p className={`text-[12px] font-semibold ${isMe ? 'text-gold-light' : 'text-gold'}`}>
                                    Quoted: {msg.quoted_currency === 'INR' ? '₹' : '€'}{msg.quoted_price?.toLocaleString()}/day
                                  </p>
                                </div>
                              )}
                              <p className={`text-[10.5px] mt-1.5 ${isMe ? 'text-white/50' : 'text-[#6B6B6B]'}`}>
                                {new Date(msg.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Accept quote button */}
                    {thread.status === 'replied' && lastQuote && (
                      <div className="px-5 pb-3 pt-0">
                        <button onClick={() => acceptQuote(thread)}
                          className="w-full flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 font-bold py-2.5 rounded-lg text-sm hover:bg-green-100 transition-colors">
                          <CheckCircle size={15} /> Accept Quote — {lastQuote.quoted_currency === 'INR' ? '₹' : '€'}{lastQuote.quoted_price?.toLocaleString()}/day
                        </button>
                      </div>
                    )}

                    {/* Reply box */}
                    {thread.status !== 'accepted' && thread.status !== 'declined' && (
                      <div className="px-5 pb-4 flex gap-2">
                        <input value={reply} onChange={e => setReply(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(thread.id) }}}
                          placeholder="Type a message to the vendor…"
                          className="flex-1 border border-[#DDD8CF] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-navy transition-colors" />
                        <button onClick={() => sendReply(thread.id)} disabled={sending || !reply.trim()}
                          className="flex items-center gap-1.5 bg-navy hover:bg-navy-light text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                          <Send size={14} /> Send
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
