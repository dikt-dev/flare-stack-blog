import { bindings, defineConfig, exports, triggers } from "cf/config";
import { getDomain } from "tldts";
import * as entrypoint from "./src/server" with { type: "cf-worker" };

const env = process.env;
const workerName = env.WORKER_NAME?.trim() || "worker-name-placeholder";
const queueName = env.QUEUE_NAME?.trim() || "queue-name-placeholder";
const bucketName = env.BUCKET_NAME?.trim() || "bucket-name-placeholder";
const d1DatabaseId =
  env.D1_DATABASE_ID?.trim() || "00000000-0000-4000-8000-000000000000";
const kvNamespaceId =
  env.KV_NAMESPACE_ID?.trim() || "00000000000000000000000000000000";
const domain = env.DOMAIN?.trim();
const useRoutes = ["1", "true", "yes", "on"].includes(
  env.ROUTE?.trim().toLowerCase() ?? "",
);

export default defineConfig((ctx) => {
  const isTest = ctx.mode === "test";

  return {
    worker: {
      name: workerName,
      compatibilityDate: "2026-02-17",
      compatibilityFlags: ["nodejs_compat", "global_fetch_strictly_public"],
      entrypoint,
      cache: { enabled: true },
      observability: { enabled: true },
      ...(domain && !useRoutes ? { domains: [domain] } : {}),
      triggers: [
        triggers.scheduled({ schedule: "15 0 * * *" }),
        ...(domain && useRoutes
          ? [
              triggers.fetch({
                pattern: `${domain}/*`,
                zone: env.ZONE_NAME?.trim() || getDomain(domain) || domain,
              }),
            ]
          : []),
        ...(isTest
          ? []
          : [
              triggers.queue({
                name: queueName,
                maxBatchSize: 10,
                maxBatchTimeout: 5,
                maxRetries: 3,
              }),
            ]),
      ],
      env: {
        // 只保留"绑定"(bindings)——这些必须在 wrangler 里声明
        DB: bindings.d1({ id: d1DatabaseId }),
        KV: bindings.kv({ id: kvNamespaceId }),
        R2: bindings.r2({ name: bucketName }),
        IMAGES: bindings.images({}),
        QUEUE: bindings.queue({ name: queueName }),

        // ⚠️ 下面这些全部交给 Cloudflare Dashboard 管理，不要在这里声明：
        // DOMAIN, BETTER_AUTH_URL, BETTER_AUTH_SECRET,
        // GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
        // TURNSTILE_SECRET_KEY, ENVIRONMENT,
        // UMAMI_WEBSITE_ID, UMAMI_SRC, UMAMI_API_URL,
        // UMAMI_USERNAME, UMAMI_PASSWORD
        //
        // 声明与 Dashboard 里的变量冲突，Dashboard 的会被忽略。
      },
      exports: {
        default: exports.worker({ cache: { enabled: false } }),
        App: exports.worker({ cache: { enabled: true } }),
        RateLimiter: exports.durableObject({ storage: "sqlite" }),
        PostPublisher: exports.durableObject({ storage: "sqlite" }),
      },
    },
  };
});