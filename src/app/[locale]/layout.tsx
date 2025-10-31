import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Providers from '@/components/Providers';
import '../globals.css';

const locales = ['en', 'pt'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: 'Budget Manager',
  description: 'Manage your budget like a pro with spreadsheet-style interface',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
