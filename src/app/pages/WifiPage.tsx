import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Wifi } from "lucide-react";
import { SeoHead } from "../components/SeoHead";
import { WifiGuide } from "../components/WifiGuide";

export function WifiPage() {
  return (
    <div className="min-h-screen bg-brand px-4 py-8">
      <SeoHead
        title="Guest Wi-Fi | Mule Hacks 2026"
        description="How to connect to the UCMO-Guest wireless network at Mule Hacks 2026."
        noIndex
      />
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl text-white mb-2">Guest Wi-Fi</h1>
            <p className="text-white/80">
              Follow these steps to connect to UCMO-Guest at the event.
            </p>
          </div>

          <WifiGuide />
        </motion.div>
      </div>
    </div>
  );
}
