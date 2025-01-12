import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: '/auth/signin',
        },
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - /auth/signin
         * - /auth/signup
         * - /api/auth
         * - /manifest.json
         */
        '/((?!auth/signin|auth/signup|api/auth|manifest.json).*)',
    ],
};
