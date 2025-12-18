# Database Schema - DynamoDB Tables (ENGLISH)

## Company Requirement: All database fields MUST be in English

This document explains each field in the simplest way possible, as if you were explaining to someone who doesn't work with technology.

---

## Table 1: petrobras-users
**What it stores:** Information about all people who use the system

| Field Name | Type | Simple Explanation | Example |
|------------|------|-------------------|---------|
| `user_id` | String (PK) | Unique number that identifies each person | "usr_12345" |
| `email` | String | Person's work email | "kleber.goncalves.prestserv@petrobras.com.br" |
| `full_name` | String | Complete name of the person | "Kleber Gonçalves" |
| `user_role` | String | What the person does in the system | "internal", "supervisor", "external" |
| `department` | String | Which area/department they work in | "IT", "Engineering", "Finance" |
| `phone_number` | String | Contact phone | "+55 21 98765-4321" |
| `is_active` | Boolean | Is the person still using the system? | true or false |
| `created_at` | Timestamp | When this person was registered | "2024-01-15T10:30:00Z" |
| `updated_at` | Timestamp | When information was last changed | "2024-01-20T14:22:00Z" |
| `last_login_at` | Timestamp | When they last logged in | "2024-01-20T14:22:00Z" |
| `password_hash` | String | Encrypted password (cannot be read) | "bcrypt hash..." |
| `avatar_url` | String | Link to profile photo | "https://..." |

**Indexes (GSI):**
- `EmailIndex`: Finds a person by email quickly
- `RoleIndex`: Lists all people with the same role

**Why these fields:** Every system needs to know WHO is using it, WHEN they use it, and WHAT they can do.

---

## Table 2: petrobras-files
**What it stores:** All files that people upload to share

| Field Name | Type | Simple Explanation | Example |
|------------|------|-------------------|---------|
| `file_id` | String (PK) | Unique number that identifies the file | "file_789012" |
| `document_name` | String | Name given to the document package | "Annual Report 2023" |
| `document_description` | String | What the files are about | "Consolidated financial report" |
| `uploaded_by_id` | String | ID of who sent the file | "usr_123456" |
| `uploader_name` | String | Name of who sent | "Kleber Gonçalves" |
| `uploader_email` | String | Email of who sent | "kleber.goncalves.prestserv@petrobras.com.br" |
| `recipient_email` | String | Email of who will receive | "client@gmail.com" |
| `recipient_name` | String | Name of who will receive | "Pedro Oliveira" |
| `file_list` | Array | List of all files in the package | [{name, size, type, s3_key}...] |
| `approval_status` | String | Current situation | "pending", "approved", "rejected" |
| `expiration_hours` | Number | How long it will be available | 72 (3 days) |
| `expires_at` | Timestamp | Exact date when it expires | "2024-01-22T10:30:00Z" |
| `created_at` | Timestamp | When it was uploaded | "2024-01-20T10:30:00Z" |
| `updated_at` | Timestamp | When info was last changed | "2024-01-20T11:00:00Z" |
| `approval_date` | Timestamp | When it was approved/rejected | "2024-01-20T11:00:00Z" |
| `approved_by_id` | String | ID of supervisor who approved | "usr_999888" |
| `approver_name` | String | Name of supervisor | "Wagner Gaspar Brazil" |
| `rejection_reason` | String | Why it was rejected | "Missing documents" |
| `download_count` | Number | How many times it was downloaded | 0, 1, 2... |
| `last_download_at` | Timestamp | When it was last downloaded | "2024-01-20T15:00:00Z" |
| `custom_message` | String | Message from sender to receiver | "Requested documents" |
| `ttl` | Number | Auto-delete timestamp | 1706097000 |
| `total_size_bytes` | Number | Total size of all files | 13421772 |
| `file_count` | Number | How many files in the package | 3 |
| `is_zip_validated` | Boolean | Did dangerous files check pass? | true or false |
| `s3_bucket_name` | String | Where files are stored | "petrobras-secure-files" |

