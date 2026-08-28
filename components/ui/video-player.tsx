"use client"

import * as React from "react"
import { Play, Pause, SpeakerHigh as Volume2, SpeakerSlash as VolumeX, ArrowsOut as Maximize, ArrowsIn as Minimize } from '@phosphor-icons/react';import { cn } from "@/lib/utils"
import { Button } from "./button"
import { useLocale } from '@/hooks/use-locale'

type KitT = ReturnType<typeof useLocale>['t'] & { kitUi: Record<string, string> };

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
  autoPlay?: boolean
}

export function VideoPlayer({ src, poster, className, autoPlay = false }: VideoPlayerProps) {
  const { t: loc } = useLocale()
  const t = loc as KitT
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  // v12.342: say so when load fails. <video> had no onError — a missing asset
  // (serve-file 404) left a blank surface and the user could only guess network
  // vs a mis-click. After scheduled cleanup wiped the owner's 30 historical
  // projects, this was exactly the "nothing here, and nothing said" state.
  const [loadError, setLoadError] = React.useState<string>('')

  // Clear the old error when src changes, or a fix still shows the previous message
  React.useEffect(() => { setLoadError('') }, [src])

  const handleError = React.useCallback(async () => {
    // "file is gone" vs "could not load right now" mean different things to the user
    let msg = t.product.videoLoadFail
    try {
      const r = await fetch(src, { method: 'HEAD' })
      if (r.status === 404) msg = t.kitUi.assetLost
      else if (r.status === 403) msg = t.kitUi.assetForbidden
      else if (!r.ok) msg = t.kitUi.assetHttp.replace('{n}', String(r.status))
    } catch { msg = t.kitUi.videoLoadNetwork }
    setLoadError(msg)
  }, [src, t])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn("relative group rounded-lg overflow-hidden bg-black", className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        autoPlay={autoPlay}
        onClick={togglePlay}
        onError={handleError}
      />

      {loadError && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/80 text-center px-4"
        >
          <p className="text-sm text-red-300">{loadError}</p>
          <p className="text-[11px] text-white/50 break-all">{src}</p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 mb-2 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#E8C547]"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="p-2"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="p-2"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            <span className="text-sm text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="p-2"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
