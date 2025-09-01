export {};

declare global {
	interface Window {
		api: {
			showToolsMenu(payload?: { videoId?: string }): Promise<void>;
			searchLibrary?(q: string): Promise<Array<{ id: string; title: string; url: string }>>;
			onMultiInitial(cb: (videoId: string) => void): () => void;
		};
	}
}

