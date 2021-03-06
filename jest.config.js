// @ts-check

/** @type {import('ts-jest').InitialOptionsTsJest  } */
module.exports = {
  preset: "ts-jest",
  testEnvironment: 'node',
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js"
  ],
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
