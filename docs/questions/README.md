# Open questions

Some questions belong to someone outside engineering: a tax treatment, a ledger account, a legal
wording. Until they answer, the question stays open **on purpose**. A deferral is a ruling, not a
gap in the code.

## The rules

1. **Never infer the answer** from the code, a default or what looks standard. A plausible wrong
   answer can do real damage and nobody notices for a month.
2. **Restate the question where the code depends on it**, citing its `OQ-##`. A repository must be
   enough on its own; never point at a file only some people can open.
3. **Build everything that does not depend on the answer**, and land it so the answer becomes
   configuration, not a release: unset, nothing changes; set, the ruling takes effect.
4. **Log any fallback** that stands in for the missing answer. A divergence waiting on a person
   must be visible, never silent.
5. **An answer is not done until it is recorded**: a `DEC-###` in the plan quoting the words, the
   question closed here, and the code comment updated.

Copy `_TEMPLATE.md` for each new question, and list it in the table below.

| OQ | Question | Owner | Where it bites |
|---|---|---|---|
| OQ-01 | What happens to the code that already collects data from LinkedIn? | Zee | `supabase/functions/fetch-linkedin-jobs/`, `supabase/functions/parse-linkedin/`, `extension/content.js` |
