export const features = {
  enableTimeline: process.env.NEXT_PUBLIC_ENABLE_TIMELINE === 'true',
  enablePresales: process.env.NEXT_PUBLIC_ENABLE_PRESALES === 'true',
  enableAI: process.env.NEXT_PUBLIC_ENABLE_AI === 'true'
};
