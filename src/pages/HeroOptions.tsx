import { lazy, Suspense } from 'react'
import { Check, CreditCard, Globe2, MapPin, QrCode, Radio, Signal, Smartphone, Wifi } from 'lucide-react'

const HeroGlobe = lazy(() => import('../components/home/HeroGlobe'))

const shell = 'group relative h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#06252b] shadow-2xl transition duration-500 hover:-translate-y-1 hover:border-accent-400/30 hover:shadow-accent-500/10'

function OptionOne() {
  return (
    <div className={shell}>
      <Glow />
      <div className="absolute left-1/2 top-8 w-56 -translate-x-1/2 rounded-[2.2rem] border border-white/15 bg-[#06161d] p-2 shadow-2xl">
        <div className="h-[360px] rounded-[1.75rem] bg-gradient-to-b from-[#eafff9] to-[#ccefe7] p-4 pt-8 text-brand-900">
          <div className="flex justify-between text-[10px] font-700"><span>QulaySIM</span><span className="flex gap-1"><Signal size={11} />5G</span></div>
          <p className="mt-7 text-xs text-brand-600">eSIM tayyor</p><p className="font-display text-xl font-700">Sayohat paketi</p>
          <div className="mt-5 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-900 p-4 text-white shadow-xl">
            <Globe2 /><p className="mt-8 text-xs text-white/60">Internet paketi</p><p className="text-xl font-700">5 GB</p>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white/80 p-3 text-xs font-700"><span>QR orqali o‘rnating</span><QrCode size={38} /></div>
        </div>
      </div>
    </div>
  )
}

function OptionTwo() {
  return (
    <div className={shell}>
      <Glow />
      <div className="absolute left-8 right-8 top-20 rotate-[-5deg] rounded-[2rem] border border-white/20 bg-gradient-to-br from-brand-400 to-brand-800 p-7 text-white shadow-2xl transition hover:rotate-0">
        <div className="flex justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><CreditCard /></span><span className="font-display font-700">QulaySIM</span></div>
        <p className="mt-16 text-xs text-white/60">GLOBAL DATA</p><p className="mt-1 text-3xl font-700">10 GB</p>
        <div className="mt-8 flex justify-between text-sm"><span>30 kun</span><span>4G / 5G</span></div>
      </div>
      <div className="absolute bottom-7 right-8 rounded-2xl bg-white p-3 text-brand-900 shadow-xl"><QrCode size={48} /></div>
    </div>
  )
}

function OptionThree() {
  return (
    <div className={shell}>
      <Glow />
      <div className="absolute left-1/2 top-8 -translate-x-1/2 transition duration-500 group-hover:scale-[1.025]">
        <Suspense fallback={<div className="h-[250px] w-[250px] animate-pulse rounded-full bg-brand-500/15" />}><HeroGlobe size={250} /></Suspense>
      </div>
      <div className="absolute bottom-8 left-7 right-7 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur">
        <span><small className="text-white/50">Boshlanish</small><b className="mt-1 flex items-center gap-1"><MapPin size={14} /> Siz turgan joy</b></span>
        <span className="h-px flex-1 bg-white/20 mx-4" />
        <span className="text-right"><small className="text-white/50">Manzil</small><b className="mt-1 block">Safar manzilingiz</b></span>
      </div>
    </div>
  )
}

function OptionFour() {
  return (
    <div className={shell}>
      <Glow />
      <div className="absolute left-1/2 top-16 -translate-x-1/2 overflow-hidden rounded-[2rem] bg-white p-5 text-brand-900 shadow-2xl transition-[box-shadow] duration-500 group-hover:shadow-accent-400/20">
        <QrCode size={150} strokeWidth={1.25} />
        <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-brand-600 text-white ring-4 ring-white"><Radio /></span>
        <span className="hero-scan-line absolute inset-x-3 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent-400 to-transparent shadow-[0_0_12px_rgba(52,227,176,.9)]" />
      </div>
      <div className="absolute bottom-9 left-8 right-8 rounded-2xl bg-[#0c353a] p-4 text-white ring-1 ring-white/10 transition duration-500 group-hover:bg-brand-700 group-hover:ring-accent-400/30">
        <div className="flex items-center gap-3"><span className="hero-status-check grid h-10 w-10 place-items-center rounded-full bg-accent-400 text-brand-900 transition group-hover:scale-110"><Check /></span><div><b>eSIM tayyor</b><p className="text-xs text-white/55 transition group-hover:text-white/80">3 oddiy qadamda ulaning</p></div></div>
      </div>
    </div>
  )
}

