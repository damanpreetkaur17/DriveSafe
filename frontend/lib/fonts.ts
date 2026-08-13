import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

// Display face — technical, geometric, used for headlines
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

// Body face — for form labels, paragraphs
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

// Utility/mono face — for system readouts, eyebrows, status labels
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});