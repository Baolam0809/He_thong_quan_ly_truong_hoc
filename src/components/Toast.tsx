// Standard globally available callback for showing beautiful React alerts
let showToastCallback: (message: string, type?: 'info' | 'success' | 'error') => void = () => {};

export function registerToastCallback(cb: (message: string, type?: 'info' | 'success' | 'error') => void) {
  showToastCallback = cb;
}

export function showToast(message: string, type: 'info' | 'success' | 'error' = 'info') {
  showToastCallback(message, type);
}