**Indexes (GSI):**
- `UploaderIndex`: All files sent by a person
- `RecipientIndex`: All files for a recipient
- `StatusIndex`: All files with same status
- `ExpirationIndex`: Files expiring soon

**Why these fields:** To track WHO sent, TO WHOM, WHAT files, WHEN they expire, and IF it was approved.

---

## Table 3: petrobras-audit-logs
**What it stores:** Everything that happens in the system (like a security camera recording)

| Field Name | Type | Simple Explanation | Example |
|------------|------|-------------------|---------|
| `log_id` | String (PK) | Unique ID for this event | "log_555666" |
| `timestamp` | Timestamp | Exact moment this happened | "2024-01-20T10:30:00Z" |
| `user_id` | String | Who did this action | "usr_123456" |
| `user_name` | String | Name of who did it | "Kleber Gonçalves" |
| `user_email` | String | Email of who did it | "kleber.goncalves.prestserv@petrobras.com.br" |
| `user_type` | String | Type of user who did it | "internal", "supervisor", "external" |
| `action_type` | String | What they did | "upload", "download", "approve", "reject", "login" |
| `severity_level` | String | How important is this event | "info", "success", "warning", "error" |
| `file_id` | String | Which file was affected | "file_789012" |
| `file_name` | String | Name of the file | "Annual Report 2023" |
| `description_text` | String | Human-readable description | "User uploaded 3 files" |
| `ip_address` | String | Computer address that did it | "192.168.1.100" |
| `user_agent` | String | Browser/device used | "Mozilla/5.0..." |
| `metadata_json` | Object | Extra details about the event | {recipient: "...", fileCount: 3} |

**Indexes (GSI):**
- `UserIndex`: All actions by a user
- `ActionIndex`: All actions of same type
- `FileIndex`: All actions on a file
- `SeverityIndex`: All events with same importance level

**Why these fields:** For SECURITY and COMPLIANCE. If something goes wrong, we can see exactly WHO did WHAT and WHEN.

---

## Table 4: petrobras-notifications
**What it stores:** Messages shown to users inside the system

| Field Name | Type | Simple Explanation | Example |
|------------|------|-------------------|---------|
| `notification_id` | String (PK) | Unique ID for this notification | "notif_111222" |
| `user_id` | String | Who should see this message | "usr_123456" |
| `notification_type` | String | What kind of message | "success", "error", "info", "warning" |
| `priority_level` | String | How urgent is it | "low", "medium", "high", "critical" |
| `title_text` | String | Short summary | "Upload Approved!" |
| `message_text` | String | Full message | "Your upload was approved by supervisor" |
| `is_read` | Boolean | Did the person see it? | true or false |
| `action_button_label` | String | Text on button | "View Details" |
| `action_button_url` | String | Where button goes | "/historico" |
| `created_at` | Timestamp | When notification was created | "2024-01-20T11:00:00Z" |
| `read_at` | Timestamp | When it was read | "2024-01-20T11:05:00Z" or null |
| `metadata_json` | Object | Extra info | {fileId: "...", fileName: "..."} |
| `ttl` | Number | Auto-delete after 30 days | 1707318000 |

**Indexes (GSI):**
- `UserNotificationsIndex`: All notifications for a user
- `UnreadNotificationsIndex`: Only unread notifications
- `PriorityIndex`: Notifications by importance

**Why these fields:** Users need to know WHAT happened with their files in REAL-TIME.

---

