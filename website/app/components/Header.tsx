"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b border-[rgba(255,255,255,0.04)] bg-[rgba(3,6,16,0.6)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(3,6,16,0.4)]">
      <div className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-3 group"
        >
          <div className="relative  w-12 h-12 flex items-center justify-center rounded-xl duration-300 border border-white/10">
            <Image
              src="/logo.png"
              alt="Focus Mask Logo"
              width={40}
              height={40}
              // fill
              priority
              className="object-contain"
            />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Focus Mask
          </span>
        </Link>
      </div>
    </header>
  );
}
