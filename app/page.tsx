import Navbar from '@/components/sections/Navbar'
import Hero from '@/components/sections/Hero'
import Services from '@/components/sections/Services'
import HowItWorks from '@/components/sections/HowItWorks'
import Stats from '@/components/sections/Stats'
import Footer from '@/components/sections/Footer'

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Services />
        <HowItWorks />
        <Stats />
      </main>
      <Footer />
    </>
  )
}
