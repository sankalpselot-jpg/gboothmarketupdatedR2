'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, User, Menu, X, Heart, LogOut, FolderOpen, Store, Zap, MapPin } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/ui/NotificationBell'

const navItems = [
  {
    label: 'Furniture', href: '/browse?category=Furniture',
    children: [
      { label: 'Sofas & Lounge Seating',      href: '/browse?category=Furniture&sub=Sofas+%26+Lounge+Seating' },
      { label: 'Poseur / Bar Tables',          href: '/browse?category=Furniture&sub=Poseur+%2F+Bar+Tables' },
      { label: 'Bar Stools & Chairs',          href: '/browse?category=Furniture&sub=Bar+Stools+%26+Chairs' },
      { label: 'Conference & Meeting Tables',  href: '/browse?category=Furniture&sub=Conference+%26+Meeting+Tables' },
      { label: 'Reception & Info Counters',    href: '/browse?category=Furniture&sub=Reception+%26+Info+Counters' },
    ],
  },
  {
    label: 'TV & Displays', href: '/browse?category=TV+%26+Digital+Displays',
    children: [
      { label: 'TV Screens (32"–85")',   href: '/browse?category=TV+%26+Digital+Displays&sub=TV+Screens' },
      { label: 'LED Video Walls',        href: '/browse?category=TV+%26+Digital+Displays&sub=LED+Video+Walls' },
      { label: 'Touchscreen Kiosks',     href: '/browse?category=TV+%26+Digital+Displays&sub=Touchscreen+Kiosks' },
      { label: 'Digital Signage Totems', href: '/browse?category=TV+%26+Digital+Displays&sub=Digital+Signage' },
    ],
  },
  {
    label: 'Audio / Visual', href: '/browse?category=Audio+%2F+Visual',
    children: [
      { label: 'PA & Speaker Systems', href: '/browse?category=Audio+%2F+Visual&sub=PA+%26+Speaker+Systems' },
      { label: 'Projectors & Screens', href: '/browse?category=Audio+%2F+Visual&sub=Projectors+%26+Screens' },
      { label: 'Microphones & Mixers', href: '/browse?category=Audio+%2F+Visual&sub=Microphones' },
      { label: 'Conference AV',        href: '/browse?category=Audio+%2F+Visual&sub=Conference+AV' },
    ],
  },
  {
    label: 'Kitchen & Catering', href: '/browse?category=Kitchen+%26+Catering',
    children: [
      { label: 'Coffee Machines',         href: '/browse?category=Kitchen+%26+Catering&sub=Coffee+Machines' },
      { label: 'Refrigerators & Bar Fridges', href: '/browse?category=Kitchen+%26+Catering&sub=Refrigerators' },
      { label: 'Water Dispensers',        href: '/browse?category=Kitchen+%26+Catering&sub=Water+Dispensers' },
      { label: 'Catering Trolleys',       href: '/browse?category=Kitchen+%26+Catering&sub=Catering+Trolleys' },
    ],
  },
  {
    label: 'More', href: '/browse',
    children: [
      { label: '🖥 Display & Shelving', href: '/browse?category=Display+%26+Shelving' },
      { label: '💡 Lighting',           href: '/browse?category=Lighting' },
      { label: '💻 IT & Connectivity',  href: '/browse?category=IT+%26+Connectivity' },
    ],
  },
]

