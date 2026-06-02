import Link from 'next/link'

const CATEGORIES = [
  {
    name:    'Furniture',
    icon:    '🛋️',
    desc:    'Sofas, lounge chairs, poseur tables, bar stools, reception counters',
    slug:    'Furniture',
    color:   'bg-amber-50 border-amber-100',
    iconBg:  'bg-amber-100',
    items:   ['Sofas & Lounges', 'Poseur Tables', 'Bar Stools', 'Reception Counters'],
  },
  {
    name:    'TV & Digital Displays',
    icon:    '📺',
    desc:    'LED screens, video walls, touchscreen kiosks, digital signage',
    slug:    'TV+%26+Digital+Displays',
    color:   'bg-blue-50 border-blue-100',
    iconBg:  'bg-blue-100',
    items:   ['32"–85" TV Screens', 'LED Video Walls', 'Touchscreen Kiosks', 'Digital Totems'],
  },
  {
    name:    'Audio / Visual',
    icon:    '🔊',
    desc:    'PA systems, projectors, microphones, conference AV',
    slug:    'Audio+%2F+Visual',
    color:   'bg-purple-50 border-purple-100',
    iconBg:  'bg-purple-100',
    items:   ['PA & Speaker Systems', 'Projectors', 'Microphones', 'Conference AV'],
  },
  {
    name:    'Kitchen & Catering',
    icon:    '☕',
    desc:    'Coffee machines, bar fridges, water dispensers, catering counters',
    slug:    'Kitchen+%26+Catering',
    color:   'bg-orange-50 border-orange-100',
    iconBg:  'bg-orange-100',
    items:   ['Coffee Machines', 'Bar Fridges', 'Water Dispensers', 'Catering Trolleys'],
  },
  {
    name:    'Display & Shelving',
    icon:    '🗄️',
    desc:    'Product shelves, showcase cabinets, plinths, gridwall panels',
    slug:    'Display+%26+Shelving',
    color:   'bg-teal-50 border-teal-100',
    iconBg:  'bg-teal-100',
    items:   ['Display Shelves', 'Showcase Cabinets', 'Plinths & Pedestals', 'Gridwall Panels'],
  },
  {
    name:    'Lighting',
    icon:    '💡',
    desc:    'LED spotlights, lightboxes, backlit panels, neon & ambient',
    slug:    'Lighting',
    color:   'bg-yellow-50 border-yellow-100',
    iconBg:  'bg-yellow-100',
    items:   ['LED Spotlights', 'Lightboxes', 'Backlit Panels', 'Neon Lighting'],
  },
  {
    name:    'IT & Connectivity',
    icon:    '💻',
    desc:    'iPad kiosks, laptops, charging stations, Wi-Fi routers',
    slug:    'IT+%26+Connectivity',
    color:   'bg-indigo-50 border-indigo-100',
    iconBg:  'bg-indigo-100',
    items:   ['iPad Kiosks', 'Presentation PCs', 'Charging Stations', 'Wi-Fi Routers'],
  },
]

export default function ProductsSection() {
  return (
    <section className="py-20 bg-[#F9F6F0]">
      <div className="max-w-[1100px] mx-auto px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-display font-extrabold text-[34px] text-navy mb-2">
              Browse by Category
            </h2>
            <p className="text-[#6B6B6B] text-[15px]">
              Everything you need for your exhibition booth — from furniture to electronics
            </p>
          </div>
          <Link href="/browse"
            className="hidden md:block text-[13.5px] font-medium text-gold hover:text-gold-light border border-gold/30 px-4 py-2 rounded-lg hover:bg-gold/5 transition-colors">
            View all products →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <Link key={cat.name} href={`/browse?category=${cat.slug}`}
              className={`group border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all ${cat.color}`}>
              <div className={`w-12 h-12 ${cat.iconBg} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                {cat.icon}
              </div>
              <h3 className="font-display font-bold text-navy text-[15px] mb-1.5">{cat.name}</h3>
              <p className="text-[12.5px] text-[#6B6B6B] leading-relaxed mb-3">{cat.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map(item => (
                  <span key={item} className="text-[10.5px] bg-white/70 border border-white text-[#6B6B6B] px-2 py-0.5 rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            </Link>
          ))}

          {/* CTA tile */}
          <Link href="/register"
            className="border-2 border-dashed border-navy/20 rounded-2xl p-5 hover:border-navy/40 hover:bg-navy/3 transition-all flex flex-col items-center justify-center text-center gap-3 group">
            <div className="w-12 h-12 bg-navy/8 rounded-xl flex items-center justify-center group-hover:bg-navy/15 transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-navy">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <div>
              <p className="font-display font-bold text-navy text-[14px]">List Your Products</p>
              <p className="text-[12px] text-[#6B6B6B] mt-0.5">Are you a rental vendor? Join free →</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
