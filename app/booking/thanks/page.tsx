// Landing page Razorpay redirects to after a successful payment link checkout.
// The actual booking confirmation message is delivered over WhatsApp from the
// `/api/razorpay-webhook` route — this page is just a polite "you're done" stub.
export default function ThanksPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-semibold">Payment received 🎉</h1>
        <p className="text-muted">
          Thanks! Your booking is being confirmed. Check WhatsApp for your booking
          ID and arrival details from <strong>DoneDanaDone</strong>.
        </p>
      </div>
    </main>
  )
}
