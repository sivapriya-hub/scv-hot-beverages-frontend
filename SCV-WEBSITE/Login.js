async function login() {

    const username =
        document.getElementById("username").value;

    const password =
        document.getElementById("password").value;

    const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        }
    );

    const result = await response.text();

    if(result === "LOGIN_SUCCESS") {

        localStorage.setItem("loggedIn", "true");
localStorage.setItem("username", username);

        window.location.href = "admin.html";

    } else {

        alert("Invalid Username or Password");

    }
}