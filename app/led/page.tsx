import type { Metadata } from "next";
import LedShow from "./LedShow";

export const metadata: Metadata = {
  title: "Vaseline Pledge — LED Wall",
};

export default function LedPage() {
  return <LedShow />;
}
