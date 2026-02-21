import { useEffect } from "react";

/**
 * Google Analytics 4 (GA4) Tracking Component
 * 
 * This component loads Google Analytics asynchronously and tracks page views.
 * 
 * Setup Instructions:
 * 1. Get your GA4 Measurement ID from Google Analytics (format: G-XXXXXXXXXX)
 * 2. Replace 'YOUR_GA4_MEASUREMENT_ID' below with your actual ID
 * 3. Or set it as an environment variable in .env.local:
 *    VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 */

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "YOUR_GA4_MEASUREMENT_ID";

/**
 * Track custom GA4 events
 * @param eventName - The name of the event (e.g., 'login', 'purchase', 'sign_up')
 * @param eventParams - Optional parameters for the event
 */
export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams);
    console.log(`[GA4 Event] ${eventName}`, eventParams);
  } else {
    console.warn(`[GA4 Event] gtag not loaded yet. Event "${eventName}" not tracked.`);
  }
}

export default function Analytics() {
  useEffect(() => {
    // Skip loading if GA ID is not configured
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === "YOUR_GA4_MEASUREMENT_ID") {
      console.warn("Google Analytics is not configured. Please set VITE_GA_MEASUREMENT_ID in your environment variables.");
      return;
    }

    // Load Google Analytics script
    const script1 = document.createElement("script");
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script1.async = true;
    document.head.appendChild(script1);

    // Initialize Google Analytics
    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        page_path: window.location.pathname,
      });
    `;
    document.head.appendChild(script2);

    // Cleanup function
    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  return null; // This component doesn't render anything
}
