import { Camera, Image as ImageIcon, Beaker, FlaskConical, PlaySquare } from "lucide-react";

export default function ImagesTab() {
  const imageAssets = [
    {
      title: "Lab Setup",
      type: "Physical preparation",
      desc: "The initial laboratory setup for processing the leaves and preparing the distilled water extraction solvent.",
      badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
      content: (
        <div className="w-full h-64 bg-[#171C1B] rounded-xl flex flex-col items-center justify-center text-white text-center border border-sage/20 overflow-hidden">
          <img
            src="/lab%20setup.jpeg"
            alt="Laboratory setup for extraction"
            className="w-full h-full object-cover"
          />
        </div>
      ),
    },
    {
      title: "Ultrasonic Extraction",
      type: "Extraction stage",
      desc: "Powdered leaves mixed with distilled water placed inside the ultrasonic bath (sonicator) for 30 minutes.",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      content: (
        <div className="w-full h-64 bg-[#171C1B] rounded-xl flex flex-col items-center justify-center text-white text-center border border-sage/20 overflow-hidden">
          <img
            src="/ultra%20sound%20bagth%20in%20sonicator.jpeg"
            alt="Ultrasonic bath sonicator"
            className="w-full h-full object-cover"
          />
        </div>
      ),
    },
    {
      title: "Filtration Process",
      type: "Separation stage",
      desc: "Filtering the centrifuged anthocyanin solution extracted from red cabbage to obtain a clear liquid.",
      badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
      content: (
        <div className="w-full h-64 bg-[#171C1B] rounded-xl flex flex-col items-center justify-center text-white text-center border border-sage/20 overflow-hidden relative">
          <video
            src="/filtering%20of%20centrifuged%20antrocynin%20solution%20extracted%20from%20red%20cabbage.mp4"
            controls
            autoPlay
            loop
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white">
            <PlaySquare className="w-4 h-4" />
          </div>
        </div>
      ),
    },
    {
      title: "Colorimetric Response",
      type: "Response test",
      desc: "Strip color change reaction indicating the shift from the stable purple state when reacting with changing chemical environments (acid/base or H₂S).",
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
      content: (
        <div className="w-full h-64 bg-[#171C1B] rounded-xl flex flex-col items-center justify-center text-white text-center border border-sage/20 overflow-hidden">
          <img
            src="/strip%20color%20change%20in%20reacting%20with%20acid%20and%20base.jpeg"
            alt="Strip color change upon reaction"
            className="w-full h-full object-cover"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal">
          Laboratory Process Imagery
        </h3>
        <p className="text-sm text-sage-muted mt-2">
          Visual documentation of the ethanol-free anthocyanin extraction and colorimetric response.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {imageAssets.map((asset, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 border border-light-surface shadow-sm card-hover-lift flex flex-col justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h4 className="font-display text-2xl uppercase tracking-tight text-charcoal">
                  {asset.title}
                </h4>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${asset.badgeColor}`}>
                  {asset.type}
                </span>
              </div>
              <div className="mb-4">
                {asset.content}
              </div>
              <p className="text-xs text-sage-muted leading-relaxed">
                {asset.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
