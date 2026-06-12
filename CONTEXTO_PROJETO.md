# Contexto do Projeto — ACS Expert

Cole este arquivo no início de uma nova conversa com o Claude para retomar o trabalho sem perda de contexto.

---

## O que é o projeto

**ACS Expert** é um app mobile-first para Agentes Comunitários de Saúde (ACS) do SUS.
Permite cadastrar pacientes, registrar visitas domiciliares, realizar triagens de saúde com scoring de risco, gerar encaminhamentos e visualizar alertas de gestão.

- Repositório principal: `https://github.com/JeanSSoares/ACS-Expert`
- Fork de trabalho: `https://github.com/lavess/ACS-Expert`
- Branch padrão: `main`

---

## Stack

### Frontend (`/frontend`)
- React 18.3 + TypeScript + Vite 6
- Tailwind v4 com tokens custom em `frontend/src/styles/theme.css`
- Zustand (estado global), Axios (HTTP), `idb` (IndexedDB offline)
- React Router 7
- Radix UI + shadcn/ui (componentes em `src/app/components/ui/`)
- Lucide React (ícones, sempre `strokeWidth={1.8}`)
- Fontes: **Sora** (display/títulos), **Inter** (corpo), **JetBrains Mono** (eyebrows/mono)
- Target mobile: 390×844px (iPhone 14)

### Backend (`/backend`)
- Node.js + Express 5
- MySQL2 (pool de conexões)
- JWT para autenticação (`Authorization: Bearer <token>`)
- Jest para testes unitários

---

## Banco de Dados — Railway MySQL (ATIVO)

> **Este banco está em produção no Railway e é o único banco conectado.**
> Ao rodar o backend localmente, ele se conecta a este banco na nuvem.

```
Host:     shortline.proxy.rlwy.net
Port:     44458
User:     root
Password: VdZqLYOVChgcJTlBoUenOCDLjhDHeQci
Database: railway
```

O arquivo `backend/.env` já tem essas credenciais configuradas:

```env
DB_HOST=shortline.proxy.rlwy.net
DB_PORT=44458
DB_USER=root
DB_PASSWORD=VdZqLYOVChgcJTlBoUenOCDLjhDHeQci
DB_NAME=railway
JWT_SECRET=acs-expert-jwt-secret-troque-em-producao
JWT_EXPIRES_IN=8h
PORT=3000
NODE_ENV=development
```

### Schema relevante (tabelas principais)

```sql
-- Usuários (ACS, coordenador, gestor)
usuarios (id, nome, email, senha_hash, perfil ENUM('acs','coordenador','gestor'), microarea_id, municipio_id, ativo)

-- Domicílios e Pacientes
domicilios (id, logradouro, numero, complemento, bairro, cep, municipio_id, nome_referencia, latitude, longitude)
pacientes (id, nome, data_nascimento, sexo, cns, dom_id, microarea_id, nivel_risco, vulnerabilidade_social,
           dificuldade_locomocao, beneficio_social, idoso_mora_sozinho, ativo, comorbidades JSON)

-- Visitas domiciliares
visitas (id, paciente_id, usuario_id, tipo, data_hora, observacao, flags JSON, criado_em)
-- flags JSON armazena alertas sanitários identificados na visita (ex: ['suspeita_dengue', 'falta_saneamento'])

-- Triagens (vinculadas obrigatoriamente a uma visita)
triagens (id, paciente_id, usuario_id, visita_id, data_hora, sintomas JSON, fatores_risco JSON,
          observacao, score_final, nivel_risco, nivel_prioridade, acao_recomendada, hipoteses JSON, criado_em)
-- visita_id é obrigatório — triagem só existe dentro de uma visita

-- Encaminhamentos
encaminhamentos (id, paciente_id, usuario_id, tipo, descricao, unidade_saude_id, prazo,
                 status ENUM('pendente','realizado','cancelado'), observacao_desfecho, criado_em, atualizado_em)

-- Alertas
alertas (id, paciente_id, usuario_id_gerador, tipo ENUM('risco_alto','encaminhamento_vencido',
         'sem_visita_30d','novo_encaminhamento'), mensagem, resolvido, criado_em)
```

### Alterações aplicadas no Railway (via scripts)
- `ALTER TABLE visitas ADD COLUMN flags JSON` — adicionado na sessão de integração
- `ALTER TABLE alertas MODIFY tipo ENUM(...)` — adicionado valor `novo_encaminhamento`
- CEPs reais de Joinville nos domicílios (dom_id 4–12)

---

## Como rodar localmente

```bash
# Backend (porta 3000)
cd backend
node server.js

# Frontend (porta 5173)
cd frontend
npm run dev
```

