"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";

export default function BackButton() {
  return (
    <Link
      href="/"
      className="
        inline-flex items-center gap-1
        text-text-muted hover:text-text-main
        transition-colors duration-200
        mb-8
        group
      "
    >
      <Icon
        icon="si:arrow-left-fill"
        className="w-6 h-6 transition-transform duration-200 group-hover:-translate-x-1"
      />
      <span className="text-sm font-medium">Back</span>
    </Link>
  );
}
