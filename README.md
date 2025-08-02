# 📊 suap-cli

Um CLI (interface de linha de comando) para acessar e salvar seus dados de boletim do SUAP diretamente pelo terminal.

## ✨ Funcionalidades

- Login com matrícula e senha do SUAP
- Verificação segura da senha (com hash bcrypt)
- Exportação do boletim como `boletim.json`

---

## 🚀 Instalação

Clone o repositório:
```bash
git clone https://github.com/LucasPaulo001/suap-cli.git
```

Na raiz do projeto rode o comando para baixar as dependências:
```bash
npm install
```

Após baixar as dependências inicie o projeto:
```bash
node src/app.mjs
```
---
## 🔒 Segurança e Privacidade

Este projeto foi desenvolvido com foco em segurança. Aqui estão alguns pontos importantes para sua tranquilidade:
- Sem envio de dados para servidores externos
> Todos os dados inseridos (usuário e senha) são usados apenas localmente para autenticação no site do SUAP via navegador automatizado (Puppeteer).
- Nada é enviado para servidores de terceiros.
> Senha protegida com criptografia forte (bcrypt)
A primeira vez que você rodar o projeto, a senha digitada será criptografada com bcrypt e salva localmente (em pass_backup/senha-segura.hash).
Nas execuções seguintes, ela será comparada com segurança e sem reenvio para o SUAP até que seja validada.
- Não é salvo boletins automaticamente em nuvem ou repositórios
> O arquivo boletim.json é gerado apenas localmente.

