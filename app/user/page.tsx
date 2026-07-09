import type { Metadata } from "next";
import Image from "next/image";
import PledgeForm from "../components/PledgeForm";

export const metadata: Metadata = {
  title: "Vaseline Pledge",
};

export default function UserPage() {
  return (
    <main
      className="relative min-h-dvh w-full overflow-x-hidden bg-cover bg-center"
      style={{ backgroundImage: "url(/userbackground.png)" }}
    >
      {/* Content column locked to the 9:16 (1080×1920) design proportion:
          never wider than the viewport, never wider than 9/16 of its height,
          so the layout scales uniformly on tall, short, and wide phones. */}
      <div
        className="mx-auto flex min-h-dvh w-[min(100%,calc(100dvh*9/16))] flex-col items-center justify-center px-[clamp(1rem,5vw,2rem)]"
        style={{
          paddingTop: "max(2rem, env(safe-area-inset-top))",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* Frosted-glass pledge popup: logo + pledge text + agree button */}
        <div className="w-full max-w-md animate-[fade-in_0.8s_ease-out_both] rounded-3xl border border-white/30 bg-white/15 p-6 shadow-[0_24px_60px_rgba(43,58,128,0.22)] backdrop-blur-xl sm:p-8">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Vaseline"
              width={320}
              height={68}
              priority
              className="h-auto w-[clamp(150px,42vw,220px)] drop-shadow-sm"
            />
          </div>
          <PledgeForm />
        </div>
      </div>
    </main>
  );
}