## Table 5: petrobras-sessions
**What it stores:** Active login sessions (like a digital key while you're using the system)

| Field Name | Type | Simple Explanation | Example |
|------------|------|-------------------|---------|
| `session_id` | String (PK) | Unique ID for this login | "sess_333444" |
| `user_id` | String | Who is logged in | "usr_123456" |
| `access_token` | String | Digital key (encrypted) | "eyJhbGciOiJIUzI1NiIs..." |
| `refresh_token` | String | Backup key to get new access | "eyJhbGciOiJIUzI1NiIs..." |
| `ip_address` | String | Where they logged in from | "192.168.1.100" |
| `user_agent` | String | Device/browser used | "Chrome on Windows" |
| `is_active` | Boolean | Is this session still valid? | true or false |
| `created_at` | Timestamp | When they logged in | "2024-01-20T10:00:00Z" |
| `last_activity_at` | Timestamp | Last time they did something | "2024-01-20T14:30:00Z" |
| `expires_at` | Timestamp | When this login expires | "2024-01-21T10:00:00Z" |
| `ttl` | Number | Auto-logout timestamp | 1705921200 |

**Indexes (GSI):**
- `UserSessionsIndex`: All active sessions for a user

**Why these fields:** For SECURITY. We need to know WHO is logged in, FROM WHERE, and for HOW LONG.

---

## Table 6: petrobras-expiration-logs
**What it stores:** History of when file expiration times were changed

| Field Name | Type | Simple Explanation | Example |
|------------|------|-------------------|---------|
| `log_id` | String (PK) | Unique ID for this change | "explog_777888" |
| `timestamp` | Timestamp | When the change happened | "2024-01-20T15:00:00Z" |
| `file_id` | String | Which file was changed | "file_789012" |
| `file_name` | String | Name of the file | "Annual Report 2023" |
| `changed_by_id` | String | Who made the change | "usr_999888" |
| `changer_name` | String | Name of who changed | "Wagner Gaspar Brazil" |
| `previous_hours` | Number | Old expiration time | 72 |
| `new_hours` | Number | New expiration time | 168 |
| `change_reason` | String | Why it was changed | "Recipient requested more time" |
| `metadata_json` | Object | Extra context | {uploadedBy: "...", recipient: "..."} |

**Indexes (GSI):**
- `FileExpirationIndex`: All changes for a file
- `ChangedByIndex`: All changes by a supervisor

**Why these fields:** For AUDITING. We need to know WHO changed expiration times and WHY.

---

## Key Concepts Explained Simply

### 1. **Primary Key (PK)**
Think of it like a CPF number. Each item in the table has a unique number that identifies it. Nobody else can have the same number.

### 2. **Global Secondary Index (GSI)**
Like an index in a book. Instead of reading the whole book to find something, you look in the index and jump directly to the page. Indexes make searches MUCH faster.

### 3. **TTL (Time To Live)**
Like an expiration date on milk. After the date passes, DynamoDB automatically deletes the item. Used for files that expire and old notifications.

### 4. **Timestamp**
Exact date and time something happened, down to the second. Format: "2024-01-20T10:30:00Z" means January 20, 2024, at 10:30 AM.

### 5. **Boolean**
Only two options: true (yes) or false (no). Like a light switch: on or off.

### 6. **String**
Text. Can be a name, email, or any text.

### 7. **Number**
A number. Can be whole (72) or decimal (3.14).

### 8. **Array**
A list of things. Like a shopping list: [item1, item2, item3].

### 9. **Object/JSON**
A group of related information. Like a contact card with name, phone, and email all together.

---

## Why DynamoDB Instead of Traditional Database?

**Simple answers:**

1. **Automatic Scaling**: Handles millions of files without you doing anything
2. **Fast**: Finds any file in milliseconds, no matter how many you have
3. **Reliable**: AWS keeps 3 copies of your data automatically
4. **Pay Only What You Use**: No fixed servers, you pay per file stored
5. **TTL**: Files auto-delete when expired (no manual cleanup needed)

---

## Security Best Practices

1. **All passwords MUST be encrypted** (never store plain text)
2. **All tokens MUST expire** (sessions, access tokens)
3. **All actions MUST be logged** (audit trail for compliance)
4. **Sensitive data MUST use encryption at rest** (AWS KMS)
5. **All API calls MUST be authenticated** (no public access)

---

This schema is designed to be **SIMPLE**, **SECURE**, and **SCALABLE** for Petrobras file sharing system.
```

Agora vou continuar com a atualização da Wiki de Integração com análise rigorosa:
