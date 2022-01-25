import NextAuth from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';
import { LOGIN_URL } from '../../../lib/spotify';

async function refreshAccessToken(token) {
  try {
    spotifyApi.setAcessToken(token.accessToken);
    spotifyApi.setRefreshToken(token.refreshToken);

    const { body } = await spotifyApi.refreshAccessToken();
  } catch (error) {
    console.error(error);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    SpotifyProvider({
      clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_CLIENT_SECRET,
      authorization: LOGIN_URL,
    }),
    // ...add more providers here
  ],
  secret: process.env.JWT_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refres_token,
          username: account.providerAccountId,
          accessTokenExpires: account.expires_at * 1000, // we are handling expiry times in milliseconds hence * 1000
        };
      }
      //Returns previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Acess token has expired, so we need to refresh it...
      console.log('ACCESS TOKEN HAS EXPIRED, REFRESHINGL...');
      return await refreshAccessToken(token);
    },
  },
});
