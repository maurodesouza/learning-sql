import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `prqlc` is a CommonJS wasm-pack build that reads its .wasm from disk at
  // import time, and declares a `browser` field pointing at an async-init web
  // build. Bundling it breaks both; load it with native Node `require` instead.
  serverExternalPackages: ["prqlc"],
  // Dev only: allow the in-browser preview proxy to load Next dev assets.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
