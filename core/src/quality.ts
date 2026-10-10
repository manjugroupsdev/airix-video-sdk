import { ScreenSharePresets, VideoPresets } from 'livekit-client'
import type { RoomOptions, VideoEncoding } from 'livekit-client'
import type { AirixVideoQualityProfile } from './types.js'

const PROFILE_OPTIONS: Record<AirixVideoQualityProfile, RoomOptions> = {
  auto: {
    videoCaptureDefaults: {
      resolution: VideoPresets.h1080.resolution,
    },
    publishDefaults: {
      screenShareEncoding: {
        maxBitrate: 5_000_000,
        maxFramerate: 30,
      },
      simulcast: true,
      videoEncoding: {
        maxBitrate: 4_000_000,
        maxFramerate: 30,
      },
      videoSimulcastLayers: [
        VideoPresets.h180,
        VideoPresets.h360,
        VideoPresets.h720,
      ],
    },
  },
  hd: {
    videoCaptureDefaults: {
      resolution: VideoPresets.h1080.resolution,
    },
    publishDefaults: {
      screenShareEncoding: {
        maxBitrate: 5_000_000,
        maxFramerate: 30,
      },
      simulcast: true,
      videoEncoding: {
        maxBitrate: 4_000_000,
        maxFramerate: 30,
      },
      videoSimulcastLayers: [VideoPresets.h360, VideoPresets.h720],
    },
  },
  'data-saver': {
    videoCaptureDefaults: {
      resolution: VideoPresets.h360.resolution,
    },
    publishDefaults: {
      screenShareEncoding: ScreenSharePresets.h720fps15.encoding,
      simulcast: true,
      videoEncoding: {
        maxBitrate: 600_000,
        maxFramerate: 20,
      },
      videoSimulcastLayers: [VideoPresets.h180],
    },
  },
}

export const createAirixRoomOptions = (
  profile: AirixVideoQualityProfile = 'auto',
  overrides: RoomOptions = {},
): RoomOptions => {
  const defaults = PROFILE_OPTIONS[profile]

  return {
    adaptiveStream: true,
    dynacast: true,
    ...defaults,
    ...overrides,
    publishDefaults: {
      ...defaults.publishDefaults,
      ...overrides.publishDefaults,
      screenShareEncoding: mergeEncoding(
        defaults.publishDefaults?.screenShareEncoding,
        overrides.publishDefaults?.screenShareEncoding,
      ),
      videoEncoding: mergeEncoding(
        defaults.publishDefaults?.videoEncoding,
        overrides.publishDefaults?.videoEncoding,
      ),
    },
    videoCaptureDefaults: {
      ...defaults.videoCaptureDefaults,
      ...overrides.videoCaptureDefaults,
      resolution:
        overrides.videoCaptureDefaults?.resolution ??
        defaults.videoCaptureDefaults?.resolution,
    },
  }
}

const mergeEncoding = (
  defaults?: VideoEncoding,
  overrides?: VideoEncoding,
): VideoEncoding | undefined => {
  if (!overrides) return defaults

  return {
    ...defaults,
    ...overrides,
    maxBitrate: overrides.maxBitrate,
  }
}
