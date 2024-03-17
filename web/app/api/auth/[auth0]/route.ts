import { initAuth0 } from '@auth0/nextjs-auth0';

const auth0 = initAuth0({
  baseURL: process.env.VERCEL_ENV === 'preview' ? `https://${process.env.VERCEL_URL!}` : process.env.AUTH0_BASE_URL!,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL!,
  secret: process.env.AUTH0_SECRET!,
  clientID: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
});

export const GET = auth0.handleAuth();
