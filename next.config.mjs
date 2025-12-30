/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⭐️ TypeScript 빌드 에러 무시 제거 (타입 안정성 확보)
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  images: {
    unoptimized: true,
  },
  // ⭐️ 백엔드 주소 강제 연결 설정 유지
  env: {
    NEXT_PUBLIC_API_URL: 'https://data-viewer-zyxg.onrender.com',
  },
  // 🚀 1단계: MCP 서버 활성화를 위한 실험적 기능 추가
  experimental: {
    mcpServer: true, 
  },
}

export default nextConfig;