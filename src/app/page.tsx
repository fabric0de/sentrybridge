"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Check,
  Copy,
  Github,
  Globe,
  ArrowRight,
  Activity,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Sentry와 Slack 브랜드 컬러
const SENTRY_COLOR = "#6C5FC7";
const SLACK_COLOR = "#4A154B";

const messageFormats = [
  {
    id: "basic",
    title: "Basic",
    description: "Error message, stack trace summary, and environment info",
    icon: "📝",
  },
  {
    id: "detailed",
    title: "Detailed",
    description:
      "Full error details including environment, user context, and performance metrics",
    icon: "📊",
  },
  {
    id: "grouped",
    title: "Grouped",
    description: "Groups similar errors and shows occurrence count with trend",
    icon: "📈",
  },
] as const;

type MessageFormat = "basic" | "detailed" | "grouped";

export default function Home() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [messageFormat, setMessageFormat] = useState<MessageFormat>("basic");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{
    webhookCount: number;
    eventCount: number;
  }>({
    webhookCount: 0,
    eventCount: 0,
  });

  const validateSlackWebhook = (url: string) => {
    const slackWebhookPattern =
      /^https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Z0-9]+$/i;
    return slackWebhookPattern.test(url);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("URL copied to clipboard");
  };

  const handleSubmit = async () => {
    if (!webhookUrl) {
      toast.error("Please enter a webhook URL");
      return;
    }

    if (!validateSlackWebhook(webhookUrl)) {
      toast.error("Invalid Slack webhook URL");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slackWebhookUrl: webhookUrl,
          messageFormat,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate URL");
      }

      setGeneratedUrl(data.webhookUrl);
      toast.success("Webhook URL generated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate URL"
      );
      setGeneratedUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        const data = await response.json();
        if (response.ok) {
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto p-8">
        <div className="flex flex-col items-center gap-8 py-10">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4 text-4xl font-bold">
              <span style={{ color: SENTRY_COLOR }}>Sentry</span>
              <ArrowRight className="h-8 w-8" />
              <span style={{ color: SLACK_COLOR }}>Slack</span>
            </div>
            <p className="text-muted-foreground">
              Easily connect Sentry alerts to Slack
            </p>
          </div>

          <div className="w-full max-w-md space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="slack-webhook" className="text-sm font-medium">
                  Slack Webhook URL
                </label>
                <Input
                  id="slack-webhook"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message Format</label>
                <RadioGroup
                  value={messageFormat}
                  onValueChange={(value) =>
                    setMessageFormat(value as MessageFormat)
                  }
                  className="grid gap-3"
                >
                  {messageFormats.map((format) => (
                    <div
                      key={format.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                        ${
                          messageFormat === format.id
                            ? "border-[#6C5FC7] bg-[#6C5FC7]/5"
                            : "border-muted hover:border-muted-foreground"
                        }`}
                    >
                      <RadioGroupItem value={format.id} id={format.id} />
                      <Label
                        htmlFor={format.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{format.icon}</span>
                          <span className="font-medium">{format.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format.description}
                        </p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button
                className="w-full hover:bg-[var(--hover-color)] transition-colors"
                onClick={handleSubmit}
                disabled={isLoading}
                style={
                  {
                    backgroundColor: SLACK_COLOR,
                    color: "white",
                    "--hover-color": "#611f69",
                  } as React.CSSProperties & { "--hover-color": string }
                }
              >
                {isLoading ? "Generating..." : "Generate Webhook URL"}
              </Button>

              {generatedUrl && (
                <Card className="p-4 space-y-4">
                  <h2 className="font-medium">Generated Sentry Webhook URL</h2>
                  <div className="flex items-center gap-2">
                    <Input
                      value={generatedUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleCopy(generatedUrl)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                      Register this URL in your Sentry webhook settings.
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Stats section */}
            <div className="w-full max-w-md mt-8">
              <Card>
                <div className="grid grid-cols-2 divide-x">
                  <div className="p-6 text-center">
                    <div className="flex justify-center mb-2">
                      <Link2
                        className="h-5 w-5"
                        style={{ color: SENTRY_COLOR }}
                      />
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: SENTRY_COLOR }}
                    >
                      {stats.webhookCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Registered Webhooks
                    </div>
                  </div>
                  <div className="p-6 text-center">
                    <div className="flex justify-center mb-2">
                      <Activity
                        className="h-5 w-5"
                        style={{ color: SLACK_COLOR }}
                      />
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: SLACK_COLOR }}
                    >
                      {stats.eventCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Delivered Events
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Usage Guide Section */}
            <div className="w-full max-w-2xl mx-auto mt-16 space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Important Notes</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Security</h3>
                    <p className="text-sm text-muted-foreground">
                      Keep your Slack Webhook URL private. The generated URL can
                      be shared safely with Sentry.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Rate Limits</h3>
                    <p className="text-sm text-muted-foreground">
                      Respect Slack&apos;s rate limits of 1 message per second
                      per webhook.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Message Format</h3>
                    <p className="text-sm text-muted-foreground">
                      Sentry alerts will be formatted to include error details,
                      stack traces, and direct links.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Webhook Lifetime</h3>
                    <p className="text-sm text-muted-foreground">
                      Generated webhooks remain active until manually deleted.
                      One Slack webhook can be used for multiple Sentry
                      projects.
                    </p>
                  </Card>
                  <Card className="p-4 col-span-2">
                    <h3 className="font-semibold mb-2">Data Management</h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>We store and manage:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Your Slack webhook URL (encrypted)</li>
                        <li>Generated webhook URL mapping</li>
                        <li>Basic event statistics (count only)</li>
                      </ul>
                      <p>We don&apos;t store:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Actual error data from Sentry</li>
                        <li>Message content sent to Slack</li>
                        <li>Any project-specific information</li>
                      </ul>
                      <p className="mt-2">
                        All data is processed in real-time and messages are
                        forwarded directly from Sentry to Slack through our
                        service.
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t">
        <div className="container mx-auto py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/fabric0de/Slack-Webhook-in-Sentry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-6 w-6" />
              </a>
              <a
                href="https://www.codefisher.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="h-6 w-6" />
              </a>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              <p>
                Created by <span className="font-bold">JungHyeon Kim</span>
              </p>
              <p className="mt-2">© {new Date().getFullYear()} Fabric0de</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
