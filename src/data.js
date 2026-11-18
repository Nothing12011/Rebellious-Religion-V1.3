// ── Colors ──
export const COLORS = { push:"#e8614d", pull:"#4d8fe8", legs:"#48c47a", rest:"#b48ee8", fullbody:"#e8a84d" };
export const BODY_PARTS = ["Chest","Back","Shoulders","Arms","Legs","Core","Cardio","Full Body"];
export const BODY_PART_COLORS = {
  Chest:"#e8614d", Back:"#4d8fe8", Shoulders:"#e8a84d", Arms:"#d44dca",
  Legs:"#48c47a", Core:"#4dc9e8", Cardio:"#b48ee8", "Full Body":"#e8a84d"
};
export const EQUIPMENT = ["Barbell","Dumbbell","Cable","Machine","Smith Machine","Bodyweight","Kettlebell","Bands","Other"];

// ── FEATURE B: 20 muscle regions + display names ──
export const MUSCLE_REGIONS = [
  "chest_upper","chest_mid","front_delt","side_delt","rear_delt","biceps","triceps","forearms",
  "lats","traps_upper","traps_mid","lower_back","abs","obliques","glutes","quads","hamstrings","adductors","calves","neck"
];
export const MUSCLE_NAMES = {
  chest_upper:"Upper Chest", chest_mid:"Chest", front_delt:"Front Delts", side_delt:"Side Delts",
  rear_delt:"Rear Delts", biceps:"Biceps", triceps:"Triceps", forearms:"Forearms",
  lats:"Lats", traps_upper:"Upper Traps", traps_mid:"Mid Traps", lower_back:"Lower Back",
  abs:"Abs", obliques:"Obliques", glutes:"Glutes", quads:"Quads", hamstrings:"Hamstrings",
  adductors:"Adductors", calves:"Calves", neck:"Neck"
};
// Muscles important enough to nag about when cold (skip tiny/stabilizer ones)
export const MAJOR_MUSCLES = [
  "chest_upper","chest_mid","front_delt","side_delt","rear_delt","biceps","triceps",
  "lats","traps_upper","lower_back","abs","glutes","quads","hamstrings","calves"
];
// FEATURE B: weekly target + chip color thresholds (weighted sets)
export const WEEKLY_SET_TARGET = 12;
export const CHIP_THRESHOLDS = { blue: 4, purple: 8 }; // <4 blue, 4-8 purple, >=8 red
export const CHIP_COLORS = { blue:"#4d8fe8", purple:"#b48ee8", red:"#e8614d", grey:"#3a4550" };

// m(primary[], secondary[]) helper
const m = (primary, secondary=[]) => ({ primary, secondary });

const E = (name, sets, reps, parts, note, muscles, main=false) => ({name, sets, reps, parts, note, muscles, main});

