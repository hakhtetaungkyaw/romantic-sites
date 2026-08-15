import FinalCTA from "@/components/home/FinalCTA";
import Footer from "@/components/home/Footer";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import Nav from "@/components/home/Nav";
import TemplateShowcase from "@/components/home/TemplateShowcase";
import { prisma, withRetry } from "@/lib/db";

export default async function Home() {
  const templates = await withRetry(() =>
    prisma.template.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        componentKey: true,
        category: true,
        price: true,
        previewImage: true,
      },
    }),
  );

  return (
    <main className="flex-1 bg-[#0a0a0b] font-sans">
      <Nav />
      <Hero />
      <TemplateShowcase templates={templates} />
      <HowItWorks />
      <FinalCTA />
      <Footer />
    </main>
  );
}
