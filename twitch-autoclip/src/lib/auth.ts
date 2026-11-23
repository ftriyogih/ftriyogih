import NextAuth from 'next-auth'
import Twitch from 'next-auth/providers/twitch'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Twitch({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'user:read:email clips:edit channel:read:vods channel:manage:vods moderator:read:chatters',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        token.twitchId = profile?.id
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.expiresAt = token.expiresAt as number
      session.user.twitchId = token.twitchId as string
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
})

declare module 'next-auth' {
  interface Session {
    accessToken: string
    refreshToken: string
    expiresAt: number
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      twitchId: string
    }
  }
}

declare module 'next-auth' {
  interface JWT {
    accessToken: string
    refreshToken: string
    expiresAt: number
    twitchId: string
  }
}