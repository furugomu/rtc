import NextAuth from "next-auth";
import Providers from "next-auth/providers";

export default NextAuth({
  providers: [
    Providers.Credentials({
      name: "credentials",
      credentials: { name: { label: "なまえ", type: "text" } },
      async authorize(credentials) {
        return credentials;
      },
    }),
  ],
});
