import Link from 'next/link'

export default function CtaBanner() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-[900px] mx-auto px-8 text-center">
        <h2 className="font-display font-extrabold text-[38px] text-navy mb-4 leading-tight">
          Your exhibition booth,
          <span className="text-gold"> fully equipped.</span>
        </h2>
        <p className="text-[#6B6B6B] text-[16px] leading-relaxed mb-10 max-w-[580px] mx-auto">
          Rent sofas, TVs, coffee machines, AV equipment and more from verified vendors —
          delivered to your stand, picked up after the show.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/register?type=consultant"
            className="bg-navy hover:bg-navy-light text-white font-bold px-8 py-4 rounded-xl text-[15px] transition-colors">
            Start Sourcing Free →
          </Link>
          <Link href="/register?type=vendor"
            className="bg-[#F9F6F0] border-[1.5px] border-[#DDD8CF] hover:border-navy text-navy font-bold px-8 py-4 rounded-xl text-[15px] transition-colors">
            List Your Products
          </Link>
        </div>
        <p className="text-[#6B6B6B] text-[13px] mt-6">
          Free to join · No commission on first 3 orders · Trusted by event agencies across Europe &amp; India
        </p>
      </div>
    </section>
  )
}
