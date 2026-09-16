import './globals.css';
import type { Metadata } from 'next';
import { ArcadeShell } from '@/components/ArcadeShell';
export const metadata:Metadata={title:'Classroom',description:'Community-focused virtual coin arcade'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body><ArcadeShell>{children}</ArcadeShell></body></html>}
