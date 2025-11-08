var $57STb$pipecataiclientjs = require("@pipecat-ai/client-js");
var $57STb$dailycodailyjs = require("@daily-co/daily-js");
var $57STb$dequal = require("dequal");


function $parcel$exportWildcard(dest, source) {
  Object.keys(source).forEach(function(key) {
    if (key === 'default' || key === '__esModule' || Object.prototype.hasOwnProperty.call(dest, key)) {
      return;
    }

    Object.defineProperty(dest, key, {
      enumerable: true,
      get: function get() {
        return source[key];
      }
    });
  });

  return dest;
}

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
var $a4389233ee9d1348$exports = {};

$parcel$export($a4389233ee9d1348$exports, "OpenAIRealTimeWebRTCTransport", () => $a4389233ee9d1348$export$60a765086a8f0478);



const $a4389233ee9d1348$var$BASE_URL = "https://api.openai.com/v1/realtime";
const $a4389233ee9d1348$var$MODEL = "gpt-4o-realtime-preview-2024-12-17";
class $a4389233ee9d1348$export$60a765086a8f0478 extends (0, $57STb$pipecataiclientjs.Transport) {
    constructor(service_options){
        super();
        this._openai_channel = null;
        this._openai_cxn = null;
        this._senders = {};
        this._botTracks = {};
        this._selectedCam = {};
        this._selectedMic = {};
        this._selectedSpeaker = {};
        this._service_options = service_options;
    }
    // subclasses should implement this method to initialize the LLM
    // client and call super() on this method
    initialize(options, messageHandler) {
        this._options = options;
        this._callbacks = options.callbacks ?? {};
        this._onMessage = messageHandler;
        this._openai_cxn = new RTCPeerConnection();
        const existingInstance = (0, ($parcel$interopDefault($57STb$dailycodailyjs))).getCallInstance();
        if (existingInstance) this._daily = existingInstance;
        else {
            this._daily = (0, ($parcel$interopDefault($57STb$dailycodailyjs))).createCallObject({
                // Default is cam off
                startVideoOff: options.enableCam != true,
                // Default is mic on
                startAudioOff: options.enableMic == false
            });
            this._attachDeviceListeners();
        }
        this._attachLLMListeners();
        this.state = "disconnected";
    }
    async initDevices() {
        if (!this._daily) throw new (0, $57STb$pipecataiclientjs.RTVIError)("Transport instance not initialized");
        this.state = "initializing";
        const infos = await this._daily.startCamera({
            startVideoOff: true,
            startAudioOff: !(this._options.enableMic ?? true),
            dailyConfig: {
                useDevicePreferenceCookies: true
            }
        });
        const { devices: devices } = await this._daily.enumerateDevices();
        const cams = devices.filter((d)=>d.kind === "videoinput");
        const mics = devices.filter((d)=>d.kind === "audioinput");
        const speakers = devices.filter((d)=>d.kind === "audiooutput");
        this._callbacks.onAvailableCamsUpdated?.(cams);
        this._callbacks.onAvailableMicsUpdated?.(mics);
        this._callbacks.onAvailableSpeakersUpdated?.(speakers);
        this._selectedCam = infos.camera;
        this._callbacks.onCamUpdated?.(infos.camera);
        this._selectedMic = infos.mic;
        this._callbacks.onMicUpdated?.(infos.mic);
        this._selectedSpeaker = infos.speaker;
        this._callbacks.onSpeakerUpdated?.(infos.speaker);
        // Instantiate audio observers
        if (!this._daily.isLocalAudioLevelObserverRunning()) await this._daily.startLocalAudioLevelObserver(100);
        this.state = "initialized";
    }
    /**********************************/ /** Call Lifecycle functionality */ _validateConnectionParams(connectParams) {
        if (connectParams === undefined || connectParams === null) return undefined;
        if (typeof connectParams !== "object") throw new (0, $57STb$pipecataiclientjs.RTVIError)("Invalid connection parameters");
        return connectParams;
    }
    async _connect() {
        if (!this._openai_cxn) {
            (0, $57STb$pipecataiclientjs.logger).error("connectLLM called before the webrtc connection is initialized. Be sure to call initializeLLM() first.");
            return;
        }
        if (this._abortController?.signal.aborted) return;
        this.state = "connecting";
        await this._connectLLM();
        if (this._abortController?.signal.aborted) return;
        this.state = "connected";
        this._callbacks.onConnected?.();
    }
    async _disconnect() {
        this.state = "disconnecting";
        await this._disconnectLLM();
        this.state = "disconnected";
        this._callbacks.onDisconnected?.();
        this.initialize(this._options, this._onMessage);
    }
    get state() {
        return this._state;
    }
    set state(state) {
        if (this._state === state) return;
        this._state = state;
        this._callbacks.onTransportStateChanged?.(state);
    }
    /**********************************/ /** OpenAI-specific functionality */ updateSettings(settings) {
        if (settings.voice && this._channelReady()) {
            (0, $57STb$pipecataiclientjs.logger).warn("changing voice settings after session start is not supported");
            delete settings.voice;
        }
        const newSettings = {
            ...this._service_options.settings,
            ...settings
        };
        if ((0, $57STb$dequal.dequal)(newSettings, this._service_options.settings)) return;
        this._service_options.settings = {
            ...this._service_options.settings,
            ...settings
        };
        this._updateSession();
    }
    /**********************************/ /** Device functionality */ async getAllMics() {
        let devices = (await this._daily.enumerateDevices()).devices;
        return devices.filter((device)=>device.kind === "audioinput");
    }
    async getAllCams() {
        let devices = (await this._daily.enumerateDevices()).devices;
        return devices.filter((device)=>device.kind === "videoinput");
    }
    async getAllSpeakers() {
        let devices = (await this._daily.enumerateDevices()).devices;
        return devices.filter((device)=>device.kind === "audiooutput");
    }
    updateMic(micId) {
        this._daily.setInputDevicesAsync({
            audioDeviceId: micId
        }).then((deviceInfo)=>{
            this._selectedMic = deviceInfo.mic;
        });
    }
    updateCam(camId) {
        this._daily.setInputDevicesAsync({
            videoDeviceId: camId
        }).then((deviceInfo)=>{
            this._selectedCam = deviceInfo.camera;
        });
    }
    updateSpeaker(speakerId) {
        this._daily.setOutputDeviceAsync({
            outputDeviceId: speakerId
        }).then((deviceInfo)=>{
            this._selectedSpeaker = deviceInfo.speaker;
        });
    }
    get selectedMic() {
        return this._selectedMic;
    }
    get selectedCam() {
        return this._selectedCam;
    }
    get selectedSpeaker() {
        return this._selectedSpeaker;
    }
    enableMic(enable) {
        if (!this._daily.participants()?.local) return;
        this._daily.setLocalAudio(enable);
    }
    enableCam(enable) {
        if (!this._daily.participants()?.local) return;
        this._daily.setLocalVideo(enable);
    }
    get isCamEnabled() {
        return this._daily.localVideo();
    }
    get isMicEnabled() {
        return this._daily.localAudio();
    }
    // Not implemented
    enableScreenShare(enable) {
        (0, $57STb$pipecataiclientjs.logger).error("startScreenShare not implemented for OpenAIRealTimeWebRTCTransport");
        throw new Error("Not implemented");
    }
    get isSharingScreen() {
        (0, $57STb$pipecataiclientjs.logger).error("isSharingScreen not implemented for OpenAIRealTimeWebRTCTransport");
        return false;
    }
    tracks() {
        const participants = this._daily?.participants() ?? {};
        const tracks = {
            local: {
                audio: participants?.local?.tracks?.audio?.persistentTrack,
                video: participants?.local?.tracks?.video?.persistentTrack
            }
        };
        if (Object.keys(this._botTracks).length > 0) tracks.bot = this._botTracks;
        return tracks;
    }
    /**********************************/ /** Bot communication */ async sendReadyMessage() {
        const p = new Promise((resolve, reject)=>{
            if (this.state === "ready") resolve();
            else this._botIsReadyResolve = {
                resolve: resolve,
                reject: reject
            };
        });
        try {
            await p;
            this._onMessage({
                type: (0, $57STb$pipecataiclientjs.RTVIMessageType).BOT_READY,
                data: {
                    version: "1.0.0"
                }
            });
        } catch (e) {
            (0, $57STb$pipecataiclientjs.logger).error("Failed to start bot");
            throw new (0, $57STb$pipecataiclientjs.TransportStartError)();
        }
    }
    sendMessage(message) {
        switch(message.type){
            case (0, $57STb$pipecataiclientjs.RTVIMessageType).APPEND_TO_CONTEXT:
                {
                    const data = message.data;
                    const runImmediately = data.run_immediately ?? false;
                    const messages = [
                        {
                            content: data.content,
                            role: data.role
                        }
                    ];
                    this._sendTextInput(messages, runImmediately);
                }
                break;
            case "run":
                this._run();
                break;
            case (0, $57STb$pipecataiclientjs.RTVIMessageType).LLM_FUNCTION_CALL_RESULT:
                this._sendFunctionCallResult(message.data);
                break;
        }
    }
    /**********************************/ /** Private methods */ async _connectLLM() {
        const audioSender = this._senders["audio"];
        if (!audioSender) {
            let micTrack = this._daily.participants()?.local?.tracks?.audio?.persistentTrack;
            if (!micTrack) try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true
                });
                micTrack = stream.getAudioTracks()[0];
            } catch (e) {
                (0, $57STb$pipecataiclientjs.logger).error("Failed to get mic track. OpenAI requires audio on initial connection.", e);
                throw new (0, $57STb$pipecataiclientjs.RTVIError)("Failed to get mic track. OpenAI requires audio on initial connection.");
            }
            this._senders["audio"] = this._openai_cxn.addTrack(micTrack);
        }
        await this._negotiateConnection();
    }
    async _disconnectLLM() {
        this._cleanup();
    }
    _attachDeviceListeners() {
        this._daily.on("track-started", this._handleTrackStarted.bind(this));
        this._daily.on("track-stopped", this._handleTrackStopped.bind(this));
        this._daily.on("available-devices-updated", this._handleAvailableDevicesUpdated.bind(this));
        this._daily.on("selected-devices-updated", this._handleSelectedDevicesUpdated.bind(this));
        this._daily.on("local-audio-level", this._handleLocalAudioLevel.bind(this));
    }
    _attachLLMListeners() {
        if (!this._openai_cxn) {
            (0, $57STb$pipecataiclientjs.logger).error("_attachLLMListeners called before the websocket is initialized. Be sure to call initializeLLM() first.");
            return;
        }
        this._openai_cxn.ontrack = (e)=>{
            (0, $57STb$pipecataiclientjs.logger).debug("[openai] got track from openai", e);
            this._botTracks[e.track.kind] = e.track;
            this._callbacks.onTrackStarted?.(e.track, $a4389233ee9d1348$var$botParticipant());
        };
        // Set up data channel for sending and receiving events
        if (this._openai_channel) {
            (0, $57STb$pipecataiclientjs.logger).warn('closing existing data channel "oai-events"');
            this._openai_channel.close();
            this._openai_channel = null;
        }
        const dc = this._openai_cxn.createDataChannel("oai-events");
        dc.addEventListener("message", (e)=>{
            const realtimeEvent = JSON.parse(e.data);
            this._handleOpenAIMessage(realtimeEvent);
        });
        this._openai_channel = dc;
        this._openai_cxn.onconnectionstatechange = (e)=>{
            const state = e.target?.connectionState;
            (0, $57STb$pipecataiclientjs.logger).debug(`connection state changed to ${state.toUpperCase()}`);
            switch(state){
                case "closed":
                case "failed":
                    this.state = "error";
                    if (this._botIsReadyResolve) {
                        this._botIsReadyResolve.reject("Connection to OpenAI failed. Check your API key.");
                        this._botIsReadyResolve = null;
                    } else this._callbacks.onError?.((0, $57STb$pipecataiclientjs.RTVIMessage).error(`Connection to OpenAI ${state}`, true));
                    break;
            }
        };
        this._openai_cxn.onicecandidateerror = (e)=>{
            (0, $57STb$pipecataiclientjs.logger).error("ice candidate error", e);
        };
    }
    async _negotiateConnection() {
        const cxn = this._openai_cxn;
        const service_options = this._service_options;
        const apiKey = service_options.api_key;
        if (!apiKey) {
            (0, $57STb$pipecataiclientjs.logger).error("!!! No API key provided in service_options");
            return;
        }
        try {
            // Start the session using the Session Description Protocol (SDP)
            const offer = await cxn.createOffer();
            await cxn.setLocalDescription(offer);
            const model = service_options?.model ?? $a4389233ee9d1348$var$MODEL;
            const sdpResponse = await fetch(`${$a4389233ee9d1348$var$BASE_URL}?model=${model}`, {
                method: "POST",
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/sdp"
                }
            });
            const answer = {
                type: "answer",
                sdp: await sdpResponse.text()
            };
            await cxn.setRemoteDescription(answer);
        } catch (error) {
            const msg = `Failed to connect to LLM: ${error}`;
            (0, $57STb$pipecataiclientjs.logger).error(msg);
            this.state = "error";
            throw new (0, $57STb$pipecataiclientjs.TransportStartError)(msg);
        }
    }
    _cleanup() {
        this._openai_channel?.close();
        this._openai_channel = null;
        this._openai_cxn?.close();
        this._openai_cxn = null;
        this._senders = {};
        this._botTracks = {};
    }
    _updateSession() {
        if (!this._channelReady()) return;
        const service_options = this._service_options;
        const session_config = service_options?.settings ?? {};
        if (session_config.input_audio_transcription === undefined) session_config.input_audio_transcription = {
            model: "gpt-4o-transcribe"
        };
        (0, $57STb$pipecataiclientjs.logger).debug("updating session", session_config);
        this._openai_channel.send(JSON.stringify({
            type: "session.update",
            session: session_config
        }));
        if (service_options?.initial_messages) this._sendTextInput(service_options.initial_messages, true);
    }
    async _handleOpenAIMessage(msg) {
        const type = msg.type;
        switch(type){
            case "error":
                (0, $57STb$pipecataiclientjs.logger).warn("openai error", msg);
                break;
            case "session.created":
                this.state = "ready";
                if (this._botIsReadyResolve) {
                    this._botIsReadyResolve.resolve();
                    this._botIsReadyResolve = null;
                }
                this._updateSession();
                break;
            case "input_audio_buffer.speech_started":
                this._callbacks.onUserStartedSpeaking?.();
                break;
            case "input_audio_buffer.speech_stopped":
                this._callbacks.onUserStoppedSpeaking?.();
                break;
            case "conversation.item.input_audio_transcription.completed":
                // User transcripts usually arrive after the bot has started speaking again
                this._callbacks.onUserTranscript?.({
                    text: msg.transcript,
                    final: true,
                    timestamp: Date.now().toString(),
                    user_id: "user"
                });
                break;
            case "response.content_part.added":
                if (msg?.part?.type === "audio") this._callbacks.onBotStartedSpeaking?.();
                break;
            case "output_audio_buffer.cleared":
            case "output_audio_buffer.stopped":
                this._callbacks.onBotStoppedSpeaking?.();
                break;
            case "response.audio_transcript.delta":
                // There does not seem to be a way to align bot text output with audio. Text
                // streams faster than audio and all events, and all events are streamed at
                // LLM output speed.
                this._callbacks.onBotTtsText?.({
                    text: msg.delta
                });
                break;
            case "response.audio_transcript.done":
                this._callbacks.onBotTranscript?.({
                    text: msg.transcript
                });
                break;
            case "response.function_call_arguments.done":
                {
                    let data = {
                        function_name: msg.name,
                        tool_call_id: msg.call_id,
                        args: JSON.parse(msg.arguments)
                    };
                    this._onMessage({
                        type: (0, $57STb$pipecataiclientjs.RTVIMessageType).LLM_FUNCTION_CALL,
                        data: data
                    });
                }
                break;
            case "response.function_call_arguments.delta":
            default:
                (0, $57STb$pipecataiclientjs.logger).debug("ignoring openai message", msg);
        }
    }
    async _handleTrackStarted(ev) {
        const sender = this._senders[ev.track.kind];
        if (sender) {
            if (sender.track?.id !== ev.track.id) sender.replaceTrack(ev.track);
        } else this._senders[ev.track.kind] = this._openai_cxn.addTrack(ev.track);
        this._callbacks.onTrackStarted?.(ev.track, ev.participant ? $a4389233ee9d1348$var$dailyParticipantToParticipant(ev.participant) : undefined);
    }
    async _handleTrackStopped(ev) {
        this._callbacks.onTrackStopped?.(ev.track, ev.participant ? $a4389233ee9d1348$var$dailyParticipantToParticipant(ev.participant) : undefined);
    }
    _handleAvailableDevicesUpdated(ev) {
        this._callbacks.onAvailableCamsUpdated?.(ev.availableDevices.filter((d)=>d.kind === "videoinput"));
        this._callbacks.onAvailableMicsUpdated?.(ev.availableDevices.filter((d)=>d.kind === "audioinput"));
        this._callbacks.onAvailableSpeakersUpdated?.(ev.availableDevices.filter((d)=>d.kind === "audiooutput"));
    }
    _handleSelectedDevicesUpdated(ev) {
        if (this._selectedCam?.deviceId !== ev.devices.camera) {
            this._selectedCam = ev.devices.camera;
            this._callbacks.onCamUpdated?.(ev.devices.camera);
        }
        if (this._selectedMic?.deviceId !== ev.devices.mic) {
            this._selectedMic = ev.devices.mic;
            this._callbacks.onMicUpdated?.(ev.devices.mic);
        }
        if (this._selectedSpeaker?.deviceId !== ev.devices.speaker) {
            this._selectedSpeaker = ev.devices.speaker;
            this._callbacks.onSpeakerUpdated?.(ev.devices.speaker);
        }
    }
    _handleLocalAudioLevel(ev) {
        this._callbacks.onLocalAudioLevel?.(ev.audioLevel);
    }
    _sendTextInput(messages, runImmediately = false) {
        if (!this._channelReady()) return;
        messages.forEach((m)=>{
            const event = {
                type: "conversation.item.create",
                item: {
                    type: "message",
                    role: m.role,
                    content: [
                        {
                            type: m.role === "assistant" ? "text" : "input_text",
                            text: m.content
                        }
                    ]
                }
            };
            this._openai_channel.send(JSON.stringify(event));
        });
        if (runImmediately) this._run();
    }
    _sendFunctionCallResult(data) {
        if (!this._channelReady() || !data.result) return;
        const event = {
            type: "conversation.item.create",
            item: {
                type: "function_call_output",
                call_id: data.tool_call_id,
                output: JSON.stringify(data.result)
            }
        };
        this._openai_channel.send(JSON.stringify(event));
        this._run();
    }
    _run() {
        if (!this._channelReady) return;
        this._openai_channel.send(JSON.stringify({
            type: "response.create"
        }));
    }
    _channelReady() {
        if (!this._openai_channel) return false;
        return this._openai_channel?.readyState === "open";
    }
}
/**********************************/ /** Daily helper functions for device handling */ const $a4389233ee9d1348$var$dailyParticipantToParticipant = (p)=>({
        id: p.user_id,
        local: p.local,
        name: p.user_name
    });
const $a4389233ee9d1348$var$botParticipant = ()=>({
        id: "bot",
        local: false,
        name: "Bot"
    });


$parcel$exportWildcard(module.exports, $a4389233ee9d1348$exports);


//# sourceMappingURL=index.js.map
