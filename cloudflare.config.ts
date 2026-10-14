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
        // ===== Bindings（只能放 wrangler） =====
        DB: bindings.d1({ id: d1DatabaseId }),
        KV: bindings.kv({ id: kvNamespaceId }),
        R2: bindings.r2({ name: bucketName }),
        IMAGES: bindings.images({}),
        QUEUE: bindings.queue({ name: queueName }),

        // ===== 普通变量（放 wrangler，避免被 Dashboard 清） =====
        DOMAIN: { type: "text", value: "ryn.us.ci" },
        BETTER_AUTH_URL: { type: "text", value: "https://ryn.us.ci" },
        ENVIRONMENT: { type: "text", value: "prod" },
        GITHUB_CLIENT_ID: { type: "text", value: env.GITHUB_CLIENT_ID ?? "" },

        UMAMI_WEBSITE_ID: {
          type: "text",
          value: "9a4de895-693a-4a4a-a599-53bbc0f11170",
        },
        UMAMI_SRC: {
          type: "text",
          value: "https://umami.fae.us.ci/script.js",
        },
        UMAMI_API_URL: {
          type: "text",
          value: "https://umami.fae.us.ci/api",
        },
        UMAMI_USERNAME: { type: "text", value: "admin" },

        // ===== 敏感值（只声明类型，值留在 Dashboard Secret） =====
        BETTER_AUTH_SECRET: { type: "secret" },
        GITHUB_CLIENT_SECRET: { type: "secret" },
        TURNSTILE_SECRET_KEY: { type: "secret" },
        UMAMI_PASSWORD: { type: "secret" },
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