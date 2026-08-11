const regButton = document.querySelector(".btn-register");

regButton.addEventListener("click", (e) => {
  e.preventDefault();
  var name = document.getElementById("name").value;
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  if (name === "" || email === "" || password === "") {
    document.querySelector(".error-text").innerHTML =
      "<p>Name, email and password are all required!</p>";
  } else {
    axios
      .post("/api/register", { name, email, password })
      .then((response) => {
        sessionStorage.setItem('auth-token', response.data.token);
        sessionStorage.setItem('user-name', response.data.name || name);
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        document.querySelector(".error-text").innerHTML =
          `<p>${error.response?.data?.error || 'Registration failed'}</p>`;
      });
  }
});
