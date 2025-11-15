# 🏊 PoolTracker — Sistema em Tempo Real para Contagem de Pessoas + Meteorologia

PoolTracker é um sistema completo criado para controlar, em tempo real, o número de pessoas dentro de um espaço público — neste caso, a **Piscina Municipal da Sobreposta** — e disponibilizar a informação ao público através de um website intuitivo e moderno.

O sistema inclui:
- API em .NET moderna e segura
- Interface pública (React + Tailwind)
- Painel administrativo com controlo total (entradas/saídas, horário, capacidade…)
- Autenticação simples via PIN
- Autorização forte via Admin API Key e middleware personalizado
- Obtenção de meteorologia em tempo real com caching inteligente para evitar rate limits
- Atualizações automáticas no frontend a cada 10–15 segundos

---

## 📦 1. Tecnologias Utilizadas (Stack)

### Backend — .NET 10 / C#
- ASP.NET Core Web API
- Controllers tradicionais (MVC) para organização
- `HttpClientFactory` para chamadas à API externa (Open-Meteo)
- Middlewares personalizados (AdminAuthMiddleware)
- OpenAPI nativa do .NET (sem Swashbuckle)

### Frontend — React + Vite
- React 18 com componentes funcionais e Hooks
- React Router (páginas `/` e `/admin`)
- TailwindCSS para estilização rápida e consistente
- Variáveis de ambiente via ficheiro `.env` (`VITE_API_URL`, `VITE_ADMIN_PIN`, `VITE_ADMIN_API_KEY`)
- UI moderna em modo dark, focada em legibilidade

### API Externa
- Open-Meteo (sem necessidade de API Key)
- Endpoint `forecast` com `current_weather=true`
- Dados: temperatura, código meteorológico, velocidade do vento, etc.

---

## 🧠 2. Objetivo do Projeto

Criar um sistema realista onde:
- A receção controla as **entradas/saídas** na piscina.
- A **lotação atual** é mostrada ao público em tempo real.
- A **meteorologia atual** da localização da piscina é exibida automaticamente.
- Apenas administradores autenticados podem alterar o estado da piscina (abrir/fechar, alterar capacidade, definir contagem, etc.).

Este projeto demonstra:
- Utilização de **serviços** e **APIs REST** (objetivo da unidade curricular).
- Integração frontend–backend.
- Consumo de API externa.
- Implementação de **segurança e autorização**.
- Arquitetura clara e escalável, fácil de evoluir para cenários mais complexos.

---

## 🛠 3. Funcionalidades Principais

### ✔ Contagem de Pessoas (Tempo Real)
- Incrementar o número de pessoas que entram na piscina.
- Decrementar o número de pessoas que saem.
- Respeito pela capacidade máxima (não permite ultrapassar o limite).
- Quando a piscina é fechada, o contador é automaticamente reposto para `0`.

### ✔ Estado da Piscina
- Estado atual: `Aberta` ou `Encerrada`.
- Horário do próprio dia, gerado automaticamente com base numa tabela fixa definida no `PoolService`.
- Guardamos também `LastUpdated` em UTC para saber quando houve a última alteração de estado.

### ✔ Capacidade Configurável
- O administrador pode alterar a capacidade máxima (ex.: 120 → 200).
- Se a capacidade for reduzida para um valor inferior à lotação atual, o sistema ajusta automaticamente o contador para o novo máximo.

### ✔ Meteorologia em Tempo Real
- Temperatura atual (°C).
- Descrição amigável: “Céu limpo”, “Nublado”, “Chuva moderada”, etc.
- Velocidade do vento em km/h.
- Ícone lógico associado ao estado (`sunny`, `cloudy`, `overcast`, `rain`, `showers`, `unknown`).
- Localização fixa nas coordenadas da Piscina Municipal da Sobreposta (Sobreposta, Braga).
- **Caching de 60 segundos** (ver secção de otimização) para evitar chamadas excessivas à Open-Meteo.

---

## 🔐 4. Segurança Implementada

### 4.1. PIN de Acesso ao Painel Administrativo

O frontend possui uma página `/admin` protegida por **PIN**.  
O PIN está guardado no ficheiro `.env` do frontend:

VITE_ADMIN_PIN=1234

Ao validar o PIN, o estado de autenticação é guardado no `localStorage`:

localStorage["pool_admin_auth"] = "true"

Enquanto este valor existir no navegador, o utilizador tem acesso ao painel administrativo. Existe também um botão de `Logout` que remove a flag de autenticação:

- Remove a key `pool_admin_auth` de `localStorage`.
- Faz reload da página, voltando ao ecrã de login.

### 4.2. Admin API Key (Autorização Forte nas Rotas da API)

