"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import FlowchartTab from "./FlowchartTab";
import ImagesTab from "./ImagesTab";
import ChemistryTab from "./ChemistryTab";
import ComparisonTab from "./ComparisonTab";
import { GitFork, Image as ImageIcon, FlaskConical, Scale } from "lucide-react";

type TabKey = "chemistry" | "comparison";

export default function WorkingTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>("chemistry");

  useEffect(() => {
    if (tabParam && ["chemistry", "comparison"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    router.push(`/working?tab=${tab}`, { scroll: false });
  };

  const tabs: Array<{ key: TabKey; label: string; icon: any }> = [
    { key: "chemistry", label: "Chemistry", icon: FlaskConical },
    { key: "comparison", label: "Comparison", icon: Scale },
  ];

  return (
    <section className="py-16 px-6 lg:px-12 bg-warm-white">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Accessible Tab Bar */}
        <div className="flex justify-center">
          <div
            role="tablist"
            className="inline-flex p-1.5 bg-white rounded-full border border-light-surface shadow-sm overflow-x-auto max-w-full"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-charcoal text-white shadow-md"
                      : "text-sage-muted hover:text-charcoal hover:bg-warm-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-yellow-golden" : "text-sage-muted"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="min-h-[500px]">
          {activeTab === "chemistry" && <ChemistryTab />}
          {activeTab === "comparison" && <ComparisonTab />}
        </div>
      </div>
    </section>
  );
}
