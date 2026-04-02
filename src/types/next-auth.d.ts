import { UserRole } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      sellerProfileId: string | null;
      name?: string | null;
    };
  }

  interface User {
    role: UserRole;
    sellerProfileId: string | null;
    email: string;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    sellerProfileId?: string | null;
  }
}
