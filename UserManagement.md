# Next.js Neo4j Multi-tenant Authentication Implementation Guide

## Overview
This guide outlines the process of converting a single-tenant Next.js/Neo4j application to a multi-tenant system with authentication using Next-Auth. The implementation includes GitHub, Google, and Apple authentication providers.

## Prerequisites
- Existing Next.js application
- Neo4j database
- Node.js 16+
- GitHub, Google, and Apple developer accounts

## Phase 1: Authentication Setup

### 1.1 Install Dependencies
```bash
npm install next-auth @auth/neo4j-adapter
```

### 1.2 Provider Setup

#### GitHub OAuth
1. Go to GitHub Developer Settings > OAuth Apps > New OAuth App
2. Set Homepage URL: `http://localhost:3000` (development)
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Save Client ID and Client Secret

#### Google OAuth
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Save Client ID and Client Secret

#### Apple OAuth
1. Go to Apple Developer Account > Certificates, Identifiers & Profiles
2. Create a new Services ID
3. Configure Sign In with Apple
4. Add return URL: `http://localhost:3000/api/auth/callback/apple`
5. Download private key and note key ID

### 1.3 Environment Setup
```env
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-secret-key

# GitHub
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Google
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# Apple
APPLE_ID=your-apple-service-id
APPLE_SECRET=your-apple-private-key
APPLE_KEY_ID=your-apple-key-id
APPLE_TEAM_ID=your-apple-team-id

# Neo4j
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
```

## Phase 2: Database Schema

### 2.1 Neo4j Constraints
```cypher
// Create constraints
CREATE CONSTRAINT user_email IF NOT EXISTS
FOR (user:User) REQUIRE user.email IS UNIQUE;

CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (user:User) REQUIRE user.id IS UNIQUE;
```

### 2.2 User Node Structure
```cypher
// Example user node structure
CREATE (u:User {
    id: $id,
    name: $name,
    email: $email,
    emailVerified: datetime($emailVerified),
    image: $image,
    createdAt: datetime(),
    updatedAt: datetime()
})
```

## Phase 3: Next-Auth Implementation

### 3.1 Authentication Configuration
```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import { Neo4jAdapter } from "@auth/neo4j-adapter";
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
);

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
      authorization: {
        params: {
          scope: 'name email'
        }
      }
    })
  ],
  adapter: Neo4jAdapter(driver),
  callbacks: {
    async session({ session, token, user }) {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
});
```

### 3.2 Middleware Configuration
```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // Customize authorization logic here
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/protected/:path*",
    "/api/protected/:path*",
  ]
};
```

## Phase 4: Frontend Implementation

### 4.1 Custom Sign-in Page
```typescript
// pages/auth/signin.tsx
import { getProviders, signIn } from "next-auth/react";

export default function SignIn({ providers }) {
  return (
    <div className="auth-container">
      {Object.values(providers).map((provider) => (
        <button
          key={provider.name}
          onClick={() => signIn(provider.id)}
        >
          Sign in with {provider.name}
        </button>
      ))}
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
```

### 4.2 Auth Context Hook
```typescript
// hooks/useAuth.ts
import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
  };
}
```

### 4.3 Protected Route Component
```typescript
// components/ProtectedRoute.tsx
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    router.push('/auth/signin');
    return null;
  }

  return children;
}
```

## Phase 5: Data Model Updates

### 5.1 Adding User Ownership
```cypher
// Add ownership to existing nodes
MATCH (n:ExistingNode)
WHERE NOT (()-[:OWNS]->(n))
WITH n
MATCH (u:User {id: $defaultUserId})
CREATE (u)-[:OWNS]->(n)
```

### 5.2 Update Queries
```typescript
// Example repository method
async function findUserContent(userId: string) {
  const result = await session.run(`
    MATCH (u:User {id: $userId})-[:OWNS]->(n:ExistingNode)
    RETURN n
  `, { userId });
  
  return result.records.map(record => record.get('n').properties);
}
```

## Phase 6: Migration Steps

1. Backup existing database
```bash
neo4j-admin dump --database=neo4j --to=/backup/pre-auth-migration.dump
```

2. Run schema updates
3. Create default user for existing data
4. Update relationships
5. Verify data integrity

## Phase 7: Testing

### 7.1 Auth Flow Tests
```typescript
// __tests__/auth.test.ts
describe('Authentication', () => {
  test('unauthenticated user cannot access protected routes', async () => {
    // Test implementation
  });

  test('authenticated user can access protected routes', async () => {
    // Test implementation
  });
});
```

### 7.2 Data Access Tests
```typescript
describe('Data Access', () => {
  test('user can only access their own data', async () => {
    // Test implementation
  });

  test('queries include user context', async () => {
    // Test implementation
  });
});
```

## Deployment Checklist

- [ ] Update environment variables
- [ ] Configure production OAuth callbacks
- [ ] Run database migrations
- [ ] Test auth flows in staging
- [ ] Monitor auth logs
- [ ] Set up error tracking
- [ ] Configure session management
- [ ] Implement rate limiting
- [ ] Set up backup procedures

## Security Considerations

1. Implement CSRF protection
2. Set secure cookie options
3. Configure proper CORS settings
4. Implement rate limiting
5. Set up proper logging
6. Configure session timeouts
7. Implement proper error handling

## Maintenance

1. Regularly update dependencies
2. Monitor auth logs
3. Review and rotate secrets
4. Backup user data
5. Monitor authentication metrics

## Troubleshooting

Common issues and solutions:

1. Session not persisting
   - Check NEXTAUTH_URL configuration
   - Verify cookie settings

2. OAuth callback errors
   - Verify callback URLs
   - Check provider configurations

3. Database connection issues
   - Verify Neo4j credentials
   - Check connection string

## Resources

- [Next-Auth Documentation](https://next-auth.js.org/)
- [Neo4j JavaScript Driver Documentation](https://neo4j.com/docs/javascript-manual/current/)
- [OAuth Provider Setup Guides](https://next-auth.js.org/providers/)