> O frontend acessa o backend em `http://localhost:3000/api` (configurado em `src/services/api.ts`).

### Testes
```bash
cd frontend && npm test        # 21 testes Vitest — todos passando
cd backend  && npm test        # 22 testes Jest   — todos passando
```

---

## Arquitetura frontend

```
frontend/src/
├── app/
│   ├── pages/          # Todas as telas (rotas)
│   │   ├── Dashboard.tsx
│   │   ├── Agenda.tsx
│   │   ├── Pacientes.tsx
│   │   ├── NovoPaciente.tsx
│   │   ├── EditarPaciente.tsx
│   │   ├── PerfilPaciente.tsx
│   │   ├── TriagemPasso1.tsx   # Fatores de risco + anotações
│   │   ├── TriagemPasso2.tsx   # Sintomas por grupo
│   │   ├── TriagemResultado.tsx
│   │   ├── DetalheTriagem.tsx
│   │   ├── Encaminhamentos.tsx
│   │   ├── Alertas.tsx
│   │   ├── Relatorios.tsx
│   │   ├── Login.tsx
│   │   ├── Perfil.tsx
│   │   ├── Usuarios.tsx
│   │   ├── NovoUsuario.tsx
│   │   └── EditarUsuario.tsx
│   └── components/
│       └── ui/          # Componentes shadcn/Radix
├── features/
│   ├── visitas/
│   │   ├── RegistrarVisitaSheet.tsx   # Sheet de registro de visita
│   │   └── HistoricoVisitas.tsx       # Lista de visitas no prontuário
│   └── encaminhamentos/
│       ├── RegistrarEncaminhamentoSheet.tsx
│       └── RegistrarDesfechoSheet.tsx
├── services/
│   ├── api.ts                  # Axios base (interceptor JWT)
│   ├── pacientesService.ts
│   ├── visitasService.ts       # VisitaAPI inclui triagem_id
│   ├── triagensService.ts      # TriagemResumo inclui visita_id
│   ├── alertasService.ts
│   ├── encaminhamentosService.ts
│   ├── offlineMiddleware.ts    # cachedGet / queuedMutation
│   ├── offlineQueue.ts         # IndexedDB queue
│   └── offlineCache.ts
├── store/
│   ├── authStore.ts            # JWT + usuário logado
│   ├── triagemStore.ts         # Estado da triagem em andamento (inclui visitaId)
│   └── pacientesStore.ts
└── styles/
    └── theme.css               # Tokens Tailwind v4 (paleta ACS)
```

---

## Arquitetura backend

```
backend/
├── server.js              # Entry point (Express, rotas, CORS)
├── db.js                  # Pool MySQL2
├── middleware/
│   └── auth.js            # Verificação JWT
├── routes/
│   ├── usuarios.js
│   ├── pacientes.js
│   ├── visitas.js         # GET inclui triagem_id via LEFT JOIN
│   ├── triagens.js        # POST exige visita_id obrigatório
│   ├── encaminhamentos.js
│   ├── alertas.js
│   ├── microareas.js
│   ├── relatorios.js
│   └── unidades-saude.js
├── controllers/
│   ├── usuariosController.js
│   ├── pacientesController.js
│   ├── triagensController.js  # criar() valida visita_id obrigatório
│   └── encaminhamentosController.js
├── services/
│   └── inference/
│       ├── engine.js          # Motor de scoring de triagem
│       ├── symptoms.json      # Catálogo de sintomas com groups em pt-BR acentuado
│       └── diseases.json      # Catálogo de doenças
└── database/
    └── schema.sql             # Schema completo (fonte de verdade)
```

---

## Decisões arquiteturais importantes

### 1. Triagem obrigatoriamente vinculada a visita
- Uma triagem **não pode** ser criada sem uma visita associada
- Fluxo: registrar visita → prompt "deseja iniciar triagem?" → se sim, abre TriagemPasso1
- `triagemStore.visitaId` armazena o vínculo durante a wizard
- Backend: `POST /api/triagens` retorna 400 se `visita_id` não enviado
- `PerfilPaciente`: removido botão "Nova triagem" — acesso só via visita

### 2. Cross-reference visita ↔ triagem
- `GET /api/visitas` retorna `triagem_id` (LEFT JOIN com triagens)
- `GET /api/triagens` retorna `visita_id`
- `HistoricoVisitas`: mostra badge "Triagem" clicável se `v.triagem_id` existe
- Cards de triagem no `PerfilPaciente`: mostram chip "Visita #N" se `triagem.visita_id` existe

