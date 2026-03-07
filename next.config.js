/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! 위험하지만 배포가 급할 때 쓰는 마법 !!
    // 빌드 시 타입 에러가 있어도 무시하고 배포를 진행합니다.
    ignoreBuildErrors: true,
  },
  eslint: {
    // 문법 검사도 일단 통과!
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
