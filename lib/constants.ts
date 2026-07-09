// Central place for all event copy and show timings.
// Replace PLEDGE_TEXT with the final approved pledge before the event.

export const BRAND_NAME = "Vaseline";

export const PLEDGE_TEXT =
  "I pledge to care for my skin and the skin of those around me. " +
  "I commit to sharing the gift of healing, protecting what matters, " +
  "and standing together for healthier skin for everyone, everywhere. " +
  "Today, I take this pledge — because every skin deserves care.";

export const AGREE_BUTTON_LABEL = "I Agree";
export const USER_THANK_YOU = "Thank you for taking the pledge";
export const LED_THANK_YOU = "THANK YOU FOR TAKING THE PLEDGE";

// Live count: SSE is the primary channel; this poll is only a safety net.
export const FALLBACK_POLL_INTERVAL_MS = 10000;

// LED show timings (ms)
export const COUNTDOWN_FROM = 10;
export const COUNTDOWN_STEP_MS = 1000;
export const COUNTDOWN_END_PAUSE_MS = 800;
export const VIDEO_END_FREEZE_MS = 5000;
export const COUNTER_SPIN_MS = 4000;
export const COUNTER_HOLD_MS = 3000;
export const COUNTER_STAGGER_MS = 800;

// Celebration overlay
export const OVERLAY_SPAWNS_PER_SECOND = 10;
export const OVERLAY_IMAGE_SRC = "/Agree.png";
// Buttons scatter at random anywhere on screen EXCEPT a protected central box
// where the video/logo plays. These are that box's size as a fraction of the
// screen width/height.
export const OVERLAY_CENTER_EXCLUDE_W = 0.62;
export const OVERLAY_CENTER_EXCLUDE_H = 0.5;
