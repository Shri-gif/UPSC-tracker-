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
        gs_hours: document.getElementById("gsHours").value,
        csat_hours: document.getElementById("csatHours").value,
        optional_hours: document.getElementById("optionalHours").value,
        current_affairs: document.getElementById("currentAffairs").value,
        revision_hours: document.getElementById("revisionHours").value,
        mock_hours: document.getElementById("mockHours").value,
        notes: document.getElementById("notes").value
      }
    ]);

  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("✅ Data saved!");
  }
});
