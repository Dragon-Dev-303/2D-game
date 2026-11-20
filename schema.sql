CREATE TABLE IF NOT EXISTS orders (
 id UUID PRIMARY KEY,
 claim_hash TEXT NOT NULL,
 coin TEXT NOT NULL,
 network TEXT NOT NULL,
 start_block BIGINT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 expires_at TIMESTAMPTZ NOT NULL,
 paid BOOLEAN NOT NULL DEFAULT FALSE,
 tx_hash TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS orders_unique_chain_tx ON orders(network,tx_hash) WHERE tx_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at);
