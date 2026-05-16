"use client";
import Navigation from "./Navigation";
import FloatingParticles from "./FloatingParticles";

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#080b14" }}>
      <FloatingParticles count={25} />
      <Navigation />
      <main className="lg:pl-64 pb-24 lg:pb-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
