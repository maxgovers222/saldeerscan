import type { MetadataRoute } from "next";
import { BRAND_COLORS } from "@/lib/brand-colors";

const SITE = "https://saldeerscan.nl";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SaldeerScan.nl",
    short_name: "SaldeerScan",
    description:
      "Gratis 2027 saldeercheck voor uw woning met AI-scan en persoonlijk investeringsrapport.",
    start_url: "/",
    display: "standalone",
    background_color: BRAND_COLORS.evergreen950,
    theme_color: BRAND_COLORS.evergreen950,
    icons: [
      {
        src: `${SITE}/icon`,
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: `${SITE}/apple-icon`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
