# 🎮 Matemática Descomplicada

### Aprender matemática pode ser uma grande aventura! 🚀

O **Matemática Descomplicada** é uma plataforma web educacional desenvolvida para tornar o aprendizado de matemática mais divertido, interativo e acessível para crianças.

O projeto foi desenvolvido como parte de uma atividade acadêmica extensionista, combinando conceitos de desenvolvimento web, integração de APIs, banco de dados, autenticação e gamificação.

A plataforma permite que os alunos pratiquem operações matemáticas, acompanhem seu desempenho e desbloqueiem conquistas conforme evoluem.

## ✨ Funcionalidades

### 🔐 Cadastro e autenticação

- Cadastro de usuários com validação de dados.
- Login e logout integrados ao FastAPI.
- Armazenamento seguro de senhas com bcrypt.
- Autenticação baseada em sessões e cookies HttpOnly.
- Proteção de páginas internas.
- Controle de expiração das sessões.
- Proteção CSRF nas operações autenticadas.
- Limite temporário de tentativas de login, registrado no SQLite.

Cada aluno possui sua própria conta, com progresso e conquistas individuais.

### 🧮 Exercícios matemáticos

A plataforma trabalha com quatro operações:

- Adição (+)
- Subtração (−)
- Multiplicação (×)
- Divisão (÷)

As questões são geradas pelo back-end e as respostas são verificadas pelo servidor.

Existem dois formatos de resposta:

**Resposta digitada:** o aluno escreve o resultado da operação.

**Múltipla escolha:** o aluno seleciona uma das quatro alternativas disponíveis.

### 🎮 Modos de jogo

**Modo Aventura**

- Partidas com 10 desafios matemáticos.
- Barra de progresso durante a partida.
- Feedback imediato para respostas corretas e incorretas.
- Resultado final com total de acertos, erros e estrelas.
- Mensagens motivacionais conforme o desempenho.

Classificação das estrelas:

| Acertos | Recompensa |
|---|---|
| 0 a 4 | ⭐ |
| 5 a 8 | ⭐⭐ |
| 9 a 10 | ⭐⭐⭐ |

**Treino Livre**

- Exercícios sem limite de questões.
- Prática contínua das operações matemáticas.
- Feedback imediato.
- Registro dos resultados no progresso individual.

### ⌨️ Jogabilidade por teclado

Para tornar a experiência mais rápida e acessível, o jogo também permite utilizar o teclado.

- Teclas **1, 2, 3 e 4** para selecionar alternativas.
- Identificação numérica nos cartões de múltipla escolha.
- Foco automático no campo das questões digitadas.
- **Enter** para confirmar respostas e avançar.
- Instruções de utilização no início da partida.

Os controles por mouse continuam disponíveis.

### 📊 Minha Evolução

A página de progresso apresenta dados reais registrados no banco:

- **Acertos:** quantidade total de respostas corretas.
- **Erros:** quantidade total de respostas incorretas.
- **Sequência atual:** número de acertos consecutivos desde o último erro.
- **Recorde:** maior sequência de acertos consecutivos alcançada.

Também são apresentados o total de questões respondidas e o percentual de acertos.

Os dados pertencem individualmente a cada aluno e permanecem registrados após o encerramento da sessão.

### 🏆 Sala de Conquistas

A plataforma possui quatro recompensas desbloqueadas por sequências de acertos:

| Conquista | Requisito |
|---|---|
| 🥉 Bronze | 5 acertos consecutivos |
| 🥈 Prata | 10 acertos consecutivos |
| 🥇 Ouro | 20 acertos consecutivos |
| 🏆 Troféu | 50 acertos consecutivos |

As conquistas são permanentes: mesmo que o aluno erre uma questão e sua sequência atual seja reiniciada, as medalhas anteriormente desbloqueadas continuam disponíveis.

A Sala de Conquistas apresenta:

- Medalhas conquistadas e bloqueadas.
- Próxima meta do aluno.
- Progresso de desbloqueio.
- Interações com os cartões das medalhas.
- Mensagens motivacionais.

