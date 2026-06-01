export default function Footer() {
  return (
    <footer className="bg-background px-3 pb-6 pt-10 sm:px-6">
      <div className="flow-wash mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 rounded-md px-6 py-8 text-sm text-white shadow-xl shadow-black/10 sm:flex-row">
        <p className="font-display text-base font-semibold">DoneDanaDone</p>

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
