import { UserPlus, Plus } from "lucide-react";

export default function TeamSection() {
  const teamPlaceholders = [
    { role: "Project Lead & Web Designer", note: "Wristband SbCl₃ cartridge architecture & formulation" },
    { role: "Full-Stack Software Engineer", note: "FastAPI dosimetry engine & Next.js platform" },
    { role: "Optical Vision & ML Specialist", note: "CIELAB segmentation & 3-layer neural network model" },
    { role: "Hardware designer and Chem specialist", note: "OISD compliance & statutory risk tiering" },
  ];

  return (
    <section id="team" className="py-24 px-6 lg:px-12 bg-white border-b border-light-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-teal-deep mb-2">Research & Development</div>
          <h2 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-tight text-charcoal leading-tightest">
            PROJECT TEAM
          </h2>
          <p className="text-base text-sage-muted mt-4">
            Multidisciplinary development across colorimetric chemistry, optical computing, and occupational health systems.
          </p>
        </div>

        {/* Team Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamPlaceholders.map((member, idx) => (
            <div
              key={idx}
              className="bg-warm-white rounded-2xl p-6 border border-light-surface flex flex-col items-center text-center card-hover-lift"
            >
              {/* Avatar Slot */}
              <div className="w-28 h-28 rounded-full bg-sage-light/40 border border-light-surface flex flex-col items-center justify-center text-sage-muted mb-6 shadow-inner">
                <UserPlus className="w-8 h-8 text-sage-muted" />
              </div>

              {/* Name & Role */}
              <h3 className="font-display text-2xl uppercase tracking-tight text-charcoal mb-1">
                TEAM MEMBER {idx + 1}
              </h3>
              <div className="text-xs font-semibold text-teal-deep uppercase tracking-wider mb-3">
                {member.role}
              </div>
              <p className="text-xs text-sage-muted leading-relaxed">
                {member.note}
              </p>

              <div className="mt-6 pt-4 border-t border-light-surface w-full text-[11px] text-sage-muted">
                Editable team slot
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
