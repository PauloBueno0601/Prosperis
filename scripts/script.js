document.addEventListener('DOMContentLoaded', function() {
    // --- Lógica para a troca de abas (Login/Cadastro) ---
    const tabTriggers = document.querySelectorAll('.tabs-trigger');
    const tabContents = document.querySelectorAll('.tabs-content');

    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            // Remove a classe 'active' de todos os botões de aba
            tabTriggers.forEach(t => t.classList.remove('active'));

            // Adiciona a classe 'hidden' a todos os contêineres de conteúdo das abas
            tabContents.forEach(c => c.classList.add('hidden'));

            // Ativa o botão de aba que foi clicado
            this.classList.add('active');

            // Obtém o ID do conteúdo da aba alvo a partir do atributo 'data-tab'
            const targetTabId = this.dataset.tab; // Ex: "login" ou "register"
            const targetContent = document.getElementById(targetTabId);

            // Torna o conteúdo da aba alvo visível
            if (targetContent) {
                targetContent.classList.remove('hidden');
                // Opcional: Adicionar classe de animação se desejar um efeito visual
                // targetContent.classList.add('animate-fade-in');
            }
        });
    });

    // --- Lógica para a submissão do formulário de Login ---
    document.getElementById('login-form').addEventListener('submit', async function (e) {
        e.preventDefault(); // Impede o recarregamento da página

        const email = document.getElementById('email').value;
        const senha = document.getElementById('password').value;
        const loginButton = e.target.querySelector('button[type="submit"]');
        const errorDiv = document.getElementById('login-error');

        // Atualiza o estado do botão e limpa mensagens de erro
        loginButton.textContent = 'Entrando...';
        loginButton.disabled = true;
        errorDiv.textContent = ''; // Limpa a mensagem de erro anterior

        try {
            const res = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            // Se o servidor redirecionar, seguir o redirecionamento
            if (res.redirected) {
                window.location.href = res.url;
                return;
            }

            // Se não houve redirecionamento, tenta ler a resposta JSON (provavelmente um erro)
            const data = await res.json();

            if (res.ok) { // res.ok é true para status 2xx (sucesso)
                window.location.href = '/dashboard'; // Sucesso: redireciona
            } else {
                // Erro: exibe a mensagem do backend ou uma genérica
                errorDiv.textContent = data.error || 'Erro ao fazer login. Verifique suas credenciais.';
            }
        } catch (err) {
            // Erro de rede ou outro erro na requisição
            console.error('Erro de conexão ou no fetch de login:', err);
            errorDiv.textContent = 'Erro de conexão. Tente novamente.';
        } finally {
            // Garante que o botão volte ao normal, independentemente do resultado
            loginButton.textContent = 'Entrar';
            loginButton.disabled = false;
        }
    });

    // --- Lógica para a submissão do formulário de Cadastro ---
    document.getElementById('register-form').addEventListener('submit', async function (e) {
        e.preventDefault(); // Impede o recarregamento da página

        const nome = document.getElementById('nome').value;
        const email = document.getElementById('register-email').value;
        const senha = document.getElementById('register-password').value;
        const confirmSenha = document.getElementById('confirm-password').value;
        const registerButton = e.target.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('register-message');

        // Atualiza o estado do botão e limpa mensagens
        registerButton.textContent = 'Criando conta...';
        registerButton.disabled = true;
        messageDiv.textContent = '';
        messageDiv.classList.remove('text-red-500', 'text-green-500'); // Limpa classes de cor anteriores

        if (senha !== confirmSenha) {
            messageDiv.textContent = 'As senhas não coincidem.';
            messageDiv.classList.add('text-red-500');
            registerButton.textContent = 'Criar conta';
            registerButton.disabled = false;
            return; // Interrompe a função se as senhas não coincidirem
        }

        try {
            const res = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha })
            });

            const data = await res.json();

            if (res.ok) { // res.ok é true para status 2xx
                messageDiv.textContent = 'Conta criada com sucesso! Faça login.';
                messageDiv.classList.add('text-green-500');
                // Opcional: Redirecionar para a aba de login após o cadastro
                // document.querySelector('.tabs-trigger[data-tab="login"]').click();
            } else {
                // Erro: exibe a mensagem do backend ou uma genérica
                messageDiv.textContent = data.error || 'Erro ao criar conta. Tente novamente.';
                messageDiv.classList.add('text-red-500');
            }
        } catch (err) {
            // Erro de rede ou outro erro na requisição
            console.error('Erro de conexão ou no fetch de cadastro:', err);
            messageDiv.textContent = 'Erro de conexão. Tente novamente.';
            messageDiv.classList.add('text-red-500');
        } finally {
            // Garante que o botão volte ao normal, independentemente do resultado
            registerButton.textContent = 'Criar conta';
            registerButton.disabled = false;
        }
    });
});