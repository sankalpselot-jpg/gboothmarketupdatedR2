export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title:  'Create Your Project',
      desc:   'Name your exhibition, add venue, dates and budget. Each show gets its own project workspace.',
      icon:   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    },
    {
      number: '02',
      title:  'Browse & Add to Cart',
      desc:   'Search sofas, TVs, coffee machines, AV gear and more from verified vendors in your region.',
      icon:   'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    },
    {
      number: '03',
      title:  'Checkout & Split Orders',
      desc:   'Place your order — it splits automatically per vendor. Each vendor fulfils their items independently.',
      icon:   'M5 13l4 4L19 7',
    },
    {
      number: '04',
      title:  'Vendor Delivers to Booth',
      desc:   'Vendors deliver to your stand before the show opens and collect after. Track everything in real time.',
      icon:   'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    },
  ]

  return (
    <section className="py-20 bg-white border-b border-[#DDD8CF]">
      <div className="max-w-[1100px] mx-auto px-8">
        <div className="text-center mb-14">
          <h2 className="font-display font-extrabold text-[36px] text-navy mb-3">How BoothMarket Works</h2>
          <p className="text-[#6B6B6B] text-[16px] max-w-[540px] mx-auto">
            From browsing to booth delivery — the whole rental process in one platform.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.number} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-[#DDD8CF] to-transparent z-0" />
              )}
              <div className="relative z-10">
                <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mb-5 relative">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-navy">
                    <path d={s.icon} />
                  </svg>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-gold text-navy text-[10px] font-bold rounded-full flex items-center justify-center">
                    {s.number}
                  </span>
                </div>
                <h3 className="font-display font-bold text-navy text-[16px] mb-2">{s.title}</h3>
                <p className="text-[#6B6B6B] text-[13.5px] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dual role callout */}
        <div className="grid md:grid-cols-2 gap-5 mt-14">
          <div className="bg-navy rounded-2xl p-7">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-3">For Design Consultants</p>
            <h3 className="font-display font-bold text-white text-xl mb-3">Source everything for your booth in one place</h3>
            <ul className="space-y-2 text-white/60 text-[13.5px]">
              {['Multi-vendor project cart','Condition-verified inventory','SLA-backed delivery & pickup','Deposit payment options'].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-gold">✓</span> {f}
                </li>
              ))}
            </ul>
            <a href="/register" className="inline-block mt-5 bg-gold hover:bg-gold-light text-navy font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">
              Start a Project →
            </a>
          </div>
          <div className="bg-[#F9F6F0] border border-[#DDD8CF] rounded-2xl p-7">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-3">For Rental Vendors</p>
            <h3 className="font-display font-bold text-navy text-xl mb-3">Reach consultants sourcing for exhibitions</h3>
            <ul className="space-y-2 text-[#6B6B6B] text-[13.5px]">
              {['List furniture, AV & electronics','Set regional pricing','Publish SLA commitments','Receive orders directly'].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-gold">✓</span> {f}
                </li>
              ))}
            </ul>
            <a href="/register" className="inline-block mt-5 bg-navy hover:bg-navy-light text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">
              List Your Products →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
