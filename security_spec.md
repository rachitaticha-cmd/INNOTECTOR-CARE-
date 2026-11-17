# Security Specification (Firestore Rules)

## 1. Data Invariants
1. All patient profiles (`/users/{userId}`) and PII (`email`, `nationalId`, `emergencyContact`, `drugAllergies`, `chronicDiseases`) are strictly owner-only (`request.auth.uid == userId`) and require verified email (`request.auth.token.email_verified == true`).
2. Subcollections (`/queues/{queueId}`, `/triages/{triageId}`, `/notifications/{notifId}`) require both owner identity matching `{userId}`, verified email, valid document ID format (`isValidId`), and existence of the parent `/users/{userId}` document (`exists(/databases/$(database)/documents/users/$(userId))`).
3. Every `create` operation enforces `hasAll` + `hasOnly` allowlisting and binds `createdAt == request.time` and `updatedAt == request.time`.
4. Every `update` operation begins with `isValid[Entity](incoming())`, uses `incoming().diff(existing()).affectedKeys().hasOnly([...])`, enforces immutable identity/creation timestamps (`id`, `userId`, `createdAt`), and enforces `updatedAt == request.time`.
5. Terminal state locking on `QueueTicket`: once `existing().status in ['completed', 'cancelled']`, no further updates are allowed.

## 2. Dirty Dozen Attack Vectors Blocked
1. Unauthenticated read/write to `/users/{userId}` -> Denied (requires `isSignedIn() && isEmailVerified()`).
2. Cross-user PII read (`userA` reading `/users/{userB}`) -> Denied (`isOwner(userId)`).
3. Unverified email spoof -> Denied (`request.auth.token.email_verified == true`).
4. Shadow/ghost field injection (`isAdmin: true`, `role: 'admin'`) on `/users/{userId}` create or update -> Denied (`hasOnly` + `affectedKeys().hasOnly`).
5. Oversized ID poisoning (`1.5KB` document ID) -> Denied (`isValidId(id)` length <= 128 and regex).
6. Oversized string DoS (`name` > 120 chars, `notes` > 2000 chars) -> Denied (mandatory `.size()` bounds).
7. Timestamp spoofing (`createdAt` or `updatedAt` != `request.time`) -> Denied (`== request.time`).
8. Immutable `createdAt` or `userId` alteration on update -> Denied (`incoming().createdAt == existing().createdAt`).
9. Orphan subcollection creation without parent `/users/{userId}` -> Denied (`exists(/databases/$(database)/documents/users/$(userId))`).
10. Invalid array element injection or unbounded array (> 20 items) -> Denied (bounded `.size() <= 20` + element type guard).
11. Modifying a `cancelled` or `completed` `QueueTicket` -> Denied (terminal state lock).
12. Unscoped `allow list` scraping across another user's subcollection -> Denied (`resource.data.userId == request.auth.uid && isOwner(userId)`).
