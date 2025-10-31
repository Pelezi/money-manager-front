import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'pt'],
  
  // Used when no locale matches
  defaultLocale: 'en',
  
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
