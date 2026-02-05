# Interactive Display para Igrejas

Este projeto consiste em uma aplicação "Interactive Display" desenvolvida para uso em igrejas, permitindo a exibição dinâmica de conteúdos como letras de músicas, versículos bíblicos e outros avisos relevantes durante os cultos ou eventos. A aplicação é conteinerizada utilizando Docker, facilitando o deploy e a gestão em diferentes ambientes.

## Sumário

- [Interactive Display para Igrejas](#interactive-display-para-igrejas)
  - [Sumário](#sumário)
  - [Visão Geral do Projeto](#visão-geral-do-projeto)
  - [Requisitos do Sistema](#requisitos-do-sistema)
  - [Estrutura do Projeto](#estrutura-do-projeto)
  - [Configuração do Ambiente](#configuração-do-ambiente)
    - [Variáveis de Ambiente](#variáveis-de-ambiente)
    - [Seed do Banco de Dados](#seed-do-banco-de-dados)
    - [Persistência de Dados e Backup](#persistência-de-dados-e-backup)
  - [Deploy com Docker Desktop](#deploy-com-docker-desktop)
    - [Pré-requisitos](#pré-requisitos)
    - [Passos para o Deploy](#passos-para-o-deploy)
    - [Acessando a Aplicação](#acessando-a-aplicação)
  - [Gerenciamento da Aplicação](#gerenciamento-da-aplicação)
    - [Iniciando a Aplicação](#iniciando-a-aplicação)
    - [Parando a Aplicação](#parando-a-aplicação)
    - [Reiniciando a Aplicação](#reiniciando-a-aplicação)
    - [Atualizando a Aplicação](#atualizando-a-aplicação)
  - [Solução de Problemas Comuns](#solução-de-problemas-comuns)
  - [Desenvolvimento (Build Manual)](#desenvolvimento-build-manual)
    - [Build do Backend](#build-do-backend)
      - [Pré-requisitos](#pré-requisitos-1)
      - [Passos para o Build da aplicação](#passos-para-o-build-da-aplicação)
      - [Passos para o build da imagem docker](#passos-para-o-build-da-imagem-docker)
    - [Build do Frontend](#build-do-frontend)
      - [Pré-requisitos](#pré-requisitos-2)
      - [Passos para o build do frontend](#passos-para-o-build-do-frontend)

## Visão Geral do Projeto

O "Interactive Display" é uma solução que visa modernizar a apresentação de informações em ambientes religiosos. Ele integra um backend robusto (Node.js/Express) para gerenciamento de dados e uma interface de usuário interativa (React) para exibição. A comunicação entre os serviços é otimizada para garantir fluidez e responsividade.

## Requisitos do Sistema

Para rodar esta aplicação, você precisará de:

- **Sistema Operacional:** Windows 10/11, macOS ou Linux (com suporte a Docker Desktop).
- **Docker Desktop:** Versão 4.x ou superior instalada e configurada.
- **Recursos de Hardware:** Mínimo de 4GB de RAM e 2 Cores de CPU dedicados ao Docker Desktop para um bom desempenho.

## Estrutura do Projeto

A estrutura de pastas principal é a seguinte:

- `apps/backend`: Contém o código-fonte da aplicação backend (API).
- `apps/frontend`: Contém o código-fonte da aplicação frontend (interface do usuário).
- `docker-compose.yml`: Arquivo principal para orquestração dos serviços Docker.

## Configuração do Ambiente

### Variáveis de Ambiente

Ambos os serviços, `backend` e `frontend`, utilizam arquivos de variáveis de ambiente. Você encontrará templates nos seguintes locais:

- `.env.template`
- `apps/backend/.env.template`
- `apps/frontend/.env.template`

Para configurar o ambiente, copie esses arquivos e renomeie-os para `.env` (sem o `.template`) em suas respectivas pastas.

Exemplo para a raíz do projeto

```bash
cp .env.template .env
```

Edite o arquivo `.env` com a tag do backend que deseja instalar.

Exemplo para o backend:

```bash
cp apps/backend/.env.template apps/backend/.env
```

Edite o arquivo `apps/backend/.env` com as configurações necessárias. As variáveis mais comuns incluem configurações de porta, conexão com banco de dados e chaves de API.

Exemplo para o frontend:

```bash
cp apps/frontend/.env.template apps/frontend/.env
```

Edite o arquivo `apps/frontend/.env` com as configurações necessárias. As variáveis mais comuns incluem a URL da API do backend.

### Seed do Banco de Dados

O backend utiliza um banco de dados Drizzle ORM. É crucial popular o banco de dados com dados iniciais (seed) para o funcionamento correto da aplicação. Para isso, o projeto oferece um endpoint específico.

Após o deploy da aplicação e com todos os serviços rodando, você pode "seedar" o banco de dados acessando o seguinte endpoint da API:

`POST /api/seed`

Você pode usar ferramentas como cURL, Postman ou até mesmo o vscode com a extensão REST Client para chamar esse endpoint.

Exemplo usando cURL (substitua `localhost:5000` pela URL/IP do seu backend, se for diferente):

```bash
curl -X POST http://localhost:5000/api/seed
```

Este comando irá popular o banco de dados com os dados iniciais configurados no projeto.

### Persistência de Dados e Backup

O backend utiliza um banco de dados SQLite, que é armazenado em um arquivo local diretamente na pasta `app/data/[nome-do-banco].db`. Este arquivo é persistente e é gerenciado pelo Docker.

O nome do arquivo do banco de dados é configurado pela variável de ambiente `DATABASE_URL` no arquivo `apps/backend/.env`. o caminho do banco de dados deve seguir o padrão `app/data/[nome-do-banco].db` para garantir persistência.

**Backup:**
Para fazer um backup do seu banco de dados, basta copiar o arquivo do banco de dados da pasta `app/data/[nome-do-banco].db` para um local seguro.

**Restauração:**
Para restaurar um backup, você deve substituir o arquivo do banco de dados existente na pasta `app/data` pelo seu arquivo de backup.

1.  **Pare o serviço do backend:** É crucial que o contêiner do backend não esteja acessando o banco de dados durante a restauração para evitar corrupção de dados.

    ```bash
    docker compose stop backend
    ```

2.  **Substitua o arquivo do banco de dados:** Copie o seu arquivo de backup para a pasta `app/data`, garantindo que ele tenha o mesmo nome do arquivo original (ex: `app.db`) ou que a variável `DATABASE_URL` seja atualizada com o novo nome.

3.  **Inicie o serviço do backend:**

    ```bash
    docker compose start backend
    ```

Certifique-se de que o nome do arquivo de backup corresponda ao valor configurado na variável de ambiente `DATABASE_URL` do seu backend (ex: `app.db`).

## Deploy com Docker Desktop

### Pré-requisitos

1.  **Docker Desktop instalado:** Certifique-se de que o Docker Desktop esteja em execução na sua máquina.
2.  **Arquivos .env configurados:** Conforme descrito na seção [Variáveis de Ambiente](#variáveis-de-ambiente), crie e configure os arquivos `.env` para ambos os serviços (`backend` e `frontend`).

### Passos para o Deploy

1.  **Navegue até o diretório raiz do projeto**   

2.  **Construa e inicie os serviços Docker:**
    Execute o seguinte comando no terminal. Ele construirá as imagens Docker para o backend e frontend (se ainda não existirem) e iniciará os contêineres definidos no `docker-compose.yml`.

    ```bash
    docker compose up --build -d
    ```

    - `--build`: Garante que as imagens sejam construídas (ou reconstruídas) a partir dos Dockerfiles.
    - `-d`: Inicia os contêineres em modo "detached" (em segundo plano), liberando o terminal.

3.  **Verifique o status dos contêineres:**
    Para garantir que todos os serviços estão rodando corretamente, você pode usar:

    ```bash
    docker ps
    ```

    Você deverá ver os serviços `backend` e `frontend` listados com o status `running`.

4.  **Popule o banco de dados (Seed):**
    Uma vez que os serviços estejam rodando, execute o comando para popular o banco de dados, como descrito na seção [Seed do Banco de Dados](#seed-do-banco-de-dados).

### Acessando a Aplicação

Após o deploy e o seed do banco de dados, a aplicação frontend estará acessível através do seu navegador web.

- **Frontend:** Abra seu navegador e navegue para `http://localhost:8090` (ou a porta que você configurou no `docker-compose.yaml`, se alterada).

## Gerenciamento da Aplicação

### Iniciando a Aplicação

Se a aplicação estiver parada, você pode iniciá-la novamente usando:

```bash
docker compose start
```

### Parando a Aplicação

Para parar todos os serviços sem remover os contêineres e seus volumes:

```bash
docker compose stop
```

Para parar e remover os contêineres, redes e volumes (cuidado, isso removerá seus dados se não houver persistência de volume configurada):

```bash
docker compose down
```

### Reiniciando a Aplicação

Para reiniciar todos os serviços:

```bash
docker compose restart
```

### Atualizando a Aplicação

Se houver novas versões do código-fonte ou alterações nos Dockerfiles:

1.  **Pare a aplicação atual:**

    ```bash
    docker compose stop
    ```

2.  **Puxe as últimas alterações do código (se estiver usando Git):**

    ```bash
    git pull origin main # ou sua branch principal
    ```

3.  **Reconstrua e inicie os serviços:**

    ```bash
    docker compose up --build -d
    ```

## Solução de Problemas Comuns

-   **Contêineres não iniciam:** Verifique os logs dos contêineres para identificar erros.
    ```bash
    docker compose logs [nome_do_serviço]
    ```
    (Ex: `docker compose logs backend`)
-   **A aplicação não carrega no navegador:**
    -   Certifique-se de que os contêineres `backend` e `frontend` estão rodando (`docker compose ps`).
    -   Verifique as portas configuradas e se não há conflitos com outras aplicações na sua máquina.
    -   Confira o console do navegador por erros (F12).
-   **Problemas com as variáveis de ambiente:** Verifique se os arquivos `.env` estão corretos e nas pastas esperadas. Lembre-se de reconstruir os contêineres se você alterou as variáveis de ambiente após o build inicial (`docker compose up --build -d`).
-   **Problemas de conectividade entre serviços:** Verifique as redes definidas no `docker-compose.yml` e se os nomes dos serviços estão sendo resolvidos corretamente (geralmente `backend` e `frontend` são os nomes dos serviços).

## Desenvolvimento (Build Manual)
### Build do Backend

#### Pré-requisitos
- Aplicação
  - Ter o node em uma versão lts instalado (`20 ou superior`)
  - Ter o yarn instalado globalmente (`npm install -g yarn`)
- Docker
  - Ter o docker instalado (`Docker Desktop` ou apenas o `Docker Engine`)
  - estar autenticado no DockerHub (Em caso de push de imagem)

#### Passos para o Build da aplicação

No diretório raíz da aplicação execute o comando
```bash
yarn build:back
```
Após a conclusão os arquivos de build estarão no caminho ./apps/backend/dist

#### Passos para o build da imagem docker

Para construir a imagem Docker do backend manualmente execute o comando
```bash
docker build -f ./apps/backend/Dockerfile . -t tiagoluizpoli/church-backend:latest -t tiagoluizpoli/church-backend:[tag]
``` 

Após o build da imagem, execute os comandos a seguir para realizar o push da imagem
```bash
docker push tiagoluizpoli/church-backend:latest && docker push tiagoluizpoli/church-backend:[tag]
```

> <b>Importante</b>
> - Substitua `[tag]` pela tag a ser utilizada
> - A tag deve ser composta pelo padrão [Semantic Versioning (SemVer)](https://semver.org/)


### Build do Frontend

#### Pré-requisitos
- Ter o node em uma versão lts instalado (`20 ou superior`)
- Ter o yarn instalado globalmente (`npm install -g yarn`)

#### Passos para o build do frontend

Para realizar o build do frontend primeiro execute o comando abaixo para instalar as dependências da aplicação
```bash
yarn install:front
```

Após a conclusão execute o comando abaixo para realizar o build dos arquivos estáticos da aplicação
```bash
yarn build:front
```