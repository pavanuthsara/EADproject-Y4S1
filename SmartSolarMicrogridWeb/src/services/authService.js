const mockUsers = [
    { username: "admin1", password: "test123", role: "Backoffice", isActive: true },
    { username: "pavan", password: "pavan2003", role: "GridOperator", isActive: true },

];

async function login(username, password) {
    const user = mockUsers.find(u => u.username === username);

    if (!user) {
        throw new Error("Invalid credentials");
    }

    if (user.password !== password) {
        throw new Error("Invalid credentials");
    }

    if (user.isActive === false) {
        throw new Error("Account deactivated");
    }

    return {
        token: "mock-token-" + user.username,
        role: user.role,
        isActive: user.isActive,
    };
}

export { login };