// ── PRESETS ──
export const PRESETS = {
  push_a: { label:"Push A", category:"split", color:COLORS.push, subtitle:"Chest focus · Shoulders · Triceps",
    exercises:[
      E("Bench Press",4,"5",["Chest"],"Main lift. Full stop at chest, drive hard.",m(["chest_mid"],["front_delt","triceps"]),true),
      E("Incline Dumbbell Press",3,"8-10",["Chest"],"30-45° incline. Upper chest.",m(["chest_upper"],["front_delt","triceps"])),
      E("Cable Chest Fly",3,"12-15",["Chest"],"Squeeze hard at center.",m(["chest_mid"],["chest_upper"])),
      E("Dumbbell Shoulder Press",3,"8-10",["Shoulders"],"Control the descent.",m(["front_delt"],["side_delt","triceps"])),
      E("Lateral Raise",3,"12-15",["Shoulders"],"Strict form, light weight.",m(["side_delt"],[])),
      E("Tricep Pushdown",3,"12",["Arms"],"Elbows pinned, full extension.",m(["triceps"],[])),
    ]},
  push_b: { label:"Push B", category:"split", color:COLORS.push, subtitle:"Shoulder focus · Chest · Triceps",
    exercises:[
      E("Overhead Press",4,"5",["Shoulders"],"Main lift. Brace core, press overhead.",m(["front_delt"],["side_delt","triceps"]),true),
      E("Flat Dumbbell Press",3,"8-10",["Chest"],"Full ROM, controlled.",m(["chest_mid"],["front_delt","triceps"])),
      E("Arnold Press",3,"10",["Shoulders"],"Rotate palms through the press.",m(["front_delt"],["side_delt","triceps"])),
      E("Lateral Raise",3,"15",["Shoulders"],"Burn them out.",m(["side_delt"],[])),
      E("Overhead Tricep Extension",3,"12",["Arms"],"Long-head focus, full stretch.",m(["triceps"],[])),
      E("Tricep Kickback",3,"12",["Arms"],"Elbow pinned, squeeze.",m(["triceps"],[])),
    ]},
  pull_a: { label:"Pull A", category:"split", color:COLORS.pull, subtitle:"Back thickness · Biceps",
    exercises:[
      E("Bent-Over Row",4,"5",["Back"],"Main lift. Hinge, bar to lower chest.",m(["lats","traps_mid"],["biceps","rear_delt","lower_back"]),true),
      E("Lat Pulldown",3,"8-10",["Back"],"Wide grip, pull to upper chest.",m(["lats"],["biceps","rear_delt"])),
      E("Seated Cable Row",3,"8-10",["Back"],"Drive elbows back, chest tall.",m(["lats","traps_mid"],["biceps","rear_delt"])),
      E("EZ Bar Curl",3,"8-10",["Arms"],"Strict — no swinging.",m(["biceps"],["forearms"])),
      E("Hammer Curl",3,"12",["Arms"],"Neutral grip, controlled.",m(["biceps","forearms"],[])),
      E("Rear Delt Fly",3,"15",["Shoulders"],"Hinged torso, wide arc.",m(["rear_delt"],["traps_mid"])),
    ]},
  pull_b: { label:"Pull B", category:"split", color:COLORS.pull, subtitle:"Back width · Biceps",
    exercises:[
      E("Deadlift",4,"5",["Back","Legs"],"Main lift. Flat back, drive through heels.",m(["lower_back","glutes","hamstrings"],["lats","traps_upper","forearms","quads"]),true),
      E("Pull-Up",3,"6-10",["Back"],"Full hang to chin over bar.",m(["lats"],["biceps","traps_mid","forearms"])),
      E("Single-Arm Dumbbell Row",3,"8-10",["Back"],"Per side. Full ROM.",m(["lats","traps_mid"],["biceps","rear_delt"])),
      E("Face Pull",3,"15",["Shoulders","Back"],"Pull to forehead, squeeze.",m(["rear_delt"],["traps_mid","traps_upper"])),
      E("Concentration Curl",3,"12",["Arms"],"Elbow braced, strict.",m(["biceps"],[])),
      E("Dumbbell Shrug",3,"12",["Back"],"Squeeze traps at top.",m(["traps_upper"],["forearms"])),
    ]},
  legs_a: { label:"Legs A", category:"split", color:COLORS.legs, subtitle:"Quad focus · Glutes · Calves",
    exercises:[
      E("Back Squat",4,"5",["Legs"],"Main lift. Break parallel, knees track toes.",m(["quads","glutes"],["hamstrings","adductors","lower_back"]),true),
      E("Leg Press",3,"10-12",["Legs"],"Deep range, don't lock out.",m(["quads","glutes"],["hamstrings"])),
      E("Walking Lunge",3,"10/leg",["Legs"],"Long stride, front knee over toe.",m(["quads","glutes"],["hamstrings","adductors"])),
      E("Leg Extension",3,"12-15",["Legs"],"Slow, pause at top.",m(["quads"],[])),
      E("Standing Calf Raise",4,"15-20",["Legs"],"Full stretch, pause at top.",m(["calves"],[])),
    ]},
  legs_b: { label:"Legs B", category:"split", color:COLORS.legs, subtitle:"Hamstring focus · Glutes · Calves",
    exercises:[
      E("Romanian Deadlift",4,"6-8",["Legs"],"Main lift. Hinge deep, feel the stretch.",m(["hamstrings","glutes"],["lower_back"]),true),
      E("Bulgarian Split Squat",3,"10/leg",["Legs"],"Rear foot elevated, deep range.",m(["quads","glutes"],["hamstrings","adductors"])),
      E("Leg Curl",3,"12",["Legs"],"Full stretch, squeeze at peak.",m(["hamstrings"],["calves"])),
      E("Goblet Squat",3,"12",["Legs"],"Slow tempo, 3 sec down.",m(["quads","glutes"],["adductors"])),
      E("Seated Calf Raise",4,"15-20",["Legs"],"Pause at the top each rep.",m(["calves"],[])),
    ]},
  fullbody: { label:"Full Body", category:"split", color:COLORS.fullbody, subtitle:"Everything in one session",
    exercises:[
      E("Back Squat",4,"5",["Legs"],"Main lift.",m(["quads","glutes"],["hamstrings","adductors","lower_back"]),true),
      E("Bench Press",3,"6-8",["Chest"],"Controlled.",m(["chest_mid"],["front_delt","triceps"])),
      E("Bent-Over Row",3,"6-8",["Back"],"Hinge, squeeze.",m(["lats","traps_mid"],["biceps","rear_delt","lower_back"])),
      E("Overhead Press",3,"8-10",["Shoulders"],"Strict.",m(["front_delt"],["side_delt","triceps"])),
      E("EZ Bar Curl",2,"12",["Arms"],"Finisher.",m(["biceps"],["forearms"])),
      E("Plank",3,"45-60s",["Core"],"Brace hard.",m(["abs"],["obliques"])),
    ]},
  arms: { label:"Arms", category:"bodypart", color:"#d44dca", subtitle:"Biceps · Triceps blast",
    exercises:[
      E("EZ Bar Curl",4,"8-10",["Arms"],"Strict, controlled.",m(["biceps"],["forearms"])),
      E("Close-Grip Bench Press",3,"8-10",["Arms","Chest"],"Triceps emphasis.",m(["triceps"],["chest_mid","front_delt"])),
      E("Hammer Curl",3,"12",["Arms"],"Neutral grip.",m(["biceps","forearms"],[])),
      E("Overhead Tricep Extension",3,"12",["Arms"],"Full stretch.",m(["triceps"],[])),
      E("Concentration Curl",3,"12",["Arms"],"Peak squeeze.",m(["biceps"],[])),
      E("Tricep Pushdown",3,"15",["Arms"],"Burnout set.",m(["triceps"],[])),
    ]},
  chest: { label:"Chest", category:"bodypart", color:"#e8614d", subtitle:"Pressing volume",
    exercises:[
      E("Bench Press",4,"6-8",["Chest"],"Main mover.",m(["chest_mid"],["front_delt","triceps"]),true),
      E("Incline Dumbbell Press",3,"8-10",["Chest"],"Upper chest.",m(["chest_upper"],["front_delt","triceps"])),
      E("Decline Press",3,"10",["Chest"],"Lower chest.",m(["chest_mid"],["triceps"])),
      E("Cable Chest Fly",3,"12-15",["Chest"],"Stretch and squeeze.",m(["chest_mid"],["chest_upper"])),
      E("Push-Up",2,"AMRAP",["Chest"],"Finisher to failure.",m(["chest_mid"],["front_delt","triceps"])),
    ]},
  back: { label:"Back", category:"bodypart", color:"#4d8fe8", subtitle:"Width + thickness",
    exercises:[
      E("Bent-Over Row",4,"6-8",["Back"],"Thickness.",m(["lats","traps_mid"],["biceps","rear_delt","lower_back"]),true),
      E("Lat Pulldown",3,"8-10",["Back"],"Width.",m(["lats"],["biceps","rear_delt"])),
      E("Seated Cable Row",3,"10",["Back"],"Mid-back.",m(["lats","traps_mid"],["biceps","rear_delt"])),
      E("Single-Arm Dumbbell Row",3,"10",["Back"],"Per side.",m(["lats","traps_mid"],["biceps","rear_delt"])),
      E("Face Pull",3,"15",["Back","Shoulders"],"Rear delts + upper back.",m(["rear_delt"],["traps_mid","traps_upper"])),
    ]},
  shoulders: { label:"Shoulders", category:"bodypart", color:"#e8a84d", subtitle:"All three delt heads",
    exercises:[
      E("Overhead Press",4,"6-8",["Shoulders"],"Front + side.",m(["front_delt"],["side_delt","triceps"]),true),
      E("Lateral Raise",4,"12-15",["Shoulders"],"Side delts.",m(["side_delt"],[])),
      E("Rear Delt Fly",3,"15",["Shoulders"],"Rear delts.",m(["rear_delt"],["traps_mid"])),
      E("Arnold Press",3,"10",["Shoulders"],"Full sweep.",m(["front_delt"],["side_delt","triceps"])),
      E("Upright Row",3,"12",["Shoulders"],"Traps + side delts.",m(["side_delt","traps_upper"],["biceps"])),
    ]},
  legs_bp: { label:"Legs (Full)", category:"bodypart", color:"#48c47a", subtitle:"Quads · Hams · Glutes · Calves",
    exercises:[
      E("Back Squat",4,"5-8",["Legs"],"Main mover.",m(["quads","glutes"],["hamstrings","adductors","lower_back"]),true),
      E("Romanian Deadlift",3,"8-10",["Legs"],"Hamstrings.",m(["hamstrings","glutes"],["lower_back"])),
      E("Leg Press",3,"10-12",["Legs"],"Quad volume.",m(["quads","glutes"],["hamstrings"])),
      E("Leg Curl",3,"12",["Legs"],"Hamstring isolation.",m(["hamstrings"],["calves"])),
      E("Standing Calf Raise",4,"15-20",["Legs"],"Calves.",m(["calves"],[])),
    ]},
  core: { label:"Core / Abs", category:"bodypart", color:"#4dc9e8", subtitle:"Direct ab work",
    exercises:[
      E("Cable Crunch",4,"12-15",["Core"],"Heavy, treat like a lift.",m(["abs"],["obliques"])),
      E("Hanging Knee Raise",3,"12",["Core"],"No swinging.",m(["abs"],["obliques"])),
      E("Ab Wheel Rollout",3,"8-12",["Core"],"Full extension.",m(["abs"],["obliques","lats"])),
      E("Pallof Press",3,"12/side",["Core"],"Anti-rotation.",m(["obliques"],["abs"])),
      E("Plank",3,"45-60s",["Core"],"Brace everything.",m(["abs"],["obliques"])),
    ]},
  cardio: { label:"Cardio", category:"bodypart", color:"#b48ee8", subtitle:"Conditioning",
    exercises:[
      E("Treadmill Walk",1,"25-30 min",["Cardio"],"Zone 2 pace.",m([],[])),
      E("Treadmill Intervals",1,"15 min",["Cardio"],"1 min hard / 2 min easy.",m([],[])),
      E("Incline Treadmill Walk",1,"15 min",["Cardio"],"High incline, vest optional.",m(["calves"],["glutes"])),
    ]},
};

