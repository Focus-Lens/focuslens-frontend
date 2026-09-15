// ============================================================
// apiClient.js
// طبقة اتصال مركزية بالـ Backend (FocusLens.Api).
// لا يحتوي هذا الملف على أي JSX/تصميم — منطق JavaScript فقط.
// ============================================================

const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5176";

const API_BASE_URL = RAW_BASE_URL.endsWith("/")
  ? RAW_BASE_URL
  : `${RAW_BASE_URL}/`;

const ACCESS_TOKEN_KEY = "focuslens_access_token";
const REFRESH_TOKEN_KEY = "focuslens_refresh_token";

// ------------------------------------------------------------
// تخزين التوكن
// ------------------------------------------------------------

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setTokens({ accessToken, refreshToken } = {}) {
  try {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // تجاهل أخطاء التخزين (مثلاً وضع التصفح الخاص)
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // تجاهل
  }
}

export function hasSession() {
  return Boolean(getAccessToken() || getRefreshToken());
}

// ------------------------------------------------------------
// أخطاء الـ API
// ------------------------------------------------------------

export class ApiError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function extractErrorMessage(data, status) {
  if (data) {
    if (typeof data === "string" && data.trim()) return data;

    if (typeof data === "object") {
      if (data.message) return data.message;
      if (data.detail) return data.detail;
      if (data.title) return data.title;

      if (data.errors && typeof data.errors === "object") {
        const firstKey = Object.keys(data.errors)[0];
        const firstValue = firstKey ? data.errors[firstKey] : null;
        const firstMessage = Array.isArray(firstValue)
          ? firstValue[0]
          : firstValue;
        if (firstMessage) return firstMessage;
      }
    }
  }

  switch (status) {
    case 400:
      return "البيانات المرسلة غير صحيحة. برجاء مراجعتها والمحاولة مرة أخرى.";
    case 401:
      return "انتهت صلاحية الجلسة. برجاء تسجيل الدخول مرة أخرى.";
    case 403:
      return "ليس لديك صلاحية للقيام بهذا الإجراء.";
    case 404:
      return "العنصر المطلوب غير موجود.";
    case 409:
      return "تعارض في البيانات. برجاء تحديث الصفحة والمحاولة مرة أخرى.";
    case 500:
    case 502:
    case 503:
      return "حدث خطأ في الخادم. برجاء المحاولة لاحقًا.";
    default:
      return "حدث خطأ غير متوقع. برجاء المحاولة مرة أخرى.";
  }
}

// ------------------------------------------------------------
// الطلب الأساسي
// ------------------------------------------------------------

function buildUrl(path, query) {
  const cleanPath = String(path).replace(/^\/+/, "");
  const url = new URL(cleanPath, API_BASE_URL);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

async function rawRequest(
  path,
  { method = "GET", body, query, auth = true, headers = {} } = {}
) {
  const finalHeaders = {
    Accept: "application/json",
    // يمنع صفحة تحذير المتصفح التي يعرضها ngrok المجاني قبل الوصول للـ API
    "ngrok-skip-browser-warning": "true",
    ...headers,
  };

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  let requestBody;

  if (body !== undefined && body !== null && !isFormData) {
    finalHeaders["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  } else {
    requestBody = body;
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: finalHeaders,
      body: requestBody,
    });
  } catch {
    throw new ApiError(
      "تعذر الاتصال بالخادم. برجاء التأكد من الاتصال بالإنترنت والمحاولة مرة أخرى.",
      { status: 0 }
    );
  }

  const rawText = await response.text();
  let data = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      if (!response.ok) {
        throw new ApiError(extractErrorMessage(null, response.status), {
          status: response.status,
        });
      }
      // استجابة ناجحة لكن الجسم مش JSON — نتجاهله
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data, response.status), {
      status: response.status,
      data,
    });
  }

  return data;
}

// ------------------------------------------------------------
// تجديد التوكن تلقائيًا عند 401
// ------------------------------------------------------------

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      const accessToken = getAccessToken();

      if (!refreshToken) {
        clearTokens();
        return false;
      }

      try {
        const data = await rawRequest("/api/auth/refresh", {
          method: "POST",
          body: { accessToken, refreshToken },
          auth: false,
        });

        if (data?.accessToken && data?.refreshToken) {
          setTokens(data);
          return true;
        }

        clearTokens();
        return false;
      } catch {
        clearTokens();
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiRequest(path, options = {}) {
  const { auth = true, skipAuthRetry = false, ...rest } = options;

  try {
    return await rawRequest(path, { ...rest, auth });
  } catch (error) {
    const isAuthExpiry =
      auth &&
      !skipAuthRetry &&
      error instanceof ApiError &&
      error.status === 401 &&
      Boolean(getRefreshToken());

    if (isAuthExpiry) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        return rawRequest(path, { ...rest, auth });
      }
    }

    throw error;
  }
}

export function apiGet(path, options = {}) {
  return apiRequest(path, { ...options, method: "GET" });
}

export function apiPost(path, body, options = {}) {
  return apiRequest(path, { ...options, method: "POST", body });
}

export function apiPut(path, body, options = {}) {
  return apiRequest(path, { ...options, method: "PUT", body });
}

export function apiPatch(path, body, options = {}) {
  return apiRequest(path, { ...options, method: "PATCH", body });
}

export function apiDelete(path, options = {}) {
  return apiRequest(path, { ...options, method: "DELETE" });
}
