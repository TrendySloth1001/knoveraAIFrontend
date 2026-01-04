import type { Metadata } from "next";
import { AuthProvider } from "../context/AuthContext";
import { ClientWrapper } from "../components/ClientWrapper";
import "../index.css";
import "../App.css";

export const metadata: Metadata = {
  title: "Knovera AI",
  description: "AI Chat Interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ClientWrapper>{children}</ClientWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