**Notificações comemorativas**

Ao desbloquear uma conquista, o aluno recebe uma notificação especial durante o jogo, com a medalha correspondente e uma mensagem de comemoração.

O sistema também consegue recuperar uma confirmação de conquista após determinadas falhas de conexão, evitando duplicação de pontos.

## 🛠️ Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Front-end | HTML5, CSS3 e JavaScript |
| Back-end | Python e FastAPI |
| Banco de dados | SQLite |
| ORM | SQLAlchemy |
| Autenticação | bcrypt, sessões e cookies HttpOnly |
| Testes | pytest |
| Servidor de desenvolvimento | Uvicorn |
| Versionamento | Git e GitHub |

A plataforma utiliza JavaScript nativo no front-end, sem depender de frameworks como React ou Vue.

## 🏗️ Estrutura do projeto

```text
Matematica_Descomplicada/
│
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── seguranca.py
│   ├── dependencias.py
│   ├── jogo.py
│   ├── conquistas.py
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   └── jogo.py
│   │
│   ├── static/
│   │   ├── assets/
│   │   ├── index.html
│   │   ├── access.html
│   │   ├── dashboard.html
│   │   ├── game-modes.html
│   │   ├── exercises.html
│   │   ├── game-result.html
│   │   ├── progress.html
│   │   ├── achievements.html
│   │   └── arquivos CSS e JavaScript
│   │
│   └── tests/
│       ├── test_jogo.py
│       ├── test_frontend_auth.py
│       └── test_backup_sqlite.py
│
├── requirements.txt
├── scripts/backup_sqlite.py
├── IMPLANTACAO.md
├── .gitignore
└── README.md
```

## 🚀 Como executar o projeto

### Pré-requisitos

- Python compatível com as dependências do projeto.
- Git.
- Navegador atualizado.
- Acesso ao terminal.

O desenvolvimento local foi realizado com Python 3.14.

### 1. Clonar o repositório

```bash
git clone https://github.com/Vinacio01/Matematica_Descomplicada.git
cd Matematica_Descomplicada
```

### 2. Criar o ambiente virtual

No Windows:

```powershell
python -m venv .venv
```

Ativar o ambiente:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Instalar as dependências

```powershell
python -m pip install -r requirements.txt
```

### 4. Inicializar a aplicação

Na raiz do projeto:

```powershell
python -m uvicorn app.main:app --reload
```

### 5. Acessar a plataforma

Abra o navegador:

**http://127.0.0.1:8000/**

A partir da página inicial, é possível criar uma conta e começar a jogar.

A documentação interativa das APIs pode ser acessada em:

**http://127.0.0.1:8000/docs**

> Importante: o front-end deve ser acessado pelo servidor FastAPI, e não pela abertura direta dos arquivos HTML com `file:///`.

## 🔗 Principais endpoints

### Autenticação

| Método | Endpoint | Funcionalidade |
|---|---|---|
| POST | `/api/cadastro` | Cadastrar usuário |
| POST | `/api/login` | Autenticar usuário |
| GET | `/api/eu` | Consultar usuário autenticado |
| POST | `/api/logout` | Encerrar sessão |
| GET | `/api/csrf` | Obter token de proteção CSRF |

### Jogo e progresso

| Método | Endpoint | Funcionalidade |
|---|---|---|
| GET | `/api/questao` | Consultar questão pendente |
| POST | `/api/questao` | Criar ou recuperar questão |
| POST | `/api/responder` | Corrigir resposta |
| GET | `/api/progresso` | Consultar estatísticas |
| GET | `/api/conquistas` | Consultar conquistas desbloqueadas |

As operações protegidas exigem autenticação. Requisições que modificam dados utilizam a proteção CSRF implementada no projeto.

## 🗄️ Banco de dados

O projeto utiliza SQLite e SQLAlchemy para armazenar:

- Usuários cadastrados.
- Sessões autenticadas.
- Questões geradas.
- Respostas registradas.
- Estatísticas de progresso.
- Conquistas desbloqueadas.
- Informações necessárias à recuperação segura de respostas e conquistas.

