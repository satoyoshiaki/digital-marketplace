import { compare, hash } from "bcryptjs";
import { UserRole } from "@prisma/client";
import { getServerSession, type NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

const oauthProviders = [];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  oauthProviders.push(
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  oauthProviders.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: { sellerProfile: true },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const validPassword = await compare(parsed.data.password, user.passwordHash);

        if (!validPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.sellerProfile?.displayName ?? user.email.split("@")[0],
          role: user.role,
          sellerProfileId: user.sellerProfile?.id ?? null,
        };
      },
    }),
    ...oauthProviders,
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
        include: { sellerProfile: true },
      });

      if (!existingUser) {
        const created = await prisma.user.create({
          data: {
            email: user.email.toLowerCase(),
            name: user.name,
            image: user.image,
          },
          include: { sellerProfile: true },
        });

        user.id = created.id;
        user.role = created.role;
        user.sellerProfileId = created.sellerProfile?.id ?? null;
        return true;
      }

      user.id = existingUser.id;
      user.role = existingUser.role;
      user.sellerProfileId = existingUser.sellerProfile?.id ?? null;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.sellerProfileId = user.sellerProfileId;
      }

      if (token.sub && (!token.role || token.sellerProfileId === undefined)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { sellerProfile: true },
        });

        token.role = dbUser?.role ?? UserRole.BUYER;
        token.sellerProfileId = dbUser?.sellerProfile?.id ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = session.user.email ?? "";
        session.user.role = (token.role as UserRole) ?? UserRole.BUYER;
        session.user.sellerProfileId = (token.sellerProfileId as string | null) ?? null;
      }

      return session;
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getAuthSession();
  return session?.user ?? null;
}

export async function requireUser() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return session.user;
}

export async function requireSeller() {
  const user = await requireUser();

  if (![UserRole.SELLER, UserRole.ADMIN].includes(user.role)) {
    redirect("/");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== UserRole.ADMIN) {
    redirect("/");
  }

  return user;
}

export async function hashPassword(password: string) {
  return hash(password, 12);
}
