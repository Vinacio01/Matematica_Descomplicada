# Operação no PythonAnywhere

Este guia descreve o site ASGI já publicado em <https://cadini.pythonanywhere.com/>. Execute comandos de atualização ou recuperação somente após revisão manual. O banco público informado para a instalação atual é `/home/Cadini/dados-matematica/teste.db`; ele deve permanecer fora do checkout Git.

## Arquitetura e ambiente

- O FastAPI em `app/main.py` serve as rotas JSON e os arquivos HTML, CSS, JavaScript e SVG de `app/static/`. Não há processo de build do front-end.
- SQLAlchemy usa um arquivo SQLite para contas, sessões, questões, respostas, progresso e conquistas. O servidor ASGI é o Uvicorn.
- Use o ambiente virtual **Python 3.13** já configurado no PythonAnywhere. Confira o caminho real do ambiente e o comando do site com `pa website get --domain cadini.pythonanywhere.com`; não presuma o nome da pasta do ambiente. Instale dependências somente quando `requirements.txt` mudar.
- O ASGI do PythonAnywhere ainda é experimental. A [documentação oficial de ASGI](https://help.pythonanywhere.com/pages/ASGICommandLine) informa que não há mapeamento estático próprio para sites ASGI; os arquivos estáticos desta aplicação são servidos pelo FastAPI.

### Configuração

| Variável | Valor nesta hospedagem | Finalidade |
|---|---|---|
| `APP_DATABASE_PATH` | `/home/Cadini/dados-matematica/teste.db` | Caminho absoluto do banco persistente, fora do repositório. A pasta deve existir e permitir leitura e escrita ao processo do site. |
| `APP_PUBLIC_ORIGIN` | `https://cadini.pythonanywhere.com` | Origem pública exata usada na verificação de requisições autenticadas atrás do proxy HTTPS. Sem barra final. |
| `APP_COOKIE_SECURE` | `1` | Exige HTTPS para o cookie de sessão; também é ativado automaticamente quando `APP_PUBLIC_ORIGIN` começa com `https://`. |
| `APP_BACKUP_DIR` | Pasta privada fora do repositório | Usada somente pelo script manual de backup. |

Confirme que essas variáveis chegam ao processo ASGI, não apenas à sua sessão Bash. O comando do site e a forma de configurá-lo devem ser conferidos em `pa website get`. A [interface ASGI](https://help.pythonanywhere.com/pages/ASGICommandLine) pode mudar; não recrie o site apenas para alterar uma variável sem antes planejar a interrupção e fazer backup.

O banco não é versionado: `.gitignore` exclui `*.db`, e a pasta de dados deve continuar fora do checkout. Não copie bancos, backups, sessões ou informações de alunos para o GitHub. Proteja a pasta de dados e a pasta de backups contra acesso por outros usuários.

## Atualização manual pelo GitHub

1. Revise e aprove a mudança no GitHub; faça backup e baixe uma cópia antes de atualizar código que usa o banco.
2. Em um console Bash do PythonAnywhere, entre no checkout existente e confirme a branch e a ausência de alterações locais: `git status --short --branch`.
3. Quando a versão aprovada estiver em `main`, execute `git pull --ff-only origin main` **somente se o checkout estiver em `main`**. Se a instalação usar outra branch, confirme a estratégia antes de trocar a branch; não execute `git reset --hard`.
4. Se `requirements.txt` tiver mudado, ative o ambiente virtual Python 3.13 existente e execute `python -m pip install -r requirements.txt`. Não instale pacotes no Python global.
5. Confirme as variáveis do processo ASGI e recarregue manualmente: `pa website reload --domain cadini.pythonanywhere.com`. O [guia oficial](https://help.pythonanywhere.com/pages/ASGICommandLine) também documenta `pa website get --domain cadini.pythonanywhere.com` e a localização dos logs.
6. Verifique a página inicial e o fluxo com **uma conta fictícia de teste**, sem disparar muitas tentativas de login ou testes de carga no site público.

## Logs e verificação

Use `pa website get --domain cadini.pythonanywhere.com` para ver os caminhos atuais dos logs. Em geral, os arquivos de acesso, erros e servidor estão em `/var/log` e também podem ser consultados na aba **Files**. Consulte o log de erros após cada reload; a [documentação ASGI](https://help.pythonanywhere.com/pages/ASGICommandLine) explica os três tipos de log. Não registre nem compartilhe senhas, cookies ou dados de alunos.

Validação leve: confirme que `/` carrega, que as páginas internas exigem sessão, que uma conta fictícia consegue entrar e sair, que uma questão pode ser respondida e que o progresso é preservado. Execute a suíte automatizada **localmente**, com banco temporário: `python -m pytest app/tests -q -p no:cacheprovider`. Não aponte `APP_DATABASE_PATH` para o banco público durante os testes.

O login permite até quatro falhas para o mesmo nome; a quinta gera bloqueio por até 15 minutos e `Retry-After`. O estado é compartilhado pelo SQLite, inclusive para nomes inexistentes. Não usamos o IP informado por cabeçalhos HTTP como chave do bloqueio: atrás de proxy ele pode ser compartilhado ou forjado se a cadeia de confiança não estiver configurada. Isso reduz bloqueios acidentais de colegas. Um atacante que conhece um nome ainda pode provocar bloqueios temporários repetidos; acompanhe os logs. Para o cadastro público de alcance restrito, monitore volume de contas e disco e considere restrição adicional apenas se houver abuso observado.

## Backup manual do SQLite

O backup inicial será criado separadamente. Para os seguintes, use `scripts/backup_sqlite.py`: ele lê o arquivo de origem em modo somente leitura, usa `sqlite3.Connection.backup()`, cria um nome único com data/hora UTC e sufixo aleatório, verifica `PRAGMA integrity_check` e restringe o arquivo a `0600` em sistemas Unix. Não sobrescreve arquivos existentes. A pasta de destino deve existir e ter permissões restritas.

Em um console Bash, depois de entrar no checkout e ativar o ambiente Python 3.13 usado pelo site:

```bash
mkdir -p /home/Cadini/backups-matematica
chmod 700 /home/Cadini/backups-matematica
APP_DATABASE_PATH=/home/Cadini/dados-matematica/teste.db \
APP_BACKUP_DIR=/home/Cadini/backups-matematica \
python scripts/backup_sqlite.py
```

O script imprime o caminho do novo arquivo. Guarde esse caminho para a conferência e para o download. Na aba **Files** do PythonAnywhere, abra a pasta de backups e use **Download** no arquivo gerado. Guarde a cópia baixada em local privado e verifique o espaço livre antes de criar backups adicionais. O [guia oficial de arquivos](https://help.pythonanywhere.com/pages/UploadingAndDownloadingFiles) descreve o download pela aba Files. Não configure tarefa agendada: a disponibilidade de agendamentos depende da data e do tipo da conta gratuita, conforme as [regras atuais](https://help.pythonanywhere.com/pages/FreeAccountsFeatures).

### Testar restauração sem tocar no banco público

Defina `COPIA` com o caminho do backup que acabou de verificar. O procedimento abaixo cria outro arquivo em uma pasta temporária e consulta somente a integridade:

```bash
COPIA=/home/Cadini/backups-matematica/NOME_DO_BACKUP.db
PASTA_TESTE=$(mktemp -d)
cp -- "$COPIA" "$PASTA_TESTE/restaurado.db"
python -c 'import sqlite3,sys; db=sqlite3.connect(sys.argv[1]); print(db.execute("PRAGMA integrity_check").fetchone()[0]); db.close()' "$PASTA_TESTE/restaurado.db"
```

O resultado esperado é `ok`. Confira que o arquivo restaurado abre e contém as tabelas esperadas, sem imprimir dados de usuários. Para uma recuperação **real**, tire o site de serviço de forma planejada, preserve o banco atual, crie um novo arquivo a partir de uma cópia íntegra em uma pasta privada, aponte `APP_DATABASE_PATH` para esse novo arquivo e recarregue o ASGI. Não copie por cima de `teste.db` enquanto o site estiver ativo. A mudança do comando/configuração ASGI pode exigir procedimento específico do PythonAnywhere; consulte a documentação e valide antes de executá-la.

## Limites do plano gratuito

Segundo a [página oficial do plano gratuito](https://help.pythonanywhere.com/pages/FreeAccountsFeatures), há limites de CPU, espaço de 512 MiB, um aplicativo com um worker e prazo de expiração do site. Confira as condições atuais da conta. Mantenha backups baixados fora do servidor para não consumir toda a cota. O [PythonAnywhere disponibiliza SQLite](https://help.pythonanywhere.com/pages/KindsOfDatabases/), mas não o recomenda para cargas maiores; esta configuração é proporcional ao uso restrito do projeto. Não configure tarefas agendadas presumindo sua disponibilidade.
