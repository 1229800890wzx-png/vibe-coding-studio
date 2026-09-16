ALTER TABLE crm_clue
 ADD COLUMN education_origin VARCHAR(16) NULL,
 ADD COLUMN education_website_status VARCHAR(16) NULL,
 ADD COLUMN education_operator_note VARCHAR(2000) NULL,
 ADD COLUMN education_experience VARCHAR(200) NULL,
 ADD COLUMN education_interest VARCHAR(200) NULL,
 ADD COLUMN education_message VARCHAR(2000) NULL,
 ADD INDEX ix_crm_education_origin (tenant_id, education_origin, id);
UPDATE crm_clue SET education_origin='MINIAPP'
 WHERE education_origin IS NULL AND education_member_id IS NOT NULL;
CREATE TABLE edu_website_admission_receipt (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 tenant_id BIGINT NOT NULL,
 channel VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 request_id VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 payload_digest VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 crm_clue_id BIGINT NOT NULL,
 receipt VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 trace_id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 creator VARCHAR(64) DEFAULT '', create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updater VARCHAR(64) DEFAULT '', update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 deleted BIT(1) NOT NULL DEFAULT b'0',
 UNIQUE KEY uk_website_request (tenant_id, channel, request_id),
 UNIQUE KEY uk_website_receipt (receipt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
