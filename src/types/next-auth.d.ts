import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      lineId: string
    } & DefaultSession["user"]
  }

  interface User {
    lineId: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    lineId: string
  }
}
