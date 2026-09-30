import ScrollyDashboard from "@/components/3d/ScrollyDashboard";

export const metadata = {
  title: "STRELA 3D Hardware Teardown | Zero-Power Passive Dosimeter",
  description: "Interactive 3D WebGL exploded-view scrollytelling teardown of the STRELA optical dosimeter wristband.",
};

export default function Prototype3DPage() {
  return <ScrollyDashboard />;
}
