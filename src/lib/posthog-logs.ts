import { SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const posthogProjectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let loggerProvider: LoggerProvider | undefined;

function getLoggerProvider() {
  if (loggerProvider) return loggerProvider;

  if (!posthogProjectToken || !posthogHost) {
    if (process.env.NODE_ENV === "development") {
      const missingVariable = posthogProjectToken ? "NEXT_PUBLIC_POSTHOG_HOST" : "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN";
      console.error(
        new Error(
          `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
        ),
      );
    }
    return;
  }

  loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({ "service.name": "subleasy-nextjs" }),
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: `${posthogHost}/i/v1/logs`,
          headers: {
            Authorization: `Bearer ${posthogProjectToken}`,
            "Content-Type": "application/json",
          },
        }),
      }),
    ],
  });

  return loggerProvider;
}

export function registerPostHogLogs() {
  getLoggerProvider();
}

export async function emitPostHogLog(message: string, attributes: Record<string, string | number | boolean>) {
  const provider = getLoggerProvider();
  if (!provider) return;

  provider.getLogger("subleasy-posthog-logs").emit({
    body: message,
    severityNumber: SeverityNumber.INFO,
    attributes,
  });
  await provider.forceFlush();
}
