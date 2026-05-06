export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const DEV_AUTH_TOKEN_KEY = "tigyeok_dev_bearer_token";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

type ApiFailure = {
  success: false;
  error?: {
    code?: string;
    message?: string;
  };
};

export type RelationshipType =
  | "COUPLE"
  | "FRIEND"
  | "FAMILY"
  | "ROOMMATE"
  | "TEAM"
  | "OTHER";

export type SessionMode = "DUAL" | "SELF";

export type Session = {
  id: string;
  owner_user_id: string;
  status: string;
  relationship_type: RelationshipType;
  mode: SessionMode;
  created_at: string;
  updated_at: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const devToken = localStorage.getItem(DEV_AUTH_TOKEN_KEY);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (devToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${devToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiFailure
    | null;

  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      payload?.error?.message ?? "API 요청에 실패했습니다.",
      response.status,
      payload?.error?.code,
    );
  }

  return (payload as ApiSuccess<T>).data;
}

export const api = {
  createSession(input: { relationshipType: RelationshipType; mode?: SessionMode }) {
    return request<Session>("/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  joinSession(sessionId: string) {
    return request<{ sessionId: string }>(`/sessions/${sessionId}/join`, {
      method: "POST",
    });
  },
};