function OptionFive() {
  return (
    <div className={shell}>
      <Glow />
      <div className="absolute inset-x-7 top-12 space-y-3">
        <Chip icon={Smartphone} title="Qurilma mos" text="eSIM qo‘llab-quvvatlanadi" offset="mr-10" />
        <Chip icon={Wifi} title="Tarmoq topildi" text="4G / 5G tezlik" offset="ml-10" />
        <Chip icon={QrCode} title="QR-kod tayyor" text="Darhol o‘rnating" offset="mr-5" />
      </div>
      <div className="hero-ready-pill absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-400 px-5 py-2.5 text-sm font-700 text-brand-900 shadow-lg shadow-accent-400/20 transition duration-500 group-hover:scale-110 group-hover:shadow-accent-400/40">Sayohatga tayyor ✓</div>
    </div>
  )
}

function OptionSix() {
  return (
    <div className={shell}>
      <Glow />
      <div className="absolute left-2 top-6 transition duration-500 group-hover:scale-[1.02]">
        <Suspense fallback={<div className="h-[240px] w-[240px] animate-pulse rounded-full bg-brand-500/15" />}><HeroGlobe size={240} /></Suspense>
      </div>

      <div className="absolute right-7 top-20 overflow-hidden rounded-[1.6rem] bg-white p-4 text-brand-900 shadow-2xl transition duration-500 group-hover:-translate-y-1 group-hover:shadow-accent-400/20">
        <QrCode size={112} strokeWidth={1.2} />
        <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-brand-600 text-white ring-4 ring-white"><Radio size={19} /></span>
        <span className="hero-scan-line-six absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent-400 to-transparent shadow-[0_0_10px_rgba(52,227,176,.9)]" />
      </div>

      <div className="absolute bottom-8 left-7 right-7 rounded-2xl border border-white/10 bg-[#0c353a]/95 p-4 text-white shadow-xl backdrop-blur transition duration-500 group-hover:border-accent-400/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-accent-400 text-brand-900"><Check size={20} /></span><div><b>Global eSIM tayyor</b><p className="text-xs text-white/55">QR-kod orqali tezkor o‘rnatish</p></div></div>
          <span className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-700 text-accent-400">4G / 5G</span>
        </div>
      </div>
    </div>
  )
}

function Glow() { return <><div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" /><div className="hero-grid opacity-70" /></> }
function Chip({ icon: Icon, title, text, offset }: { icon: typeof Smartphone; title: string; text: string; offset: string }) {
  return <div className={`flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-white shadow-xl backdrop-blur transition duration-500 hover:border-accent-400/40 hover:bg-white/15 ${offset}`}><span className="grid h-12 w-12 place-items-center rounded-xl bg-accent-400/15 text-accent-400 transition duration-300 group-hover:rotate-6 group-hover:scale-105"><Icon /></span><div><b>{title}</b><p className="text-xs text-white/55">{text}</p></div></div>
}

const options = [OptionOne, OptionTwo, OptionThree, OptionFour, OptionFive, OptionSix]

export default function HeroOptions() {
  return (
    <div className="container-page py-12">
      <div className="max-w-2xl"><p className="text-sm font-700 uppercase tracking-widest text-brand-500">QulaySIM original concepts</p><h1 className="mt-3 text-3xl font-700 sm:text-4xl">Hero illustratsiya variantlari</h1><p className="mt-3 text-slate-soft">Barchasi QulaySIM uchun kod orqali noldan chizilgan. Hech qanday tashqi eSIM sayt asseti ishlatilmagan.</p></div>
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {options.map((Visual, index) => <section key={index}><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-700">Variant {index + 1}</h2><span className="text-xs text-slate-soft">{index === 2 ? '3D · optimallashtirilgan' : 'Original'}</span></div><Visual /></section>)}
      </div>
    </div>
  )
}
