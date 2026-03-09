import {
  createTRPCProxyClient,
  unstable_httpBatchStreamLink,
} from "@trpc/client";
import { headers } from "next/headers";

import { type AppRouter } from "@/server/api/root";
import { getUrl, transformer } from "./shared";

export const api = createTRPCProxyClient<AppRouter>({
  links: [
    unstable_httpBatchStreamLink({
      transformer,
      url: getUrl(),
      async headers() {
        const hdrs = await headers();
        const heads = new Map(hdrs);
        heads.set("x-trpc-source", "rsc");
        return Object.fromEntries(heads);
      },
    }),
  ],
});
