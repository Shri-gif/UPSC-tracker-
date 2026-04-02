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

const entryForm = document.getElementById("entryForm");

entryForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = (await supabaseClient.auth.getUser()).data.user;

  const { error } = await supabaseClient
    .from('entries')
    .insert([
      {
        user_id: user.id,
        date: document.getElementById("entryDate").value,
        gsHours: document.getElementById("gsHours").value,
        csatHours: document.getElementById("csatHours").value,
        optionalHours: document.getElementById("optionalHours").value,
        currentAffairs: document.getElementById("currentAffairs").value,
        revisionHours: document.getElementById("revisionHours").value,
        mockHours: document.getElementById("mockHours").value,
      }
    ]);

  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("✅ Data saved!");
  }
});
