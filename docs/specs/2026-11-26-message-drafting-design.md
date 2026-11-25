# Message drafting from the user's notes

REQ-005, 2026-11-26. Implements REQ-005 (strategy spec section 5E). Builds on REQ-003 and REQ-009.

## Why

The contact dialog had an "AI Invitation Generator" that wrote a 300-character note from a tone
picked in a list. It ignored the user's notes about the person, so every note read the same, and
it could only write a connection request. The strategy spec asks for a draft per contact, built
from what the user knows about them, with an ask that fits how warm the relationship is.

## Goals

- One draft per contact, built from the user's own notes about that person.
- The ask follows the ladder: connection request, then advice, then a call, then a referral.
- A draft that is the same as another contact's draft is rejected in code.
- "Mark as sent" logs the message in the contact's interaction history.

## Non-goals

- JobOS does not send messages or open LinkedIn with text filled in (P1, P2).
- No bulk drafting. One contact at a time.
- No drafts for email or other channels yet.
- It does not check a draft's claims against the notes. The prompt forbids invented facts; the
  user reads the draft before sending.

## Acceptance criteria

- **AC-1** With no relationship text and no notes on the contact, drafting is refused with a
  message asking for a note. No model call is made.
- **AC-2** `availableAsks(stage, hasInbound)`: Identified, Following and Engaged offer only a
  connection request; Connected offers advice and a call; In conversation and Advocate add a
  referral only when at least one inbound interaction is logged.
- **AC-3** The prompt contains the user's notes, at most the facts taken from the Master
  Profile, the chosen ask and the rule that only supplied facts may be used.
- **AC-4** `checkDraft` rejects a draft that is empty, over the limit for its ask (300, 600,
  600, 700 characters), does not use the contact's first name, or contains a bracket placeholder.
- **AC-5** `checkDraft` rejects a draft that shares 80% or more of its three-word sequences with
  the saved draft of another contact, names ignored. The message names that contact.
- **AC-6** Copy and "Mark as sent" are disabled while the check fails. The user can still edit
  and save the draft.
- **AC-7** "Mark as sent" saves the draft and adds an outbound LinkedIn interaction with the
  text. For a connection request it also sets the invitation date (REQ-009) when not yet set.
- **AC-8** A contact marked do not contact has no drafting.
- **AC-9** With no AI key, or when the provider fails, the user sees the reason. There is no
  canned fallback (P3, P10).

## Design

- `src/utils/message-draft.ts` (pure): `availableAsks`, `recommendedAsk`, `buildDraftPrompt`,
  `checkDraft`, `draftSimilarity`, `senderFacts`.
- `AIGenerator.draftMessage` replaces `generateConnectionNote`. It uses the user's own provider
  key, as before.
- `src/components/contacts/MessageDrafter.tsx` replaces the body of the dialog's Connection tab.
- Drafts stay in the existing `contacts.invitation_note` column. No migration.

## Risks

- A model may still write something untrue. Mitigation: the prompt rules, the short limits, and
  the user sends by hand.
- The similarity check compares only saved drafts, one per contact.
