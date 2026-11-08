function checkLogin(event) {
    event.preventDefault();
    try {
        let email = document.getElementById("email").value;
        let password = document.getElementById("password").value;
        let message = document.getElementById("message");
        if (email === "aaa@gmail.com" && password === "12345678") {
            alert("Log in successful!");
            message.textContent = "";
        } else {
            message.textContent = "Invalid email or password. Please try again.";
            message.style.color = "#ff336688";
        }
    } catch (error) {
        console.error("Error checking authentication:", error);
    }
}

function checkSignUp(event) {
    event.preventDefault();
    try {
        let password = document.getElementById("password").value;
        let checkPassword = document.getElementById("confirm-password").value;
        if (password === checkPassword) {
            alert("You have been registered successfully!");
            message.textContent = "";
        } else {
            message.textContent = "Passwords do not match. Please try again.";
            message.style.color = "#ff336688";
        }
    } catch (error) {
        console.error("Error checking authentication:", error);
    }
}

function checkEmail(event) {
    event.preventDefault();
    try {
        let email = document.getElementById("email").value;
        let message = document.getElementById("message");
        if (email) {
            message.textContent = "A password reset link has been sent to your email.";
            message.style.color = "#ff336688";
            return;
        }
    } catch (error) {
        console.error("Error checking authentication:", error);
    }
}