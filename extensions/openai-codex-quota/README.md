# OpenAI Codex / ChatGPT Plus & Pro Quota Monitor for Pi Agent

Monitor your real-time rate limits, usage quotas, and remaining credits on your **OpenAI ChatGPT Plus or Pro** subscription directly within Pi Agent.

---

## Features

- **Real-Time Quota Dashboard**: Displays short-term and extended rate limit windows with graphical progress bars.
- **Reset Countdown Timers**: Shows exactly how many hours/minutes remain until your limits reset.
- **Plan Details**: Displays your active plan tier (ChatGPT Pro / ChatGPT Plus / Team) and email.
- **Model Overview**: Lists available subscription models (`o3-mini`, `o1`, `gpt-4o`, `gpt-4o-mini`).

---

## Quick Start

### 1. Launch with Pi:

```bash
pi -e ./packages/coding-agent/examples/extensions/openai-codex-quota
```

Or install globally into your Pi extensions directory:

```bash
mkdir -p ~/.pi/agent/extensions
cp -r ./packages/coding-agent/examples/extensions/openai-codex-quota ~/.pi/agent/extensions/
```

### 2. Login with your OpenAI Account:

Inside Pi, run:
```text
/login openai-codex
```
Follow the browser authentication page to log in to your ChatGPT Plus or Pro account.

### 3. Check Quota & Usage:

```text
/codex-quota
```
or
```text
/openai-quota
```

### 4. Switch to an OpenAI Subscription Model:

```text
/model openai-codex/o3-mini
/model openai-codex/o1
/model openai-codex/gpt-4o
```