As rotas da API que **alteram estado** (entrar/sair, abrir/fechar, alterar capacidade, definir contagem) exigem um header especial:

X-Admin-Key: <chave secreta>

Esta chave está definida no `appsettings.json` do backend:

"AdminApiKey": "12345-SEGREDO-POOLTRACKER"

No frontend, o valor é colocado também em `.env`, por exemplo:

VITE_ADMIN_API_KEY=12345-SEGREDO-POOLTRACKER

O painel admin, ao fazer pedidos do tipo POST/PUT para a API, envia sempre este header `X-Admin-Key` com o valor correto.

### 4.3. Middleware de Autorização (AdminAuthMiddleware)

Foi criado um middleware customizado para garantir que:

- Endpoints públicos **não exigem** API key:
  - `/api/pool/status` (estado e lotação atual)
  - `/api/weather/current` (meteorologia atual)
- Todos os outros endpoints `api/pool/*` que alterem o estado requerem a header `X-Admin-Key` válida.

Em pseudocódigo:

- Se o caminho começa por `/api/pool/status` ou `/api/weather/current` → segue sem validação.
- Caso contrário:
  - Lê `AdminApiKey` do `appsettings.json`.
  - Compara com o cabeçalho `X-Admin-Key` do pedido.
  - Se não existir ou não coincidir → retorna `401 Unauthorized`.

Isto garante que mesmo que alguém descubra os endpoints da API, **não consegue alterar o estado sem a chave secreta**.

### 4.4. CORS e Ambiente de Desenvolvimento

Atualmente o CORS está configurado como:

- `AllowAnyOrigin`
- `AllowAnyMethod`
- `AllowAnyHeader`

Isto facilita o desenvolvimento (sobretudo com o frontend a correr em `http://localhost:5173` e a API em `http://localhost:5292`).

Em ambiente de produção, este comportamento deve ser restringido a domínios específicos (por exemplo, o domínio final do website da piscina).

### 4.5. User-Agent Customizado para Open-Meteo

O `WeatherService` adiciona um User-Agent personalizado:

`PoolTrackerApp/1.0`

Isto é uma boa prática quando se consome APIs externas, permitindo ao fornecedor identificar o tipo de cliente e, em alguns casos, reduzir o risco de bloqueio.

---

## 🌦 5. Otimização da Meteorologia (Anti Rate-Limit)

Para evitar eventuais bloqueios de IP por excesso de chamadas à API da Open-Meteo, foi implementado um mecanismo de cache simples em memória:

- Quando alguém chama `/api/weather/current`, o `WeatherService` verifica:
  - Se existe um resultado em cache (`_cachedWeather`).
  - Se foi obtido há menos de 60 segundos (`_lastFetch`).
- Se sim:
  - Devolve imediatamente os dados em cache.
- Se não:
  - Faz um novo pedido HTTP à Open-Meteo.
  - Atualiza `_cachedWeather` e `_lastFetch`.
  - Devolve os dados novos.

Desta forma:
- O frontend pode fazer pedidos de 10 em 10 segundos sem problema.
- A API externa é chamada, na prática, no máximo 1 vez por minuto.

---

## 🧬 6. Arquitetura da API

Estrutura simplificada do projeto backend:

/PoolTracker.API  
 ├── Controllers  
 │     ├── PoolController.cs        (endpoints da piscina)  
 │     └── WeatherController.cs     (endpoints de meteorologia)  
 ├── Middleware  
 │     └── AdminAuthMiddleware.cs   (proteção das rotas via X-Admin-Key)  
 ├── Models  
 │     ├── PoolStatus.cs            (estado da piscina)  
 │     └── WeatherInfo.cs           (modelo simplificado da meteorologia)  
 ├── Services  
 │     ├── PoolService.cs           (lógica de contagem, estado, horário, capacidade)  
 │     └── WeatherService.cs        (integração com Open-Meteo + cache)  
 └── Program.cs                     (configuração de serviços, CORS, middleware, controllers, OpenAPI)

### PoolService

Responsável por:
- Manter o estado interno da piscina (`PoolStatus`).
- Tabela de horários por dia da semana.
- Operações:
  - `GetStatus()`
  - `Enter()`
  - `Exit()`
  - `SetCount(value)`
  - `SetOpenStatus(isOpen)` → quando `isOpen == false`, força `CurrentCount = 0`.
  - `SetCapacity(value)` → ajusta `CurrentCount` se for maior que a nova capacidade.

### WeatherService

Responsável por:
- Montar o URL correto para a Open-Meteo usando latitude/longitude e `current_weather=true`.
- Fazer o pedido HTTP usando `HttpClientFactory`.
- Mapear o JSON de resposta para o modelo `WeatherInfo`.
- Mapear `weathercode` para uma descrição em português e um ícone lógico.
- Fazer cache dos resultados por 60 segundos.

