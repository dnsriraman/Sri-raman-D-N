import { createApp } from "../server";

const appPromise = createApp({
  enableViteMiddleware: false,
  serveStaticDist: false,
});

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
