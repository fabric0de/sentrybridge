"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Check, Copy } from "lucide-react";

export default function Home() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const validateSlackWebhook = (url: string) => {
    const slackWebhookPattern =
      /^https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Z0-9]+$/i;
    return slackWebhookPattern.test(url);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    setError(null);
    setGeneratedUrl(null);

    if (!webhookUrl) {
      setError("웹훅 URL을 입력해주세요.");
      return;
    }

    if (!validateSlackWebhook(webhookUrl)) {
      setError("올바른 Slack 웹훅 URL을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slackWebhookUrl: webhookUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setGeneratedUrl(data.webhookUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "URL 생성 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto min-h-screen p-8">
      <main className="flex flex-col items-center gap-8 py-10">
        <h1 className="text-3xl font-bold">Sentry to Slack 웹훅 변환기</h1>

        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <label htmlFor="slack-webhook" className="text-sm font-medium">
              Slack 웹훅 URL
            </label>
            <Input
              id="slack-webhook"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "생성 중..." : "변환된 URL 생성하기"}
          </Button>

          {generatedUrl && (
            <Card className="p-4 space-y-4">
              <h2 className="font-medium">생성된 Sentry 웹훅 URL</h2>
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
              <p className="text-sm text-muted-foreground">
                이 URL을 Sentry의 웹훅 설정에 등록하세요.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