### 3. Padrão offline-first
- Mutations usam `queuedMutation()` — salva em IndexedDB se offline, sincroniza quando volta
- GETs usam `cachedGet()` — retorna cache IndexedDB se offline
- `RegistrarVisitaSheet`: se visita foi enfileirada (offline), não exibe prompt de triagem

### 4. Paleta de cores (NUNCA hex direto nos componentes)
```
--acs-azul      #0B3A6F   primário, headers
--acs-coral     #E76F4A   CTA, FAB, acentos
--acs-verde     #2F9E6E   sucesso, risco baixo
--acs-amar      #F2B134   atenção, risco médio
--acs-vermelho  #C8364A   urgência, risco alto
--acs-paper     #F5F1EB   fundo base
--acs-ink       #0E1726   texto primário
```

---

## Rotas do frontend (React Router 7)

```
/login
/dashboard
/agenda
/pacientes
/pacientes/novo
/paciente/:id
/paciente/:id/editar
/triagem/:pacienteId/passo1    # Requer triagemStore.visitaId
/triagem/:pacienteId/passo2
/triagem/:pacienteId/resultado
/triagem/:id/detalhe
/encaminhamentos
/alertas
/relatorios
/perfil
/usuarios
/usuarios/novo
/usuario/:id/editar
```

---

## API endpoints principais

```
POST /api/auth/login
GET  /api/auth/me

GET  /api/pacientes
POST /api/pacientes
GET  /api/pacientes/:id
PUT  /api/pacientes/:id

GET  /api/visitas?paciente_id=X      # retorna triagem_id por visita
POST /api/visitas                    # body: { paciente_id, tipo, data_hora, observacao, flags[] }
GET  /api/visitas/stats

GET  /api/triagens?paciente_id=X     # retorna visita_id por triagem
POST /api/triagens                   # body obrigatório: { visita_id, paciente_id, sintomas, ... }

GET  /api/encaminhamentos
POST /api/encaminhamentos
PUT  /api/encaminhamentos/:id/desfecho

GET  /api/alertas
POST /api/alertas/:id/resolver

GET  /api/usuarios
POST /api/usuarios
PUT  /api/usuarios/:id

GET  /api/microareas
GET  /api/unidades-saude
GET  /api/relatorios
```

---

## Problemas conhecidos / gotchas

1. **MySQL Railway não suporta `ADD COLUMN IF NOT EXISTS`** — usar `information_schema.COLUMNS` para checar antes de alterar.

2. **Escapes Unicode em JSX**: O editor pode salvar caracteres acentuados como `ç` em vez do caractere real. Em JSX text nodes (`<p>texto</p>`) isso aparece literal na tela. **Solução**: usar `{'texto com acento'}` (expressão JS) onde o escape é interpretado.

3. **Scripts temporários no backend** — existem arquivos `fix-flags.js`, `fix-ceps.js`, `console.error(e.message))`, `{` na raiz do `backend/` que são artefatos de sessões anteriores. Não commitá-los.

4. **Catálogo de sintomas** (`backend/services/inference/symptoms.json`) usa nomes de grupo **com acentos** (ex: `"Saúde Mental"`, `"Músculos e Articulações"`). As constantes `GROUP_ORDER` e `GROUP_ICONS` em `TriagemPasso2.tsx` devem bater exatamente com esses valores.

5. **CEPs nos domicílios**: domicílios com `dom_id` 4–12 têm CEPs reais de Joinville-SC adicionados manualmente.

6. **Push para o repositório do Jean**: o `origin` aponta para o fork `lavess/ACS-Expert`. Para enviar ao `JeanSSoares/ACS-Expert`, criar PR de `lavess:main → JeanSSoares:main`.

---

## Estado atual do banco de dados (Railway)

- Dados de teste reais com pacientes, domicílios, microáreas e unidades de saúde de Joinville-SC
- Usuário admin: criar via `npm run seed:admin` no backend (se necessário)
- Schema atualizado com `flags JSON` em visitas e ENUM atualizado em alertas

---

## Últimos commits

```
44e5a49 feat: unifica jornada visita+triagem, corrige schema Railway e ajusta acentos
02ff417 feat(dashboard): dados reais + cards KPI + operacao offline
bfa5542 feat(alertas): alerta para gestor ao criar encaminhamento + badge dinamico + testes automatizados
78bf878 feat(alertas): tela de alertas com dados reais, agrupamento por urgencia e resolucao
```

---

## Como usar este contexto

Cole o conteúdo deste arquivo no início de uma conversa com o Claude e diga algo como:

> "Aqui está o contexto do projeto ACS Expert. Preciso de ajuda com [tarefa]."

O Claude terá tudo que precisa para trabalhar sem refazer investigações.
