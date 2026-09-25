function deferredSetupKeys(user) {
  const keys = [
    user?.email?.trim()?.toLowerCase(),
    user?.userId,
    user?.id,
  ]
    .filter(Boolean)
    .map((id) => `focusLensSetupDeferred:${id}`);

  return [...new Set(keys.length ? keys : ["focusLensSetupDeferred:parent"])];
}

export function isSetupDeferred(user) {
  return deferredSetupKeys(user).some((key) => sessionStorage.getItem(key));
}

export function markSetupDeferred(user) {
  deferredSetupKeys(user).forEach((key) => sessionStorage.setItem(key, "true"));
}

export function clearSetupDeferred(user) {
  deferredSetupKeys(user).forEach((key) => sessionStorage.removeItem(key));
}