export default function Header() {
  const { user, profile, signOut }     = useAuth()
  const { items }                      = useCart(user?.id)
  const { count: wishlistCount }       = useWishlist()
  const [mobileOpen,  setMobileOpen]   = useState(false)
  const [accountOpen, setAccountOpen]  = useState(false)
  const router = useRouter()

  const cartCount  = items.reduce((sum, i) => sum + i.quantity, 0)
  const userType   = (profile as any)?.user_type
  const isVendor   = userType === 'vendor'
  const isConsult  = userType === 'consultant'

  const handleSignOut = async () => {
    await signOut()
    setAccountOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-[#DDD8CF] sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-8 h-[68px] flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-[36px] h-[36px] bg-navy rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 014 0v2"/>
            </svg>
          </div>
          <span className="font-display font-extrabold text-xl text-navy tracking-tight">
            Booth<span className="text-gold">Market</span>
          </span>
          <span className="text-[10px] font-semibold tracking-[0.06em] uppercase bg-cream-dark text-[#6B6B6B] px-2 py-0.5 rounded-full ml-1 hidden sm:block">
            EU · UK · IN
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1">
          {/* Consultant shortcuts */}
          {isConsult && (
            <>
              <Link href="/projects" className="flex items-center gap-1.5 text-[13px] text-[#1A1A1A] px-3 py-2 rounded hover:bg-cream transition-colors whitespace-nowrap">
                <FolderOpen size={13} className="text-gold" /> My Projects
              </Link>
              <Link href="/browse" className="text-[13px] text-[#1A1A1A] px-3 py-2 rounded hover:bg-cream transition-colors whitespace-nowrap">
                Browse
              </Link>
              <Link href="/browse/vendors" className="text-[13px] text-[#1A1A1A] px-3 py-2 rounded hover:bg-cream transition-colors whitespace-nowrap">
                Find Vendors
              </Link>
              <Link href="/emergency" className="flex items-center gap-1.5 text-[13px] text-red-600 px-3 py-2 rounded hover:bg-red-50 transition-colors whitespace-nowrap">
                <Zap size={12} /> Emergency
              </Link>
            </>
          )}
          {/* Vendor shortcut */}
          {isVendor && (
            <Link href="/vendor/dashboard" className="flex items-center gap-1.5 text-[13px] text-gold px-3 py-2 rounded hover:bg-cream transition-colors">
              <Store size={13} /> Vendor Dashboard
            </Link>
          )}
          {/* Default nav for guests */}
          {!user && navItems.map(item => (
            <div key={item.label} className="relative group">
              <Link href={item.href}
                className="flex items-center gap-1 text-[13px] text-[#1A1A1A] px-3 py-2 rounded hover:bg-cream transition-colors whitespace-nowrap">
                {item.label}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </Link>
              <div className="absolute top-full left-0 pt-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-150 -translate-y-1 group-hover:translate-y-0 z-50">
                <div className="bg-white border border-[#DDD8CF] rounded-xl shadow-lg p-2 min-w-[220px]">
                  {item.children.map(child => (
                    <Link key={child.href} href={child.href}
                      className="block px-3.5 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors">
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {!isVendor && (
            <Link href="/wishlist" className="hidden sm:flex relative items-center p-2 rounded hover:bg-cream transition-colors">
              <Heart size={19} className="text-[#6B6B6B]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}

          {user && (
            <div className="hidden sm:block">
              <NotificationBell />
            </div>
          )}

          {user ? (
            <div className="relative hidden sm:block">
              <button onClick={() => setAccountOpen(v => !v)}
                className="flex items-center gap-1.5 text-[13px] text-navy border-[1.5px] border-navy px-3.5 py-2 rounded-lg hover:bg-navy hover:text-white transition-colors">
                <User size={14} />
                {(profile as any)?.full_name?.split(' ')[0] || 'Account'}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-[#DDD8CF] rounded-xl shadow-xl p-2 min-w-[190px]">
                    <div className="px-3 py-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                        isVendor ? 'bg-gold/15 text-gold' : isConsult ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isVendor ? 'Vendor' : isConsult ? 'Consultant' : 'Account'}
                      </span>
                    </div>
                    {isVendor ? (
                      <>
                        <Link href="/vendor/dashboard" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors"><Store size={13} /> Vendor Dashboard</Link>
                        <Link href="/vendor/products"  onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors"><User size={13} /> My Products</Link>
                        <Link href="/vendor/orders"    onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors"><ShoppingCart size={13} /> Orders</Link>
                      </>
                    ) : isConsult ? (
                      <>
                        <Link href="/projects"  onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors"><FolderOpen size={13} /> My Projects</Link>
                        <Link href="/dashboard" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors"><User size={13} /> Dashboard</Link>
                      </>
                    ) : (
                      <Link href="/dashboard" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#1A1A1A] rounded-lg hover:bg-cream transition-colors"><User size={13} /> Dashboard</Link>
                    )}
                    {(profile as any)?.role === 'admin' && (
                      <Link href="/admin" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-gold rounded-lg hover:bg-cream transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-[#DDD8CF] my-1.5" />
                    <button onClick={handleSignOut} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-600 rounded-lg hover:bg-red-50 transition-colors w-full text-left">
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login" className="hidden sm:block text-[13px] text-navy border-[1.5px] border-navy px-3.5 py-2 rounded-lg hover:bg-navy hover:text-white transition-colors">
              Sign In
            </Link>
          )}

          {!isVendor && (
            <Link href="/cart" className="flex items-center gap-1.5 bg-navy text-white px-3.5 py-2 rounded-lg text-[13px] font-medium hover:bg-navy-light transition-colors">
              <ShoppingCart size={15} />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="bg-gold rounded-full w-[17px] h-[17px] text-[10px] flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          <button className="lg:hidden p-2 hover:bg-cream rounded transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#DDD8CF] px-6 py-4 space-y-1">
          {isVendor ? (
            <>
              <Link href="/vendor/dashboard" className="block py-2.5 text-sm text-gold border-b border-cream-dark" onClick={() => setMobileOpen(false)}>Vendor Dashboard</Link>
              <Link href="/vendor/products"  className="block py-2.5 text-sm text-[#1A1A1A] border-b border-cream-dark" onClick={() => setMobileOpen(false)}>My Products</Link>
              <Link href="/vendor/orders"    className="block py-2.5 text-sm text-[#1A1A1A] border-b border-cream-dark" onClick={() => setMobileOpen(false)}>Orders</Link>
            </>
          ) : isConsult ? (
            <>
              <Link href="/projects"      className="block py-2.5 text-sm text-[#1A1A1A] border-b border-cream-dark" onClick={() => setMobileOpen(false)}>My Projects</Link>
              <Link href="/browse"        className="block py-2.5 text-sm text-[#1A1A1A] border-b border-cream-dark" onClick={() => setMobileOpen(false)}>Browse Products</Link>
              <Link href="/browse/vendors"className="block py-2.5 text-sm text-[#1A1A1A] border-b border-cream-dark" onClick={() => setMobileOpen(false)}>Find Vendors</Link>
              <Link href="/emergency"     className="block py-2.5 text-sm text-red-600 border-b border-cream-dark" onClick={() => setMobileOpen(false)}>⚡ Emergency</Link>
            </>
          ) : (
            navItems.map(item => (
              <Link key={item.label} href={item.href} className="block py-2.5 text-sm text-[#1A1A1A] border-b border-cream-dark" onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            ))
          )}
          {user
            ? <button onClick={handleSignOut} className="block py-2.5 text-sm text-red-600 w-full text-left mt-1">Sign Out</button>
            : <Link href="/login" className="block mt-3 text-center btn-primary py-3" onClick={() => setMobileOpen(false)}>Sign In</Link>
          }
        </div>
      )}
    </header>
  )
}
