import type { Metadata } from "next";
import { CvScoreChecker } from "@/components/check/cv-score-checker";

export const metadata: Metadata = {
  description: "Paste CV text or upload a PDF to get an instant Nigerian CV score.",
  title: "Check My Nigerian CV | CVPadi",
};

export default function CheckPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <CvScoreChecker />
      </div>
    </main>
  );
}
