# SMS (A2P 10DLC) registration copy

Paste these into the brand and campaign forms. Everything here matches what the live site says once it is
deployed. Deploy first: reviewers check the live pages, not this file.

## Brand

| Field | Value |
| --- | --- |
| Legal business name | TAAM Marketing LLC (must match the EIN paperwork exactly) |
| Brand / DBA name | TAAM Marketing |
| Website | https://taammarketing.com |
| Support email | info@taammarketing.com |
| Support phone | 702-997-6813 |

## Campaign

**Use case:** Mixed (Customer Care, Account Notification, Marketing). If you picked different use cases, tell
Claude so the "Message types" line on the site (`app/lib/legal.ts`, `SMS_MESSAGE_TYPES`) can be changed to match.

**Campaign description:**
TAAM Marketing (TAAM Marketing LLC) is a Las Vegas marketing agency that builds websites, video content and ads for
local businesses. We text business owners who opt in on our website forms to reply to their inquiry, schedule
and remind them of calls, send project and account updates to clients, and send occasional marketing messages
about TAAM Marketing services. Message frequency varies.

**How people opt in (call-to-action / message flow):**
People opt in on our website, taammarketing.com, in two places:
1. The contact form (open it from any "Talk" or contact button on taammarketing.com). The SMS checkbox is on
   the contact-details step, next to the phone number field.
2. The free video offer form at https://taammarketing.com/free-video-offer. The SMS checkbox is on step 2, next
   to the phone number field.

The checkbox is unchecked by default and optional. A form can be sent without it. The checkbox reads: "Yes, text
me. I agree to receive text messages from TAAM Marketing (TAAM Marketing LLC) at the phone number I provided.
Messages may be sent with automated technology. Consent is not a condition of purchase." Right under it the form
lists the message types, "Message frequency varies", "Message and data rates may apply", "Reply STOP to opt
out", "Reply HELP for help", and links to our Terms (https://taammarketing.com/terms#text-messages) and Privacy
Policy (https://taammarketing.com/privacy#text-messages). We store the date, page and wording version of every
opt-in.

**Privacy Policy URL:** https://taammarketing.com/privacy
**Terms URL:** https://taammarketing.com/terms

**Proof of consent:** upload `webdesign/sms-optin-proof.jpg` (step 2 of the free video offer form, showing the
phone field and the SMS checkbox with its disclosures).

## Sample messages

1. TAAM Marketing: Hi Jane, thanks for reaching out about your website. Does Tuesday at 2:00 PM PT work for a
   15-minute call? Reply STOP to opt out.
2. TAAM Marketing: Reminder, your call with our team is tomorrow at 2:00 PM PT. Need a new time? Just reply here.
   Reply STOP to opt out.
3. TAAM Marketing: Your new homepage draft is ready to review at https://taammarketing.com. Reply with any
   changes. Reply STOP to opt out.
4. TAAM Marketing: We have 3 spots open this month for a free week of video content for local businesses. Want
   one? Reply YES and we'll set it up. Reply STOP to opt out.

**Message content flags:** embedded links: yes. Phone numbers: yes. Age-gated content: no. Direct lending: no.

## Keyword replies

| Keyword | Reply |
| --- | --- |
| Opt-in confirmation (first text after the checkbox) | TAAM Marketing: Thanks for opting in to texts about your inquiry, scheduling, project updates and occasional marketing. Msg frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to opt out. |
| HELP, INFO | TAAM Marketing: For help, email info@taammarketing.com or call 702-997-6813. Msg & data rates may apply. Reply STOP to opt out. |
| STOP, CANCEL, END, QUIT, UNSUBSCRIBE | TAAM Marketing: You're unsubscribed and won't get more texts from us. Reply START to opt back in. |
| START | TAAM Marketing: You're opted back in to texts. Msg frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to opt out. |
