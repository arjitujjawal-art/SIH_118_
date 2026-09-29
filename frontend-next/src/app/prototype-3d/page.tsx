import ScrollyDashboard from "@/components/3d/ScrollyDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "STRELA 3D Exploded Teardown · Optical Dosimeter Architecture",
  description: "Interactive 3D WebGL exploded-view presentation of the STRELA wearable passive colorimetric H2S dosimeter wristband hardware prototype.",
};

export default function Prototype3DPage() {
  return <ScrollyDashboard />;
}
