# Prompt Generator Platform

Системен дизайн и артефакти за платформа за създаване и управление на промптове за образователни ресурси.

## Съдържание
- [Визия и архитектура](#визия-и-архитектура)
- [База данни](#база-данни)
- [API спецификация](#api-спецификация)
- [Seed скрипт](#seed-скрипт)
- [Локална среда](#локална-среда)
- [Master Prompt](#master-prompt)

## Визия и архитектура
Общата концепция, архитектурни слоеве, ERD описание, тестова стратегия и пътна карта са описани в [docs/system-design.md](docs/system-design.md).

## База данни
Първоначалната PostgreSQL схема и индекси са дефинирани в [db/migrations/0001_init.sql](db/migrations/0001_init.sql). Миграцията създава всички основни таблици, енум типове и индекси за производителност и отчетност.

## API спецификация
OpenAPI 3.0 спецификацията на REST API е достъпна в [openapi/prompt-generator.yaml](openapi/prompt-generator.yaml). Файлът може да се импортира в Swagger UI/Postman за генериране на клиентски SDK-та и документация.

## Seed скрипт
Примерен seed скрипт с Prisma се намира в [scripts/seed.ts](scripts/seed.ts). Той създава Super Admin потребител, базови каталози и одобрен шаблон за работен лист по история.

## Локална среда
1. Създайте `.env` с настройки за база данни и JWT тайни.
2. Стартирайте инфраструктурата с Docker Compose (PostgreSQL, API, Frontend). Примерен `docker-compose.yml`:
   ```yaml
   version: '3.8'
   services:
     db:
       image: postgres:15
       restart: unless-stopped
       environment:
         POSTGRES_DB: prompt_generator
         POSTGRES_USER: prompt
         POSTGRES_PASSWORD: prompt
       ports:
         - '5432:5432'
       volumes:
         - pgdata:/var/lib/postgresql/data
     api:
       build: ./backend
       depends_on:
         - db
       environment:
         DATABASE_URL: postgresql://prompt:prompt@db:5432/prompt_generator
       ports:
         - '4000:4000'
     web:
       build: ./frontend
       depends_on:
         - api
       ports:
         - '5173:5173'
   volumes:
     pgdata:
   ```
3. Изпълнете миграциите (`npx prisma migrate deploy` или `alembic upgrade head`).
4. Пуснете seed скрипта: `npx ts-node scripts/seed.ts`.
5. Стартирайте API и SPA, след което отворете `http://localhost:5173`.

## Master Prompt
Използвайте следния промпт, когато искате разработващ ИИ да генерира архитектура или код за системата:

```
ROLE: Ти си старши софтуерен архитект и full-stack разработчик.
GOAL: Проектирај и опиши/генерирай код за система „Prompt Generator“ с Админ панел, REST API и База данни, според спецификацията по-долу.
STACK (предложение):

Backend: Node.js (NestJS/Express) или Python (FastAPI), JWT Auth, Zod/ Pydantic валидации.

DB: PostgreSQL + Prisma/SQLAlchemy, миграции.

Frontend: React + TypeScript, Vite, Zustand/Redux, Tailwind.

Docs: OpenAPI/Swagger.
CORE FEATURES:

Админ: каталози (roles, tasks, formats, dimensions), шаблони с плейсхолдъри, версии, одобрения, аудит.

Потребител: зареждане на каталози, избор на шаблон, попълване на параметри (вкл. свободен текст, markdown, линкове с URL валидация), „Генерирай промпт“, преглед, копиране, експорт (.md/.txt/.json).

API: /catalog/*, /templates, /generate, /presets, /user-configs, /audit.

Сигурност: RBAC, rate limiting, input sanitize, MFA за админ.
DATA MODEL: използвай таблиците и полетата от раздел „База данни“ (горе), с релации и индекси; добави placeholder_definitions с тип/валидации/по подразбиране.
VALIDATION: URL regex, дължини, enum стойности; сървърът отказва невалидни стойности.
OUTPUTS:

ERD диаграма (текстово описание).

SQL миграции за PostgreSQL.

OpenAPI спецификация за основните маршрути.

Примерен seed script (роля, задача, формат, 1 шаблон „Работен лист по история“).

Frontend: страници /admin/* и /generator, компоненти за динамични форми според placeholder_definitions.

Тестове (unit + e2e) и инструкции за локално стартиране (Docker Compose).
QUALITY GATES: покритие ≥80%, ESLint/Prettier, CI pipeline. Предай финален README с инструкции.
```
