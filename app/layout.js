import "./globals.css";
import { AuthProvider } from "@/lib/AuthProvider";

export const metadata = {
  title: "Medix — Apprendre, Défier, Exceller",
  description: "Votre académie médicale virtuelle : quiz, Marathon hebdomadaire, classements et mentor IA Dr Stephene.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="medix-hex-texture">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
