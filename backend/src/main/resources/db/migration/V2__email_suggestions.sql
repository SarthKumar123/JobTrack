CREATE TABLE email_suggestions (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL,
    message_id VARCHAR(100) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    sender VARCHAR(500) NOT NULL,
    snippet VARCHAR(1000) NOT NULL,
    stage VARCHAR(20) NOT NULL,
    reason VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    CONSTRAINT unique_owner_message UNIQUE (owner_id, message_id)
);
CREATE INDEX email_suggestions_owner_status ON email_suggestions(owner_id, status, date);
