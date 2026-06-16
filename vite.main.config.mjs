export default (env) => ({
  build: {
    lib: {
      entry: env.forgeConfigSelf.entry,
      fileName: () => 'main.cjs',
      formats: ['cjs'],
    },
  },
});
