export const logger = {
  info: (msg: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] INFO: ${msg}`, data);
  },
  error: (msg: string, error?: any) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, error);
  }
};
