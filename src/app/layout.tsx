import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";
export const metadata: Metadata = { title:"SPARC | Urban space, coordinated", description:"Smart Parking & Resource Coordination" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><DemoProvider>{children}</DemoProvider></body></html>; }

