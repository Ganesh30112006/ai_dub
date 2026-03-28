/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL?: string;
	readonly VITE_AUTH_API_PATH?: string;
	readonly VITE_DUBBING_API_PATH?: string;
	readonly VITE_ENABLE_AUTH_MOCK?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
