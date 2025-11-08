import { PipecatClientOptions, RTVIEventCallbacks, Tracks, BotTTSTextData, RTVIMessage, TranscriptData, Transport, TransportState } from "@pipecat-ai/client-js";
declare abstract class MediaManager {
    protected _userAudioCallback: (data: ArrayBuffer) => void;
    protected _options: PipecatClientOptions;
    protected _callbacks: RTVIEventCallbacks;
    protected _micEnabled: boolean;
    protected _camEnabled: boolean;
    protected _supportsScreenShare: boolean;
    constructor();
    setUserAudioCallback(userAudioCallback: (data: ArrayBuffer) => void): void;
    setClientOptions(options: PipecatClientOptions, override?: boolean): void;
    abstract initialize(): Promise<void>;
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract userStartedSpeaking(): Promise<unknown>;
    abstract bufferBotAudio(data: ArrayBuffer | Int16Array, id?: string): Int16Array | undefined;
    abstract getAllMics(): Promise<MediaDeviceInfo[]>;
    abstract getAllCams(): Promise<MediaDeviceInfo[]>;
    abstract getAllSpeakers(): Promise<MediaDeviceInfo[]>;
    abstract updateMic(micId: string): void;
    abstract updateCam(camId: string): void;
    abstract updateSpeaker(speakerId: string): void;
    abstract get selectedMic(): MediaDeviceInfo | Record<string, never>;
    abstract get selectedCam(): MediaDeviceInfo | Record<string, never>;
    abstract get selectedSpeaker(): MediaDeviceInfo | Record<string, never>;
    abstract enableMic(enable: boolean): void;
    abstract enableCam(enable: boolean): void;
    abstract enableScreenShare(enable: boolean): void;
    abstract get isCamEnabled(): boolean;
    abstract get isMicEnabled(): boolean;
    abstract get isSharingScreen(): boolean;
    abstract tracks(): Tracks;
    get supportsScreenShare(): boolean;
}
interface LLMServiceOptions {
    api_key: string;
    initial_messages?: Array<unknown>;
    model?: string;
    settings?: Record<string, unknown>;
}
/**
 * DirectToLLMBaseWebSocketTransport is an abstract class that provides a client-side
 * interface for connecting to a real-time AI service. It is intended to
 * connect directly to the service. (No Pipecat server is involved.)
 */
declare abstract class DirectToLLMBaseWebSocketTransport extends Transport {
    protected _service_options: LLMServiceOptions;
    protected _botIsSpeaking: boolean;
    constructor(service_options: LLMServiceOptions, manager: MediaManager);
    /**
     * This method will be called from initialize()
     * Subclasses should initialize the LLM client and media player/recorder
     * and call initializeAudio() from within this method.
     */
    abstract initializeLLM(): void;
    /**
     * This method will be called from initialize()
     * Subclasses should etup listeners for LLM events from within this method
     */
    abstract attachLLMListeners(): void;
    /**
     * This method will be called from connect()
     * Subclasses should connect to the LLM and pass along the initial messages
     * @param initial_messages
     */
    abstract connectLLM(): Promise<void>;
    /**
     * This method will be called from disconnect()
     * Subclasses should disconnect from the LLM
     */
    abstract disconnectLLM(): Promise<void>;
    /**
     * This method will be called regularly with audio data from the user
     * Subclasses should handle this data and pass it along to the LLM
     * @param data ArrayBuffer of audio data
     */
    abstract handleUserAudioStream(data: ArrayBuffer): void;
    initialize(options: PipecatClientOptions, messageHandler: (ev: RTVIMessage) => void): void;
    initDevices(): Promise<void>;
    _connect(connectParams?: LLMServiceOptions): Promise<void>;
    _disconnect(): Promise<void>;
    getAllMics(): Promise<MediaDeviceInfo[]>;
    getAllCams(): Promise<MediaDeviceInfo[]>;
    getAllSpeakers(): Promise<MediaDeviceInfo[]>;
    updateMic(micId: string): Promise<void>;
    updateCam(camId: string): void;
    updateSpeaker(speakerId: string): void;
    get selectedMic(): MediaDeviceInfo | Record<string, never>;
    get selectedCam(): MediaDeviceInfo | Record<string, never>;
    get selectedSpeaker(): MediaDeviceInfo | Record<string, never>;
    enableMic(enable: boolean): void;
    enableCam(enable: boolean): void;
    get isCamEnabled(): boolean;
    get isMicEnabled(): boolean;
    get state(): TransportState;
    set state(state: TransportState);
    tracks(): Tracks;
    userStartedSpeaking(): Promise<unknown>;
    userStoppedSpeaking(): void;
    userTranscript(transcript: TranscriptData): void;
    botStartedSpeaking(): void;
    botStoppedSpeaking(): void;
    botTtsText(data: BotTTSTextData): void;
    bufferBotAudio(audio: ArrayBuffer, id?: string): void;
    connectionError(errorMsg: string): void;
}
export interface GeminiLLMServiceOptions extends LLMServiceOptions {
    initial_messages?: Array<{
        content: string;
        role: string;
    }>;
    api_key: string;
    settings?: {
        candidate_count?: number;
        maxOutput_tokens?: number;
        temperature?: number;
        top_p?: number;
        top_k?: number;
        presence_penalty?: number;
        frequency_penalty?: number;
        response_modalities?: string;
        speech_config?: {
            voice_config?: {
                prebuilt_voice_config?: {
                    voice_name: "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede";
                };
            };
        };
    };
}
export class GeminiLiveWebsocketTransport extends DirectToLLMBaseWebSocketTransport {
    constructor(service_options: GeminiLLMServiceOptions, manager?: MediaManager);
    initializeLLM(): void;
    attachLLMListeners(): void;
    _validateConnectionParams(connectParams: unknown): undefined | GeminiLLMServiceOptions;
    connectLLM(): Promise<void>;
    disconnectLLM(): Promise<void>;
    sendReadyMessage(): Promise<void>;
    handleUserAudioStream(data: ArrayBuffer): void;
    sendMessage(message: RTVIMessage): void;
    _sendAudioInput(data: ArrayBuffer): Promise<void>;
    _sendTextInput(text: string, role: string, turnComplete?: boolean | undefined): Promise<void>;
    _sendMsg(msg: unknown): Promise<void>;
    enableScreenShare(enable: boolean): void;
    get isSharingScreen(): boolean;
}

//# sourceMappingURL=index.d.ts.map
