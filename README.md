# 💸 Fluxo - Gestor Financeiro Pessoal

![Badge Em Desenvolvimento](http://img.shields.io/badge/STATUS-EM_DESENVOLVIMENTO-green)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

O **Fluxo** é uma aplicação completa e moderna para gestão financeira pessoal. Desenvolvido para oferecer total controle sobre receitas, despesas, cartões de crédito e metas financeiras, tudo em uma interface limpa, intuitiva e responsiva.

---

## ✨ Funcionalidades

- **📊 Dashboard Interativo:** Gráficos de fluxo de caixa diário e despesas por categoria utilizando `Recharts`.
- **💳 Gestão de Contas e Cartões:** Suporte para contas correntes, poupança, investimentos e cartões de crédito (com fechamento de faturas).
- **📝 Transações Inteligentes:** Registro rápido de receitas, despesas e transferências.
- **🏷️ Categorização Customizada:** Crie categorias com emojis e cores personalizadas dinamicamente.
- **🎯 Metas Financeiras (Goals):** Acompanhe o progresso dos seus sonhos (viagens, carro, etc.) com barras de progresso e dicas integradas.
- **📎 Anexos Seguros:** Faça upload de recibos e notas fiscais (PDF/Imagens) e armazene-os de forma segura.
- **📥 Exportação de Relatórios:** Exporte seus dados financeiros em `CSV` ou `Excel` com apenas um clique.
- **⚡ Edição em Lote (Bulk Mode):** Altere categorias de múltiplas transações ao mesmo tempo.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React.js & Next.js** (App Router)
- **Tailwind CSS** para estilização utilitária e responsiva
- **Lucide React** para ícones modernos
- **Recharts** para visualização de dados e gráficos
- **Axios** para consumo da API

### Backend
- **Python 3**
- **FastAPI** para criação da API RESTful de alta performance
- **SQLAlchemy & Asyncpg** para ORM e consultas assíncronas
- **PostgreSQL** como banco de dados relacional
- **Pandas & Openpyxl** para geração e manipulação de planilhas Excel/CSV

### Infraestrutura
- **Docker & Docker Compose** para orquestração e conteinerização do ambiente

---

## 🚀 Como Executar o Projeto

O projeto foi configurado para rodar facilmente utilizando o Docker. Não é necessário instalar o banco de dados ou o Python localmente, o Docker faz tudo por você!

### Pré-requisitos
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### Passo a Passo

1. **Clone o repositório:**
~~~bash
git clone [https://github.com/seu-usuario/fluxo.git](https://github.com/seu-usuario/fluxo.git)
cd fluxo
~~~

2. **Suba os containers (Backend + Banco de Dados):**
No terminal, na raiz do projeto (onde está o `docker-compose.yml`), execute:
~~~bash
docker compose up -d --build
~~~
*Isso fará o download das imagens, instalará as bibliotecas do backend (como `pandas` e `openpyxl`) e inicializará o PostgreSQL.*

3. **Inicie o Frontend:**
Em outro terminal, navegue até a pasta do frontend, instale as dependências e rode o servidor de desenvolvimento:
~~~bash
cd frontend
npm install
npm run dev
~~~

4. **Acesse a Aplicação:**
- O Frontend estará disponível em: `http://localhost:3000`
- A documentação interativa da API (Swagger UI) estará em: `http://localhost:8000/docs`

---

## 📂 Estrutura do Projeto

~~~text
fluxo/
├── backend/                # API desenvolvida em FastAPI
│   ├── app/
│   │   ├── api/            # Rotas e Endpoints (reports, transactions, etc.)
│   │   ├── models/         # Modelos do Banco de Dados (SQLAlchemy)
│   │   └── main.py         # Ponto de entrada da API
│   ├── requirements.txt    # Dependências do Python (pandas, fastapi, etc.)
│   └── Dockerfile          # Configuração da imagem do Backend
├── frontend/               # Interface Web em Next.js
│   ├── src/
│   │   ├── app/            # Páginas (Dashboard, Contas, Metas)
│   │   ├── components/     # Componentes reutilizáveis (Modais, Inputs)
│   │   └── lib/            # Configurações de API (Axios) e Tipagens
│   ├── tailwind.config.ts  # Configuração de estilos
│   └── package.json        # Dependências do Node.js
└── docker-compose.yml      # Orquestração dos containers (Web, API, DB)
~~~

---

## 🤝 Contribuindo

Contribuições são super bem-vindas! Se você tem alguma ideia para melhorar o app, sinta-se à vontade para abrir uma *Issue* ou enviar um *Pull Request*.

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Faça o commit de suas alterações (`git commit -m 'feat: Adicionando uma nova feature'`)
4. Faça o push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Sinta-se à vontade para usá-lo e modificá-lo!
