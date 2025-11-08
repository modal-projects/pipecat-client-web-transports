import { LLMContextMessage, PipecatClientOptions, RTVIMessage, Tracks, Transport, TransportState } from "@pipecat-ai/client-js";
/**********************************
 * OpenAI-specific types
 *   types and comments below are based on:
 *     gpt-4o-realtime-preview-2024-12-17
 **********************************/
type JSONSchema = {
    [key: string]: any;
};
export type OpenAIFunctionTool = {
    type: "function";
    name: string;
    description: string;
    parameters: JSONSchema;
};
export type OpenAIServerVad = {
    type: "server_vad";
    create_response?: boolean;
    interrupt_response?: boolean;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
    threshold?: number;
};
export type OpenAISemanticVAD = {
    type: "semantic_vad";
    eagerness?: "low" | "medium" | "high" | "auto";
    create_response?: boolean;
    interrupt_response?: boolean;
};
export type OpenAISessionConfig = Partial<{
    modalities?: string;
    instructions?: string;
    voice?: "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse";
    input_audio_noise_reduction?: {
        type: "near_field" | "far_field";
    } | null;
    input_audio_transcription?: {
        model: "whisper-1" | "gpt-4o-transcribe" | "gpt-4o-mini-transcribe";
        language?: string;
        prompt?: string[] | string;
    } | null;
    turn_detection?: OpenAIServerVad | OpenAISemanticVAD | null;
    temperature?: number;
    max_tokens?: number | "inf";
    tools?: Array<OpenAIFunctionTool>;
}>;
export interface OpenAIServiceOptions {
    api_key: string;
    model?: string;
    initial_messages?: LLMContextMessage[];
    settings?: OpenAISessionConfig;
}
export class OpenAIRealTimeWebRTCTransport extends Transport {
    constructor(service_options: OpenAIServiceOptions);
    initialize(options: PipecatClientOptions, messageHandler: (ev: RTVIMessage) => void): void;
    initDevices(): Promise<void>;
    /**********************************/
    /** Call Lifecycle functionality */
    _validateConnectionParams(connectParams: unknown): undefined | OpenAIServiceOptions;
    _connect(): Promise<void>;
    _disconnect(): Promise<void>;
    get state(): TransportState;
    private set state(value);
    /**********************************/
    /** OpenAI-specific functionality */
    updateSettings(settings: OpenAISessionConfig): void;
    /**********************************/
    /** Device functionality */
    getAllMics(): Promise<MediaDeviceInfo[]>;
    getAllCams(): Promise<MediaDeviceInfo[]>;
    getAllSpeakers(): Promise<MediaDeviceInfo[]>;
    updateMic(micId: string): void;
    updateCam(camId: string): void;
    updateSpeaker(speakerId: string): void;
    get selectedMic(): MediaDeviceInfo | Record<string, never>;
    get selectedCam(): MediaDeviceInfo | Record<string, never>;
    get selectedSpeaker(): MediaDeviceInfo | Record<string, never>;
    enableMic(enable: boolean): void;
    enableCam(enable: boolean): void;
    get isCamEnabled(): boolean;
    get isMicEnabled(): boolean;
    enableScreenShare(enable: boolean): void;
    get isSharingScreen(): boolean;
    tracks(): Tracks;
    /**********************************/
    /** Bot communication */
    sendReadyMessage(): Promise<void>;
    sendMessage(message: RTVIMessage): void;
    /**********************************/
    /** Private methods */
    _connectLLM(): Promise<void>;
    _disconnectLLM(): Promise<void>;
    _negotiateConnection(): Promise<void>;
}

//# sourceMappingURL=index.d.ts.map
