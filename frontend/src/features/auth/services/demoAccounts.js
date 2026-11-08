export const initialDemoAccounts = [
    { name: "Alya Putri", email: "alya.putri@gymnasyum.id", role: "Admin/CS & Sales", initials: "AP" },
    { name: "Fajar Nugraha", email: "fajar.nugraha@gymnasyum.id", role: "Admin/CS & Sales", initials: "FN" },
    { name: "Nisa Amalia", email: "nisa.amalia@gymnasyum.id", role: "Supervisor / Manajer Operasional", initials: "NA" },
    { name: "Raka Kurnia", email: "raka.kurnia@gymnasyum.id", role: "Administrator Sistem", initials: "RK" },
];

export const accountRoles = ["Admin/CS & Sales", "Supervisor / Manajer Operasional", "Administrator Sistem"];

export const roleDescriptions = {
    "Admin/CS & Sales": "Tawarkan promo, follow-up member yang tertarik, bantu pembelian atau perpanjangan, dan catat hasilnya.",
    "Supervisor / Manajer Operasional": "Atur jeda follow-up 3–7 hari, tentukan petugas dan izin kontak member, serta beri catatan arahan.",
    "Administrator Sistem": "Buat akun karyawan, ubah peran, dan nonaktifkan akun yang tidak lagi digunakan.",
};

export let demoAccounts = (() => {
    try {
        const saved = JSON.parse(localStorage.getItem("gymnasyum-demo-accounts-v2") || "null");
        if (Array.isArray(saved) && saved.length && saved.every((u) => typeof u.name === "string" && typeof u.email === "string" && typeof u.initials === "string" && accountRoles.includes(u.role)))
            return saved;
    }
    catch { /* Use seeded demo accounts when storage is unavailable. */ }
    return initialDemoAccounts;
})();

export const demoPassword = "GymnasyumDemo123!";

export function authenticateDemo(email, password, onSuccess, setError) {
    const user = demoAccounts.find((user) => user.email === email.trim().toLowerCase());
    let disabled = [];
    try {
        disabled = JSON.parse(localStorage.getItem("gymnasyum-disabled-accounts") || "[]");
    }
    catch { /* Use the default demo state. */ }
    if (user && disabled.includes(user.email)) {
        setError("Akun demo ini dinonaktifkan. Hubungi Administrator Sistem.");
        return;
    }
    if (!user || password !== demoPassword) {
        setError("Email atau kata sandi tidak sesuai. Gunakan akun demo di bawah.");
        return;
    }
    onSuccess(user);
}

export function replaceDemoAccounts(next) { demoAccounts = next; }
