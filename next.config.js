/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // يتيح تصدير التطبيق بحجم خفيف جداً ليعمل في سيرفرات Docker و Linux بكفاءة عالية
}

module.exports = nextConfig
