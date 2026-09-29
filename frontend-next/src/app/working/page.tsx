import { Suspense } from "react";
import PublicNavbar from "@/components/layout/PublicNavbar";
import Footer from "@/components/layout/Footer";
import HowItWorks from "@/components/working/HowItWorks";
import WorkingTabs from "@/components/working/WorkingTabs";

export default function WorkingPage() {
  return (
    <>
      <PublicNavbar />
      <main className="flex-1 bg-warm-white">
        {/* Working Hero Header - Video Only */}
        <section className="relative w-full aspect-video border-b border-light-surface overflow-hidden bg-black flex items-center justify-center">
          {/* Background Video */}
          <video
            src="/Aqueous_extraction_of_anthocyanin_20260929194533.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </section>

        {/* Storytelling Pipeline */}
        <section className="py-24 px-6 lg:px-12 max-w-6xl mx-auto space-y-32">
          
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2 order-2 md:order-1 relative rounded-3xl overflow-hidden shadow-2xl border border-light-surface bg-[#171C1B]">
              <img
                src="/lab%20setup.jpeg"
                alt="Laboratory Setup"
                className="w-full h-[400px] object-cover hover:scale-[1.03] transition-transform duration-700"
              />
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2 text-left">
              <div className="text-5xl font-display text-teal-deep opacity-20 mb-4">01</div>
              <h2 className="text-3xl font-display uppercase tracking-tight text-charcoal mb-4">Preparation & Washing</h2>
              <div className="space-y-4 text-sage-muted">
                <p>
                  The process begins by collecting anthocyanin-rich leaves (such as red cabbage). To ensure a pure extraction, we gently wash the leaves with distilled water, removing all dust and surface contaminants. 
                </p>
                <p>
                  The leaves are then spread in a single layer and dried at a gentle 40–45°C to avoid degrading the organic compounds. Finally, they are ground into a fine powder and stored in an opaque container to minimize light exposure.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2 text-left">
              <div className="text-5xl font-display text-teal-deep opacity-20 mb-4">02</div>
              <h2 className="text-3xl font-display uppercase tracking-tight text-charcoal mb-4">Ultrasonic Extraction</h2>
              <div className="space-y-4 text-sage-muted">
                <p>
                  We use an entirely <strong>ethanol-free</strong>, aqueous extraction method. We mix exactly 2.00g of the dried leaf powder with 50mL of pure distilled water. 
                </p>
                <p>
                  The mixture is placed in an ultrasonic bath (sonicator) for 30 minutes, keeping temperatures below 30°C to preserve the chemical integrity. This efficiently extracts the raw anthocyanins into the water without relying on toxic solvents.
                </p>
              </div>
            </div>
            <div className="w-full md:w-1/2 relative rounded-3xl overflow-hidden shadow-2xl border border-light-surface bg-[#171C1B]">
              <img
                src="/ultra%20sound%20bagth%20in%20sonicator.jpeg"
                alt="Ultrasonic Bath"
                className="w-full h-[400px] object-cover hover:scale-[1.03] transition-transform duration-700"
              />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2 order-2 md:order-1 relative rounded-3xl overflow-hidden shadow-2xl border border-light-surface bg-black">
              <video
                src="/filtering%20of%20centrifuged%20antrocynin%20solution%20extracted%20from%20red%20cabbage.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-[400px] object-cover pointer-events-none"
              />
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2 text-left">
              <div className="text-5xl font-display text-teal-deep opacity-20 mb-4">03</div>
              <h2 className="text-3xl font-display uppercase tracking-tight text-charcoal mb-4">Separation & Filtration</h2>
              <div className="space-y-4 text-sage-muted">
                <p>
                  After sonication, the mixture undergoes centrifugation at 3500 rpm for 15 minutes. This separates the solid residue from our valuable supernatant.
                </p>
                <p>
                  We then carefully filter the centrifuged solution (as shown in the video) to obtain a clear, crude aqueous anthocyanin extract, free from particulate matter, collected safely in an amber container.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2 text-left">
              <div className="text-5xl font-display text-teal-deep opacity-20 mb-4">04</div>
              <h2 className="text-3xl font-display uppercase tracking-tight text-charcoal mb-4">pH Optimization & Response</h2>
              <div className="space-y-4 text-sage-muted">
                <p>
                  Instead of assuming pH 7 is perfect, we optimize the extract by testing multiple pH levels (5.0 to 7.0) using dilute NaOH and citric acid to find the most stable, vibrant <strong>purple</strong> baseline.
                </p>
                <p>
                  When this optimized purple extract is exposed to a changing chemical environment (such as H₂S gas), the anthocyanin undergoes a clear colorimetric shift from <strong>Purple to Red/Pink</strong>. This safe, lead-free organic reaction is the core of our smart dosimeter strip.
                </p>
              </div>
            </div>
            <div className="w-full md:w-1/2 relative rounded-3xl overflow-hidden shadow-2xl border border-light-surface bg-[#171C1B]">
              <img
                src="/strip%20color%20change%20in%20reacting%20with%20acid%20and%20base.jpeg"
                alt="Strip Color Change"
                className="w-full h-[400px] object-cover hover:scale-[1.03] transition-transform duration-700"
              />
            </div>
          </div>
          
        </section>

        {/* 5. How It Works */}
        <HowItWorks />

        {/* Technical Tabs (Chemistry & Comparison) */}
        <Suspense fallback={<div>Loading tabs...</div>}>
          <WorkingTabs />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
