import { ReactNode } from "react";
import BrandHeader from "./BrandHeader";
import BrandFooter from "./BrandFooter";

interface BrandLayoutProps {
  children: ReactNode;
}

export default function BrandLayout({ children }: BrandLayoutProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf7_0%,#fff7df_22%,#fffdf7_52%,#f8f5ef_100%)] text-slate-900">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-8rem] top-24 h-64 w-64 rounded-full bg-[#ffe067]/20 blur-3xl" />
        <div className="absolute right-[-6rem] top-72 h-72 w-72 rounded-full bg-[#ffd54f]/16 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#d9d3c5]/18 blur-3xl" />
      </div>
      <div className="relative flex min-h-screen flex-col">
        <BrandHeader />
        <main className="flex-1 pt-24 md:pt-28">{children}</main>
        <BrandFooter />
      </div>
    </div>
  );
}
