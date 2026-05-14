# Discord Invite & Rescue Bot

Este é um bot de Discord completo desenvolvido em JavaScript utilizando `discord.js v14`, com persistência de dados no Firebase Firestore. Ele oferece um sistema robusto de contagem de invites, resgate de produtos por invites, gerenciamento de estoque, atribuição de cargos e um painel de configuração interativo.

## Funcionalidades

- **Sistema de Invites:** Contagem precisa de invites por usuário, detecção de convidador, e ajuste de saldo ao sair do servidor.
- **Regra Antifraude:** Prevenção de abuso com bloqueio de contas novas e bloqueio manual de usuários.
- **Produtos Resgatáveis:** Definição de produtos com nome, ID, preço em invites, cargo associado e estoque individual. Resgate de keys via DM.
- **Tema Visual:** Embeds, botões e mensagens com tema vermelho consistente.
- **Painel de Configuração:** Comando `$setup` para administradores configurarem o menu público de resgate via embeds e botões.
- **Comandos Administrativos:** Diversos comandos para gerenciar invites, estoques, usuários e mensagens.
- **Persistência de Dados:** Todos os dados são salvos no Firebase Firestore, garantindo a sobrevivência a reinícios.
- **Segurança:** Configuração via variáveis de ambiente para tokens e credenciais.

## Stack Tecnológica

- Node.js 18+
- discord.js v14
- firebase-admin
- Firestore
- dotenv

## Instalação

Para configurar e rodar o bot, siga os passos abaixo:

1.  **Clone o Repositório:**
    ```bash
    git clone https://github.com/seu-usuario/discord-invite-bot.git
    cd discord-invite-bot
    ```

2.  **Instale as Dependências:**
    ```bash
    npm install
    ```

3.  **Configuração do Firebase:**
    - Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
    - Vá em `Project settings` > `Service accounts`.
    - Clique em `Generate new private key` e baixe o arquivo JSON.
    - Abra o arquivo JSON e copie todo o conteúdo.

4.  **Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

    ```env
    DISCORD_TOKEN=SEU_TOKEN_DO_BOT
    FIREBASE_SERVICE_ACCOUNT=\'{"type": "service_account", ...}\' # Cole o JSON do Firebase aqui, como uma string única
    ADMIN_IDS=ID_DO_ADMIN1,ID_DO_ADMIN2 # IDs dos usuários administradores, separados por vírgula
    RESGATE_ROLE_ID=ID_DO_CARGO_DE_RESGATE # Opcional: ID de um cargo específico para resgates
    LOG_CHANNEL_ID=ID_DO_CANAL_DE_LOGS # Opcional: ID de um canal para logs
    ```
    **Importante:** Certifique-se de que o valor de `FIREBASE_SERVICE_ACCOUNT` seja uma string JSON válida. Você pode usar um formatador JSON online para garantir que não há erros de sintaxe.

5.  **Permissões do Bot e Intents:**
    - No [Portal do Desenvolvedor Discord](https://discord.com/developers/applications), vá para a aplicação do seu bot.
    - Em `Bot` > `Privileged Gateway Intents`, ative:
        - `PRESENCE INTENT`
        - `SERVER MEMBERS INTENT`
        - `MESSAGE CONTENT INTENT`
    - Em `OAuth2` > `URL Generator`, selecione `bot` e as seguintes permissões:
        - `Manage Roles`
        - `Kick Members` (para o sistema antifraude, se necessário)
        - `Send Messages`
        - `Read Message History`
        - `Manage Channels` (para enviar o painel de setup)
        - `View Channels`
        - `Use External Emojis`
        - `Add Reactions`
    - Copie o URL gerado e adicione o bot ao seu servidor.

6.  **Hierarquia de Cargos no Discord:**
    Certifique-se de que o cargo do seu bot no servidor esteja **acima** de todos os cargos que ele precisa gerenciar (adicionar/remover). Caso contrário, o bot não terá permissão para modificar esses cargos.

## Execução

Para iniciar o bot, execute:

```bash
npm start
```

## Deploy (Hospedagem)

### Railway / Render / Outras Plataformas Node.js

Estas plataformas geralmente detectam automaticamente o `package.json` e o script `start`. Você precisará configurar as variáveis de ambiente (`DISCORD_TOKEN`, `FIREBASE_SERVICE_ACCOUNT`, etc.) diretamente na interface da plataforma. O `FIREBASE_SERVICE_ACCOUNT` deve ser inserido como uma string JSON válida.

### Discloud

Para Discloud, siga as instruções específicas da plataforma para fazer o upload de um projeto Node.js. As variáveis de ambiente também serão configuradas no painel da Discloud.

## Comandos

### Comandos de Usuário

-   `$cmds`: Lista todos os comandos disponíveis.
-   `$ping`: Mostra a latência do bot, uso de RAM e uptime.
-   `$infos @user`: Exibe informações detalhadas sobre os invites, resgates e status de bloqueio de um usuário.

### Comandos de Administrador (requer `ADMIN_IDS` configurado)

-   `$estocar {quantia} {produto} {keys...}`: Adiciona chaves ao estoque de um produto. Ex: `$estocar 5 key1dia key1 key2 key3 key4 key4 key5`
-   `$zerar`: Zera o estoque de todos os produtos e envia as chaves removidas para o DM do administrador.
-   `$cargoadd {idCargo} @user`: Adiciona um cargo específico a um usuário.
-   `$presentear {produto} @user`: Presenteia um usuário com uma chave de um produto e aplica o cargo associado.
-   `$blockuser @user`: Bloqueia um usuário de resgatar produtos.
-   `$unblockuser @user`: Desbloqueia um usuário.
-   `$msg @user {mensagem}`: Envia uma mensagem direta para um usuário.
-   `$setup`: Abre o painel de configuração interativo para o menu público de resgate.

## Painel de Configuração (`$setup`)

O comando `$setup` abre um painel interativo para administradores configurarem o menu público de resgate. Através de botões e modais, é possível:

-   Mudar o título e a descrição do embed público.
-   Adicionar um banner ao embed.
-   Adicionar, remover e modificar produtos (nome, ID, preço, cargo).
-   Enviar o menu público de resgate em um canal específico.

## Fluxo de Resgate

1.  O usuário interage com o menu `select` no painel público de resgate.
2.  O bot verifica:
    -   Se o usuário está bloqueado.
    -   Se o usuário está em cooldown (12 horas entre resgates).
    -   Se o usuário possui invites suficientes.
    -   Se o produto tem estoque disponível.
3.  Se todas as condições forem atendidas:
    -   O custo em invites é removido do usuário.
    -   Uma chave é consumida do estoque do produto.
    -   A chave é enviada via DM ao usuário.
    -   O cargo associado ao produto é aplicado ao usuário.
    -   Um aviso sobre a falta de suporte para keys por invite é enviado.
    -   O resgate é registrado no Firebase.
4.  Em caso de falha (falta de invites, estoque, bloqueio, cooldown), uma mensagem ephemeral é enviada ao usuário com a razão.

## Observações Importantes

-   **Robustez:** O bot foi projetado para ser robusto e lidar com erros de forma graciosa, sem crashar. Logs de erro são gerados para facilitar a depuração.
-   **Mensagens:** Todas as mensagens do bot são gentis, educadas e claras, evitando jargões ou termos agressivos.
-   **Escalabilidade:** O sistema de invites e persistência no Firebase foi pensado para suportar servidores grandes, como o exemplo de 14.600 membros.
-   **Organização do Código:** O código é modularizado em arquivos separados (`commands/`, `events/`, `utils/`) para facilitar a manutenção e leitura.

---

Desenvolvido por Manus AI
