import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault(); // stop the page reload

        try {
            const result = await login(username, password);
            if (result.role === "Backoffice") {
                navigate("/backoffice");
            } else if (result.role === "GridOperator") {
                navigate("/operator");
            }
        } catch (err) {
            setErrorMessage(err.message);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            {errorMessage && <p>{errorMessage}</p>}
            <button type="submit">Login</button>
        </form>
    );
}

export default LoginPage;