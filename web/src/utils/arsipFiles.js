export const shouldOpenInNewTab = (fileUri) => {
  if (!fileUri || typeof fileUri !== 'string') return false;
  if (fileUri.startsWith('data:') || fileUri.startsWith('blob:')) return false;
  return /^https?:\/\//i.test(fileUri) || fileUri.startsWith('/') || fileUri.startsWith('./') || fileUri.startsWith('../');
};