// ── FEATURE 1: Expanded exercise library with muscle tags ──
const L = (name, parts, equipment, note, muscles) => ({name, parts, equipment, note, muscles, sets:3, reps:"10", main:false});
export const EXERCISE_LIBRARY = [
  // CHEST
  L("Bench Press",["Chest"],"Barbell","The king of pressing. Full stop at chest.",m(["chest_mid"],["front_delt","triceps"])),
  L("Incline Bench Press",["Chest"],"Barbell","30-45° incline, upper chest.",m(["chest_upper"],["front_delt","triceps"])),
  L("Decline Press",["Chest"],"Barbell","Lower chest emphasis.",m(["chest_mid"],["triceps"])),
  L("Close-Grip Bench Press",["Arms","Chest"],"Barbell","Triceps-dominant press.",m(["triceps"],["chest_mid","front_delt"])),
  L("Flat Dumbbell Press",["Chest"],"Dumbbell","Deeper stretch than barbell.",m(["chest_mid"],["front_delt","triceps"])),
  L("Incline Dumbbell Press",["Chest"],"Dumbbell","Upper chest, slow descent.",m(["chest_upper"],["front_delt","triceps"])),
  L("Dumbbell Fly",["Chest"],"Dumbbell","Wide arc, big stretch.",m(["chest_mid"],["chest_upper","front_delt"])),
  L("Cable Chest Fly",["Chest"],"Cable","Constant tension, squeeze center.",m(["chest_mid"],["chest_upper"])),
  L("Low-to-High Cable Fly",["Chest"],"Cable","Upper chest focus.",m(["chest_upper"],["front_delt"])),
  L("Pec Deck",["Chest"],"Machine","Isolation, pause at squeeze.",m(["chest_mid"],[])),
  L("Machine Chest Press",["Chest"],"Machine","Stable pressing volume.",m(["chest_mid"],["front_delt","triceps"])),
  L("Smith Machine Bench Press",["Chest"],"Smith Machine","Fixed path, safe solo.",m(["chest_mid"],["front_delt","triceps"])),
  L("Push-Up",["Chest"],"Bodyweight","Add weighted vest to scale.",m(["chest_mid"],["front_delt","triceps","abs"])),
  L("Deficit Push-Up",["Chest"],"Bodyweight","Hands elevated, deeper stretch.",m(["chest_mid"],["front_delt","triceps"])),
  L("Dip",["Chest","Arms"],"Bodyweight","Lean forward for chest.",m(["chest_mid","triceps"],["front_delt"])),
  // BACK
  L("Deadlift",["Back","Legs"],"Barbell","Total-body pull. Flat back.",m(["lower_back","glutes","hamstrings"],["lats","traps_upper","forearms","quads"])),
  L("Bent-Over Row",["Back"],"Barbell","Bar to lower chest, hinge.",m(["lats","traps_mid"],["biceps","rear_delt","lower_back"])),
  L("Pendlay Row",["Back"],"Barbell","Dead-stop row from floor.",m(["lats","traps_mid"],["biceps","rear_delt","lower_back"])),
  L("T-Bar Row",["Back"],"Barbell","Thickness builder.",m(["lats","traps_mid"],["biceps","rear_delt"])),
  L("Rack Pull",["Back"],"Barbell","Partial deadlift, overload.",m(["traps_upper","lower_back"],["lats","glutes","forearms"])),
  L("Single-Arm Dumbbell Row",["Back"],"Dumbbell","Full ROM per side.",m(["lats","traps_mid"],["biceps","rear_delt"])),
  L("Chest-Supported Row",["Back"],"Dumbbell","No lower-back stress.",m(["lats","traps_mid"],["biceps","rear_delt"])),
  L("Dumbbell Shrug",["Back"],"Dumbbell","Traps, hold at top.",m(["traps_upper"],["forearms"])),
  L("Lat Pulldown",["Back"],"Cable","Width. Pull to upper chest.",m(["lats"],["biceps","rear_delt"])),
  L("Straight-Arm Pulldown",["Back"],"Cable","Lat isolation.",m(["lats"],["triceps"])),
  L("Seated Cable Row",["Back"],"Cable","Drive elbows back.",m(["lats","traps_mid"],["biceps","rear_delt"])),
  L("Face Pull",["Back","Shoulders"],"Cable","Rear delts + upper back health.",m(["rear_delt"],["traps_mid","traps_upper"])),
  L("Machine Row",["Back"],"Machine","Stable rowing volume.",m(["lats","traps_mid"],["biceps","rear_delt"])),
  L("Smith Machine Bent-Over Row",["Back"],"Smith Machine","Fixed-path row.",m(["lats","traps_mid"],["biceps","rear_delt"])),
  L("Pull-Up",["Back"],"Bodyweight","Full hang to chin over.",m(["lats"],["biceps","traps_mid","forearms"])),
  L("Chin-Up",["Back","Arms"],"Bodyweight","Supinated, more biceps.",m(["lats","biceps"],["traps_mid","forearms"])),
  L("Inverted Row",["Back"],"Bodyweight","Scalable row under bar.",m(["lats","traps_mid"],["biceps","rear_delt"])),
  L("Band Pull-Apart",["Back","Shoulders"],"Bands","High-rep shoulder health.",m(["rear_delt"],["traps_mid"])),
  // SHOULDERS
  L("Overhead Press",["Shoulders"],"Barbell","Strict standing press.",m(["front_delt"],["side_delt","triceps"])),
  L("Push Press",["Shoulders"],"Barbell","Leg drive, overload.",m(["front_delt"],["side_delt","triceps","quads"])),
  L("Behind-the-Neck Press",["Shoulders"],"Barbell","Requires good mobility.",m(["side_delt","front_delt"],["triceps"])),
  L("Dumbbell Shoulder Press",["Shoulders"],"Dumbbell","Seated or standing.",m(["front_delt"],["side_delt","triceps"])),
  L("Arnold Press",["Shoulders"],"Dumbbell","Rotate through the press.",m(["front_delt"],["side_delt","triceps"])),
  L("Lateral Raise",["Shoulders"],"Dumbbell","Side delts, strict.",m(["side_delt"],[])),
  L("Rear Delt Fly",["Shoulders"],"Dumbbell","Hinged, wide arc.",m(["rear_delt"],["traps_mid"])),
  L("Front Raise",["Shoulders"],"Dumbbell","Front delts.",m(["front_delt"],[])),
  L("Upright Row",["Shoulders"],"Barbell","Wide grip, elbows high.",m(["side_delt","traps_upper"],["biceps"])),
  L("Cable Lateral Raise",["Shoulders"],"Cable","Constant tension.",m(["side_delt"],[])),
  L("Machine Shoulder Press",["Shoulders"],"Machine","Stable overhead work.",m(["front_delt"],["side_delt","triceps"])),
  L("Reverse Pec Deck",["Shoulders"],"Machine","Rear delt isolation.",m(["rear_delt"],["traps_mid"])),
  L("Pike Push-Up",["Shoulders"],"Bodyweight","Vertical press progression.",m(["front_delt"],["side_delt","triceps"])),
  // ARMS
  L("Barbell Curl",["Arms"],"Barbell","Classic mass builder.",m(["biceps"],["forearms"])),
  L("EZ Bar Curl",["Arms"],"Barbell","Wrist-friendly curl.",m(["biceps"],["forearms"])),
  L("Skull Crusher",["Arms"],"Barbell","Lying tricep extension.",m(["triceps"],[])),
  L("Dumbbell Curl",["Arms"],"Dumbbell","Alternating or together.",m(["biceps"],["forearms"])),
  L("Hammer Curl",["Arms"],"Dumbbell","Neutral grip, brachialis.",m(["biceps","forearms"],[])),
  L("Incline Dumbbell Curl",["Arms"],"Dumbbell","Long-head stretch.",m(["biceps"],["forearms"])),
  L("Concentration Curl",["Arms"],"Dumbbell","Peak contraction.",m(["biceps"],[])),
  L("Zottman Curl",["Arms"],"Dumbbell","Curl up, rotate, lower slow.",m(["biceps","forearms"],[])),
  L("Overhead Tricep Extension",["Arms"],"Dumbbell","Long head, full stretch.",m(["triceps"],[])),
  L("Tricep Kickback",["Arms"],"Dumbbell","Elbow pinned high.",m(["triceps"],[])),
  L("Tricep Pushdown",["Arms"],"Cable","Rope or bar, full lockout.",m(["triceps"],[])),
  L("Cable Curl",["Arms"],"Cable","Constant tension curl.",m(["biceps"],["forearms"])),
  L("Preacher Curl",["Arms"],"Machine","Strict, no cheating.",m(["biceps"],["forearms"])),
  L("Bench Dip",["Arms"],"Bodyweight","Feet elevated to scale.",m(["triceps"],["front_delt"])),
  L("Wrist Curl",["Arms"],"Dumbbell","Forearm flexors.",m(["forearms"],[])),
  // LEGS
  L("Back Squat",["Legs"],"Barbell","Break parallel, drive up.",m(["quads","glutes"],["hamstrings","adductors","lower_back"])),
  L("Front Squat",["Legs"],"Barbell","Upright torso, quads.",m(["quads"],["glutes","adductors","abs"])),
  L("Romanian Deadlift",["Legs"],"Barbell","Hinge, hamstring stretch.",m(["hamstrings","glutes"],["lower_back"])),
  L("Sumo Deadlift",["Legs","Back"],"Barbell","Wide stance pull.",m(["glutes","adductors","quads"],["hamstrings","lower_back","traps_upper"])),
  L("Hip Thrust",["Legs"],"Barbell","Glute driver, pause at top.",m(["glutes"],["hamstrings"])),
  L("Good Morning",["Legs","Back"],"Barbell","Hinge pattern, light.",m(["hamstrings","lower_back"],["glutes"])),
  L("Goblet Squat",["Legs"],"Dumbbell","Front-loaded, slow tempo.",m(["quads","glutes"],["adductors"])),
  L("Bulgarian Split Squat",["Legs"],"Dumbbell","Rear foot elevated.",m(["quads","glutes"],["hamstrings","adductors"])),
  L("Walking Lunge",["Legs"],"Dumbbell","Long strides.",m(["quads","glutes"],["hamstrings","adductors"])),
  L("Reverse Lunge",["Legs"],"Dumbbell","Knee-friendly lunge.",m(["quads","glutes"],["hamstrings"])),
  L("Step-Up",["Legs"],"Dumbbell","Box or bench, drive through heel.",m(["quads","glutes"],["hamstrings"])),
  L("Dumbbell RDL",["Legs"],"Dumbbell","Hinge with dumbbells.",m(["hamstrings","glutes"],["lower_back"])),
  L("Leg Press",["Legs"],"Machine","Deep range, don't lock out.",m(["quads","glutes"],["hamstrings"])),
  L("Leg Extension",["Legs"],"Machine","Quad isolation, pause.",m(["quads"],[])),
  L("Leg Curl",["Legs"],"Machine","Hamstring isolation.",m(["hamstrings"],["calves"])),
  L("Hack Squat",["Legs"],"Machine","Quad-dominant squat.",m(["quads"],["glutes","adductors"])),
  L("Standing Calf Raise",["Legs"],"Machine","Full stretch, pause top.",m(["calves"],[])),
  L("Seated Calf Raise",["Legs"],"Machine","Soleus focus.",m(["calves"],[])),
  L("Smith Machine Squat",["Legs"],"Smith Machine","Fixed path squat.",m(["quads","glutes"],["hamstrings","adductors"])),
  L("Smith Machine Calf Raise",["Legs"],"Smith Machine","Loaded calf work.",m(["calves"],[])),
  L("Kettlebell Swing",["Legs","Full Body"],"Kettlebell","Explosive hinge.",m(["glutes","hamstrings"],["lower_back","front_delt"])),
  L("Goblet Kettlebell Squat",["Legs"],"Kettlebell","KB front squat.",m(["quads","glutes"],["adductors"])),
  L("Nordic Curl",["Legs"],"Bodyweight","Brutal hamstring eccentric.",m(["hamstrings"],["glutes","calves"])),
  L("Sissy Squat",["Legs"],"Bodyweight","Quad stretch, niche.",m(["quads"],[])),
  // CORE
  L("Plank",["Core"],"Bodyweight","Brace everything.",m(["abs"],["obliques"])),
  L("Side Plank",["Core"],"Bodyweight","Per side, hips high.",m(["obliques"],["abs"])),
  L("Hanging Leg Raise",["Core"],"Bodyweight","Toes to bar progression.",m(["abs"],["obliques","forearms"])),
  L("Hanging Knee Raise",["Core"],"Bodyweight","Controlled, no swing.",m(["abs"],["obliques"])),
  L("Ab Wheel Rollout",["Core"],"Other","Full extension.",m(["abs"],["obliques","lats"])),
  L("Cable Crunch",["Core"],"Cable","Heavy, kneeling.",m(["abs"],["obliques"])),
  L("Pallof Press",["Core"],"Cable","Anti-rotation.",m(["obliques"],["abs"])),
  L("Dead Bug",["Core"],"Bodyweight","Low back pinned down.",m(["abs"],["obliques"])),
  L("Bicycle Crunch",["Core"],"Bodyweight","Slow, controlled.",m(["abs","obliques"],[])),
  L("Hollow Body Hold",["Core"],"Bodyweight","Gymnast staple.",m(["abs"],["obliques"])),
  L("Russian Twist",["Core"],"Dumbbell","Weighted rotation.",m(["obliques"],["abs"])),
  L("Dragon Flag",["Core"],"Bodyweight","Advanced, Bruce Lee style.",m(["abs"],["obliques","lats"])),
  L("Farmer Carry",["Core","Full Body"],"Dumbbell","Heavy, walk tall.",m(["forearms","traps_upper"],["abs","obliques"])),
  L("Suitcase Carry",["Core"],"Dumbbell","One-sided anti-lean.",m(["obliques"],["forearms","traps_upper"])),
  // CARDIO / FULL BODY
  L("Treadmill Walk",["Cardio"],"Machine","Zone 2 pace.",m([],[])),
  L("Treadmill Intervals",["Cardio"],"Machine","Hard/easy repeats.",m([],[])),
  L("Incline Treadmill Walk",["Cardio"],"Machine","High incline burner.",m(["calves"],["glutes"])),
  L("Rowing Machine",["Cardio","Full Body"],"Machine","Full-body cardio.",m(["lats"],["quads","biceps"])),
  L("Assault Bike",["Cardio"],"Machine","Brutal intervals.",m(["quads"],["hamstrings"])),
  L("Jump Rope",["Cardio"],"Other","Coordination + conditioning.",m(["calves"],[])),
  L("Burpee",["Full Body","Cardio"],"Bodyweight","Everything at once.",m(["quads","chest_mid"],["front_delt","abs","triceps"])),
  L("Thruster",["Full Body"],"Dumbbell","Squat to press.",m(["quads","front_delt"],["glutes","triceps"])),
  L("Clean and Press",["Full Body"],"Barbell","Power development.",m(["front_delt","quads"],["glutes","traps_upper","lower_back"])),
  L("Turkish Get-Up",["Full Body","Core"],"Kettlebell","Slow, technical, niche.",m(["abs","front_delt"],["obliques","glutes"])),
];

