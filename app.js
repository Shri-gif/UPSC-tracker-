const authForm = document.getElementById("loginForm");

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  let { data, error } = await loginUser(email, password);

  if (error) {
    alert("Login failed");
  } else {
    alert("Login success");
  }
});
