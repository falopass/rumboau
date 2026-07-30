# Rumbo AU — product contract

## Purpose

Rumbo AU replaces the manually edited WhatsApp waiting list with a public,
filterable community ledger. It reports what members say about their own
Working Holiday Australia applications; it is not an official immigration
service and does not predict decisions.

## Audiences

- Visitors compare dates, attempts, application origin, declared documents and
  proof-of-funds institutions without signing in.
- Participants create a public alias, provide a private Chilean mobile number
  for manual group verification and protect editing with a password.
- Administrators moderate, correct, export and issue one-time recovery links.

## Public data

Public alias, masked phone, membership-verification state, application date,
origin country, attempt number, current status,
declared bank names, declared document states, public notes, public tips and the
visible event timeline.

Never collect or publish passport numbers, visa identifiers, RUT, phone
numbers in full, account numbers, balances, statements or uploaded files.

## Success criteria

1. A visitor can understand the queue and filter it from a phone.
2. A participant can create and later edit only their own record.
3. Password recovery never reveals or assigns the new password to an admin.
4. The public projection never contains password hashes, reset tokens, audit
   metadata or internal notes.
5. Every community claim is labelled as self-reported and non-official.

## Non-goals

OTP, automatic WhatsApp membership verification, file uploads, automatic
WhatsApp messaging, grant-date prediction, legal advice and search-engine
indexing.
