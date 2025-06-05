function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const loginButton = event.target.querySelector('button[type="submit"]');
  loginButton.textContent = 'Entrando...';
  loginButton.disabled = true;

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha: password })
  })
  .then(response => {
    if (response.redirected) {
      // Se o backend fez redirect, vamos seguir
      window.location.href = response.url;
      return;
    }
    // Se não redirecionou, espera JSON (erro)
    return response.json().then(data => {
      loginButton.textContent = 'Entrar';
      loginButton.disabled = false;
      alert('Erro no login: ' + (data.message || 'Verifique suas credenciais'));
    });
  })
  .catch(error => {
    loginButton.textContent = 'Entrar';
    loginButton.disabled = false;
    console.error('Erro:', error);
    alert('Erro ao fazer login. Tente novamente.');
  });
}
