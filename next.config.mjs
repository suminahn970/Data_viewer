/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // ⭐️ 아래 env 설정을 추가하여 백엔드 주소를 강제로 연결합니다.
  env: {
    NEXT_PUBLIC_API_URL: 'https://data-viewer-zyxg.onrender.com',
  },
}

export default nextConfig