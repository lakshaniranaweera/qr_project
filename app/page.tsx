import Image from "next/image";
import Link from "next/link";
import AudioManager from "./components/AudioManager";

const modules = [
  {
    href: "/user",
    title: "User Management",
    description:
      "The pledge page users reach from the QR code. Open it to review the pledge and the AGREE / SUBMIT flow.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-7 w-7"
        aria-hidden
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/led",
    title: "LED Management",
    description:
      "The LED wall experience: pledge, countdown, video with celebration overlay, and the live submission counters.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-7 w-7"
        aria-hidden
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
];

function NavLinks({ vertical = false }: { vertical?: boolean }) {
  return (
    <nav className={vertical ? "flex flex-col gap-1" : "flex gap-1"}>
      <Link
        href="/"
        className="rounded-lg bg-vaseline-blue/10 px-4 py-2.5 text-sm font-semibold text-vaseline-blue"
      >
        Dashboard
      </Link>
      <Link
        href="/user"
        className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-vaseline-blue"
      >
        User
      </Link>
      <Link
        href="/led"
        className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-vaseline-blue"
      >
        LED
      </Link>
    </nav>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-dvh bg-zinc-50">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white px-4 py-6 md:flex">
        <Link href="/" className="px-4">
          <Image
            src="/Agree.png"
            alt="Vaseline"
            width={200}
            height={43}
            priority
            className="h-auto w-32"
          />
        </Link>
        <p className="mt-1 px-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Admin
        </p>
        <div className="mt-6">
          <NavLinks vertical />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (mobile nav + heading) */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3 md:hidden">
            <Image
              src="/logo.png"
              alt="Vaseline"
              width={140}
              height={30}
              priority
              className="h-auto w-24"
            />
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Admin
            </span>
          </div>
          <div className="md:hidden">
            <NavLinks />
          </div>
          <h1 className="hidden text-lg font-bold text-zinc-800 md:block">
            Dashboard
          </h1>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="animate-[fade-in_0.5s_ease-out_both]">
              <h2 className="text-2xl font-bold text-zinc-800">
                Vaseline Pledge Event
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Manage the two event surfaces below.
              </p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {modules.map((m) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-vaseline-blue/40 hover:shadow-lg"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-vaseline-blue/10 text-vaseline-blue">
                      {m.icon}
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-zinc-800 group-hover:text-vaseline-blue">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                      {m.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-vaseline-blue">
                      Open
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        aria-hidden
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-6">
                <AudioManager />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
