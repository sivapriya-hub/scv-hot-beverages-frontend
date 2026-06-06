document.addEventListener("DOMContentLoaded", function() {

    // WhatsApp Button Click Handler
    const whatsappButtons = document.querySelectorAll(".btn-whatsapp");

    if (whatsappButtons.length > 0) {
        whatsappButtons.forEach(function(button) {
            button.addEventListener("click", function(event) {
                event.preventDefault();
                window.open("https://wa.me/919444105422", "_blank");
            });
        });
    }

    // Mobile Navigation Menu Toggle
    const menuBtn = document.getElementById("menu-btn");
    const navMenu = document.getElementById("nav-menu");

    if (menuBtn && navMenu) {
        menuBtn.addEventListener("click", function() {
            const isOpen = navMenu.classList.toggle("open");
            menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
            menuBtn.innerHTML = isOpen ? "✕" : "☰";
        });
        
        // Close menu when clicking outside
        document.addEventListener("click", function(event) {
            if (!navMenu.contains(event.target) && !menuBtn.contains(event.target)) {
                navMenu.classList.remove("open");
                menuBtn.setAttribute("aria-expanded", "false");
                menuBtn.innerHTML = "☰";
            }
        });
    }

    // Inquiry Form Submission Handler
    const inquiryForm = document.getElementById("inquiry-form");

    if (inquiryForm) {
        inquiryForm.addEventListener("submit", async function(event) {
            event.preventDefault();

            const nameInput = document.getElementById("user-name");
            const companyNameInput = document.getElementById("company-name");
            const phoneInput = document.getElementById("phone-number");
            const emailInput = document.getElementById("email-address");
            const requirementsInput = document.getElementById("requirements");

            const nameValue = nameInput.value;
            const phoneValue = phoneInput.value;
            const emailValue = emailInput.value;

            clearValidationFeedback(inquiryForm);

            let isFormValid = true;

            if (nameValue.trim() === "") {
                showFieldError(nameInput, "Please enter your name.");
                isFormValid = false;
            }

            const phonePattern = /^[0-9]{10}$/;
            if (!phonePattern.test(phoneValue)) {
                showFieldError(
                    phoneInput,
                    "Please enter a valid 10-digit phone number (e.g., 9876543210)."
                );
                isFormValid = false;
            }

            if (emailValue.trim() !== "") {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(emailValue)) {
                    showFieldError(
                        emailInput,
                        "Please enter a valid email address (e.g., name@company.com)."
                    );
                    isFormValid = false;
                }
            }

            if (isFormValid) {
                const submitButton = inquiryForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.innerText = "Submitting...";
                }

                const inquiry = {
                    name: nameValue,
                    companyName: companyNameInput ? companyNameInput.value : "",
                    phone: phoneValue,
                    email: emailValue,
                    requirements: requirementsInput ? requirementsInput.value : "",
                    status: "NEW"
                };

                try {
                    const response = await fetch(
                        "http://localhost:8080/api/inquiries",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(inquiry)
                        }
                    );

                    if (response.ok) {
                        showSuccessMessage(inquiryForm);
                        inquiryForm.reset();
                    } else {
                        alert("Failed to submit inquiry. Please try again later.");
                    }
                } catch (error) {
                    console.error("API submission error:", error);
                    alert("Error connecting to server. Please check your internet connection.");
                } finally {
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.innerText = "Submit Inquiry";
                    }
                }
            }
        });
    }

    function showFieldError(inputElement, errorMessage) {
        inputElement.classList.add("error-input");
        const parentElement = inputElement.parentElement;
        const errorSpan = document.createElement("span");
        errorSpan.className = "error-message";
        errorSpan.innerText = errorMessage;
        parentElement.appendChild(errorSpan);
    }

    function showSuccessMessage(formElement) {
        const successDiv = document.createElement("div");
        successDiv.className = "success-alert";
        successDiv.innerHTML = `
            <h3>Inquiry Submitted Successfully!</h3>
            <p>Thank you for contacting SCV. We will get back to you shortly.</p>
        `;
        formElement.insertBefore(successDiv, formElement.firstChild);
    }

    function clearValidationFeedback(formElement) {
        const errorInputs = formElement.querySelectorAll(".error-input");
        errorInputs.forEach(function(input) {
            input.classList.remove("error-input");
        });

        const errorSpans = formElement.querySelectorAll(".error-message");
        errorSpans.forEach(function(span) {
            span.remove();
        });

        const successAlert = formElement.querySelector(".success-alert");
        if (successAlert) {
            successAlert.remove();
        }
    }

});
