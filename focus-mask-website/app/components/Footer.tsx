"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isPrivacyPage = pathname === "/privacy-policy";

  return (
    <footer className="py-6 bg-background-end">
      <div
        className={`
          container mx-auto px-6
          flex flex-col md:flex-row
          items-center
          ${isPrivacyPage ? "justify-center" : "justify-between"}
          gap-6
        `}
      >
        <p
          className="text-text-muted text-sm font-normal text-center"
          suppressHydrationWarning
        >
          &copy; {new Date().getFullYear()} Focus Mask. All rights reserved.
        </p>

        {!isPrivacyPage && (
          <div className="flex items-center gap-8">
            <Link
              href="/privacy-policy"
              className="text-text-muted hover:text-text-main text-sm transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        )}
      </div>
    </footer>
  );
}
