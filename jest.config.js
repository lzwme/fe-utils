/** @type {import('ts-jest').JestConfigWithTsJest} **/
// eslint-disable-next-line no-undef
module.exports = {
  preset: 'ts-jest',
  resolver: 'ts-jest-resolver',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  moduleNameMapper: {
    '^src/(.*).js$': '$1.ts',
  },
  transform: {
    '^.+.tsx?$': ['ts-jest'],
  },
  // transform: {
  //   '^.+\\.(t|j)sx?$': [
  //     '@swc/jest',
  //     {
  //       jsc: {
  //         target: 'es2022',
  //       },
  //     },
  //   ],
  // },
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', 'src/cli.ts', 'src/index.ts'], // 'src/**/*.spec.ts'
  // collectCoverageFrom: ['src/**/!(*.d).ts'],
  maxWorkers: require('os').cpus().length,
};
