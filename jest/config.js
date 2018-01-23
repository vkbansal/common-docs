module.exports = {
    setupFiles: ['@vkbansal/docs/jest/jsdom.setup.js', '@vkbansal/docs/jest/enzyme.setup.js'],
    testMatch: ['**/?(*.)(spec|test).ts?(x)'],
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    roots: ['<rootDir>/src/__tests__/'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest/preprocessor.js'
    },
    mapCoverage: true,
    snapshotSerializers: ['enzyme-to-json/serializer', 'jest-glamor-react/dist/serializer'],
    collectCoverageFrom: ['src/*.{ts,tsx}']
};
