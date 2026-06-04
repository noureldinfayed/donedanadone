import DoneDanaDoneLogo from '@/components/brand/DoneDanaDoneLogo'

export default function Footer() {
  return (
    <footer className="bg-background px-3 pb-6 pt-10 sm:px-6">
      <div className="flow-wash mx-auto flex max-w-[1900px] flex-col items-center justify-between gap-4 rounded-md px-6 py-8 text-sm text-white shadow-xl shadow-black/10 sm:flex-row">
        <DoneDanaDoneLogo
          markClassName="h-7 w-auto text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
          wordmarkClassName="font-display text-base font-semibold"
        />

        <p className="text-xs text-white/70">
          Powered by{' '}
          <a
            href="https://fayedintelligence.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline-offset-4 hover:text-saffron-soft hover:underline"
          >
            Fayed Intelligence
          </a>
        </p>

        <p className="text-xs text-white/70">© 2026 DoneDanaDone</p>
      </div>
    </footer>
  )
}
