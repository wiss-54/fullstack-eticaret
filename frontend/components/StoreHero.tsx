import Link from 'next/link';

export default function StoreHero() {
  return (
    <section className="relative overflow-hidden border-b border-amber-100 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:border-amber-900/40 dark:from-zinc-950 dark:via-amber-950/20 dark:to-rose-950/20">
      <div className="absolute -right-16 top-0 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
      <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-rose-200/40 blur-3xl dark:bg-rose-500/10" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
            Hatira Niyat
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-5xl">
            Ozel anlarina ozel urunler
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
            Kişiselleştirilebilir seçenekler, sipariş notu ve güvenli alışveriş. İkas tarzı
            profesyonel mağaza deneyimini adım adım kuruyoruz.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#urunler"
              className="rounded-full bg-amber-800 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-900 dark:bg-amber-500 dark:text-zinc-950"
            >
              Urunleri Kesfet
            </a>
            <Link
              href="/sepet"
              className="rounded-full border border-amber-300 bg-white/80 px-6 py-3 text-sm font-semibold text-amber-900 backdrop-blur dark:border-amber-800 dark:bg-zinc-950/60 dark:text-amber-200"
            >
              Sepetime Git
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['Kisisellestirme', 'Her urune ozel secenekler ve not alani'],
            ['Guvenli Siparis', 'Stok ve secenek kontrolu otomatik'],
            ['Hizli Yonetim', 'Admin panelden urun ve secenek yonetimi'],
            ['Canli Takip', 'Monitoring ile sistem durumu izleme'],
          ].map(([title, text]) => (
            <div
              key={title}
              className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70"
            >
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
