// @ts-check
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';

/**
 * Layer boundaries:
 *   domain/          pure — no Nest, no Prisma, no infrastructure, no modules
 *   modules/         may use Nest; reaches persistence only through the ports
 *   infrastructure/  the only layer allowed to import Prisma
 */
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'coverage-e2e/**',
      'prisma/migrations/**',
      'src/infrastructure/prisma-client/**',
      'eslint.config.mjs',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { sourceType: 'module' },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...prettier.rules,
      // An argument prefixed with _ is unused on purpose.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // No silent fallbacks: config.get('KEY') with a literal default, and
      // empty catch blocks, both hide a misconfiguration or a swallowed error.
      // Fix it, or annotate the line with a reason:
      //   // eslint-disable-next-line no-restricted-syntax -- safe default: <reason>
      'no-restricted-syntax': [
        'error',
        // config.get('KEY') ?? 'literal' / || 'literal'
        {
          selector:
            "LogicalExpression[operator='??'][left.callee.object.name='config'][left.callee.property.name='get'][right.type='Literal']",
          message:
            "config.get('KEY') ?? 'literal' silently falls back when the env var is absent. " +
            "Use config.getOrThrow('KEY') for security-sensitive keys (_URL _URI _AUDIENCE _SECRET _KEY _PASSWORD _TOKEN _HOST _PORT). " +
            "If this key is genuinely cosmetic (APP_NAME, LOG_LEVEL), annotate: " +
            "// eslint-disable-next-line no-restricted-syntax -- safe default: <reason>",
        },
        {
          selector:
            "LogicalExpression[operator='??'][left.callee.object.name='configService'][left.callee.property.name='get'][right.type='Literal']",
          message:
            "configService.get('KEY') ?? 'literal' silently falls back when the env var is absent. " +
            "Use configService.getOrThrow('KEY') for security-sensitive keys. " +
            "Annotate cosmetic keys: // eslint-disable-next-line no-restricted-syntax -- safe default: <reason>",
        },
        {
          selector:
            "LogicalExpression[operator='??'][left.callee.object.property.name='configService'][left.callee.property.name='get'][right.type='Literal']",
          message:
            "this.configService.get('KEY') ?? 'literal' silently falls back when the env var is absent. " +
            "Use this.configService.getOrThrow('KEY') for security-sensitive keys. " +
            "Annotate cosmetic keys: // eslint-disable-next-line no-restricted-syntax -- safe default: <reason>",
        },
        {
          selector:
            "LogicalExpression[operator='||'][left.callee.object.name='config'][left.callee.property.name='get'][right.type='Literal']",
          message:
            "config.get('KEY') || 'literal' silently falls back when the env var is absent. " +
            "Use config.getOrThrow('KEY') for security-sensitive keys. " +
            "Annotate cosmetic keys: // eslint-disable-next-line no-restricted-syntax -- safe default: <reason>",
        },
        {
          selector:
            "LogicalExpression[operator='||'][left.callee.object.name='configService'][left.callee.property.name='get'][right.type='Literal']",
          message:
            "configService.get('KEY') || 'literal' silently falls back when the env var is absent. " +
            "Use configService.getOrThrow('KEY') for security-sensitive keys. " +
            "Annotate cosmetic keys: // eslint-disable-next-line no-restricted-syntax -- safe default: <reason>",
        },
        {
          selector:
            "LogicalExpression[operator='||'][left.callee.object.property.name='configService'][left.callee.property.name='get'][right.type='Literal']",
          message:
            "this.configService.get('KEY') || 'literal' silently falls back when the env var is absent. " +
            "Use this.configService.getOrThrow('KEY') for security-sensitive keys. " +
            "Annotate cosmetic keys: // eslint-disable-next-line no-restricted-syntax -- safe default: <reason>",
        },
        // empty catch block
        {
          selector: "CatchClause[body.body.length=0]",
          message:
            "Empty or comment-only catch block swallows all errors silently. " +
            "Either rethrow, log the error via the Nest logger, or update a degraded-flag signal. " +
            "If silence is intentional (e.g. SSR compatibility, best-effort cleanup), annotate: " +
            "// eslint-disable-next-line no-restricted-syntax -- <explicit reason>",
        },
      ],
    },
  },
  {
    // The domain stays pure: no Nest, Prisma, HTTP or any outer layer.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@nestjs/*',
                '@prisma/client',
                'prisma',
                '**/infrastructure/**',
                '**/modules/**',
              ],
              message:
                'The domain layer must stay pure: no Nest, no Prisma, no ' +
                'infrastructure and no module imports. Invert the dependency ' +
                'through a port declared in the domain instead.',
            },
          ],
        },
      ],
    },
  },
  {
    // Feature modules reach persistence through the domain ports, never
    // through Prisma directly.
    files: ['src/modules/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@prisma/client', 'prisma'],
              message:
                'Feature modules must not import Prisma directly. Depend on ' +
                'the repository port from the domain; the Prisma adapter lives ' +
                'in infrastructure/persistence.',
            },
          ],
        },
      ],
    },
  },
  {
    // Specs may reach wherever they need to in order to assert.
    // The no-silent-fallback checks are off here: ConfigService is mocked and
    // a test may use an empty catch to check that something does not throw.
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'test/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-syntax': 'off',
    },
  },
];
