'use client'
import Link from 'next/link'
import { useState } from 'react'
import {
  ShoppingCart, User, Menu, X, Heart, LogOut,
  FolderOpen, Store, Zap, MapPin, ChevronDown, MessageSquare
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/ui/NotificationBell'

// ── Category mega-nav ─────────────────────────────────────────
const categoryNav = [
  {
    label: 'Furniture', href: '/browse?category=Furniture',
    children: [
      { label: 'Sofas & Lounge Seating',     href: '/browse?category=Furniture&sub=Sofas' },
      { label: 'Poseur / Bar Tables',         href: '/browse?category=Furniture&sub=Poseur' },
      { label: 'Bar Stools & Chairs',         href: '/browse?category=Furniture&sub=Stools' },
      { label: 'Conference & Meeting Tables', href: '/browse?category=Furniture&sub=Conference' },
      { label: 'Reception & Info Counters',   href: '/browse?category=Furniture&sub=Reception' },
    ],
  },
  {
    label: 'TV & Displays', href: '/browse?category=TV+%26+Digital+Displays',
    children: [
      { label: 'TV Screens (32"–85")',  href: '/browse?category=TV+%26+Digital+Displays' },
      { label: 'LED Video Walls',       href: '/browse?category=TV+%26+Digital+Displays' },
      { label: 'Touchscreen Kiosks',    href: '/browse?category=TV+%26+Digital+Displays' },
      { label: 'Digital Signage',       href: '/browse?category=TV+%26+Digital+Displays' },
    ],
  },
  {
    label: 'Audio / Visual', href: '/browse?category=Audio+%2F+Visual',
    children: [
      { label: 'PA & Speaker Systems', href: '/browse?category=Audio+%2F+Visual' },
      { label: 'Projectors & Screens', href: '/browse?category=Audio+%2F+Visual' },
      { label: 'Microphones & Mixers', href: '/browse?category=Audio+%2F+Visual' },
      { label: 'Conference AV',        href: '/browse?category=Audio+%2F+Visual' },
    ],
  },
  {
    label: 'Kitchen & Catering', href: '/browse?category=Kitchen+%26+Catering',
    children: [
      { label: 'Coffee Machines',          href: '/browse?category=Kitchen+%26+Catering' },
      { label: 'Refrigerators & Fridges',  href: '/browse?category=Kitchen+%26+Catering' },
      { label: 'Water Dispensers',         href: '/browse?category=Kitchen+%26+Catering' },
      { label: 'Catering Equipment',       href: '/browse?category=Kitchen+%26+Catering' },
    ],
  },
  {
    label: 'More', href: '/browse',
    children: [
      { label: '🗄 Display & Shelving',  href: '/browse?category=Display+%26+Shelving' },
      { label: '💡 Lighting',            href: '/browse?category=Lighting' },
      { label: '💻 IT & Connectivity',   href: '/browse?category=IT+%26+Connectivity' },
      { label: '📦 View All Categories', href: '/browse' },
    ],
  },
]

// ── Info/company nav ──────────────────────────────────────────
const infoNav = [
  { label: 'About Us',            href: '/about' },
  { label: 'How It Works',        href: '/how-it-works' },
  { label: 'Trade Show Calendar', href: '/shows' },
  { label: 'Premium Services',    href: '/premium' },
  { label: 'Blog',                href: '/blog' },
  { label: 'Careers',             href: '/careers' },
  { label: 'Help Centre',         href: '/help' },
]

export default function Header() {
  const { user, profile, signOut }    = useAuth()
  const { items }                     = useCart(user?.id)
  const { count: wishlistCount }      = useWishlist()
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [infoOpen,    setInfoOpen]    = useState(false)
  const router = useRouter()

  const cartCount = items.reduce((s, i) => s + i.quantity, 0)
  const userType  = (profile as any)?.user_type
  const isVendor  = userType === 'vendor'
  const isConsult = userType === 'consultant'

  const handleSignOut = async () => {
    await signOut()
    setAccountOpen(false)
    router.push('/browse')
    router.refresh()
  }

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      {/* ── Top utility bar ───────────────────────────────── */}
      <div className="bg-navy border-b border-white/5">
        <div className="max-w-[1280px] mx-auto px-8 h-9 flex items-center justify-between">
          {/* Info links */}
          <div className="hidden lg:flex items-center gap-4">
            {infoNav.slice(0, 5).map(item => (
              <Link key={item.href} href={item.href}
                className="text-[11.5px] text-white/50 hover:text-white/80 transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-4">
            {infoNav.slice(5).map(item => (
              <Link key={item.href} href={item.href}
                className="text-[11.5px] text-white/50 hover:text-white/80 transition-colors">
                {item.label}
              </Link>
            ))}
            {!user && (
              <>
                <span className="text-white/20">|</span>
                <Link href="/login"    className="text-[11.5px] text-white/50 hover:text-white/80 transition-colors">Sign In</Link>
                <Link href="/register" className="text-[11.5px] text-gold hover:text-gold-light transition-colors font-medium">Register Free</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Main nav bar ──────────────────────────────────── */}
      <div className="border-b border-[#DDD8CF]">
        <div className="max-w-[1280px] mx-auto px-8 h-[62px] flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/browse" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-[34px] h-[34px] bg-navy rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 014 0v2"/>
              </svg>
            </div>
            <span className="font-display font-extrabold text-[19px] text-navy tracking-tight">
              Booth<span className="text-gold">Market</span>
            </span>
            <span className="text-[9.5px] font-semibold tracking-widest uppercase bg-cream-dark text-[#6B6B6B] px-1.5 py-0.5 rounded-full hidden sm:block">
              EU · UK · IN
            </span>
          </Link>

          {/* Category nav — guests + consultants */}
          {!isVendor && (
            <nav className="hidden lg:flex items-center gap-0">
              {categoryNav.map(item => (
                <div key={item.label} className="relative group">
                  <Link href={item.href}
                    className="flex items-center gap-0.5 text-[12.5px] text-[#1A1A1A] px-3 py-2 rounded hover:bg-cream transition-colors whitespace-nowrap font-medium">
                    {item.label}
                    <ChevronDown size={11} className="ml-0.5 text-[#6B6B6B]" />
                  </Link>
                  <div className="absolute top-full left-0 pt-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-150 z-50">
                    <div className="bg-white border border-[#DDD8CF] rounded-xl shadow-xl p-2 min-w-[220px]">
                      {item.children.map(child => (
                        <Link key={child.label} href={child.href}
                          className="block px-3.5 py-2.5 text-[12.5px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors">
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </nav>
          )}

          {/* Vendor shortcut */}
          {isVendor && (
            <div className="hidden lg:flex items-center gap-1">
              <Link href="/vendor/dashboard" className="flex items-center gap-1.5 text-[13px] text-gold px-3 py-2 rounded hover:bg-cream transition-colors">
                <Store size={13} /> Dashboard
              </Link>
              <Link href="/vendor/products" className="text-[13px] text-[#1A1A1A] px-3 py-2 rounded hover:bg-cream transition-colors">Products</Link>
              <Link href="/vendor/orders"   className="text-[13px] text-[#1A1A1A] px-3 py-2 rounded hover:bg-cream transition-colors">Orders</Link>
            </div>
          )}

          {/* Consultant shortcuts */}
          {isConsult && (
            <div className="hidden lg:flex items-center gap-0">
              <Link href="/projects" className="flex items-center gap-1.5 text-[12.5px] text-[#1A1A1A] px-3 py-2 rounded hover:bg-cream transition-colors">
                <FolderOpen size={12} className="text-gold" /> Projects
              </Link>
              <Link href="/browse/vendors" className="flex items-center gap-1.5 text-[12.5px] text-[#1A1A1A] px-3 py-2 rounded hover:bg-cream transition-colors">
                <MapPin size={12} className="text-gold" /> Find Vendors
              </Link>
              <Link href="/quotes" className="flex items-center gap-1.5 text-[12.5px] text-[#1A1A1A] px-3 py-2 rounded hover:bg-cream transition-colors">
                <MessageSquare size={12} className="text-gold" /> My Quotes
              </Link>
              <Link href="/emergency" className="flex items-center gap-1.5 text-[12.5px] text-red-600 px-3 py-2 rounded hover:bg-red-50 transition-colors">
                <Zap size={11} /> Emergency
              </Link>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            {!isVendor && (
              <Link href="/wishlist" className="hidden sm:flex relative items-center p-2 rounded hover:bg-cream transition-colors">
                <Heart size={18} className="text-[#6B6B6B]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {user && <div className="hidden sm:block"><NotificationBell /></div>}

            {user ? (
              <div className="relative hidden sm:block">
                <button onClick={() => setAccountOpen(v => !v)}
                  className="flex items-center gap-1.5 text-[12.5px] text-navy border-[1.5px] border-navy px-3 py-1.5 rounded-lg hover:bg-navy hover:text-white transition-colors">
                  <User size={13} />
                  {(profile as any)?.full_name?.split(' ')[0] || 'Account'}
                  <ChevronDown size={11} />
                </button>
                {accountOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-[#DDD8CF] rounded-xl shadow-xl p-2 min-w-[190px]">
                      <div className="px-3 py-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                          isVendor ? 'bg-gold/15 text-gold' : isConsult ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isVendor ? '🏪 Vendor' : isConsult ? '🗂 Consultant' : 'Account'}
                        </span>
                      </div>
                      {isVendor ? (
                        <>
                          <Link href="/vendor/dashboard" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors"><Store size={13}/> Dashboard</Link>
                          <Link href="/vendor/products"  onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors"><User size={13}/> My Products</Link>
                          <Link href="/vendor/orders"    onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors"><ShoppingCart size={13}/> Orders</Link>
                          <Link href="/vendor/sla"       onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors">⚙ SLA Settings</Link>
                        </>
                      ) : isConsult ? (
                        <>
                          <Link href="/projects"  onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors"><FolderOpen size={13}/> My Projects</Link>
                          <Link href="/dashboard" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors"><User size={13}/> Dashboard</Link>
                        </>
                      ) : (
                        <Link href="/dashboard" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors"><User size={13}/> Dashboard</Link>
                      )}
                      {(profile as any)?.role === 'admin' && (
                        <Link href="/admin" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-gold rounded-lg hover:bg-cream transition-colors">
                          🛡 Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-[#DDD8CF] my-1.5" />
                      <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-red-600 rounded-lg hover:bg-red-50 transition-colors w-full text-left">
                        <LogOut size={13} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login" className="hidden sm:block text-[12.5px] text-navy border-[1.5px] border-navy px-3 py-1.5 rounded-lg hover:bg-navy hover:text-white transition-colors">
                Sign In
              </Link>
            )}

            {!isVendor && (
              <Link href="/cart" className="flex items-center gap-1.5 bg-navy text-white px-3 py-1.5 rounded-lg text-[12.5px] font-medium hover:bg-navy-light transition-colors">
                <ShoppingCart size={14} />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="bg-gold rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold">{cartCount}</span>
                )}
              </Link>
            )}

            <button className="lg:hidden p-2 hover:bg-cream rounded transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#DDD8CF] px-6 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
          {/* Category links */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] px-1 pt-2 pb-1">Categories</p>
          {categoryNav.map(item => (
            <Link key={item.label} href={item.href} className="block py-2.5 text-sm text-[#1A1A1A] border-b border-cream-dark" onClick={() => setMobileOpen(false)}>
              {item.label}
            </Link>
          ))}
          {/* Info links */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] px-1 pt-3 pb-1">Information</p>
          {infoNav.map(item => (
            <Link key={item.href} href={item.href} className="block py-2.5 text-sm text-[#6B6B6B] border-b border-cream-dark" onClick={() => setMobileOpen(false)}>
              {item.label}
            </Link>
          ))}
          {/* Auth */}
          {user
            ? <button onClick={handleSignOut} className="block py-2.5 text-sm text-red-600 w-full text-left mt-2">Sign Out</button>
            : <div className="flex gap-3 mt-3">
                <Link href="/login"    className="flex-1 text-center border border-navy text-navy py-2.5 rounded-lg text-sm font-medium" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link href="/register" className="flex-1 text-center bg-navy text-white py-2.5 rounded-lg text-sm font-bold" onClick={() => setMobileOpen(false)}>Register</Link>
              </div>
          }
        </div>
      )}
    </header>
  )
}
