export default (env) => ({
  build: {
    lib: {
      entry: env.forgeConfigSelf.entry,
      fileName: () => 'preload.cjs',
      formats: ['cjs'],
    },
  },
});
