import type { Metadata } from "next";
import "@/app/admin/admin.css";

export const metadata: Metadata = {
  title: "MobiGear Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
