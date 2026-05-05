import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useSchool } from "@/contexts/SchoolContext";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [stage, setStage] = useState(0);
  const { currentSchool } = useSchool();

  useEffect(() => {
    // Stage 1: Logo appears
    const timer1 = setTimeout(() => setStage(1), 100);
    // Stage 2: Text appears
    const timer2 = setTimeout(() => setStage(2), 600);
    // Stage 3: Fade out
    const timer3 = setTimeout(() => setStage(3), 2000);
    // Complete
    const timer4 = setTimeout(() => onComplete(), 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 transition-opacity duration-500 ${
        stage === 3 ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Animated Logo */}
      <div
        className={`flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 shadow-2xl transition-all duration-500 ${
          stage >= 1 ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
      >
        <Building2 className="h-12 w-12 text-white" />
      </div>

      {/* Brand Name */}
      <div
        className={`mt-8 text-center transition-all duration-500 delay-100 ${
          stage >= 2 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <h1 className="text-5xl font-bold text-white tracking-tight">
          Store<span className="text-white/80">Sure</span>
        </h1>
        <p className="mt-3 text-white/70 text-lg font-medium">
          {currentSchool?.name || "Greenwood High School"}
        </p>
      </div>

      {/* Loading indicator */}
      <div
        className={`mt-12 transition-all duration-500 delay-200 ${
          stage >= 2 ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex space-x-2">
          <div className="h-2 w-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="h-2 w-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="h-2 w-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
