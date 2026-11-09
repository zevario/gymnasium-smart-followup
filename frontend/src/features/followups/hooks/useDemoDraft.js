import { useState } from 'react';

export function useDemoDraft(customer, user, ownTask) {
  const c = customer;
  const [tone, setTone] = useState('Ramah');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const generate = (selectedTone = tone) => {
    if (!ownTask) return;
    setLoading(true);
    window.setTimeout(() => {
      const name = c.name.split(' ')[0];
      const sender = user?.name.split(' ')[0] ?? c.owner;
      const context =
        c.goal === 'Trial'
          ? `Terima kasih sudah mencoba ${c.package}. Bagaimana pengalaman latihannya?`
          : `Mengenai ${c.package}: ${c.context.toLowerCase()}.`;
      setDraft(
        selectedTone === 'Formal'
          ? `Selamat pagi, Bapak/Ibu ${name}. Saya ${sender} dari Gymnasyum Bintaro. ${context} Apakah Anda berkenan menerima informasi ${c.goal === 'Trial' ? 'membership' : 'perpanjangan'}?`
          : selectedTone === 'Ringkas'
            ? `Halo Kak ${name}, ${context} Mau info ${c.goal === 'Trial' ? 'membership' : 'perpanjangan'} di Gymnasyum Bintaro?`
            : `Halo Kak ${name}, saya ${sender} dari Gymnasyum Bintaro. ${context} Saya siap membantu jika Kakak ingin tahu pilihan ${
                c.goal === 'Trial' ? 'membership setelah trial' : 'perpanjangan paket'
              }.`,
      );
      setLoading(false);
    }, 650);
  };
  return { tone, setTone, draft, setDraft, loading, generate };
}
