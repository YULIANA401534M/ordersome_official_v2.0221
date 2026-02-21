import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

/**
 * Marketing Trap: Force customers to provide phone number after login
 * 
 * This component intercepts the user flow and redirects to /profile/complete
 * if the user is a customer without a phone number.
 */
export function MarketingTrap({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Skip check if not authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Skip check if already on the complete profile page
    if (location === "/profile/complete") {
      return;
    }

    // Skip check for non-customers (franchisee, staff, admin don't need phone trap)
    if (user.role !== "customer") {
      return;
    }

    // Check if customer is missing phone number
    if (!user.phone || user.phone.trim() === "") {
      console.log("[Marketing Trap] Customer missing phone, redirecting to /profile/complete");
      setLocation("/profile/complete");
    }
  }, [user, isAuthenticated, location, setLocation]);

  return <>{children}</>;
}
