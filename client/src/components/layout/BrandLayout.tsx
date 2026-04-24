import { ReactNode } from "react";
import BrandHeader from "./BrandHeader";
import BrandFooter from "./BrandFooter";

interface BrandLayoutProps {
  children: ReactNode;
}

export default function BrandLayout({ children }: BrandLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader />
      <main className="flex-1 pt-16 md:pt-20">
        {children}
      </main>
      <BrandFooter />
    </div>
  );
}
