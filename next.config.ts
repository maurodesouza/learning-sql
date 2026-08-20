import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `prqlc` is a CommonJS wasm-pack build that reads its .wasm from disk at
  // import time, and declares a `browser` field pointing at an async-init web
  // build. Bundling it breaks both; load it with native Node `require` instead.
  serverExternalPackages: ["prqlc"],
};

export default nextConfig;