O banco é criado automaticamente conforme a configuração da aplicação.

Os arquivos locais de banco de dados e os backups não devem ser enviados ao GitHub. Na hospedagem, o banco fica fora do repositório; veja [o guia de implantação](./IMPLANTACAO.md).

## 🧪 Testes

O projeto possui testes automatizados para verificar os principais fluxos da aplicação:

- Cadastro e autenticação.
- Geração e correção de questões.
- Prevenção de respostas duplicadas.
- Isolamento entre usuários.
- Persistência do progresso.
- Desbloqueio das conquistas.
- Recuperação após falhas de comunicação.
- Bloqueio temporário do login e recuperação do acesso.
- Backup e restauração em bancos fictícios.

Para executar:

```powershell
python -m pytest app/tests -q
```

Caso exista um problema local relacionado ao cache do pytest:

```powershell
python -m pytest app/tests -q -p no:cacheprovider
```

Os testes criam bancos temporários e contas fictícias; nunca aponte `APP_DATABASE_PATH` para o banco público ao executá-los. O número de testes aprovados deve ser conferido na execução mais recente da suíte.

## 🎨 Interface e experiência do usuário

A identidade visual do Matemática Descomplicada foi criada especialmente para o público infantil.

Entre os elementos utilizados estão:

- Mascotes ilustrados.
- Cores vibrantes.
- Botões grandes e arredondados.
- Tipografia de fácil leitura.
- Feedback visual e mensagens positivas.
- Medalhas e recompensas ilustradas.
- Layout responsivo para computadores e dispositivos móveis.

O objetivo é oferecer uma experiência acolhedora, intuitiva e motivadora, valorizando o aprendizado por meio da prática.

## 🔒 Segurança e privacidade

A aplicação utiliza mecanismos como hashes de senha, cookies HttpOnly, sessões autenticadas, proteção CSRF e validação de acesso aos dados individuais dos usuários.

Como a plataforma é destinada a crianças, a privacidade e a proteção das informações dos alunos são prioridades.

Após cinco senhas incorretas para o mesmo nome em 15 minutos, o login responde com bloqueio temporário. Nomes inexistentes seguem a mesma regra e recebem mensagens equivalentes. O controle persiste no SQLite e expira automaticamente. Um ataque direcionado ainda pode causar bloqueios temporários repetidos; acompanhe os logs sem registrar senhas ou cookies. Para o cadastro público, mantenha o compartilhamento limitado e monitore crescimento de contas e uso de disco antes de introduzir medidas adicionais.

## 🌐 Hospedagem e disponibilidade

A aplicação está publicada em [cadini.pythonanywhere.com](https://cadini.pythonanywhere.com/) no plano gratuito do PythonAnywhere, com FastAPI/ASGI e SQLite. O procedimento de atualização, configuração, logs, backup e restauração está no [guia de implantação](./IMPLANTACAO.md).

**Status atual:** plataforma em uso restrito por colegas; alterações locais deste ciclo ainda exigem revisão e publicação manual.

## 📌 Próximos passos

- Revisar e executar a suíte após cada alteração.
- Criar e baixar backups manuais regularmente; testar restauração em banco separado.
- Acompanhar logs, espaço em disco e disponibilidade do plano gratuito.
- Publicar alterações futuras manualmente após revisão e backup.

## 🎓 Sobre o projeto

O Matemática Descomplicada é um projeto acadêmico extensionista desenvolvido com foco na aplicação prática dos conhecimentos de Análise e Desenvolvimento de Sistemas.

O trabalho reúne desenvolvimento front-end e back-end, integração de APIs, banco de dados, testes, segurança, experiência do usuário e colaboração por Git e GitHub.

Mais do que um exercício de programação, a proposta é construir uma ferramenta educacional que incentive crianças a praticarem matemática de maneira leve e divertida.

---

**Matemática Descomplicada — Aprender, jogar e conquistar! 🧮🏆**
