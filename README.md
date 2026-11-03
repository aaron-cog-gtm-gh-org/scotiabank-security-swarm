# ![Scotiabank Portfolio Tracker Logo](frontend/src/assets/public/images/Scotiabank_Logo.svg) Scotiabank Portfolio Tracker

A self-directed investing portfolio dashboard used as an **application security training target**. The UI presents a
portfolio overview, account list, market ticker and an investment catalogue with a Trade Ticket checkout flow — and it
is deliberately riddled with vulnerabilities spanning the
[OWASP Top Ten](https://owasp.org/www-project-top-ten) and beyond, so it can be attacked, scanned and used in demos.

> Demo interface with mock data. Not affiliated with The Bank of Nova Scotia. Balances, quotes and holdings are fictional.

> **Never deploy this application to a public host or to any network you care about.** It is insecure by design. The
> files under `infrastructure/` and `terraform/` are intentionally insecure teaching material — use the root
> `Dockerfile` if you need a real deployment for a training session.

## Setup

Requires Node.js 22–25 (24 is the default).

```bash
git clone https://github.com/aaron-cog-gtm-gh-org/investment-portfolio.git
cd investment-portfolio
npm install
npm start
```

The application is then available on <http://localhost:3000>. No `NODE_ENV` is required — the Scotiabank Portfolio Tracker
branding, theme and investment catalogue are the default configuration in `config/default.yml`.

### Docker

```bash
docker build -t investment-portfolio .
docker run --rm -p 3000:3000 investment-portfolio
```

## Configuration

`config/default.yml` holds the application name, theme (`scotia-red`), logo, favicon, welcome banner, chatbot
persona and the investment product catalogue, including the metadata that individual challenges depend on.

The remaining profiles are selected with `NODE_ENV=<name>` and exist for specific training modes rather than for
alternative branding:

| Profile    | Purpose                                                       |
|------------|---------------------------------------------------------------|
| `ctf`      | Capture-the-flag mode with flag codes enabled                  |
| `fbctf`    | Facebook CTF export mode                                       |
| `quiet`    | Suppresses challenge notifications                             |
| `tutorial` | Restricts progress to the hacking instructor tutorials first   |
| `unsafe`   | Enables challenges disabled by default for safety reasons      |
| `test`     | Used by the automated test suites                              |

## Development

```bash
npm run lint            # ESLint (JS Standard Style) + stylelint + config schema validation
npm test                # frontend (Vitest), server and API tests
npm run test:frontend
npm run test:server
npm run test:api
npm run rsn             # Refactoring Safety Net, required when touching coding-challenge code
npm start & npm run test:e2e   # Cypress end-to-end suite
```

Agent-specific contribution rules live in [AGENTS.md](AGENTS.md). Commits must be signed off (`git commit -s`).

## Licensing

This project is a rebranded derivative of [OWASP Juice Shop](https://owasp-juice.shop) by Bjoern Kimminich and the
OWASP Juice Shop contributors, released under the [MIT license](LICENSE).
