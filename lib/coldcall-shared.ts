// Cold-call lead statuses and call outcomes, shared by the API (lib/coldcall.ts) and the CRM board.

export const COLDCALL_STATUSES = [
  'To contact',
  'No answer',
  'Left voicemail',
  'Call back',
  'Messaged',
  'Replied',
  'Interested',
  'Appointment set',
  'Won',
  'Not a fit',
] as const;

/** Quick outcomes for logging a call. Each one moves the lead to a status. */
export const CALL_OUTCOMES: Record<string, string> = {
  'No answer': 'No answer',
  'Left voicemail': 'Left voicemail',
  'Talked, call back': 'Call back',
  Interested: 'Interested',
  'Appointment set': 'Appointment set',
  'Not interested': 'Not a fit',
  'Wrong number': 'Not a fit',
  'Sent DM': 'Messaged',
  'They replied': 'Replied',
};
