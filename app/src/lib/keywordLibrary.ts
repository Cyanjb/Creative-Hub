/**
 * Cinematography Keyword Library.
 *
 * Ported from Cyan's Craft doc "Cinematography Keyword Library" (Keyword
 * Library folder), which is the plain-English glossary version of the
 * vocabulary the director skills assume you already know.
 *
 * Kept in the app rather than in a skill file so terms are searchable and
 * one-click insertable into any prompt block.
 */

export interface Keyword {
  term: string;
  /** What it means, in plain English. */
  meaning: string;
  /** When to reach for it. */
  useWhen: string;
  /** Drop-in phrasing. This is what the Insert button writes. */
  example: string;
}

export interface KeywordCategory {
  id: string;
  name: string;
  icon: string;
  items: Keyword[];
}

export const KEYWORD_LIBRARY: KeywordCategory[] = [
  {
    id: 'lenses',
    name: 'Lenses',
    icon: '◎',
    items: [
      { term: '24mm', meaning: 'A wide lens that shows lots of the scene at once. Makes spaces feel big and puts the viewer inside the action.', useWhen: 'Establishing a location, showing a crowd, or shooting action close up while still seeing the environment.', example: '24mm wide shot of a bustling night market' },
      { term: '28mm', meaning: 'Slightly less wide than 24mm. Still roomy but feels more natural, less distorted at the edges.', useWhen: 'You want a wide feel without the fisheye pull on faces or buildings.', example: '28mm shot of a woman walking through her apartment' },
      { term: '35mm', meaning: 'The most-used lens in film. Matches how your eyes see the world. Wide enough for context, tight enough to feel personal.', useWhen: "You're not sure what lens to pick. It almost always works.", example: '35mm shot of two friends talking at a café table' },
      { term: '50mm', meaning: 'The nifty fifty. Shows things close to how a human sees them. Flattering on faces, natural on objects.', useWhen: 'You want a classic, grounded, realistic look. Great for portraits and dialogue.', example: '50mm close-up of the chef plating the dish' },
      { term: '85mm', meaning: 'A portrait lens. Crops in tight, blurs the background, makes the subject pop.', useWhen: 'You want a beautiful face shot or to isolate one subject from everything around them.', example: '85mm portrait of her turning toward the camera, soft background blur' },
      { term: 'Anamorphic', meaning: 'Gives the wide, letterbox, oval-flare look of big-budget film — Blade Runner, Dune.', useWhen: 'You want instant cinema-grade prestige. Adds horizontal flares and a squeezed, dreamy feel.', example: 'anamorphic lens, horizontal lens flares across the frame' },
      { term: 'Macro', meaning: 'Extreme close-up lens for tiny details. Textures, water drops, fabric threads.', useWhen: 'You want to zoom in on something small and make it feel huge.', example: 'macro shot of a raindrop sliding down a leaf' },
      { term: 'Ultra-wide', meaning: 'Wider than 24mm. Stretches and exaggerates space. Dramatic or disorienting.', useWhen: 'You want impact, scale, or a slightly unreal feeling.', example: 'ultra-wide low shot of the skyscraper towering overhead' },
      { term: 'Probe lens (8mm)', meaning: 'A skinny lens that gets into tiny spaces — cups, mouths, machinery.', useWhen: 'You want a weird, surprising angle from inside something.', example: 'probe lens shot from inside the glass as wine pours in' },
    ],
  },
  {
    id: 'shot-sizes',
    name: 'Shot Sizes',
    icon: '▭',
    items: [
      { term: 'Wide shot (WS)', meaning: 'Shows the full scene — people, location, everything around them.', useWhen: 'The viewer needs to understand where the scene takes place before you go closer.', example: 'wide shot of the desert highway stretching to the horizon' },
      { term: 'Medium shot (MS)', meaning: 'A person from about the waist up. Body language plus face.', useWhen: 'A character is doing something and you still want their expression.', example: 'medium shot of her pouring coffee, shoulders visible' },
      { term: 'Medium close-up (MCU)', meaning: 'From the chest up. Tighter than medium, looser than close-up.', useWhen: 'You want a conversational, intimate feel without going all the way in.', example: 'medium close-up of him leaning in to whisper' },
      { term: 'Close-up (CU)', meaning: 'Just the face, or one detail — a hand, a ring, an eye.', useWhen: 'You want emotion, intensity, or to highlight something important.', example: 'close-up of her eyes widening' },
      { term: 'Extreme close-up (ECU)', meaning: 'Super tight. One eye. A single drop of sweat.', useWhen: 'Maximum intensity, or one tiny detail carrying the beat.', example: 'extreme close-up on the trembling fingertip' },
      { term: 'Over-the-shoulder (OTS)', meaning: "Looking at one person from behind another's shoulder.", useWhen: 'Two characters are talking. The standard coverage for conversation.', example: 'over-the-shoulder shot of her facing him across the table' },
      { term: 'POV', meaning: 'The camera sees exactly what a character sees.', useWhen: 'You want the viewer to feel like they are the character.', example: 'POV shot: hands gripping the steering wheel as the road rushes toward us' },
      { term: 'Full body', meaning: 'Head to feet, nothing cut off.', useWhen: 'Showing an outfit, a pose, a dance move, or a full action.', example: 'full body shot of the dancer mid-leap' },
      { term: 'Insert shot', meaning: 'A quick cut to a small detail — a text message, a watch, a doorknob.', useWhen: 'You want to highlight a specific object or piece of information fast.', example: 'insert shot of her phone lighting up with a message' },
    ],
  },
  {
    id: 'angles',
    name: 'Camera Angles',
    icon: '◺',
    items: [
      { term: 'Eye level', meaning: "Camera at the subject's eye height. Neutral, grounded, honest.", useWhen: 'You want the shot to feel calm and natural, no drama added.', example: 'eye-level shot of the interviewer smiling' },
      { term: 'Low angle', meaning: 'Camera below the subject, looking up. Makes them powerful, tall, heroic or threatening.', useWhen: 'Someone should feel dominant, larger than life, or intimidating.', example: 'low angle shot of the boxer staring down at the camera' },
      { term: 'High angle', meaning: 'Camera above, looking down. Makes them small, vulnerable, defeated.', useWhen: 'Someone should feel weak, lost, or overwhelmed.', example: 'high angle shot of the child alone in the empty hallway' },
      { term: 'Overhead / bird’s-eye', meaning: 'Directly above, pointing straight down. Turns the scene into a pattern or map.', useWhen: 'Showing layout, geometry, or a satisfying planning visual.', example: 'overhead shot of hands arranging ingredients on the counter' },
      { term: 'Dutch angle', meaning: 'Camera tilted so the horizon slants. Feels off, wrong, chaotic, dreamlike.', useWhen: 'Unease, tension, horror, comedy chaos, disorientation. 5–15°; more only at chaos peaks.', example: 'dutch angle shot of the hallway as the lights flicker' },
      { term: 'Ground level', meaning: 'Camera on or near the floor. Extreme low angle.', useWhen: 'Making something at ground level feel huge — feet, wheels, something rolling.', example: 'ground level shot of sneakers hitting the pavement at a sprint' },
      { term: 'Crane / aerial', meaning: 'High in the air, climbing or looking down.', useWhen: 'Scale, grandeur, or revealing something slowly as the camera rises.', example: 'crane shot rising up to reveal the full stadium' },
      { term: 'Profile', meaning: 'Directly beside the subject, showing them from the side.', useWhen: 'A silhouette, a clean graphic look, or two characters facing each other.', example: 'profile shot of her staring out the window' },
    ],
  },
  {
    id: 'movement',
    name: 'Camera Movement',
    icon: '⇄',
    items: [
      { term: 'Static / locked off', meaning: "The camera doesn't move at all.", useWhen: 'Stillness, focus, a poster-frame feel. The strongest way to end a clip.', example: 'static shot of her standing alone in the doorway' },
      { term: 'Pan', meaning: 'Camera stays put and turns left or right, like a head turning.', useWhen: 'Showing a wide space or following something across the frame.', example: 'slow pan across the skyline at dawn' },
      { term: 'Tilt', meaning: 'Camera stays put and tips up or down, like a nod.', useWhen: 'Revealing height — a tall building, a full outfit head-to-toe.', example: 'tilt up from her shoes to her face' },
      { term: 'Push-in', meaning: 'Camera moves toward the subject. Builds tension or focus.', useWhen: 'You want the viewer to lean in. Great for emotional beats and reveals.', example: 'slow push-in on his face as he realizes the truth' },
      { term: 'Pull-out', meaning: 'Camera moves away. Reveals more of the scene or creates distance.', useWhen: 'Showing context, or ending a shot by opening it up.', example: 'pull-out from the single candle to reveal the dark cathedral' },
      { term: 'Tracking shot', meaning: 'Camera moves alongside the subject, keeping pace.', useWhen: 'Following someone walking, running, or driving.', example: 'tracking shot alongside the runner on the beach' },
      { term: 'Follow shot', meaning: 'Camera moves behind the subject, following from the rear.', useWhen: 'The viewer should feel like they are trailing someone into a space.', example: 'follow shot of her walking into the crowded market' },
      { term: 'Dolly', meaning: 'Camera rolls smoothly on wheels or track. Graceful push or pull.', useWhen: 'A polished, deliberate move. Feels expensive.', example: 'slow dolly in on the chessboard' },
      { term: 'Handheld', meaning: 'Held by a person, so it shakes and drifts naturally.', useWhen: 'Realism, urgency, documentary feel, chaos.', example: 'handheld shot of her pushing through the protest crowd' },
      { term: 'Steadicam', meaning: 'Smooth, floating movement. The camera glides.', useWhen: 'A flowing, dreamy, immersive walk-through feel.', example: 'steadicam following the waiter through the restaurant' },
      { term: 'Orbit', meaning: 'Camera circles the subject while they stay centred.', useWhen: 'Showing every side of something, or a bullet-time feel.', example: '360-degree orbit around the frozen fighter mid-punch' },
      { term: 'Arc', meaning: 'A partial orbit — the camera curves around without going all the way.', useWhen: 'A graceful reveal.', example: 'arc shot around the couple as they embrace' },
      { term: 'Rise / climb', meaning: 'Camera moves straight up.', useWhen: 'Revealing height or scale, or lifting away at the end of a shot.', example: 'camera rises slowly from her face to the ceiling fan spinning above' },
      { term: 'Drop / descend', meaning: 'Camera moves straight down.', useWhen: 'Landing on a subject or dropping into a scene.', example: 'camera descends from the clouds to the single figure on the mountaintop' },
      { term: 'Whip-pan', meaning: 'A very fast pan, fast enough to blur. Often a transition.', useWhen: 'Energy, comedy timing, or moving to a new scene quickly.', example: 'whip-pan from his shocked face to the exploding car' },
      { term: 'Snap zoom', meaning: 'A sudden, not-smooth zoom. Aggressive or comedic.', useWhen: 'Punch, surprise, a zoom that says look at THIS.', example: 'snap zoom onto the ticking clock' },
      { term: 'Zoom', meaning: "The lens adjusts rather than the camera moving. Different from a push-in.", useWhen: 'A quick shift in focus without repositioning the camera.', example: 'slow zoom in on the painting on the wall' },
      { term: 'Rack focus', meaning: 'Focus shifts from one subject to another within the same shot.', useWhen: 'Redirecting attention mid-shot without cutting. One per scene maximum.', example: 'rack focus from the wine glass in the foreground to her face behind it' },
      { term: 'Glide / drift', meaning: 'Gentle, slow, smooth motion. Barely there, but adds life.', useWhen: 'Calm beauty. Portraits, landscapes, still moments that should still breathe.', example: 'camera glides slowly past the sleeping child' },
      { term: 'Spiral', meaning: 'The camera rotates as it moves — twisting, dreamlike.', useWhen: 'Surreal, dramatic, falling-into-a-memory energy.', example: 'spiral shot descending into the stairwell' },
      { term: 'FPV', meaning: 'Fast, drone-like flying camera that dives and swoops through spaces.', useWhen: 'High-energy, immersive motion through a location.', example: 'FPV drone flying through the abandoned warehouse' },
    ],
  },
  {
    id: 'transitions',
    name: 'Cuts & Transitions',
    icon: '✂',
    items: [
      { term: 'Cut to', meaning: 'The simplest transition. One shot ends, the next begins.', useWhen: 'The default. 90% of edits work this way.', example: 'cut to the next morning' },
      { term: 'Hard cut', meaning: 'An abrupt cut between very different shots. Jarring on purpose.', useWhen: 'Shock, surprise, emotional whiplash.', example: 'hard cut from the quiet kitchen to the roaring nightclub' },
      { term: 'Match cut', meaning: 'Two shots share a shape, movement or position so they feel connected.', useWhen: 'A transition that feels smart, symbolic, poetic.', example: 'match cut from a bone tossed in the air to a spaceship drifting in orbit' },
      { term: 'Smash cut', meaning: 'A sudden cut between two extreme contrasts. Loud to quiet, calm to chaos.', useWhen: 'Dramatic impact. Action or comedy.', example: 'smash cut from her peaceful sleep to the alarm screaming' },
      { term: 'Quick cut', meaning: 'A sequence of very short shots cut together fast.', useWhen: 'Energy, montage feel, compressing a lot of action.', example: 'rapid cuts of her packing her bag, grabbing her keys, slamming the door' },
      { term: 'Cut on action', meaning: 'Cutting mid-motion so the action continues across the cut.', useWhen: 'Invisible, flowing edits. Standard for fights and sports.', example: 'cut on action as she throws the punch' },
      { term: 'Jump cut', meaning: 'A cut between two similar shots where something suddenly changes. Glitchy.', useWhen: 'Disorientation, passage of time, modern vlog feel.', example: "jump cut: she's standing, then sitting, then gone" },
      { term: 'Fade to black', meaning: 'The image gradually dims to black or white.', useWhen: 'Ending a scene with finality, emotional weight, or rest.', example: 'fade to black on her closing eyes' },
      { term: 'Sound bridge', meaning: 'Sound from the next scene starts before the picture cuts to it.', useWhen: 'A smooth, cinematic bridge between locations.', example: 'sound bridge: we hear the ocean before we see it' },
    ],
  },
  {
    id: 'lighting',
    name: 'Lighting',
    icon: '☀',
    items: [
      { term: 'Natural light', meaning: "Sunlight, daylight, whatever's already there. No added lamps.", useWhen: 'Realism, documentary feel, a soft untouched look.', example: 'lit by natural light from the open window' },
      { term: 'Golden hour', meaning: 'The hour after sunrise or before sunset. Warm, soft, glowing.', useWhen: 'Romantic, flattering, beautiful light.', example: 'golden hour light pouring across her face' },
      { term: 'Blue hour', meaning: 'Just before sunrise or after sunset — sky deep blue but not yet dark.', useWhen: 'Moody, cool, cinematic atmosphere.', example: 'blue hour light over the quiet city' },
      { term: 'Neon', meaning: 'Bright coloured electric light. The signature look of night cities and bars.', useWhen: 'Modern, edgy, night-time mood with strong colour.', example: 'neon pink and blue lighting the alley' },
      { term: 'Bloom', meaning: 'A soft glow around bright light sources, like halos.', useWhen: 'Dreamy, cinematic, slightly unreal light.', example: 'bloom glowing off the streetlamps' },
      { term: 'Volumetric lighting', meaning: 'Visible beams where you can see dust, fog or mist in the air.', useWhen: 'Atmosphere, depth, a god-rays feel.', example: 'volumetric light streaming through the cathedral windows' },
      { term: 'Practical light', meaning: 'Light from things actually in the scene — lamps, candles, TVs, phones.', useWhen: 'Realism, and light that feels motivated by the space itself.', example: 'lit only by the practical glow of the TV in the dark room' },
      { term: 'Backlight', meaning: 'Light from behind the subject, making them glow at the edges or silhouette.', useWhen: 'A halo, a silhouette, or separating a character from the background.', example: 'strong backlight turning her hair into a glow' },
      { term: 'Rim light', meaning: 'A thin edge of light outlining the subject from the side or behind.', useWhen: 'The subject should pop against a dark background.', example: 'rim light catching the edge of his jawline' },
      { term: 'Hard shadows', meaning: 'Sharp, clearly defined shadows. Dramatic, contrasty, intense.', useWhen: 'Noir, tension, strong graphic contrast.', example: 'hard shadows from the venetian blinds across her face' },
      { term: 'Soft light', meaning: 'Diffused, gentle light with barely any shadows.', useWhen: 'Flattering, calm, warm, dreamy visuals.', example: 'soft light filling the nursery' },
      { term: 'High-key', meaning: 'Bright, evenly lit, minimal shadows. Clean and cheerful.', useWhen: 'Commercial, happy, open, beauty-ad feel.', example: 'high-key lighting on the white kitchen set' },
      { term: 'Low-key', meaning: 'Mostly dark with small areas of light. Moody and dramatic.', useWhen: 'Tension, mystery, thriller or horror atmosphere.', example: 'low-key lighting, her face half in shadow' },
      { term: 'Fluorescent', meaning: 'The flat, green-blue light of offices, gas stations, hospitals.', useWhen: 'Clinical, uncomfortable, mundane, unsettling.', example: 'fluorescent lighting in the empty break room' },
      { term: 'Bioluminescence', meaning: 'Glowing from within — jellyfish, fireflies, glowing mushrooms.', useWhen: 'Magical, underwater, otherworldly glow.', example: 'bioluminescent plants glowing in the forest floor' },
      { term: 'Lens flare', meaning: 'Streaks or dots of light caused by light hitting the lens.', useWhen: 'Cinematic shine or sunny warmth.', example: 'lens flare as the sun breaks through the trees' },
      { term: 'Dappled light', meaning: 'Patches of light filtered through leaves, blinds, or patterns.', useWhen: 'Soft, textured, poetic light. Great outdoors under trees.', example: 'dappled light through the forest canopy' },
    ],
  },
  {
    id: 'depth',
    name: 'Depth & Focus',
    icon: '◑',
    items: [
      { term: 'Shallow depth of field', meaning: 'Subject sharp, everything else blurry.', useWhen: 'Isolating a person or object and melting the background away.', example: 'shallow depth of field, her face sharp, the crowd behind her blurred' },
      { term: 'Deep depth of field', meaning: 'Everything front to back is in focus.', useWhen: 'The viewer should see the full environment. Landscapes, wides.', example: 'deep depth of field, every layer of the valley in focus' },
      { term: 'Bokeh', meaning: 'The soft, round, glowing blur of out-of-focus lights.', useWhen: 'Dreamy, magical, romantic background lights.', example: 'string lights blurred into warm bokeh behind them' },
      { term: 'Sharp focus', meaning: 'The subject is in crisp, clear detail.', useWhen: 'Precision — a product, a face, a key detail.', example: 'sharp focus on the wristwatch' },
      { term: 'Focus hunt', meaning: 'The camera visibly searches for focus, drifting in and out.', useWhen: 'Handheld realism or a documentary moment.', example: 'focus shifts as the camera catches up with her turn' },
    ],
  },
  {
    id: 'time',
    name: 'Speed & Time',
    icon: '⏱',
    items: [
      { term: 'Slow motion', meaning: 'Movement plays slower than normal. Weighty and dramatic.', useWhen: 'Emotion, beauty, or stretching out an important moment.', example: 'slow motion as the water splashes upward' },
      { term: 'High-speed', meaning: 'Everything plays faster than real life.', useWhen: 'Compressing time, showing chaos, creating energy.', example: 'high-speed montage of the city waking up' },
      { term: 'Speed ramp', meaning: 'Footage smoothly changes speed mid-shot.', useWhen: 'A dynamic shift in energy, often at a hit or reveal.', example: 'speed ramp from slow-mo into full speed as he throws the punch' },
      { term: 'Bullet time', meaning: 'Camera orbits while everything else is frozen or extremely slow.', useWhen: 'A frozen moment viewed from every angle.', example: 'bullet time orbit around the fighter mid-kick' },
      { term: 'Time freeze', meaning: 'Everything stops except the camera, and sometimes one moving element.', useWhen: 'Drama, surrealism, isolating one thing still moving in a frozen world.', example: 'time freeze across the busy square, only she continues to walk' },
      { term: 'Stroboscopic', meaning: 'A flickering strobe effect where movement appears as stuttered frames.', useWhen: 'Club, chaos, horror, hallucinogenic feel.', example: 'stroboscopic flashes as she runs through the hallway' },
      { term: 'Time dilation', meaning: 'A stretched, elastic version of time. Some things slow, some normal.', useWhen: 'Dreamlike, psychological, or sci-fi effect.', example: 'time dilation: the crowd moves at half-speed while she moves at full' },
    ],
  },
  {
    id: 'stock',
    name: 'Cameras & Stock',
    icon: '🎞',
    items: [
      { term: 'Arri Alexa', meaning: 'A high-end professional cinema camera. Signals real-movie quality.', useWhen: 'Premium, cinematic, prestige-film look.', example: 'shot on Arri Alexa, cinematic colour' },
      { term: '35mm film', meaning: 'Traditional film stock. Organic grain, warmth, a slightly soft feel.', useWhen: 'A nostalgic, filmic, non-digital look.', example: 'shot on 35mm film with visible grain' },
      { term: 'Kodak Vision3', meaning: 'A modern film stock known for beautiful skin tones and rich colour.', useWhen: 'Warm, cinematic-with-soul.', example: 'Kodak Vision3 film stock, natural warm tones' },
      { term: 'iPhone', meaning: 'Naming a phone signals handheld, amateur, or documentary feel.', useWhen: 'Realism, home-video energy, found-footage vibes.', example: 'shot on iPhone, slightly unstable handheld' },
      { term: 'Film grain', meaning: 'The natural texture of film. Adds soul, removes the plastic digital feel.', useWhen: 'Warmth, authenticity, a vintage touch.', example: 'subtle film grain across the image' },
    ],
  },
  {
    id: 'post',
    name: 'Post & Grade',
    icon: '◧',
    items: [
      { term: 'Motion blur', meaning: 'Moving things leave a blur behind them, showing speed.', useWhen: 'Realistic fast motion or cinematic action.', example: 'motion blur on the racing car' },
      { term: 'High contrast', meaning: 'A strong difference between lights and darks. Bold and dramatic.', useWhen: 'Drama, graphic punch.', example: 'high contrast black and white image' },
      { term: 'Low contrast', meaning: 'Lights and darks sit close together. Soft and faded.', useWhen: 'Gentle or vintage moods.', example: 'low contrast, lifted blacks, faded vintage grade' },
      { term: 'Saturated', meaning: 'Colours are rich, bold and strong.', useWhen: 'Vibrant, punchy, stylised visuals.', example: 'saturated reds and yellows across the market stall' },
      { term: 'Desaturated', meaning: 'Colours are muted, washed out, leaning grey.', useWhen: 'Somber, gritty, documentary, melancholic.', example: 'desaturated palette, almost black and white' },
      { term: 'Colour grade', meaning: 'The overall colour treatment — warm, cold, teal-and-orange, vintage.', useWhen: 'Defining mood through colour.', example: 'warm amber colour grade, soft and nostalgic' },
      { term: 'Chromatic aberration', meaning: 'Colour fringing at the edges of bright objects.', useWhen: 'A glitchy, retro, or dreamy look. Never in cel animation.', example: 'chromatic aberration around the streetlight' },
      { term: 'Subsurface scattering', meaning: 'Light passes through a surface and glows softly from inside — skin, wax, leaves.', useWhen: 'Realistic, glowing skin or translucent materials.', example: 'subsurface scattering on her skin as sunlight hits it' },
      { term: 'Volumetric fog', meaning: 'Smoke or fog with depth that interacts with light beams.', useWhen: 'Atmosphere, mystery, god-ray effects.', example: 'volumetric fog rolling through the alley' },
      { term: 'Monochrome', meaning: 'Everything in one colour or greyscale.', useWhen: 'Stylised, artistic, classic film looks.', example: 'monochrome blue-tinted shot' },
    ],
  },
];

/** Flat list for search. */
export const ALL_KEYWORDS: Array<Keyword & { category: string }> = KEYWORD_LIBRARY.flatMap((c) =>
  c.items.map((k) => ({ ...k, category: c.name })),
);

export function searchKeywords(q: string): Array<Keyword & { category: string }> {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return ALL_KEYWORDS.filter(
    (k) =>
      k.term.toLowerCase().includes(t) ||
      k.meaning.toLowerCase().includes(t) ||
      k.useWhen.toLowerCase().includes(t) ||
      k.category.toLowerCase().includes(t),
  ).slice(0, 40);
}
