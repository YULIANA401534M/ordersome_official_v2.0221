import { ReactNode } from "react";
import CorporateHeader from "./CorporateHeader";
import CorporateFooter from "./CorporateFooter";

interface CorporateLayoutProps {
  children: ReactNode;
}

export default function CorporateLayout({ children }: CorporateLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <CorporateHeader />
      <main className="flex-1 pt-16 md:pt-20">
        {children}
      </main>
      <CorporateFooter />
    </div>
  );
}
