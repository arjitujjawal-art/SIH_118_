import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "LEAVES TO EXTRACT",
      desc: "Wash, dry at 40-45°C, and grind the leaves. Use an ultrasonic bath (2g powder to 50mL distilled water) for 30 minutes at under 30°C to safely extract anthocyanin.",
      sub: "No ethanol is used in this 100% aqueous extraction.",
    },
    {
      num: "02",
      title: "OPTIMIZE pH",
      desc: "Centrifuge and filter to obtain the crude aqueous extract. Divide the sample and use dilute NaOH and Citric Acid to find the most stable purple state between pH 5.0 and 7.0.",
      sub: "Target condition for H₂S testing established.",
    },
    {
      num: "03",
      title: "H₂S EXPOSURE",
      desc: "Expose the optimal purple solution to controlled hydrogen sulfide. The chemical environment shifts, causing a distinct colorimetric transition to Red/Pink.",
      sub: "Color change quantified via RGB, HSV, and CIE L*a*b*.",
    },
  ];

  return (
    <section className="py-24 px-6 lg:px-12 bg-warm-white border-b border-light-surface">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Sticky Title (1 Part of 1:2 layout) */}
        <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-deep">
            SUMMARY WORKFLOW
          </span>
          <h2 className="font-display text-5xl sm:text-6xl uppercase tracking-tight text-charcoal leading-tightest">
            THE MOP.
          </h2>
          <p className="text-sm text-sage-muted leading-relaxed">
            Three core milestones defining the anthocyanin extraction and color-response preparation stage.
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-charcoal hover:text-teal-deep group mb-8"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-4 h-4 text-yellow-golden group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Video Demonstration (Bottom Left) */}
          <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-light-surface mt-8 relative group">
            <div className="absolute inset-0 z-10 pointer-events-none p-4 flex items-end">
              <span className="text-white/50 font-display uppercase tracking-widest text-sm font-bold">
                COLOR RESPONSE
              </span>
            </div>
            <video
              src="/Demonstrating_gas_detection_stri.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full aspect-video object-cover pointer-events-none"
            />
          </div>
        </div>

        {/* Right Steps (2 Parts of 1:2 layout) */}
        <div className="lg:col-span-8 space-y-8">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-8 border border-light-surface shadow-sm card-hover-lift flex flex-col sm:flex-row items-start gap-6 group focus-within:ring-2 focus-within:ring-yellow-golden"
              tabIndex={0}
            >
              {/* Large Yellow Numeral with hover/focus feedback */}
              <div className="font-display text-6xl sm:text-7xl text-yellow-golden leading-none group-hover:scale-110 group-focus:scale-110 transition-transform duration-300 select-none">
                {step.num}
              </div>

              <div className="space-y-2 flex-1">
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-charcoal">
                  {step.title}
                </h3>
                <p className="text-sm text-sage-muted leading-relaxed">
                  {step.desc}
                </p>
                <div className="text-xs font-mono text-teal-deep font-semibold pt-1">
                  → {step.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