// ── FEATURE 4: Strength standards (bodyweight-ratio e1RM thresholds by tier) ──
export const STRENGTH_STANDARDS = {
  "Bench Press":        [0.50, 0.75, 1.00, 1.50, 2.00],
  "Incline Bench Press":[0.40, 0.65, 0.90, 1.30, 1.75],
  "Back Squat":         [0.75, 1.00, 1.50, 2.00, 2.50],
  "Deadlift":           [1.00, 1.25, 1.75, 2.50, 3.00],
  "Overhead Press":     [0.35, 0.55, 0.75, 1.00, 1.30],
  "Bent-Over Row":      [0.50, 0.75, 1.00, 1.50, 1.75],
};
export const TIER_NAMES = ["Bronze","Silver","Gold","Platinum","Diamond"];
export const TIER_COLORS = ["#cd7f32","#c0c0c0","#ffd700","#7de3f4","#b9f2ff"];
export const STREAK_MILESTONES = [7, 14, 30, 50, 100, 200, 365];

export const DEFAULT_WEEKLY = ["rest","push_a","pull_a","legs_a","push_b","pull_b","legs_b"];
export const DEFAULT_CYCLE = ["push_a","pull_a","legs_a","push_b","pull_b","legs_b","rest"];

// FEATURE A: color swatch palette for custom presets
export const PRESET_SWATCHES = ["#e8614d","#4d8fe8","#48c47a","#e8a84d","#d44dca","#4dc9e8","#b48ee8","#e0555c"];

