import NextAuth, { type DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "./src/lib/prisma"

declare module "next-auth" {
    interface Session {
        user: {
            role: string
            cedula: string
        } & DefaultSession["user"]
    }

    interface User {
        role: string
        cedula: string
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                cedula: { label: "Cedula", type: "text" },
                telefono: { label: "Telefono", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.cedula || !credentials?.telefono) {
                    console.log('Faltan credenciales');
                    return null;
                }

                const cedula = String(credentials.cedula).trim();
                const telefono = String(credentials.telefono).trim();

                const user = await prisma.user.findUnique({
                    where: { cedula }
                });

                if (!user) {
                    console.log('Usuario no encontrado:', cedula);
                    return null;
                }

                if (user.telefono !== telefono) {
                    console.log('Teléfono no coincide para usuario:', cedula);
                    return null;
                }

                return {
                    id: String(user.id),
                    name: user.name,
                    cedula: user.cedula,
                    role: user.role
                };
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as { role: string }).role
                token.cedula = (user as { cedula: string }).cedula
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { role: string } & DefaultSession["user"]).role = token.role as string;
                (session.user as { cedula: string } & DefaultSession["user"]).cedula = token.cedula as string
            }
            return session
        }
    }
})
