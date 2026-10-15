/**
 * Tiện ích xử lý URL và phát hiện liên kết trùng lặp
 */

export function cleanAndNormalizeUrl(rawUrl: string): string {
  if (!rawUrl) return '';

  let urlStr = rawUrl.trim();
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    urlStr = `https://${urlStr}`;
  }

  try {
    const parsed = new URL(urlStr);

    // Chuẩn hóa hostname thành chữ thường
    parsed.hostname = parsed.hostname.toLowerCase();

    // Loại bỏ các tham số tracking phổ biến
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'ref',
      'source',
      '_ga',
    ];

    trackingParams.forEach((param) => {
      parsed.searchParams.delete(param);
    });

    // Chuẩn hóa pathname: xóa dấu gạch chéo cuối nếu không phải root
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    return parsed.toString();
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

export function isValidUrl(urlStr: string): boolean {
  if (!urlStr) return false;
  try {
    const formatted = urlStr.startsWith('http://') || urlStr.startsWith('https://')
      ? urlStr
      : `https://${urlStr}`;
    const parsed = new URL(formatted);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
}

export function getDomainFromUrl(urlStr: string): string {
  try {
    const formatted = urlStr.startsWith('http://') || urlStr.startsWith('https://')
      ? urlStr
      : `https://${urlStr}`;
    const parsed = new URL(formatted);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

export function getGoogleFaviconUrl(urlStr: string, size: number = 128): string {
  const domain = getDomainFromUrl(urlStr);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

export function formatTimeAgoVi(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
