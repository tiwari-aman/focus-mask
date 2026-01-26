import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import BackButton from "@/app/components/BackButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Focus Mask",
  description:
    "Read about how Focus Mask protects your privacy. We do not collect, store, or transmit any personal data.",
};

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main
        className="
          flex-grow
          container mx-auto
          max-w-3xl
          px-6 sm:px-8
          py-16 sm:py-20 md:py-20
          mt-4
        "
      >
        <BackButton />

        {/* Page Title */}
        <header className="">
          <h1
            className="
              text-3xl sm:text-4xl md:text-5xl
              font-semibold
              tracking-tight
              text-text-main
              mb-3
            "
          >
            Privacy Policy
          </h1>

          <p
            className="
              text-sm
              text-text-muted
              border-b border-surface-border
              pb-4
              mb-4
            "
          >
            {/* Last updated: January 15, 2026 */}
          </p>
        </header>

        {/* Content */}
        <div className="space-y-10 text-text-secondary leading-relaxed">
          <p>
            Focus Mask is committed to protecting your privacy. This Privacy
            Policy explains how information is handled when you use the Focus
            Mask browser extension.
          </p>

          {/* Data Collection */}
          <section className="space-y-4">
            <h2
              className="
                text-xl sm:text-2xl
                font-semibold
                text-text-main
              "
            >
              Data Collection
            </h2>

            <p>
              Focus Mask is designed to be privacy-first.{" "}
              <strong className="text-text-main">
                We do not collect, store, or transmit any personal data,
                browsing history, or page content.
              </strong>{" "}
              All processing occurs locally within your browser environment.
            </p>
          </section>

          {/* Permissions */}
          <section className="space-y-4">
            <h2
              className="
                text-xl sm:text-2xl
                font-semibold
                text-text-main
              "
            >
              Permissions
            </h2>

            <p>
              The extension requires permission to{" "}
              <span className="font-medium text-text-main">
                &quot;read and change all your data on websites you visit&quot;
              </span>{" "}
              only to enable its core functionality:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li>Inject the focus mask overlay onto web pages</li>
              <li>Allow you to define and adjust focus areas</li>
              <li>Block interactions outside selected focus regions</li>
            </ul>

            <p>
              Focus Mask does not track the websites you visit or monitor your
              activity in any way.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
