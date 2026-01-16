import Header from "@/app/components/Header";
import Hero from "@/app/sections/Hero";
import Features from "@/app/sections/Features";
import GetExtension from "@/app/sections/GetExtension";
import Footer from "@/app/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Features />
        <GetExtension />
      </main>
      <Footer />
    </div>
  );
}
