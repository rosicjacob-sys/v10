import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CartProvider } from './lib/cart'
import { startLenis } from './lib/scroll'
import { MQ_MOTION_OK } from './lib/env'
import ApexStage from './three/ApexStage'
import AnnouncementBar from './components/AnnouncementBar'
import Boot from './components/Boot'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Thesis from './components/Thesis'
import Instrument from './components/Instrument'
import Lens from './components/Lens'
import Verify from './components/Verify'
import Marquee from './components/Marquee'
import Catalog from './components/Catalog'
import Compounds from './components/Compounds'
import MassSpec from './components/MassSpec'
import ScanRecon from './components/ScanRecon'
import BatchRail from './components/BatchRail'
import ColdChain from './components/ColdChain'
import Formula from './components/Formula'
import Order from './components/Order'
import Faq from './components/Faq'
import FinalCta from './components/FinalCta'
import Footer from './components/Footer'
import StickyCart from './components/StickyCart'

gsap.registerPlugin(ScrollTrigger)
// iPhone Safari fires a resize on every URL-bar collapse mid-scroll; without
// this, ~20 invalidateOnRefresh triggers full-refresh in the middle of a swipe.
ScrollTrigger.config({ ignoreMobileResize: true })

export default function App() {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add(MQ_MOTION_OK, () => startLenis())
    return () => mm.revert()
  }, [])

  return (
    <CartProvider>
      <Boot />
      <a className="skip-link" href="#catalog">
        Skip to the catalog
      </a>
      <AnnouncementBar />
      <Nav />
      <main>
        <Hero />
        <Thesis />
        <Instrument />
        <Lens />
        <Verify />
        <Catalog />
        <Compounds />
        <MassSpec />
        <ScanRecon />
        <BatchRail />
        <ColdChain />
        <Formula />
        <Marquee />
        <Order />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <ApexStage />
      <StickyCart />
    </CartProvider>
  )
}
