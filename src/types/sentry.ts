export interface SentryUser {
  id?: string;
  email?: string;
  ip_address?: string;
  sentry_user?: string;
}

export interface SentryBreadcrumbData {
  from?: string;
  to?: string;
  method?: string;
  status_code?: number;
  reason?: string;
  url?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface SentryBreadcrumb {
  timestamp: number;
  type: string;
  category: string;
  level: string;
  message?: string;
  data?: SentryBreadcrumbData;
}

export interface SentryStackFrame {
  filename: string;
  function: string;
  lineno: number;
  colno: number;
  abs_path?: string;
  context_line?: string;
  pre_context?: string[];
  post_context?: string[];
  in_app?: boolean;
}

export interface SentryException {
  type: string;
  value: string;
  stacktrace?: {
    frames?: SentryStackFrame[];
  };
}

export interface SentryContext {
  name?: string;
  version?: string;
  type?: string;
}

export interface SentryEvent {
  event_id: string;
  level: string;
  message?: string;
  timestamp?: number;
  platform?: string;
  environment?: string;
  project?: string;
  logger?: string;
  user?: SentryUser;
  contexts?: {
    browser?: SentryContext;
    os?: SentryContext;
    client_os?: SentryContext;
    [key: string]: SentryContext | undefined;
  };
  breadcrumbs?: {
    values: SentryBreadcrumb[];
  };
  exception?: {
    values?: SentryException[];
  };
  tags?: [string, string][];
  extra?: Record<
    string,
    string | number | boolean | null | Array<unknown> | Record<string, unknown>
  >;
  metadata?: {
    value?: string;
    type?: string;
    filename?: string;
    function?: string;
    title?: string;
  };
  url?: string;
}

export interface SentryWebhookPayload {
  id: string;
  project: string;
  project_name: string;
  project_slug: string;
  level: string;
  culprit: string;
  message: string;
  url: string;
  event: SentryEvent;
}
