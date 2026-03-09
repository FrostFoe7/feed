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
        hostname: "uploadthing.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
