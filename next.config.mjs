/** @type {import("next").NextConfig} */

const nextConfig = {
  async redirects() {
    if (process.env.NODE_ENV === "production") {
      return [
        {
          source: "/seed",
          destination: "/",
          permanent: true,
        },
      ];
    } else {
      return [];
    }
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cloud.appwrite.io",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "*.appwrite.io",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
