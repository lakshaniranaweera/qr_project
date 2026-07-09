// Central place for all event copy and show timings.
// Replace PLEDGE_TEXT with the final approved pledge before the event.

export const BRAND_NAME = "Vaseline";

export const PLEDGE_TEXT =
  "We pledge to bring Vaseline Gluta Hya to every shelf,  " +
  "skin confidence to every shopper & excellence to " +
  "every execution. " 
  ;

export const AGREE_BUTTON_LABEL = "I Agree";
export const USER_THANK_YOU = "Thank you for taking the pledge";
export const LED_THANK_YOU = "THANK YOU FOR TAKING THE PLEDGE";

// Fixed number the LED slot-machine counters lock onto. Edit this to set the
// displayed total for the show — it is no longer tied to real submissions.
export const LED_FIXED_COUNT = 500;

// LED show timings (ms)
// Brief hold after the fire countdown video ends before the video phase.
export const COUNTDOWN_END_PAUSE_MS = 800;
export const VIDEO_END_FREEZE_MS = 5000;
export const COUNTER_SPIN_MS = 4000;
export const COUNTER_HOLD_MS = 3000;
// The step-4 bottom reel never stops — it counts up endlessly. This is how
// fast its fastest (ones) wheel rolls, in digits per second. Lower = slower.
export const BOTTOM_COUNTER_ROLL_PER_SEC = 13;

// Celebration overlay
export const OVERLAY_SPAWNS_PER_SECOND = 10;
// Message SFX during the video phase: each second fires a random number of
// plays in this inclusive range.
export const MESSAGE_PLAYS_PER_SEC_MIN = 1;
export const MESSAGE_PLAYS_PER_SEC_MAX = 5;
export const OVERLAY_IMAGE_SRC = "/Agree.png";
// Buttons scatter at random anywhere on screen EXCEPT a protected central box
// where the video/logo plays. These are that box's size as a fraction of the
// screen width/height.
export const OVERLAY_CENTER_EXCLUDE_W = 0.62;
export const OVERLAY_CENTER_EXCLUDE_H = 0.5;
