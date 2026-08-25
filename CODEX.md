# Codex involvement

## Intent

Codex (OpenAI CLI) was requested to author a core module for real — prefer the **payment-recovery state machine**.

## What actually happened

- **Cursor Grok 4.6 cloud agent** implemented the product in this repo (`src/lib/payment-machine.ts`, UI, rail graph, tests).
- `npx @openai/codex` is installed (`codex-cli 0.149.1`).
- `codex login status` → **Not logged in**.
- `codex doctor` → **no Codex credentials were found**.
- `codex exec` (read-only, skip-git-repo-check) was invoked with a payment-machine prompt. It selected model `gpt-5.6-sol` / provider `openai`, then failed:

  `401 Unauthorized: Missing bearer or basic authentication in header` against `https://api.openai.com/v1/responses`.

Codex **did not write any product code**. There is no fake co-authorship.

## Gap

This cloud environment has the Codex CLI binary but no OpenAI / Codex auth (no API key, no login). The payment-recovery state machine and bilingual strings were therefore authored by the Cursor Grok 4.6 cloud agent so the citizen journey is not blocked.

To involve Codex later: `codex login` or set a supported auth env var, then re-run `codex exec` against `src/lib/payment-machine.ts`.
