import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Video,
  VideoOff,
  Camera,
  Mic,
  MicOff,
  Square,
  Play,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldAlert,
  Sparkles,
  Upload,
  Info,
  Clock,
  Radio
} from 'lucide-react';
import { generateSimulatedVideoBlob } from '../../services/videoStorage';

interface EmergencyVideoRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoRecorded: (videoBlob: Blob, metadata: {
    durationSeconds: number;
    mimeType: string;
    sizeBytes: number;
    hasAudio: boolean;
    fileName?: string;
  }) => void;
  existingVideoBlob?: Blob | null;
  incidentTitle?: string;
  incidentCategory?: string;
}

type RecorderPhase = 'permission_prompt' | 'live_preview' | 'recording' | 'review' | 'error';

export const EmergencyVideoRecorderModal: React.FC<EmergencyVideoRecorderModalProps> = ({
  isOpen,
  onClose,
  onVideoRecorded,
  existingVideoBlob,
  incidentTitle = 'Emergency Report',
  incidentCategory = 'General Emergency'
}) => {
  const [phase, setPhase] = useState<RecorderPhase>('permission_prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [hasAudioPermission, setHasAudioPermission] = useState(true);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(existingVideoBlob || null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [isGeneratingSimulated, setIsGeneratingSimulated] = useState(false);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_RECORDING_SECONDS = 30;

  // Cleanup helper to stop camera hardware tracks
  const stopLiveStream = useCallback(() => {
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      liveStreamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  }, []);

  // Clean timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // When modal closes, clean up memory and hardware
  useEffect(() => {
    if (!isOpen) {
      stopLiveStream();
      stopTimer();
      if (recordedUrl && !existingVideoBlob) {
        URL.revokeObjectURL(recordedUrl);
      }
      setPhase('permission_prompt');
      setErrorMessage(null);
      setRecordingSeconds(0);
    } else {
      if (existingVideoBlob) {
        const url = URL.createObjectURL(existingVideoBlob);
        setRecordedBlob(existingVideoBlob);
        setRecordedUrl(url);
        setPhase('review');
      } else {
        setPhase('permission_prompt');
      }
    }
  }, [isOpen, existingVideoBlob, stopLiveStream, stopTimer]);

  // Request camera and microphone access
  const handleRequestCamera = async () => {
    setErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('MediaDevices API is not supported by your browser. You can use simulation or file upload below.');
      setPhase('error');
      return;
    }

    try {
      // First attempt: Video + Audio
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        });
        setHasAudioPermission(true);
      } catch (err: any) {
        // Fallback to video only if microphone access is blocked or unavailable
        console.warn('Microphone failed, falling back to video-only stream:', err);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        setHasAudioPermission(false);
      }

      liveStreamRef.current = stream;

      // Assign to preview element
      setPhase('live_preview');

      // Small tick to ensure DOM is rendered
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play().catch((e) => console.warn('Preview play warning:', e));
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera access failed:', err);
      stopLiveStream();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Camera and microphone permissions were declined. Please allow camera access in your browser settings to record live footage, or use the simulated emergency video option below.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage(
          'No camera or recording device was detected on your system. You can test with the simulated emergency video option or upload a pre-recorded file.'
        );
      } else {
        setErrorMessage(`Unable to access camera: ${err.message || 'Unknown device error'}`);
      }
      setPhase('error');
    }
  };

  // Start MediaRecorder recording
  const handleStartRecording = () => {
    if (!liveStreamRef.current) return;

    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    // Pick best supported MIME type
    let mimeType = 'video/webm';
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }
    }

    try {
      const recorder = new MediaRecorder(liveStreamRef.current, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        const finalDuration = recordingSecondsRef.current || 1;
        setRecordedDuration(finalDuration);
        setRecordedBlob(fullBlob);

        const url = URL.createObjectURL(fullBlob);
        setRecordedUrl(url);

        // Hardware release
        stopLiveStream();
        setPhase('review');
      };

      recorder.start(500); // 500ms timeSlice chunks
      setPhase('recording');

      // Start recording timer with automatic 30s stop
      let elapsed = 0;
      recordingSecondsRef.current = 0;
      timerIntervalRef.current = window.setInterval(() => {
        elapsed += 1;
        recordingSecondsRef.current = elapsed;
        setRecordingSeconds(elapsed);

        if (elapsed >= MAX_RECORDING_SECONDS) {
          stopTimer();
          handleStopRecording();
        }
      }, 1000);
    } catch (err: any) {
      console.error('Failed to initialize MediaRecorder:', err);
      setErrorMessage(`Failed to start recording: ${err.message}`);
      setPhase('error');
    }
  };

  // Ref to hold exact recording seconds inside intervals
  const recordingSecondsRef = useRef(0);

  // Stop MediaRecorder recording
  const handleStopRecording = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping media recorder:', e);
      }
    }
  };

  // Retake video: discard review and open camera stream again
  const handleRetake = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setRecordedBlob(null);
    setRecordedDuration(0);
    setRecordingSeconds(0);
    handleRequestCamera();
  };

  // Delete video and reset
  const handleDelete = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setRecordedBlob(null);
    setRecordedDuration(0);
    setRecordingSeconds(0);
    stopLiveStream();
    setPhase('permission_prompt');
  };

  // Final confirmation: Attach video to report
  const handleAttachVideo = () => {
    if (!recordedBlob) return;

    onVideoRecorded(recordedBlob, {
      durationSeconds: recordedDuration || 1,
      mimeType: recordedBlob.type || 'video/webm',
      sizeBytes: recordedBlob.size,
      hasAudio: hasAudioPermission,
      fileName: `evidence_${Date.now()}.webm`
    });

    onClose();
  };

  // Simulated emergency video generator (for zero-hardware/denied environments)
  const handleCreateSimulatedVideo = async () => {
    setIsGeneratingSimulated(true);
    setErrorMessage(null);
    try {
      const sim = await generateSimulatedVideoBlob(
        incidentTitle || 'Emergency Scene Evidence',
        incidentCategory || 'Emergency Hazard',
        6 // 6 seconds simulation
      );
      setRecordedBlob(sim.blob);
      setRecordedDuration(sim.duration);
      const url = URL.createObjectURL(sim.blob);
      setRecordedUrl(url);
      setPhase('review');
    } catch (err: any) {
      console.error('Failed to generate simulated video:', err);
      setErrorMessage('Could not generate simulated video. Please upload a file instead.');
    } finally {
      setIsGeneratingSimulated(false);
    }
  };

  // File upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 30MB
    if (file.size > 30 * 1024 * 1024) {
      setErrorMessage('Video file is larger than 30MB. Please select a shorter emergency clip.');
      return;
    }

    setRecordedBlob(file);
    setRecordedDuration(15);
    const url = URL.createObjectURL(file);
    setRecordedUrl(url);
    setPhase('review');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Emergency Video Evidence Capture
                </h3>
                <span className="font-mono text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded uppercase font-semibold">
                  Max 30s
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Capture situational footage for first responder visual assessment
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopLiveStream();
              stopTimer();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Phase 1: Permission & Safety Prompt */}
          {phase === 'permission_prompt' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600/30 to-amber-600/20 border border-rose-500/40 mx-auto flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/40">
                <Camera className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Capture Live Emergency Video</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                  ResQ uses browser <span className="font-mono text-cyan-400">MediaDevices</span> to capture short video evidence. Recordings are saved in local IndexedDB storage and sealed with your incident report.
                </p>
              </div>

              {/* Safety Advisory Banner */}
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/50 text-left space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Citizen Safety Advisory (Critical)</span>
                </div>
                <p className="text-amber-200/90 text-[11px] leading-relaxed">
                  • Only record from a safe distance. Never put yourself or others in danger.<br />
                  • Do not enter burning structures, rising floodwaters, or active traffic lanes.<br />
                  • Video evidence is completely <strong className="text-white">optional</strong>—you can submit your report without video at any time.
                </p>
              </div>

              {/* Privacy Notice */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left flex items-start gap-2.5 text-xs text-slate-400">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong className="text-slate-200">Privacy Safeguard: </strong>
                  The camera will not activate until you click below. Recording only begins after you click <span className="text-rose-400 font-semibold">Start Recording</span>. No video is uploaded without your explicit confirmation.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRequestCamera}
                  className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950 flex items-center justify-center gap-2 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Grant Permission & Open Camera</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateSimulatedVideo}
                  disabled={isGeneratingSimulated}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{isGeneratingSimulated ? 'Generating...' : 'Simulate Evidence (Canvas)'}</span>
                </button>
              </div>

              <div className="pt-1">
                <label className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer underline flex items-center justify-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Or upload a pre-recorded video file</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Phase 2 & 3: Live Preview & Recording */}
          {(phase === 'live_preview' || phase === 'recording') && (
            <div className="space-y-3">
              {/* Live Video Canvas Container */}
              <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden border border-slate-800 shadow-inner">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />

                {/* Status Badges Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {phase === 'recording' ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600 text-white font-mono text-xs font-bold tracking-wider animate-pulse shadow-lg">
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                      <span>REC {recordingSeconds < 10 ? `00:0${recordingSeconds}` : `00:${recordingSeconds}`} / 00:30</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white font-mono text-[11px]">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>LIVE CAM READY</span>
                    </div>
                  )}

                  <div className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300 text-[10px] flex items-center gap-1">
                    {hasAudioPermission ? (
                      <>
                        <Mic className="w-3 h-3 text-emerald-400" />
                        <span>MIC ON</span>
                      </>
                    ) : (
                      <>
                        <MicOff className="w-3 h-3 text-amber-400" />
                        <span>VIDEO ONLY</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar during recording */}
                {phase === 'recording' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${(recordingSeconds / MAX_RECORDING_SECONDS) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Safety notice in preview */}
              <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Record safely from a secure vantage point
                </span>
                <span className="font-mono text-slate-400">
                  {MAX_RECORDING_SECONDS - recordingSeconds}s remaining
                </span>
              </div>

              {/* Recording Controls */}
              <div className="pt-2 flex items-center justify-center gap-3">
                {phase === 'live_preview' && (
                  <>
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950 flex items-center gap-2 transition-all transform active:scale-95"
                    >
                      <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                      <span>Start Recording</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopLiveStream();
                        setPhase('permission_prompt');
                      }}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                    >
                      Back
                    </button>
                  </>
                )}

                {phase === 'recording' && (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950 flex items-center gap-2 transition-all transform active:scale-95 animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Stop Recording</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Phase 4: Review Recorded Video */}
          {phase === 'review' && recordedUrl && (
            <div className="space-y-4">
              <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden border border-slate-800 shadow-md">
                <video
                  src={recordedUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Video Metadata Pills */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">Emergency Video Ready</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                  <span>Duration: ~{recordedDuration}s</span>
                  <span>·</span>
                  <span>Size: {recordedBlob ? (recordedBlob.size / 1024 / 1024).toFixed(2) : '0'} MB</span>
                  <span>·</span>
                  <span className="text-cyan-400">IndexedDB Ready</span>
                </div>
              </div>

              {/* Action Buttons: Attach, Retake, Delete */}
              <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Video</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAttachVideo}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Attach Video to Report</span>
                </button>
              </div>
            </div>
          )}

          {/* Phase 5: Error State */}
          {phase === 'error' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-600/60 mx-auto flex items-center justify-center text-rose-400">
                <VideoOff className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">Camera Access Notice</h4>
                <p className="text-xs text-rose-300 max-w-md mx-auto mt-1 leading-relaxed">
                  {errorMessage || 'Unable to open camera hardware.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1 text-slate-300">
                <span className="font-semibold text-white block">Next steps:</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  1. Check if another application (Zoom, Teams, Camera) is using your webcam.<br />
                  2. In your browser bar, tap the lock/camera icon and set camera to "Allow".<br />
                  3. Or generate a simulated tactical footage stream below for instant evaluation.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRequestCamera}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                >
                  Retry Camera
                </button>

                <button
                  type="button"
                  onClick={handleCreateSimulatedVideo}
                  disabled={isGeneratingSimulated}
                  className="w-full sm:w-auto px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isGeneratingSimulated ? 'Generating...' : 'Use Simulated Video'}</span>
                </button>
              </div>

              <div className="pt-1">
                <label className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer underline flex items-center justify-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload local video file instead</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>IndexedDB Encrypted Local Storage</span>
          </div>

          <button
            type="button"
            onClick={() => {
              stopLiveStream();
              stopTimer();
              onClose();
            }}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            Proceed Without Video
          </button>
        </div>
      </div>
    </div>
  );
};
