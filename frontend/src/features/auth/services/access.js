export function permissions(user) {
    const supervisor = user?.role === "Supervisor / Manajer Operasional";
    const system = user?.role === "Administrator Sistem";
    const operational = supervisor || user?.role === "Admin/CS & Sales";
    return { supervisor, system, operational };
}
export function mayEditTask(user, owner) {
    const access = permissions(user);
    return access.operational && (access.supervisor || owner === user?.name.split(" ")[0]);
}
