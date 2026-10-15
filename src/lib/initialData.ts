import { Category, Bookmark } from '../types';
import { cleanAndNormalizeUrl, getGoogleFaviconUrl } from './urlUtils';

export function getSampleCategories(userId: string): Category[] {
  const now = new Date().toISOString();
  return [
    {
      id: `cat_dev_${userId.slice(0, 6)}`,
      userId,
      name: 'Lập trình & Phát triển',
      parentId: null,
      icon: 'Code2',
      color: '#4F46E5', // Indigo
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `cat_frontend_${userId.slice(0, 6)}`,
      userId,
      name: 'Frontend & UI',
      parentId: `cat_dev_${userId.slice(0, 6)}`,
      icon: 'Layout',
      color: '#0284C7', // Sky
      order: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `cat_backend_${userId.slice(0, 6)}`,
      userId,
      name: 'Backend & Cloud',
      parentId: `cat_dev_${userId.slice(0, 6)}`,
      icon: 'Server',
      color: '#0D9488', // Teal
      order: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `cat_ai_${userId.slice(0, 6)}`,
      userId,
      name: 'Công nghệ AI & LLM',
      parentId: null,
      icon: 'Sparkles',
      color: '#059669', // Emerald
      order: 4,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `cat_resources_${userId.slice(0, 6)}`,
      userId,
      name: 'Tài nguyên & Học tập',
      parentId: null,
      icon: 'BookOpen',
      color: '#D97706', // Amber
      order: 5,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function getSampleBookmarks(userId: string, categories: Category[]): Bookmark[] {
  const now = new Date().toISOString();
  const catDev = categories.find((c) => c.name.includes('Lập trình'))?.id || null;
  const catFrontend = categories.find((c) => c.name.includes('Frontend'))?.id || catDev;
  const catBackend = categories.find((c) => c.name.includes('Backend'))?.id || catDev;
  const catAi = categories.find((c) => c.name.includes('AI'))?.id || null;
  const catResources = categories.find((c) => c.name.includes('Tài nguyên'))?.id || null;

  return [
    {
      id: `bm_react_${userId.slice(0, 6)}`,
      userId,
      url: 'https://react.dev',
      cleanUrl: cleanAndNormalizeUrl('https://react.dev'),
      title: 'React - Thư viện xây dựng giao diện người dùng component',
      description: 'Trang tài liệu chính thức của React. Học cách tư duy theo component, hooks, state và kiến trúc ứng dụng web hiện đại.',
      favicon: getGoogleFaviconUrl('https://react.dev'),
      imageUrl: 'https://react.dev/images/og-learn.png',
      categoryId: catFrontend,
      tags: ['react', 'frontend', 'javascript'],
      notes: 'Tài liệu hướng dẫn trực quan nhất về React 19 và các hook useActionState, useOptimistic.',
      isFavorite: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `bm_mdn_${userId.slice(0, 6)}`,
      userId,
      url: 'https://developer.mozilla.org',
      cleanUrl: cleanAndNormalizeUrl('https://developer.mozilla.org'),
      title: 'MDN Web Docs - Cẩm nang phát triển Web toàn diện từ Mozilla',
      description: 'Kho kiến thức chuẩn mực cho các nhà phát triển Web: Tài liệu tham khảo HTML5, CSS3, JavaScript ESNext và các Web APIs.',
      favicon: getGoogleFaviconUrl('https://developer.mozilla.org'),
      imageUrl: '',
      categoryId: catDev,
      tags: ['web', 'tailieu', 'javascript'],
      notes: 'Tra cứu chuẩn cú pháp Web API và độ tương thích giữa các trình duyệt.',
      isFavorite: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `bm_tailwind_${userId.slice(0, 6)}`,
      userId,
      url: 'https://tailwindcss.com',
      cleanUrl: cleanAndNormalizeUrl('https://tailwindcss.com'),
      title: 'Tailwind CSS - Rapidly build modern websites without ever leaving your HTML',
      description: 'Framework CSS utility-first đa năng, hỗ trợ responsive, dark mode và phong cách thiết kế giao diện nhất quán.',
      favicon: getGoogleFaviconUrl('https://tailwindcss.com'),
      imageUrl: 'https://tailwindcss.com/api/og?path=/',
      categoryId: catFrontend,
      tags: ['css', 'styling', 'frontend'],
      notes: 'Hệ thống class utility mạnh mẽ, có chế độ Dark Mode tinh tế.',
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `bm_aistudio_${userId.slice(0, 6)}`,
      userId,
      url: 'https://aistudio.google.com',
      cleanUrl: cleanAndNormalizeUrl('https://aistudio.google.com'),
      title: 'Google AI Studio - Nền tảng thử nghiệm & tích hợp mô hình Gemini',
      description: 'Môi trường tạo mẫu nhanh với các dòng mô hình Gemini hàng đầu của Google, hỗ trợ multimodal, audio và code.',
      favicon: getGoogleFaviconUrl('https://aistudio.google.com'),
      imageUrl: '',
      categoryId: catAi,
      tags: ['ai', 'gemini', 'google'],
      notes: 'Nơi cấp API Key và thử nghiệm prompts với độ trễ cực thấp.',
      isFavorite: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `bm_github_${userId.slice(0, 6)}`,
      userId,
      url: 'https://github.com',
      cleanUrl: cleanAndNormalizeUrl('https://github.com'),
      title: 'GitHub - Nền tảng lưu trữ và cộng tác mã nguồn Git',
      description: 'Hàng triệu lập trình viên và doanh nghiệp cùng xây dựng, lưu trữ và đánh giá mã nguồn, quản lý dự án và phát triển phần mềm.',
      favicon: getGoogleFaviconUrl('https://github.com'),
      imageUrl: 'https://github.githubassets.com/images/modules/open_graph/github-logo.png',
      categoryId: catBackend,
      tags: ['git', 'devops', 'opensource'],
      notes: 'Quản lý repositories và thiết lập CI/CD qua GitHub Actions.',
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `bm_roadmap_${userId.slice(0, 6)}`,
      userId,
      url: 'https://roadmap.sh',
      cleanUrl: cleanAndNormalizeUrl('https://roadmap.sh'),
      title: 'Roadmap.sh - Bản đồ lộ trình học lập trình từng bước',
      description: 'Các lộ trình học tập trực quan hướng dẫn lập trình viên phát triển kỹ năng từ Frontend, Backend, DevOps đến AI Engineer.',
      favicon: getGoogleFaviconUrl('https://roadmap.sh'),
      imageUrl: '',
      categoryId: catResources,
      tags: ['lotrinh', 'hoctap', 'career'],
      notes: 'Rất hữu ích để tham khảo lộ trình kỹ năng cần bổ sung.',
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
