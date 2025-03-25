import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { initializeDatabase } from '@/lib/db';

const inter = Inter({ subsets: ['latin'] });

// Initialize database on server startup
initializeDatabase()
  .then(() => console.log('Database initialized'))
  .catch(err => console.error('Failed to initialize database:', err));

export const metadata = {
  title: 'CertChain - Secure Digital Certificates',
  description: 'Secure, verifiable digital credentials powered by blockchain technology',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}