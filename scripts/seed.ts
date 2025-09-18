/**
 * Example seed script using Prisma Client.
 *
 * Run with: `npx ts-node scripts/seed.ts`
 */
import { PrismaClient, TemplateStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@prompt-generator.local' },
    update: {},
    create: {
      email: 'admin@prompt-generator.local',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$examplehash',
      fullName: 'Super Admin',
      role: 'super_admin',
      isActive: true,
    },
  });

  const historyTeacherRole = await prisma.role.upsert({
    where: { name: 'History Teacher' },
    update: {},
    create: {
      name: 'History Teacher',
      description: 'Teacher specializing in Bulgarian History',
    },
  });

  const worksheetTask = await prisma.task.upsert({
    where: { name_subject: { name: 'Worksheet', subject: 'HistoryBG' } },
    update: {},
    create: {
      name: 'Worksheet',
      subject: 'HistoryBG',
      description: 'Structured worksheet for Bulgarian history topics',
    },
  });

  const markdownFormat = await prisma.format.upsert({
    where: { name: 'Markdown' },
    update: {},
    create: {
      name: 'Markdown',
      mime: 'text/markdown',
      extension: '.md',
    },
  });

  const template = await prisma.template.create({
    data: {
      name: 'История - Работен лист',
      description: 'Базов шаблон за работен лист по история на България',
      contentMd: `ROLE: {{enum:role}}
GOAL: Създай {{enum:task}} за тема "{{string:topic}}" по {{enum:subject:HistoryBG}} за {{enum:grade}}.
CONSTRAINTS: Език: {{enum:language:BG,EN}}; Ниво Bloom: {{enum:bloom}}; Продължителност: {{enum:duration}}.
KEY CONCEPTS: {{tags:concepts[]}}
MATERIALS: {{url_list:resources[]}} + {{markdown:notes}}
OUTPUT: Формат {{enum:format}}. Включи секции: {{multiselect:sections[Intro,SourceWork,Map,Argument,SelfAssessment,Rubric]}}.
STYLE: кратко, ясно, подходящо за Gen Alpha, без лични данни.
`,
      status: TemplateStatus.approved,
      version: 1,
      createdBy: superAdmin.id,
      approvedBy: superAdmin.id,
      approvedAt: new Date(),
      relations: {
        create: [
          {
            roleId: historyTeacherRole.id,
            taskId: worksheetTask.id,
            formatId: markdownFormat.id,
          },
        ],
      },
      placeholderDefinitions: {
        create: [
          {
            placeholderKey: 'role',
            placeholderType: 'enum',
            label: 'Role',
            description: 'Persona who will execute the prompt',
            isRequired: true,
            optionsJson: { values: ['Учител по история', 'AI експерт'] },
          },
          {
            placeholderKey: 'topic',
            placeholderType: 'string',
            label: 'Topic',
            description: 'Specific historical topic (e.g. Иван Асен II)',
            isRequired: true,
          },
          {
            placeholderKey: 'grade',
            placeholderType: 'enum',
            label: 'Grade',
            optionsJson: { values: ['5', '6', '7'] },
            isRequired: true,
          },
          {
            placeholderKey: 'language',
            placeholderType: 'enum',
            label: 'Language',
            optionsJson: { values: ['BG', 'EN'] },
            isRequired: true,
          },
          {
            placeholderKey: 'bloom',
            placeholderType: 'enum',
            label: 'Bloom Level',
            optionsJson: { values: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] },
            isRequired: true,
          },
          {
            placeholderKey: 'duration',
            placeholderType: 'enum',
            label: 'Duration',
            optionsJson: { values: ['15 мин', '30 мин', '45 мин'] },
            isRequired: true,
          },
          {
            placeholderKey: 'concepts',
            placeholderType: 'tags',
            label: 'Key Concepts',
          },
          {
            placeholderKey: 'resources',
            placeholderType: 'url_list',
            label: 'Resources',
            validatorsJson: { maxItems: 5 },
          },
          {
            placeholderKey: 'notes',
            placeholderType: 'markdown',
            label: 'Teacher Notes',
          },
          {
            placeholderKey: 'sections',
            placeholderType: 'multiselect',
            label: 'Sections',
            optionsJson: { values: ['Intro', 'SourceWork', 'Map', 'Argument', 'SelfAssessment', 'Rubric'] },
          },
          {
            placeholderKey: 'format',
            placeholderType: 'enum',
            label: 'Output Format',
            optionsJson: { values: ['Markdown', 'DOCX', 'HTML'] },
          },
        ],
      },
    },
    include: {
      relations: true,
      placeholderDefinitions: true,
    },
  });

  console.log('Seed completed:', template.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
