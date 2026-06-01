import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FortiRule Builder",
  description: "เครื่องมือสร้าง FortiGate CLI สำหรับ VLAN, DHCP, Firewall Policy และ NAT",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
