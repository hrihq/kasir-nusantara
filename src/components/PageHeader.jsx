export default function PageHeader({ judul, sub, kanan }) {
  return (
    <header className="flex items-start justify-between gap-3 px-5 pb-4 pt-[max(1.75rem,env(safe-area-inset-top))]">
      <div>
        <h1 className="font-judul text-[28px] leading-tight">{judul}</h1>
        {sub && <p className="mt-0.5 text-sm text-black/50">{sub}</p>}
      </div>
      {kanan}
    </header>
  )
}
