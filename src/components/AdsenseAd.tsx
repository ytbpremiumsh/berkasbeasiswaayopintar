import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdsenseAdProps {
  placement: "header" | "sidebar" | "content_top" | "content_bottom" | "footer" | "between_sections";
  className?: string;
}

export function AdsenseAd({ placement, className = "" }: AdsenseAdProps) {
  const [adCode, setAdCode] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptExecuted = useRef(false);

  useEffect(() => {
    fetchAdSettings();
  }, [placement]);

  useEffect(() => {
    if (adCode && containerRef.current && !scriptExecuted.current) {
      // Insert the ad code
      containerRef.current.innerHTML = adCode;

      // Execute any scripts in the ad code
      const scripts = containerRef.current.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        
        // Copy attributes
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Copy inline script content
        if (oldScript.textContent) {
          newScript.textContent = oldScript.textContent;
        }
        
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });

      scriptExecuted.current = true;
    }
  }, [adCode]);

  const fetchAdSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("adsense_settings")
        .select("adsense_code, is_active")
        .eq("placement_key", placement)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching ad:", error);
        return;
      }

      if (data && data.is_active && data.adsense_code) {
        setAdCode(data.adsense_code);
        setIsActive(true);
      }
    } catch (error) {
      console.error("Error fetching ad settings:", error);
    }
  };

  if (!isActive || !adCode) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`adsense-container ${className}`}
      data-placement={placement}
    />
  );
}