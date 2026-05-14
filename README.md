# Veridicus I.A — Rede de Apoio & Cuidado

## Product Requirements Document (PRD)

---

## 1. Visão Geral do Produto

**Veridicus I.A — Gestão da Violência na Saúde** é um portal técnico web voltado para profissionais de saúde, oferecendo protocolos, documentos e ferramentas de apoio para gestão da violência em ambientes de cuidado à saúde.

A plataforma fornece acesso organizado a protocolos clínicos, fichas de notificação, documentos periciais e materiais de referência, com sistema de autenticação por CPF, engajamento via likes/favoritos e um dashboard administrativo para monitoramento de uso.

**URL de Produção:** https://periciascamara.github.io/violencia_saude/

---

## 2. Problema

Profissionais de saúde que lidam com situações de violência em unidades de urgência e emergência frequentemente enfrentam:

- Dificuldade em encontrar protocolos técnicos atualizados e confiáveis
- Falta de acesso rápido a fichas de notificação obrigatória (SINAN)
- Ausência de referência para procedimentos de cadeia de custódia hospitalar
- Necessidade de materiais de apoio para atendimento em crise (suicídio, exposição biológica)

---

## 3. Público-Alvo

| Perfil | Descrição |
|--------|-----------|
| **Médicos** | Emergencistas, peritos legistas, clínicos em plantão |
| **Enfermeiros** | Coordenadores de emergência, gestores hospitalares |
| **Gestores** | Diretores clínicos, responsáveis por protocolos internos |
| **Estudantes** | Alunos de graduação em medicina (disciplina de urgência e emergência) |

---

## 4. Funcionalidades

### 4.1 Portal Público (index.html)

#### 4.1.1 Autenticação por CPF
- **Login sem senha** — autenticação simplificada via CPF
- Verificação se o CPF já existe no banco (login direto) ou redireciona para cadastro
- Cadastro com campos: nome completo, telefone, e-mail, profissão
- Máscara automática de CPF (`000.000.000-00`) e telefone (`(00) 00000-0000`)
- CPF exibido parcialmente mascarado na barra de usuário (`***.***.***-00`)
- Sessão mantida via `sessionStorage` (não persiste entre abas)

#### 4.1.2 Cards de Protocolos (Flip Cards)
Cada protocolo é apresentado como um card interativo com animação de flip (frente/verso):

| Card | Categoria | Status | Conteúdo |
|------|-----------|--------|----------|
| **Profilaxia PEP** | Clínico / Urgência | ✅ Ativo | Formulário CAT (INSS), Exames Complementares, Notificação Exp. Biológica |
| **Ficha SINAN** | Gestão | ✅ Ativo | Ficha Oficial, Ficha PDF LaTeX, Código LaTeX |
| **Atendimento Suicídio** | Clínico / Urgência Psicológica | ✅ Ativo | Manual de Prevenção (MS), Escala de Risco, Fluxo de Encaminhamento |
| **Cadeia de Custódia** | Perícia | 🚧 Em Construção | Manual em fase de validação |

- **Frente do card:** título, descrição, badge de categoria, ícone de cadeado (🔒/🔓), botões de like e favorito
- **Verso do card:** links para documentos (geralmente Google Drive)
- Cards requerem login para serem abertos (flip)

#### 4.1.3 Sistema de Engajamento
- **Likes (votos de relevância):** cada usuário pode votar na relevância de um card, contagem global exibida
- **Favoritos (toggle):** cada card pode ser favoritado/desfavoritado com switch deslizante
- **Filtros:** Todos, Novidades, Favoritos, Clínico, Gestão, Perícia

#### 4.1.4 Tracking de Uso
Todas as interações são rastreadas no Supabase:
- **Visitas:** registra cada abertura (flip) de card
- **Cliques em documentos:** registra nome, URL e card de origem
- **Likes e Favoritos:** rastreados por usuário

#### 4.1.5 Outras Funcionalidades
- **Depoimentos profissionais:** pool de 5 depoimentos fictícios, 3 exibidos aleatoriamente com botão para gerar novos
- **Sugestão de protocolos via WhatsApp:** textarea + envio direto para WhatsApp da equipe técnica
- **Seção Equipe Técnica:** apresentação do Dr. Guilherme Camara com badge institucional

### 4.2 Dashboard Administrativo (dashboard.html)

Acesso restrito a usuários com `is_admin = true`.

#### 4.2.1 KPIs em Tempo Real
- Total de usuários cadastrados
- Total de likes registrados
- Total de visitas a cards
- Total de cliques em documentos

#### 4.2.2 Análises
- **Cards mais visitados:** ranking com barras de progresso animadas
- **Documentos mais clicados:** top 10 com contagem
- **Gráfico de visitas (últimos 7 dias):** barras verticais por dia da semana

#### 4.2.3 Gerenciamento de Usuários
- Tabela com todos os usuários: nome, CPF (mascarado), profissão, e-mail, telefone, data de cadastro
- Toggle para promover/remover administradores
- Proteção: admin não pode remover seu próprio acesso

---

## 5. Arquitetura Técnica

### 5.1 Stack

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | HTML5, JavaScript (vanilla), CSS |
| **Estilização** | Tailwind CSS (CDN), Inter (Google Fonts) |
| **Backend/BaaS** | Supabase (PostgreSQL + API REST) |
| **Hospedagem** | GitHub Pages (static hosting) |
| **Armazenamento de Docs** | Google Drive (links externos) |

### 5.2 Estrutura de Arquivos

