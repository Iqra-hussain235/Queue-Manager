import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "Queue Manager",
  description: "Manage queues and customer service in real time.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
