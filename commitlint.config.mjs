const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // `content` is used for articles and case studies (see release-please-config.json).
    'type-enum': [
      2,
      'always',
      ['build', 'chore', 'ci', 'content', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test'],
    ],
    'body-max-line-length': [0],
  },
};

export default config;