```
violencia_saude/
├── index.html           # Portal principal com cards e autenticação
├── dashboard.html       # Dashboard administrativo
├── app.js               # Lógica de negócios (autenticação, Supabase, tracking)
├── supabase_schema.sql  # Schema do banco de dados
├── migration_v2.sql     # Migração para cadastro expandido + admin
├── badge_gestao_violencia.jpg  # Badge institucional
├── foto1-5.jpg          # Imagens do hero section
└── README.md            # Este documento
```

### 5.3 Fluxo de Autenticação

```
Usuário clica "Entrar com CPF"
         │
         ▼
   Modal: Insere CPF
         │
         ▼
  ┌──────────────────┐
  │ CPF existe no DB? │
  └──────┬───────────┘
     Sim │        │ Não
         ▼        ▼
   Login direto   Formulário de cadastro
   (showUserBar)  (nome, tel, email, profissão)
         │                │
         ▼                ▼
   Sessão ativa    INSERT no Supabase
   (sessionStorage)       │
                          ▼
                   Sessão ativa
```

---

## 6. Schema do Banco de Dados (Supabase/PostgreSQL)

### 6.1 Tabelas

#### `users`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `cpf` | TEXT (UNIQUE) | CPF do usuário (11 dígitos, sem máscara) |
| `nome` | TEXT | Nome completo |
| `telefone` | TEXT | Telefone com DDD |
| `email` | TEXT | E-mail |
| `profissao` | TEXT | Profissão do usuário |
| `is_admin` | BOOLEAN | Flag de administrador |
| `created_at` | TIMESTAMPTZ | Data de criação |

#### `likes`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `user_id` | UUID (FK → users) | Usuário que curtiu |
| `card_id` | TEXT | ID do card (p1, p2, p3, p4) |
| `created_at` | TIMESTAMPTZ | Data do like |

#### `favorites`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `user_id` | UUID (FK → users) | Usuário |
| `card_id` | TEXT | ID do card |
| `created_at` | TIMESTAMPTZ | Data |
| | UNIQUE | (user_id, card_id) |

#### `visits`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `user_id` | UUID (FK → users) | Usuário (nullable) |
| `card_id` | TEXT | ID do card visitado |
| `created_at` | TIMESTAMPTZ | Data da visita |

#### `document_clicks`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `user_id` | UUID (FK → users) | Usuário (nullable) |
| `card_id` | TEXT | ID do card de origem |
| `document_name` | TEXT | Nome do documento clicado |
| `document_url` | TEXT | URL do documento |
| `created_at` | TIMESTAMPTZ | Data do clique |

### 6.2 Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com políticas públicas:

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `users` | ✅ Público | ✅ Público | ✅ Público | ❌ |
| `likes` | ✅ Público | ✅ Público | ❌ | ❌ |
| `favorites` | ✅ Público | ✅ Público | ❌ | ✅ Público |
| `visits` | ✅ Público | ✅ Público | ❌ | ❌ |
| `document_clicks` | ✅ Público | ✅ Público | ❌ | ❌ |

> **Nota:** As políticas são abertas (anon key) para simplificar o acesso. A segurança depende da natureza não-sensível dos dados de tracking.

---

## 7. Design e UX

### 7.1 Identidade Visual
- **Tema claro** com acentos em azul (`#1d4ed8`)
- **Tipografia:** Inter (300–900)
- **Hero section:** fundo escuro (`#0f172a`) com imagem de fundo em baixa opacidade
- **Cards:** flip animation com `perspective: 1000px` e `transform: rotateY(180deg)`
- **Modais:** overlay com blur (`backdrop-filter: blur(12px)`) e animação vertical

### 7.2 Componentes de UI
- Toast notifications (fixo na parte inferior)
- Barra de usuário (fixo no topo, glassmorphism)
- Toggle switches animados para favoritos
- Animação de coração nos likes
- Filtros com destaque de estado ativo
- Badges de categoria nos cards
- Ribbon "Em Construção" para cards em desenvolvimento

### 7.3 Responsividade
- Grid responsivo: 1 coluna (mobile) → 2 colunas (tablet) → 3 colunas (desktop)
- Layout mobile-first com breakpoints `md` e `lg`

---

## 8. Deploy e Infraestrutura

| Componente | Serviço | Região |
|-----------|---------|--------|
| Frontend | GitHub Pages | Global CDN |
| Banco de Dados | Supabase (PostgreSQL 17) | `sa-east-1` (São Paulo) |
| Documentos | Google Drive | Global |

### 8.1 Deploy
1. Push para `main` no repositório `periciascamara/violencia_saude`
2. GitHub Pages serve automaticamente via `https://periciascamara.github.io/violencia_saude/`

### 8.2 Variáveis de Configuração
- `SUPABASE_URL` — URL do projeto Supabase (hardcoded em `app.js` e `dashboard.html`)
- `SUPABASE_KEY` — Chave anon do Supabase (hardcoded, segura para frontend público)

---

## 9. Roadmap

- [x] v4.6.0 — Portal com 4 cards de protocolos
- [x] Autenticação por CPF com cadastro expandido
- [x] Dashboard administrativo com KPIs
- [x] Sistema de likes, favoritos e tracking
- [x] Tratamento de erros robusto com feedback visual
- [ ] Completar protocolo Cadeia de Custódia
- [ ] Adicionar mais protocolos técnicos
- [ ] Integração com I.A. para busca semântica de protocolos
- [ ] Exportação de relatórios (PDF) no dashboard

---

## 10. Equipe

**Responsável Técnico:** Dr. Guilherme Camara — Médico Perito e Professor com 30 anos de prática em unidades de urgência e emergência.

**Plataforma:** Veridicus I.A — plataforma especializada na apuração da verdade.

---

*Versão: v4.6.0 Standalone | Time Os Caras da TI*