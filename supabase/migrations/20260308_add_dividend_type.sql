ALTER TABLE trade_logs DROP CONSTRAINT IF EXISTS trade_logs_type_check;
ALTER TABLE trade_logs ADD CONSTRAINT trade_logs_type_check CHECK (type IN ('BUY', 'SELL', 'DIVIDEND'));
