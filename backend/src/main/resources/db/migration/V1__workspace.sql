CREATE TABLE applications (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL,
    company VARCHAR(100) NOT NULL,
    role_name VARCHAR(150) NOT NULL,
    location VARCHAR(100) NOT NULL,
    work_mode VARCHAR(20) NOT NULL,
    stage VARCHAR(20) NOT NULL,
    event_date DATE NOT NULL,
    url VARCHAR(2048) NOT NULL,
    notes VARCHAR(5000) NOT NULL,
    resume VARCHAR(150) NOT NULL
);
CREATE INDEX applications_owner_date ON applications(owner_id, event_date);

CREATE TABLE application_history (
    app_id VARCHAR(36) NOT NULL,
    position INTEGER NOT NULL,
    stage VARCHAR(20) NOT NULL,
    event_date DATE NOT NULL,
    PRIMARY KEY (app_id, position),
    FOREIGN KEY (app_id) REFERENCES applications(id)
);

CREATE TABLE interviews (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL,
    app_id VARCHAR(36) NOT NULL,
    round_name VARCHAR(150) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    link VARCHAR(2048) NOT NULL,
    notes VARCHAR(5000) NOT NULL,
    FOREIGN KEY (app_id) REFERENCES applications(id)
);
CREATE INDEX interviews_owner_date ON interviews(owner_id, event_date);

CREATE TABLE follow_ups (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL,
    app_id VARCHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    event_date DATE NOT NULL,
    done BOOLEAN NOT NULL,
    FOREIGN KEY (app_id) REFERENCES applications(id)
);
CREATE INDEX follow_ups_owner_date ON follow_ups(owner_id, event_date);
