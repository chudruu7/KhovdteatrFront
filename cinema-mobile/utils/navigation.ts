export const safeBack = (router: any, fallback: string = '/') => {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
};
