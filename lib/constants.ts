// Central place for all event copy and show timings.
// Replace PLEDGE_TEXT with the final approved pledge before the event.

export const BRAND_NAME = "Vaseline";

export const PLEDGE_TEXT =
  "We pledge to bring Vaseline Gluta Hya to every shelf, skin confidence to every shopper & excellence in every execution.\n\n" +
  "Vaseline Gluta-Hya සෑම පාරිභෝගිකයෙකුටම ළඟා කරවීමටත්, ඔවුන් තුළ සම පිළිබඳ විශ්වාසය ඇති කිරීමටත්, සෑම අලෙවියකදීම විශිෂ්ටත්වය පෙන්වීමටත් අපි පොරොන්දු වෙමු!\n\n" +
  "Vaseline Gluta-Hya ஒவ்வொரு வாடிக்கையாளரையும் சென்றடைவதற்கும், அவர்கள் மத்தியில் தங்கள் சருமத்தின் மீதான நம்பிக்கையை ஏற்படுத்தவும், ஒவ்வொரு விற்பனை நடவடிக்கையிலும் சிறந்த சேவையை வழங்கவும் நாம் உறுதியளிக்கிறோம்";

export const AGREE_BUTTON_LABEL = "I Agree";
export const USER_THANK_YOU = "THANK YOU FOR TAKING THE PLEDGE";
export const LED_THANK_YOU = "THANK YOU FOR TAKING THE PLEDGE";

// Fixed number the LED slot-machine counters lock onto. Edit this to set the
// displayed total for the show — it is no longer tied to real submissions.
export const LED_FIXED_COUNT = 304;

// LED show timings (ms)
// Brief hold after the fire countdown video ends before the video phase.
export const COUNTDOWN_END_PAUSE_MS = 800;
export const VIDEO_END_FREEZE_MS = 5000;
export const COUNTER_SPIN_MS = 4000;
export const COUNTER_HOLD_MS = 3000;
// The step-4 bottom reel never stops — it counts up endlessly. This is how
// fast its fastest (ones) wheel rolls, in digits per second. Lower = slower.
export const BOTTOM_COUNTER_ROLL_PER_SEC = 8;

// Celebration overlay
export const OVERLAY_SPAWNS_PER_SECOND = 8;
// Message SFX during the video phase: each second fires a random number of
// plays in this inclusive range.
export const MESSAGE_PLAYS_PER_SEC_MIN = 1;
export const MESSAGE_PLAYS_PER_SEC_MAX = 5;
export const OVERLAY_IMAGE_SRC = "/Agree.png";
