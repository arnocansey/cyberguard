import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "AI Cybersecurity Threat Detection Platform",
  description: "Enterprise SOC dashboard"
};

const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem("theme");
    var prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    var theme = (saved === "light" || saved === "dark") ? saved : (prefersLight ? "light" : "dark");
    var isLight = theme === "light";
    document.documentElement.classList.toggle("light", isLight);
    document.body.classList.toggle("light", isLight);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