// Quotes: {text, source}. Mix of iconic lines + themed originals in each series' spirit.
export const MOTIVATION = [
  // One Piece
  { text:"If you don't take risks, you can't create a future.", source:"Luffy, One Piece" },
  { text:"When do you think people die? When they are forgotten.", source:"Dr. Hiluluk, One Piece" },
  { text:"Being weak is nothing to be ashamed of. Staying weak is.", source:"Fuegoleon (shonen spirit)" },
  { text:"I don't wanna conquer anything. I just think the guy with the most freedom is the king.", source:"Luffy, One Piece" },
  // Naruto
  { text:"I never go back on my word. That's my nindō — my ninja way.", source:"Naruto Uzumaki, Naruto" },
  { text:"Hard work is worthless for those that don't believe in themselves.", source:"Naruto Uzumaki, Naruto" },
  { text:"A dropout will beat a genius through hard work.", source:"Rock Lee, Naruto" },
  { text:"If you don't like your destiny, don't accept it.", source:"Naruto Uzumaki, Naruto" },
  // Dragon Ball
  { text:"Push through the pain. Giving up hurts more.", source:"Vegeta, Dragon Ball (paraphrased)" },
  { text:"A true warrior never stops trying to be better.", source:"Goku, Dragon Ball (spirit)" },
  { text:"I am the hope of the universe. And I'm not done yet.", source:"Goku, Dragon Ball" },
  // Marvel
  { text:"I can do this all day.", source:"Steve Rogers, Marvel" },
  { text:"Whatever it takes.", source:"Avengers: Endgame, Marvel" },
  { text:"Get up. Because you can.", source:"Aunt May (spirit), Marvel" },
  { text:"It's not about how much we've lost. It's about how much we have left to fight for.", source:"Tony Stark, Marvel" },
  // inFamous Second Son
  { text:"With great power comes a whole lot of weird.", source:"Delsin Rowe, inFamous Second Son" },
  { text:"You're only as caged as you let yourself be.", source:"inFamous Second Son (spirit)" },
  // Red Dead Redemption 2
  { text:"We can't change what's done. We can only move on.", source:"Arthur Morgan, RDR2" },
  { text:"Just keep moving forward. That's all any of us can do.", source:"Arthur Morgan, RDR2 (spirit)" },
  { text:"Take the pain. Earn the rest.", source:"RDR2 (spirit)" },
  // Cyberpunk 2077
  { text:"Wake the f*** up, samurai. We have muscle to build.", source:"Johnny Silverhand, Cyberpunk (remix)" },
  { text:"No easy way out. Never was.", source:"Johnny Silverhand, Cyberpunk (spirit)" },
  { text:"Don't lose your edge. Sharpen it.", source:"Cyberpunk 2077 (spirit)" },
  // House M.D.
  { text:"You can't always get what you want — but if you grind, you get what you need.", source:"Gregory House, House M.D. (remix)" },
  { text:"Everybody lies. Your excuses today, especially.", source:"Gregory House, House M.D. (remix)" },
  // Rebellious Religion (your own)
  { text:"Forge the temple. Rep by rep.", source:"Rebellious Religion" },
  { text:"Fall, rise, reforge. Repeat.", source:"Rebellious Religion" },
];

