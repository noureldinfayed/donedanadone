import DoneDanaDoneLogo from '@/components/brand/DoneDanaDoneLogo'
import LegalFooter from '@/components/sections/LegalFooter'

export default function Footer() {
  return (
    <footer className="bg-background px-3 pb-6 pt-10 sm:px-6">
      <div className="flow-wash mx-auto grid max-w-[1900px] gap-6 rounded-md px-6 py-8 text-sm text-white shadow-xl shadow-black/10 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
          <DoneDanaDoneLogo
            markClassName="h-7 w-auto text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
            wordmarkClassName="font-display text-base font-semibold"
          />

          <LegalFooter />
        </div>

        <div className="flex flex-col items-center gap-2 text-center sm:items-end sm:text-right">
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
      </div>
    </footer>
  )
}
