module.exports = {
    extends: [
        'foxsports',
    ],
    rules: {
        'compat/compat': 0,
        'react/static-property-placement': 0,              // need to remove propTypes from prod builds
    },
    globals: {
        process: 'readonly',
    },
};
