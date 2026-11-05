CREATE TABLE email_notifications (
  id          bigserial   PRIMARY KEY,
  kind        text        NOT NULL CHECK (kind IN ('order_paid', 'needs_check', 'test')),
  order_no    text        CHECK (length(order_no) <= 40),
  sent        boolean     NOT NULL,
  error       text        CHECK (length(error) <= 500),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_notifications_galat CHECK (sent = (error IS NULL))
);

CREATE INDEX email_notifications_terbaru_idx ON email_notifications (created_at DESC, id DESC);

CREATE INDEX email_notifications_terkirim_idx ON email_notifications (created_at DESC) WHERE sent;

ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