// ── WELLNESS config ──
export const WELLNESS_DEFAULTS = [
  { id:"sleepHours", label:"Sleep", type:"number", unit:"hrs", icon:"😴", goal:8, track:true },
  { id:"bedtime",    label:"Bedtime", type:"time", icon:"🌙", track:false },
  { id:"waketime",   label:"Wake time", type:"time", icon:"☀️", track:false },
  { id:"sleepQuality", label:"Sleep quality", type:"rating", icon:"⭐", track:true },
  { id:"water",      label:"Water", type:"number", unit:"oz", icon:"💧", goal:80, track:true },
  { id:"energy",     label:"Mood / energy", type:"rating", icon:"⚡", track:true },
  { id:"soreness",   label:"Soreness", type:"rating", icon:"🔥", track:true },
  { id:"protein",    label:"Protein / nutrition", type:"text", icon:"🍗", track:false },
  { id:"stretching", label:"Stretched", type:"bool", icon:"🧘", track:true },
  { id:"steps",      label:"Steps", type:"number", unit:"steps", icon:"👟", goal:10000, track:true },
];
export const HABIT_DEFAULTS = [
  { id:"vitamins", label:"Vitamins", icon:"💊" },
  { id:"meditate", label:"Meditate", icon:"🧠" },
  { id:"sunlight", label:"Morning sunlight", icon:"🌅" },
];
export const WELLNESS_TIPS = [
  "Recovery is where the muscle is actually built.",
  "Hydration drives performance more than most supplements.",
  "Protein + sleep is 90% of body composition.",
  "A 10-minute stretch beats a skipped one.",
  "Consistency in small habits compounds fastest.",
];
