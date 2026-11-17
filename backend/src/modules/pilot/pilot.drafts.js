import { requestDraft } from '../reminders/draft-generator.service.js';

// The generator chooses approved clauses. Names, package and dates are inserted only by the server.
export async function draftFor(row) {
  // Draft GenAI (DRAFT_API_URL) bila tersedia; layanan itu sendiri memeriksa fakta dan
  // punya template cadangan. Bila tidak terjangkau, katalog frasa di bawah tetap dipakai.
  const generated = await requestDraft({
    kind: row.goal === 'trial' ? 'followup_trial' : 'followup_renewal',
    customerName: row.name,
    packageName: row.facts.package,
    [row.goal === 'trial' ? 'trialDate' : 'expiresAt']: new Date(
      row.facts.anchor,
    ).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
  });
  if (generated) {
    return {
      message: generated.message,
      kind: generated.source === 'gemini' ? 'AI · Gemini' : 'Template',
    };
  }
  const greetings = ['Halo Kak', 'Selamat siang Kak'];
  const endings = [
    'Apakah Kakak ingin dibantu dengan langkah berikutnya?',
    'Apakah ada informasi yang bisa kami bantu?',
  ];
  let greeting = 0,
    ending = 0,
    kind = 'Template';
  if (process.env.PILOT_AI_MODEL && process.env.PILOT_AI_URL) {
    try {
      const response = await fetch(new URL('/api/generate', process.env.PILOT_AI_URL), {
        method: 'POST',
        signal: AbortSignal.timeout(4000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.PILOT_AI_MODEL,
          stream: false,
          format: 'json',
          prompt:
            'Select a warm Indonesian gym follow-up greeting and question for ' +
            row.goal +
            '. Return JSON with integer greeting and ending, each 0 or 1. Greeting 0 casual, 1 formal. Ending 0 next steps, 1 more information.',
        }),
      });
      if (response.ok) {
        const pick = JSON.parse((await response.json()).response);
        if ([0, 1].includes(pick.greeting) && [0, 1].includes(pick.ending)) {
          greeting = pick.greeting;
          ending = pick.ending;
          kind = 'AI · frasa terverifikasi';
        }
      }
    } catch {
      /* Use the same approved catalog when inference is unavailable. */
    }
  }
  const day = new Date(row.facts.anchor).toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'long',
  });
  const fact =
    row.goal === 'trial'
      ? 'Terima kasih telah mengikuti ' +
        // Package names such as "Trial Bintaro" already say trial.
        (/trial/i.test(row.facts.package) ? '' : 'trial ') +
        row.facts.package +
        ' pada ' +
        day +
        '.'
      : 'Tanggal akhir paket ' + row.facts.package + ' yang tercatat adalah ' + day + '.';
  return {
    message:
      greetings[greeting] +
      ' ' +
      row.name +
      ', kami dari Gymnasyum Bintaro. ' +
      fact +
      ' ' +
      endings[ending],
    kind,
  };
}
