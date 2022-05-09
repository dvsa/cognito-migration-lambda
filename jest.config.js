module.exports = {
  verbose: true,
  transform: {'\\.ts$': ['ts-jest']},
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  modulePathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.aws-sam/"],
  coverageDirectory: '<rootDir>/coverage/',
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  }
};
