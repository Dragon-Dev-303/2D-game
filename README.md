# INK FIGHT / 06 — Celestial Cataclysm

A single-page, Flash-style Canvas 2D stickman fighter with a Vercel-ready Node API for a $1 USDC/USDT premium move.

## Game

Open `public/index.html` directly to preview gameplay and use **TRY DEMO** to test the O-key move. To run the payment APIs, deploy to Vercel or use `npx vercel dev` after configuring environment variables.

Controls: A/D move, W jump, S crouch, J punch, K kick, U uppercut, I spinning kick, L block, O Celestial Cataclysm. On-screen buttons also support touch.

## Vercel setup

1. Create a Neon PostgreSQL database: https://neon.tech . Run `schema.sql` in its SQL editor.
2. Copy `.env.example` to `.env.local`. Set `DATABASE_URL` to your Neon connection string, and generate `ENTITLEMENT_SECRET` using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Configure RPC endpoints for only the networks you intend to enable. A paid RPC provider is recommended for production.
4. `npm install` and `npx vercel dev` for local development (requires Vercel CLI login).
5. Push the project to GitHub, import into https://vercel.com/new and select **Other** framework. Set the same environment variables in Vercel's project settings. Deploy.
6. Confirm the game works, then run end-to-end tests on the payment backend before enabling customer payments.

## Payment design

- The UI offers USDC on Base, Ethereum, Arbitrum, Polygon, and USDT on Ethereum, Arbitrum, BNB Smart Chain. Not all combinations are enabled; do not assume an Exodus wallet supports every listed token/network.
- Recipient: `0x65b24321Bb13CE0E2ddBC4BC3F46a9DAE29B7850`. Verify this address inside Exodus for each selected network/token.
- `/api/order` creates a 30-minute order and a secret claim key, stores its hash in Neon, and returns the network/token/recipient.
- `/api/verify` checks the chain ID, receipt status, start block, minimum of 3 confirmations, ERC-20 Transfer event contract, recipient and amount. PostgreSQL unique constraint blocks reuse of an already claimed tx on that chain.
- `/api/entitlement` validates the signed unlock token against the database.
- Demo unlock is deliberately local-only and **not proof of payment**.

## CRITICAL — before accepting real payments

**This is a deployable demo/prototype, not a production-ready crypto checkout.** A shared receiving address and manual transaction hash can still allow competing orders to race to claim the same *unclaimed* transfer. A secure production design needs uniquely attributable payment requests (e.g. per-order deposit addresses, wallet-authenticated sender binding, or a verified payment processor), robust replay/claim protection, monitoring, rate limiting, abuse controls, order recovery, and independent end-to-end payment testing. The $1 minimum does not include network gas. Do not collect real customer funds until these issues are resolved. The demo mode should be disabled or isolated from paid users for commercial launch.

## Technology

- Canvas 2D game renderer (NOT Three.js), deliberately retained to avoid the prior WebGL character visibility issue.
- Vercel Node serverless API endpoints in `api/`.
- Neon serverless PostgreSQL for order persistence.
- Node 20+, no blockchain private keys required; server only reads chain receipts.

## Testing

`npm run check` validates API syntax. To validate the inline game script, extract it and run `node --check`. Manual browser and on-chain integration tests are still necessary.
