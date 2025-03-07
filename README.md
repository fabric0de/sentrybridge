# Slack Webhook in Sentry

A webhook bridge service that forwards Sentry error notifications to Slack.

## Features

- Convert Sentry events to Slack messages
- Support for 3 message formats:
  - Basic: Essential error information and stack trace
  - Detailed: Comprehensive info including browser, OS, tags, and user activity
  - Grouped: Error pattern and frequency analysis (coming soon)
- Source code context display
- Error location highlighting
- Real-time notifications

## Installation

```bash
git clone https://github.com/fabric0de/Slack-Webhook-in-Sentry
cd Slack-Webhook-in-Sentry
npm install
```

## Environment Variables

Create a `.env` file and set the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

Create the following tables in Supabase:

### webhooks table

```sql
create table webhooks (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  slack_webhook_url text not null,
  message_format text default 'basic'::text,
  name text
);
```

### webhook_events table

```sql
create table webhook_events (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  webhook_id uuid references webhooks(id),
  event_type text
);
```

## Usage

1. Create a Slack Incoming Webhook URL
2. Register a new webhook through the web interface
3. Add the generated webhook URL to your Sentry webhook settings

## API Endpoints

- `POST /api/webhooks/[id]`: Receives Sentry events and forwards them to Slack

## Message Formats

### Basic Format

- Error type and message
- Location and environment
- Source code context
- Simple stack trace

### Detailed Format

- All Basic Format information
- Browser/OS information
- User information
- Recent activity history
- Tag information
- Additional context data

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License
