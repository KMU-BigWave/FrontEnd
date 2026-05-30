export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const DEV_AUTH_TOKEN_KEY = "tigyeok_dev_bearer_token";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

type ApiFailure = {
  success: false;
  message?: string;
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

export type SessionMode = "DUAL" | "SINGLE";

export type Session = {
  id: string;
  owner_user_id: string;
  status: string;
  relationship_type: RelationshipType;
  mode: SessionMode;
  created_at: string;
  updated_at: string;
};

export type Me = {
  id: string;
  email: string;
  name: string;
  picture_url: string | null;
  gender: string | null;
  age: number | null;
};

export type LlmResult = {
  id: string;
  sessionId: string;
  mode: string;
  resultText: string;
  structuredResult?: unknown;
  sections: {
    facts: { a: string; b: string; self: string };
    interpretations: { a: string; b: string; self: string };
    emotions: { a: string; b: string; self: string };
    needs: { a: string; b: string; self: string };
    questions: string[];
  };
  diagramKeywords: {
    coreConflict: string[];
    facts: string[];
    interpretations: string[];
    emotions: string[];
    needs: string[];
    relationshipShift: string[];
    questions: string[];
  };
  sourceSnapshot?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type SessionStatus = {
  sessionId: string;
  status: string;
  myRole: "A" | "B" | "SELF";
  bothSubmitted: boolean;
};

export type AnalysisStatus = {
  sessionId: string;
  mode: SessionMode;
  status: string;
  relationshipType: RelationshipType;
  participantRole: "A" | "B" | "SELF";
  updatedAt: string;
};

export type StatementLabel =
  | "FACT"
  | "INTERPRETATION"
  | "EMOTION"
  | "NEED"
  | "F"
  | "I"
  | "E"
  | "N";

export type AnalysisStatement = {
  id: string;
  speaker: "A" | "B" | "SELF";
  text: string;
  spanStart: number;
  spanEnd: number;
  label: StatementLabel;
  confidence: number;
};

export type AnalysisSession = {
  id: string;
  status: string;
  relationshipType: RelationshipType;
  mode: SessionMode;
  createdAt: string;
  updatedAt: string;
};

export type BasicAnalysisResult = {
  session: AnalysisSession;
  statements: AnalysisStatement[];
};

export type DualAnalysisResult = {
  session: AnalysisSession;
  statements: {
    A: AnalysisStatement[];
    B: AnalysisStatement[];
  };
  alignedPairs: Array<{
    id: string;
    similarity: number;
    pairType: string;
    pairTypeDisplayName: string;
    aStatement: Omit<AnalysisStatement, "speaker">;
    bStatement: Omit<AnalysisStatement, "speaker">;
  }>;
  commonGroundPairs: Array<{
    id: string;
    similarity: number;
    pairType: string;
    pairTypeDisplayName: string;
    aStatement?: Omit<AnalysisStatement, "speaker">;
    bStatement?: Omit<AnalysisStatement, "speaker">;
  }>;
  tensions: Array<{
    id: string;
    type: string;
    displayName?: string;
    rationale: string;
    createdAt?: string;
    evidence: AnalysisStatement[];
  }>;
  summary: {
    aStatementCount: number;
    bStatementCount: number;
    alignedPairCount: number;
    commonGroundPairCount: number;
    tensionCount: number;
  };
};

export type SingleAnalysisResult = {
  session: AnalysisSession;
  input: {
    id: string;
    speaker: "A" | "B" | "SELF";
    rawText: string;
    submittedAt: string;
  } | null;
  statements: AnalysisStatement[];
  summary: {
    statementCount: number;
    labelCounts: Partial<Record<StatementLabel, number>>;
  };
};

export type KakaoCaptureInputResult = {
  inputs: Array<{
    id: string;
    session_id: string;
    user_id: string;
    speaker: "A" | "B";
    raw_text: string;
    ocr_text: string;
    submitted_at: string;
  }>;
  speaker: "A" | "B";
  mode: "DUAL";
  status: string;
  captureParsing: {
    model: string;
    imageCount: number;
    messages: Array<{
      order: number;
      speaker: "A" | "B";
      text: string;
      time: string | null;
    }>;
    notes: string[];
    summary: {
      messageCount: number;
      aMessageCount: number;
      bMessageCount: number;
      hasBothSpeakers: boolean;
    };
  };
  feinAnalysisStatus: "DONE" | "FAILED" | "SKIPPED";
  next: {
    generateLlmResult: string;
    getLlmResult: string;
  } | null;
};

export type HistoryResult = {
  items: Array<{
    sessionId: string;
    status: string;
    mode: SessionMode;
    relationshipType: RelationshipType;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type LlmEvidenceStatement = AnalysisStatement & {
  statementId?: string;
  confidencePercent?: number | null;
  keywordSimilarity?: number;
  keywordSimilarityPercent?: number;
};

export type LlmEvidenceResult = {
  sessionId: string;
  mode: SessionMode;
  keywordEvidence: Partial<Record<"facts" | "interpretations" | "emotions" | "needs", Array<{
    keyword: string;
    label: StatementLabel;
    evidence: LlmEvidenceStatement[];
  }>>>;
  tensions: Array<{
    id: string;
    type: string;
    rationale: string;
    evidence: LlmEvidenceStatement[];
  }>;
  createdAt: string;
  updatedAt: string;
};

export type SelfLlmResults = {
  count: number;
  results: Array<LlmResult & {
    session?: AnalysisSession;
    input?: {
      id: string;
      speaker: "A" | "B" | "SELF";
      rawText: string;
      submittedAt: string;
    } | null;
  }>;
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
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  if (!headers.has("Content-Type") && init.body && !isFormData) {
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
      payload?.error?.message ?? payload?.message ?? "API 요청에 실패했습니다.",
      response.status,
      payload?.error?.code,
    );
  }

  return (payload as ApiSuccess<T>).data;
}

export const api = {
  getMe() {
    return request<Me>("/users/me");
  },

  logout() {
    return request<unknown>("/auth/google/logout", {
      method: "POST",
    });
  },

  createSession(input: {
    relationshipType: RelationshipType;
    mode?: SessionMode;
    roomPassword: string;
  }) {
    return request<Session>("/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  joinSession(sessionId: string, roomPassword: string) {
    return request<{ sessionId: string }>(`/sessions/${sessionId}/join`, {
      method: "POST",
      body: JSON.stringify({ roomPassword }),
    });
  },

  submitInput(sessionId: string, rawText: string) {
    return request<unknown>(`/sessions/${sessionId}/inputs`, {
      method: "POST",
      body: JSON.stringify({ rawText }),
    });
  },

  submitKakaoCaptures(sessionId: string, images: File[]) {
    const formData = new FormData();
    images.forEach((image) => formData.append("images", image));

    return request<KakaoCaptureInputResult>(`/sessions/${sessionId}/inputs/kakao-captures`, {
      method: "POST",
      body: formData,
    });
  },

  updateMyProfile(input: { gender?: string | null; age?: number | null }) {
    return request<Me>("/users/me/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  getSessionStatus(sessionId: string) {
    return request<SessionStatus>(`/sessions/${sessionId}/status`);
  },

  getAnalysisStatus(sessionId: string) {
    return request<AnalysisStatus>(`/sessions/${sessionId}/analysis-status`);
  },

  getBasicAnalysis(sessionId: string) {
    return request<BasicAnalysisResult>(`/sessions/${sessionId}/analysis`);
  },

  getDualResults(sessionId: string) {
    return request<DualAnalysisResult>(`/sessions/${sessionId}/results/dual`);
  },

  getSingleResults(sessionId: string) {
    return request<SingleAnalysisResult>(`/sessions/${sessionId}/results/single`);
  },

  generateLlmAnalysis(sessionId: string) {
    return request<LlmResult>(`/llm/sessions/${sessionId}/analysis`, {
      method: "POST",
    });
  },

  getLlmAnalysis(sessionId: string) {
    return request<LlmResult>(`/llm/sessions/${sessionId}/analysis`);
  },

  getLlmEvidence(sessionId: string) {
    return request<LlmEvidenceResult>(`/llm/sessions/${sessionId}/evidence`);
  },

  getHistory() {
    return request<HistoryResult>("/sessions/history");
  },

  getSelfLlmResults() {
    return request<SelfLlmResults>("/llm/self/results");
  },
};
