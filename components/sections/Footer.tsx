export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm sm:flex-row">
        <p className="font-display text-base font-semibold text-saffron">DoneDanaDone</p>

        <p className="text-xs text-muted">
          Powered by{' '}
          <a
            href="https://fayedintelligence.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 underline-offset-4 hover:text-saffron hover:underline"
          >
            Fayed Intelligence
          </a>
        </p>

        <p className="text-xs text-muted">© 2026 DoneDanaDone</p>
      </div>
    </footer>
  )
}
