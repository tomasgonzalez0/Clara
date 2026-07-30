import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const moneyInputScript = String.raw`
  (function () {
    function isMoneyInput(element) {
      return element instanceof HTMLInputElement && element.name === "amount";
    }
    function prepare(input) {
      input.type = "text";
      input.inputMode = "numeric";
      input.removeAttribute("min");
    }
    function format(input) {
      var digits = input.value.replace(/\D/g, "");
      input.value = digits ? new Intl.NumberFormat("es-CO").format(Number(digits)) : "";
    }
    document.addEventListener("focusin", function (event) {
      if (isMoneyInput(event.target)) prepare(event.target);
    }, true);
    document.addEventListener("input", function (event) {
      if (isMoneyInput(event.target)) {
        prepare(event.target);
        format(event.target);
      }
    }, true);
  })();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clara | Finanzas personales",
  description: "Control personal de gastos, bolsillos y proyecciones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="cop-money-input" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: moneyInputScript }} />
        {children}
      </body>
    </html>
  );
}