---

## 🌐 7. Arquitetura do Website (Frontend)

Estrutura simplificada:

/pooltracker-web  
 ├── src  
 │     ├── App.jsx                 (página pública: ocupação + meteorologia)  
 │     ├── pages  
 │     │      └── admin.jsx        (painel administrativo)  
 │     ├── adminlogin.jsx          (ecrã de login por PIN)  
 │     ├── main.jsx                (ponto de entrada, React Router, Tailwind)  
 │     └── index.css / tailwind   (estilos)  
 ├── index.html  
 └── .env

### Página Pública (`/`)

Mostra:
- Título e morada da Piscina Municipal da Sobreposta.
- Estado da piscina (Aberta/Encerrada).
- Lotação atual e capacidade máxima.
- Barra de progresso com percentagem de ocupação.
- Horário de hoje.
- Meteorologia (temperatura, vento, condição textual).
- Informação de “Última atualização” baseada na hora local do utilizador.
- Atualização automática em intervalos regulares (ex.: 15 segundos).

### Painel Administrativo (`/admin`)

Após passar pelo ecrã de PIN:

- Cartão de Estado:
  - Mostra se a piscina está aberta ou fechada.
  - Botão para abrir/fechar piscina.
- Cartão de Lotação:
  - Mostra `currentCount / maxCapacity`.
  - Botões `+ Entrou` e `- Saiu`, com validações:
    - Não permite entrar mais do que a capacidade.
    - Não permite sair abaixo de 0.
    - Botões são desativados (`disabled`) quando a ação não faz sentido.
- Meteorologia:
  - Mostra a mesma informação da página pública, mas no contexto de gestão.
- Alterar Capacidade:
  - Campo para nova capacidade.
  - Botão para atualizar, com validação básica (valor positivo).
- Logout:
  - Botão no canto superior direito.
  - Limpa `localStorage["pool_admin_auth"]`.
  - Faz reload, voltando ao ecrã de PIN.

---

## ▶ 8. Como Executar o Projeto

### Backend (.NET)

1. Abrir uma consola na pasta da API:

   cd PoolTracker.API

2. Restaurar e compilar:

   dotnet restore  
   dotnet build

3. Executar:

   dotnet run

A API ficará disponível em algo como:

http://localhost:5292/

(O porto pode variar, mas este é o configurado durante o desenvolvimento.)

---

### Frontend (React + Vite)

1. Abrir uma consola na pasta do frontend:

   cd pooltracker-web

2. Instalar dependências:

   npm install

3. Correr o servidor de desenvolvimento:

   npm run dev

O site ficará acessível em:

http://localhost:5173/

Se `VITE_API_URL` estiver corretamente definido no `.env`, o frontend conseguirá comunicar com a API.

---

## 🔧 9. Decisões Técnicas (Resumo e Justificações)

- **Abandono do Swashbuckle**: Inicialmente foi tentado usar Swashbuckle para Swagger, mas com .NET 10 surgiram conflitos de versões (Microsoft.OpenApi). Optou-se por usar a **OpenAPI nativa** (`AddOpenApi` / `MapOpenApi`), que é mais simples e compatível.
- **Controllers em vez de Minimal APIs**: Foram usados controllers tradicionais para:
  - Melhor organização do código.
  - Facilitar testes.
  - Tornar mais simples a evolução para autenticação JWT/Identity no futuro.
- **React + Tailwind**: Escolhidos para velocidade de desenvolvimento e para criar rapidamente uma interface moderna (especialmente útil como “extra” para surpreender o professor).
- **Middleware de Autorização**: Implementado para reforçar a separação entre:
  - Endpoints públicos (consulta).
  - Endpoints administrativos (alterações de estado).
- **Rate limiting manual (meteorologia)**: Implementação de cache em memória para reduzir chamadas à Open-Meteo, prevenindo bloqueios e uso excessivo de recursos.
- **Reset de lotação ao fechar piscina**: Comportamento lógico para garantir que, sempre que a piscina está fechada, o contador volta a 0, refletindo que não há pessoas dentro.

---

## 👤 Autor

**Ricardo Guimarães**  
GitHub: https://github.com/ricardoguimaraes2021  

Projeto desenvolvido no contexto da unidade curricular de Integração de Sistemas de Informação, com foco em:
- Criação de serviços web,
- Consumo de APIs externas,
- Integração frontend–backend,
- Boas práticas de segurança e arquitetura.

---

## 📄 Licença

Projeto livre para utilização académica, estudo e demonstração. Para utilização em produção, recomenda-se rever chaves, configurações de CORS, HTTPS e mecanismos de autenticação/autorização mais robustos (por exemplo, Identity + JWT).
