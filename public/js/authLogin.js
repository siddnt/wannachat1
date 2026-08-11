const loginButton = document.querySelector(".btn-login");

loginButton.addEventListener("click", (e) => {
  e.preventDefault();
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  if (email === "" || password === "") {
    document.querySelector(".error-text").innerHTML =
      "<p>Both email and password are required!</p>";
  } else {
    axios
      .post("/api/login", { email, password })
      .then((response) => {
        sessionStorage.setItem('auth-token', response.data.token);
        sessionStorage.setItem('user-name', response.data.name || email);
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        document.querySelector(".error-text").innerHTML =
          `<p>${error.response?.data?.error || 'Login failed'}</p>`;
      });
  }
});
