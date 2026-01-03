import { db } from './db';

const EXERCISES_CSV = `Name,MuscleGroup,SubMuscleGroup,Equipment,Alias1,Alias2
Overhead Barbell Press,Shoulders,Front Delt,Barbell,Military Press,Standing Press
Push Press,Shoulders,Front Delt,Barbell,Explosive Press,Barbell Shoulder Push
Seated Barbell Press,Shoulders,Front Delt,Barbell,Seated Shoulder Press,Barbell Seated Press
Landmine Viking Press,Shoulders,Front Delt,Barbell,Landmine Shoulder Press,Landmine Press
Single-Arm Landmine Press Left,Shoulders,Front Delt,Barbell,Landmine Press Left,Single Arm Viking Press Left
Single-Arm Landmine Press Right,Shoulders,Front Delt,Barbell,Landmine Press Right,Single Arm Viking Press Right
Seated Dumbbell Press,Shoulders,Front Delt,Dumbbell,Dumbbell Shoulder Press,Sitting DB Press
Standing Dumbbell Press,Shoulders,Front Delt,Dumbbell,DB Overhead Press,Standing DB Press
Arnold Press,Shoulders,Front Delt,Dumbbell,Rotational Press,DB Arnold Press
Neutral Grip Dumbbell Press,Shoulders,Front Delt,Dumbbell,Palms Facing Press,DB Neutral Press
Single-Arm Dumbbell Press Left,Shoulders,Front Delt,Dumbbell,One Arm Press Left,DB Press Left
Single-Arm Dumbbell Press Right,Shoulders,Front Delt,Dumbbell,One Arm Press Right,DB Press Right
Dumbbell Lateral Raise Left,Shoulders,Lateral Delt,Dumbbell,Side Raise Left,DB Side Lateral Left
Dumbbell Lateral Raise Right,Shoulders,Lateral Delt,Dumbbell,Side Raise Right,DB Side Lateral Right
Cable Lateral Raise Left,Shoulders,Lateral Delt,Cable,Single Arm Cable Side Left,Cable Side Raise Left
Cable Lateral Raise Right,Shoulders,Lateral Delt,Cable,Single Arm Cable Side Right,Cable Side Raise Right
Behind-the-Back Cable Lateral Raise Left,Shoulders,Lateral Delt,Cable,Reverse Cable Side Left,Back Cable Lateral Left
Behind-the-Back Cable Lateral Raise Right,Shoulders,Lateral Delt,Cable,Reverse Cable Side Right,Back Cable Lateral Right
Machine Lateral Raise,Shoulders,Lateral Delt,Machine,Seated Lateral Raise,Machine Side Raise
Bent-Over Dumbbell Rear Delt Fly Left,Shoulders,Rear Delt,Dumbbell,DB Reverse Fly Left,Bent DB Rear Fly Left
Bent-Over Dumbbell Rear Delt Fly Right,Shoulders,Rear Delt,Dumbbell,DB Reverse Fly Right,Bent DB Rear Fly Right
Reverse Pec Deck,Shoulders,Rear Delt,Machine,Rear Delt Machine,Reverse Fly Machine
Cable Face Pull,Shoulders,Rear Delt,Cable,Face Pull Rope,Cable Pull Face
Single-Arm Cable Rear Delt Fly Left,Shoulders,Rear Delt,Cable,Cable Reverse Fly Left,Single Arm Rear Fly Left
Single-Arm Cable Rear Delt Fly Right,Shoulders,Rear Delt,Cable,Cable Reverse Fly Right,Single Arm Rear Fly Right
Barbell Shrug,Shoulders,Upper Traps,Barbell,BB Shrugs,Barbell Trap Raise
Dumbbell Shrug,Shoulders,Upper Traps,Dumbbell,DB Shrugs,Dumbbell Trap Raise
Cable Upright Row (Wide Grip),Shoulders,Lateral Delt,Cable,Cable Upright Wide,Cable Row Wide Grip
Cable Upright Row (Narrow Grip),Shoulders,Front Delt,Cable,Cable Upright Narrow,Cable Row Narrow Grip
Smith Machine Overhead Press,Shoulders,Front Delt,Smith Machine,Smith Shoulder Press,Smith Overhead Press
Smith Machine Upright Row (Wide Grip),Shoulders,Lateral Delt,Smith Machine,Smith Upright Wide,Smith Row Wide
Smith Machine Upright Row (Narrow Grip),Shoulders,Front Delt,Smith Machine,Smith Upright Narrow,Smith Row Narrow
Pike Push-up,Shoulders,Front Delt,Bodyweight,Decline Push-up Variation,Shoulder Push-up
Elevated Pike Push-up,Shoulders,Front Delt,Bodyweight,Elevated Shoulder Push,Incline Pike Push
Handstand Push-up,Shoulders,Front Delt,Bodyweight,Wall Handstand Press,Vertical Push-up
Behind-the-Neck Press,Shoulders,Front Delt,Barbell,BB BTN Press,Barbell Behind Neck
Barbell Front Raise,Shoulders,Front Delt,Barbell,BB Front Raise,Barbell Anterior Raise
Dumbbell Front Raise,Shoulders,Front Delt,Dumbbell,DB Front Raise,DB Anterior Raise
Bent-Over Rear Delt Flyes,Shoulders,Rear Delt,Dumbbell,Bent DB Reverse Fly,Rear DB Fly
Dumbbell Shrugs,Shoulders,Upper Traps,Dumbbell,DB Trap Raise,DB Trap Shrugs
Single-Arm Dumbbell Lateral Raise Left,Shoulders,Lateral Delt,Dumbbell,DB Side Raise Left,Single Arm Lateral Left
Single-Arm Dumbbell Lateral Raise Right,Shoulders,Lateral Delt,Dumbbell,DB Side Raise Right,Single Arm Lateral Right
Single-Arm Dumbbell Front Raise Left,Shoulders,Front Delt,Dumbbell,DB Front Left,Single Arm Front Left
Single-Arm Dumbbell Front Raise Right,Shoulders,Front Delt,Dumbbell,DB Front Right,Single Arm Front Right
Single-Arm Dumbbell Rear Delt Fly Left,Shoulders,Rear Delt,Dumbbell,DB Rear Fly Left,Single Arm Rear Fly Left
Single-Arm Dumbbell Rear Delt Fly Right,Shoulders,Rear Delt,Dumbbell,DB Rear Fly Right,Single Arm Rear Fly Right
Cable Front Raises Left,Shoulders,Front Delt,Cable,Cable Front Left,Single Arm Cable Front Left
Cable Front Raises Right,Shoulders,Front Delt,Cable,Cable Front Right,Single Arm Cable Front Right
Cable Face Pulls,Shoulders,Rear Delt,Cable,Face Pulls Rope,Cable Pull Face
Single-Arm Cable Rear Delt Flyes Left,Shoulders,Rear Delt,Cable,Cable Reverse Left,Single Arm Cable Rear Left
Single-Arm Cable Rear Delt Flyes Right,Shoulders,Rear Delt,Cable,Cable Reverse Right,Single Arm Cable Rear Right
Cable Upright Rows,Shoulders,Lateral Delt,Cable,Cable Upright,Wide Grip Upright
Behind-the-Back Cable Lateral Raises Left,Shoulders,Lateral Delt,Cable,Back Cable Lateral L,Reverse Side Cable L
Behind-the-Back Cable Lateral Raises Right,Shoulders,Lateral Delt,Cable,Back Cable Lateral R,Reverse Side Cable R
Machine Shoulder Press,Shoulders,Front Delt,Machine,Seated Machine Press,Machine Overhead Press
Reverse Pec Deck (Rear Delts),Shoulders,Rear Delt,Machine,Machine Rear Fly,Reverse Pec Deck Fly
Machine Lateral Raise,Shoulders,Lateral Delt,Machine,Seated Lateral Raise,Side Machine Raise
Smith Machine Overhead Press,Shoulders,Front Delt,Smith Machine,Smith Shoulder Press,Smith Overhead Press
Smith Machine Upright Row,Shoulders,Lateral Delt,Smith Machine,Smith Upright,Smith Upright Row
Pike Push-ups,Shoulders,Front Delt,Bodyweight,Decline Push-up Variant,Shoulder Push
Elevated Pike Push-ups,Shoulders,Front Delt,Bodyweight,Elevated Shoulder Push,Incline Pike Push
Handstand Push-ups,Shoulders,Front Delt,Bodyweight,Wall Handstand Press,Vertical Push-up
Plate Front Raises,Shoulders,Front Delt,Plate,Plate Front Raise,Weighted Front Raise
Plate Halo,Shoulders,Front Delt,Plate,Plate Circle,Plate Shoulder Halo
Landmine Viking Press,Shoulders,Front Delt,Barbell,Landmine Shoulder Press,Landmine Press
Single-Arm Landmine Press Left,Shoulders,Front Delt,Barbell,Landmine Press Left,Single Arm Viking Press Left
Single-Arm Landmine Press Right,Shoulders,Front Delt,Barbell,Landmine Press Right,Single Arm Viking Press Right
Kettlebell Press Left,Shoulders,Front Delt,Kettlebell,KB Shoulder Press Left,KB Overhead Left
Kettlebell Press Right,Shoulders,Front Delt,Kettlebell,KB Shoulder Press Right,KB Overhead Right
Resistance Band Face Pulls,Shoulders,Rear Delt,Resistance Band,RB Face Pull,RB Pulls
Resistance Band Lateral Raise Left,Shoulders,Lateral Delt,Resistance Band,RB Side Left,RB Lateral Left
Resistance Band Lateral Raise Right,Shoulders,Lateral Delt,Resistance Band,RB Side Right,RB Lateral Right
Smith Machine Incline Chest Press,Chest,Upper Chest,Smith Machine,Incline Smith Press,Smith Incline Bench
Flat Barbell Bench Press,Chest,Mid Chest,Barbell,BB Flat Press,Flat Bench Press
Incline Barbell Bench Press,Chest,Upper Chest,Barbell,BB Incline Press,Incline Bench
Decline Barbell Bench Press,Chest,Lower Chest,Barbell,BB Decline Press,Decline Bench
Close-Grip Bench Press,Chest,Inner Chest,Barbell,BB Close Press,Close Grip Press
Barbell Floor Press,Chest,Mid Chest,Barbell,BB Floor Press,Floor Press
Flat Dumbbell Press,Chest,Mid Chest,Dumbbell,DB Flat Press,DB Bench Press
Incline Dumbbell Press,Chest,Upper Chest,Dumbbell,DB Incline Press,Incline DB Bench
Decline Dumbbell Press,Chest,Lower Chest,Dumbbell,DB Decline Press,Decline DB Bench
Dumbbell Flyes,Chest,Mid Chest,Dumbbell,DB Chest Fly,Flat DB Fly
Incline Dumbbell Flyes,Chest,Upper Chest,Dumbbell,DB Incline Fly,Incline DB Fly
Standing Cable Flyes,Chest,Mid Chest,Cable,Cable Chest Fly,Standing Cable Chest Fly
Low-to-High Cable Flyes,Chest,Upper Chest,Cable,Cable Low to High,Cable Chest Rise
High-to-Low Cable Flyes,Chest,Lower Chest,Cable,Cable High to Low,Cable Chest Press
Single-Arm Cable Press,Chest,Mid Chest,Cable,Cable One Arm Press,Single Arm Cable Press
Cable Crossover,Chest,Mid Chest,Cable,Cable X Fly,Cable Cross Press
Seated Machine Chest Press,Chest,Mid Chest,Machine,Machine Chest Press,Seated Chest Press
Incline Machine Press,Chest,Upper Chest,Machine,Incline Machine Press,Machine Incline Press
Pec Deck Flyes,Chest,Mid Chest,Machine,Machine Fly,Pec Deck
Hammer Strength Press,Chest,Mid Chest,Machine,Hammer Press,Hammer Strength Machine Press
Smith Machine Flat Press,Chest,Mid Chest,Smith Machine,Smith Flat Press,Smith Bench Press
Standard Push-ups,Chest,Mid Chest,Bodyweight,Push-up,Floor Push-up
Incline Push-ups,Chest,Upper Chest,Bodyweight,Incline Push-up,Decline Floor Push-up
Decline Push-ups,Chest,Lower Chest,Bodyweight,Decline Push-up,Feet Elevated Push-up
Wide Grip Push-ups,Chest,Mid Chest,Bodyweight,Wide Push-up,Wide Floor Push-up
Diamond Push-ups,Chest,Inner Chest,Bodyweight,Diamond Press,Close Push-up
Archer Push-ups,Chest,Mid Chest,Bodyweight,Archer Press,Side Push-up
Chest Dips,Chest,Lower Chest,Bodyweight,Dip,Parallel Bar Dip
Ring Push-ups,Chest,Mid Chest,Bodyweight,Ring Press,Ring Floor Push
Plyometric Push-ups,Chest,Mid Chest,Bodyweight,Explosive Push-up,Jump Push-up
Svend Press,Chest,Inner Chest,Plate,Plate Svend Press,Chest Plate Press
Plate Press-outs,Chest,Mid Chest,Plate,Plate Chest Press,Press-out
Landmine Press,Chest,Mid Chest,Barbell,Landmine Chest Press,Landmine Barbell Press
Single-Arm Landmine Press,Chest,Mid Chest,Barbell,One Arm Landmine Press,Landmine Single Arm
Resistance Band Chest Press,Chest,Mid Chest,Resistance Band,RB Chest Press,Chest Press Band
Resistance Band Flyes,Chest,Mid Chest,Resistance Band,RB Flyes,Band Chest Fly
Weighted Push-ups,Chest,Mid Chest,Bodyweight/Plate,Weighted Floor Push-up,Weighted Push
Weighted Dips,Chest,Lower Chest,Bodyweight/Plate,Weighted Dip,Weighted Parallel Dip
Conventional Barbell Deadlift,Back,Spinal Erectors,Barbell,BB Deadlift,Deadlift
Bent-Over Barbell Rows (Overhand),Back,Upper Lats,Barbell,BB Rows Overhand,Barbell Overhand Row
Bent-Over Barbell Rows (Underhand),Back,Lower Lats,Barbell,BB Rows Underhand,Barbell Underhand Row
Pendlay Rows,Back,Upper Back,Barbell,Pendlay Row,BB Pendlay
Barbell Shrugs,Back,Upper Traps,Barbell,BB Shrugs,Trap Raise
T-Bar Row (Wide Grip),Back,Upper Back,Barbell,T-Bar Row Wide,BB T-Bar Wide
T-Bar Row (Neutral Grip),Back,Mid Back,Barbell,T-Bar Row Neutral,T-Bar BB Row
Yates Row,Back,Lower Lats,Barbell,Yates Row Underhand,Underhand BB Row
Single-Arm Dumbbell Row Left,Back,Mid Back,Dumbbell,One Arm DB Row Left,DB Row Left
Single-Arm Dumbbell Row Right,Back,Mid Back,Dumbbell,One Arm DB Row Right,DB Row Right
Chest-Supported Dumbbell Row,Back,Upper Back,Dumbbell,Chest Supported Row,DB Incline Row
Dumbbell Pullovers,Back,Lats,Dumbbell,DB Pullover,DB Lat Pull
Dumbbell Incline Row,Back,Upper Back,Dumbbell,Incline DB Row,DB Incline Row
Dumbbell Shrugs,Back,Upper Traps,Dumbbell,DB Shrugs,DB Trap Raise
Renegade Row,Back,Mid Back,Dumbbell,Plank Row,DB Renegade
Lat Pulldown (Wide Grip),Back,Upper Lats,Cable,Cable Pulldown Wide,Wide Lat Pulldown
Lat Pulldown (Neutral Grip/V-Bar),Back,Mid Lats,Cable,Cable Pulldown Neutral,Neutral Lat Pulldown
Lat Pulldown (Underhand/Narrow),Back,Lower Lats,Cable,Cable Pulldown Underhand,Narrow Lat Pulldown
Seated Cable Row (Neutral Grip),Back,Mid Back,Cable,Cable Row Neutral,Seated Cable Row
Seated Cable Row (Wide Grip),Back,Upper Back,Cable,Cable Row Wide,Seated Wide Row
Seated Cable Row (Narrow/Underhand),Back,Lower Lats,Cable,Cable Row Narrow,Seated Underhand Row
Straight Arm Cable Pullover,Back,Lats,Cable,Cable Pullover,Straight Arm Pulldown
Single-Arm Cable Row,Back,Mid Back,Cable,One Arm Cable Row,Cable Row Single
Face Pulls,Back,Upper Back,Cable,Cable Face Pull,Face Rope Pull
Cable Shrugs,Back,Upper Traps,Cable,Cable Trap Raise,Traps Cable Shrug
Assisted Pull-up Machine,Back,Upper Lats,Machine,Assisted Pull-up,Machine Pull-up
Seated Machine Row,Back,Mid Back,Machine,Machine Row,Seated Row
Hammer Strength High Row,Back,Upper Back,Machine,Hammer Row,Hammer Machine Row
Smith Machine Bent Over Row,Back,Upper Back,Smith Machine,Smith Row,Smith BB Row
Smith Machine Shrugs,Back,Upper Traps,Smith Machine,Smith Trap Raise,Smith Shrugs
Back Extension Machine,Back,Spinal Erectors,Machine,Back Extension,Hyperextension Machine
Wide Grip Pull-ups,Back,Upper Lats,Bodyweight,Pull-up Wide,Chin-up Wide
Neutral Grip Pull-ups,Back,Mid Lats,Bodyweight,Pull-up Neutral,Chin-up Neutral
Narrow Grip Chin-ups,Back,Lower Lats,Bodyweight,Chin-up Underhand,Close Grip Pull-up
Inverted Row (Wide Grip),Back,Upper Back,Bodyweight,Body Row Wide,Inverted Row
Inverted Row (Neutral Grip),Back,Mid Back,Bodyweight,Body Row Neutral,Inverted Row Neutral
Superman Extensions,Back,Spinal Erectors,Bodyweight,Superman,Floor Extension
Hyperextensions,Back,Spinal Erectors,Bodyweight,Back Hyperextension,Floor Hyperextension
Scapular Pull-ups,Back,Traps,Bodyweight,Scap Pull-up,Shoulder Pull
Single-Arm Landmine Row Left,Back,Mid Back,Barbell,Landmine Row Left,One Arm Landmine Row Left
Single-Arm Landmine Row Right,Back,Mid Back,Barbell,Landmine Row Right,One Arm Landmine Row Right
Meadows Row Left,Back,Upper Back,Barbell,Meadows BB Row Left,Meadows Row Single Left
Meadows Row Right,Back,Upper Back,Barbell,Meadows BB Row Right,Meadows Row Single Right
Seal Row,Back,Mid Back,Dumbbell/Barbell,Seal DB Row,Seal Barbell Row
Resistance Band Lat Pulldown,Back,Lats,Resistance Band,RB Lat Pulldown,Band Pulldown
Resistance Band Seated Row,Back,Mid Back,Resistance Band,RB Seated Row,Band Row
Kettlebell Gorilla Row Left,Back,Mid Back,Kettlebell,KB Gorilla Row Left,Gorilla Row Left
Kettlebell Gorilla Row Right,Back,Mid Back,Kettlebell,KB Gorilla Row Right,Gorilla Row Right
Neutral Grip Dumbbell Press,Triceps,Lateral Head,Dumbbell,DB Overhead Press,Palms Facing Press
Two-Arm Overhead Dumbbell Extension,Triceps,Long Head,Dumbbell,DB OHP,Overhead DB Ext
Single-Arm Overhead Dumbbell Extension Left,Triceps,Long Head,Dumbbell,DB Single Arm Left,Overhead Ext Left
Single-Arm Overhead Dumbbell Extension Right,Triceps,Long Head,Dumbbell,DB Single Arm Right,Overhead Ext Right
Dumbbell Skull Crushers,Triceps,Lateral Head,Dumbbell,DB Skull Crush,DB Lying Extension
Dumbbell Tricep Kickbacks Left,Triceps,Medial Head,Dumbbell,DB Kickback Left,DB Extension Left
Dumbbell Tricep Kickbacks Right,Triceps,Medial Head,Dumbbell,DB Kickback Right,DB Extension Right
Tate Press,Triceps,Lateral Head,Dumbbell,DB Tate Press,Lying DB Press
Incline Dumbbell Kickbacks Left,Triceps,Medial Head,Dumbbell,Incline DB Kickback Left,DB Kickback Incline Left
Incline Dumbbell Kickbacks Right,Triceps,Medial Head,Dumbbell,Incline DB Kickback Right,DB Kickback Incline Right
Cable Pushdowns (Straight Bar),Triceps,Lateral Head,Cable,Pushdown Bar,Cable Triceps Push
Cable Pushdowns (V-Bar),Triceps,Lateral Head,Cable,Pushdown V,Cable V-Bar
Rope Cable Pushdowns,Triceps,Lateral Head,Cable,Rope Pushdown,Rope Triceps Ext
Overhead Cable Rope Extension,Triceps,Long Head,Cable,Rope OH Ext,Rope Overhead Press
Single-Arm Cable Pushdowns Left,Triceps,Lateral Head,Cable,Cable Push Left,One Arm Push Left
Single-Arm Cable Pushdowns Right,Triceps,Lateral Head,Cable,Cable Push Right,One Arm Push Right
Single-Arm Reverse Grip Pushdowns Left,Triceps,Lateral Head,Cable,Rev Grip Push Left,Reverse Cable Left
Single-Arm Reverse Grip Pushdowns Right,Triceps,Lateral Head,Cable,Rev Grip Push Right,Reverse Cable Right
Cable Kickbacks Left,Triceps,Medial Head,Cable,Cable DB Kickback Left,Kickback Left
Cable Kickbacks Right,Triceps,Medial Head,Cable,Cable DB Kickback Right,Kickback Right
Behind-the-Back Cable Extension Left,Triceps,Long Head,Cable,BB Cable Ext Left,Reverse Cable Ext Left
Behind-the-Back Cable Extension Right,Triceps,Long Head,Cable,BB Cable Ext Right,Reverse Cable Ext Right
Cross-Body Cable Extensions Left,Triceps,Lateral Head,Cable,Cable Cross Ext Left,Triceps Cross Left
Cross-Body Cable Extensions Right,Triceps,Lateral Head,Cable,Cable Cross Ext Right,Triceps Cross Right
Machine Tricep Dip,Triceps,Lateral Head,Machine,Machine Dip,Tricep Machine Dip
Seated Machine Tricep Extension,Triceps,Lateral Head,Machine,Seated Machine Ext,Triceps Ext Machine
Smith Machine Close-Grip Press,Triceps,Lateral Head,Smith Machine,Smith Close Press,Smith Close Grip
Cable French Press,Triceps,Lateral Head,Machine/Cable,French Press,Cable French Ext
Assisted Dip Machine,Triceps,Lateral Head,Machine,Machine Assisted Dip,Assisted Tricep Dip
Bodyweight Dips,Triceps,Lateral Head,Bodyweight,Dip,Parallel Bar Dip
Bench Dips,Triceps,Lateral Head,Bodyweight,Bench Dip,Seated Dip
Diamond Push-ups,Triceps,Lateral Head,Bodyweight,Diamond Press,Close Push-up
Close-Grip Push-ups,Triceps,Lateral Head,Bodyweight,Close Push,Triceps Push-up
Tricep Bodyweight Extensions (on bar/bench),Triceps,Long Head,Bodyweight,Tricep Ext,Bodyweight Tricep Ext
Tiger Bend Push-ups,Triceps,Lateral Head,Bodyweight,Tiger Press,Tiger Triceps Push
Sphinx Push-ups,Triceps,Lateral Head,Bodyweight,Sphinx Press,Sphinx Triceps
EZ-Bar Skull Crushers,Triceps,Lateral Head,EZ-Bar,Skull EZ,EZ Press
EZ-Bar Overhead Extension,Triceps,Long Head,EZ-Bar,EZ OH Ext,Overhead EZ
Close-Grip Floor Press,Triceps,Lateral Head,Barbell,BB Close Floor Press,Close Floor Press
Resistance Band Pushdowns,Triceps,Lateral Head,Resistance Band,RB Pushdown,RB Cable Push
Resistance Band Overhead Extension,Triceps,Long Head,Resistance Band,RB OH Ext,RB Overhead
Incline Barbell Skull Crushers,Triceps,Lateral Head,Barbell,Incline BB Skull,BB Incline Ext
Decline Dumbbell Skull Crushers,Triceps,Lateral Head,Dumbbell,Decline DB Skull,DB Decline Ext
Standing Cable Leaning Extension,Triceps,Long Head,Cable,Leaning Cable Ext,Cable Leaning Press
Dumbbell Power Bombs,Triceps,Lateral Head,Dumbbell,DB Power Bomb,DB Explosive Ext
Weighted Bench Dips,Triceps,Lateral Head,Bodyweight/Plate,Weighted Dip,Weighted Bench Dip
Plank,Core,Abs,Bodyweight,Front Plank,Elbow Plank
Side Plank Left,Core,Obliques,Bodyweight,Left Side Plank,Oblique Plank Left
Side Plank Right,Core,Obliques,Bodyweight,Right Side Plank,Oblique Plank Right
Hollow Body Hold,Core,Abs,Bodyweight,Hollow Hold,Hollow Position
Ab Wheel Rollout,Core,Abs,Bodyweight,Wheel Rollout,Ab Roller
Hanging Leg Raise,Core,Lower Abs,Bodyweight,Hanging L-Sit,Leg Lift Hang
Hanging Knee Raise,Core,Lower Abs,Bodyweight,Hanging Knee Up,Knee Raise Hang
Weighted Decline Sit-up,Core,Abs,Plate,Decline Sit-up with Weight,Weighted Sit-up
Cable Crunch,Core,Abs,Cable,Cable Ab Crunch,Cable Sit-up
Russian Twists Left,Core,Obliques,Bodyweight,Seated Twist Left,Russian Twist L
Russian Twists Right,Core,Obliques,Bodyweight,Seated Twist Right,Russian Twist R
Medicine Ball Russian Twist Left,Core,Obliques,Medicine Ball,MB Twist L,Weighted Twist L
Medicine Ball Russian Twist Right,Core,Obliques,Medicine Ball,MB Twist R,Weighted Twist R
Bicycle Crunch,Core,Abs,Bodyweight,Bike Crunch,Alternating Crunch
Reverse Crunch,Core,Lower Abs,Bodyweight,Reverse Sit-up,Leg Crunch
V-Up,Core,Abs,Bodyweight,V Sit-up,Full Sit-up
Jackknife Sit-up,Core,Abs,Bodyweight,Jackknife Crunch,Full Body Sit-up
Mountain Climbers,Core,Abs,Bodyweight,Climber,Running Plank
Flutter Kicks,Core,Lower Abs,Bodyweight,Leg Flutter,Scissor Kicks
Toe Touch Crunch,Core,Upper Abs,Bodyweight,Toe Crunch,Reach Crunch
Weighted Side Bend Left,Core,Obliques,Plate,Plate Side Bend L,Weighted Side Crunch L
Weighted Side Bend Right,Core,Obliques,Plate,Plate Side Bend R,Weighted Side Crunch R
Standing Oblique Crunch Left,Core,Obliques,Bodyweight,Standing Side Crunch L,Oblique Standing L
Standing Oblique Crunch Right,Core,Obliques,Bodyweight,Standing Side Crunch R,Oblique Standing R
Windshield Wipers Left,Core,Obliques,Bodyweight,Leg Wipers L,Hanging Twist L
Windshield Wipers Right,Core,Obliques,Bodyweight,Leg Wipers R,Hanging Twist R
Captain's Chair Knee Raise,Core,Lower Abs,Machine,Chair Knee Raise,Machine Knee Raise
Seated Leg Tuck,Core,Lower Abs,Bodyweight,Seated Knee Tuck,Chair Tuck
Dragon Flag,Core,Abs,Bodyweight,Full Dragon Flag,Advanced Sit-up
Lying Leg Raise,Core,Lower Abs,Bodyweight,Leg Raise,Floor Leg Lift
Side Crunch Left,Core,Obliques,Bodyweight,Side Sit-up L,Oblique Crunch L
Side Crunch Right,Core,Obliques,Bodyweight,Side Sit-up R,Oblique Crunch R
Cable Woodchopper Left,Core,Obliques,Cable,Woodchopper L,Cable Twist L
Cable Woodchopper Right,Core,Obliques,Cable,Woodchopper R,Cable Twist R
Stability Ball Rollout,Core,Abs,Ball,Ball Rollout,Ball Plank
Stability Ball Pike,Core,Abs,Ball,Ball Pike,Ball Leg Raise
Medicine Ball Sit-up,Core,Abs,Medicine Ball,MB Sit-up,Weighted Sit-up
Medicine Ball V-Up,Core,Abs,Medicine Ball,MB V-Up,Weighted V-Up
TRX Pike,Core,Abs,TRX,TRX Pike TRX Plank Pike
TRX Knee Tuck,Core,Abs,TRX,TRX Knee Pull,TRX Leg Tuck
Side Jackknife Left,Core,Obliques,Bodyweight,Side V-Up L,Side Crunch V L
Side Jackknife Right,Core,Obliques,Bodyweight,Side V-Up R,Side Crunch V R
Oblique V-Up Left,Core,Obliques,Bodyweight,V-Up Side L,Side Abs L
Oblique V-Up Right,Core,Obliques,Bodyweight,V-Up Side R,Side Abs R
Cable Side Bend Left,Core,Obliques,Cable,Cable Side Bend L,Oblique Cable L
Cable Side Bend Right,Core,Obliques,Cable,Cable Side Bend R,Oblique Cable R
Plank Shoulder Tap Left,Core,Abs,Bodyweight,Plank Tap L,Shoulder Tap L
Plank Shoulder Tap Right,Core,Abs,Bodyweight,Plank Tap R,Shoulder Tap R
Plank to Push-up,Core,Abs,Bodyweight,Up-Down Plank,Plank Push-up
Weighted Plank,Core,Abs,Plate,Plate Plank,Weighted Hold
Decline Sit-up,Core,Abs,Bodyweight,Decline Crunch,Decline Floor Sit-up
Barbell Back Squat,Legs,Quads,Barbell,BB Squat,Back Squat
Front Squat,Legs,Quads,Barbell,Front BB Squat,BB Front Squat
Goblet Squat,Legs,Quads,Kettlebell,KB Goblet Squat,Weighted Goblet
Bulgarian Split Squat Left,Legs,Quads,Dumbbell,Split Squat L,Rear Foot Elevated L
Bulgarian Split Squat Right,Legs,Quads,Dumbbell,Split Squat R,Rear Foot Elevated R
Walking Lunge Left,Legs,Quads/DL,Dumbbell,DB Lunge L,Forward Lunge L
Walking Lunge Right,Legs,Quads/DL,Dumbbell,DB Lunge R,Forward Lunge R
Reverse Lunge Left,Legs,Quads/DL,Barbell,BB Reverse Lunge L,Step Back L
Reverse Lunge Right,Legs,Quads/DL,Barbell,BB Reverse Lunge R,Step Back R
Step-up Left,Legs,Quads/DL,Dumbbell,Step Up L,Box Step L
Step-up Right,Legs,Quads/DL,Dumbbell,Step Up R,Box Step R
Romanian Deadlift,Legs,Hamstrings,Barbell,BB RDL,Stiff Leg Deadlift
Sumo Deadlift,Legs,Glutes/Hamstrings,Barbell,Sumo DL,Wide Stance Deadlift
Leg Press,Legs,Quads,Machine,Machine Leg Press,Press Machine
Hack Squat,Legs,Quads,Machine,Hack Machine Squat,Leg Hack
Walking Dumbbell Lunge Left,Legs,Quads,Dumbbell,DB Lunge Forward L,Walking Lunge L
Walking Dumbbell Lunge Right,Legs,Quads,Dumbbell,DB Lunge Forward R,Walking Lunge R
Glute Bridge,Legs,Glutes,Bodyweight,Hip Thrust,Floor Glute Bridge
Hip Thrust,Legs,Glutes,Barbell,BB Hip Thrust,Glute Press
Single-Leg Glute Bridge Left,Legs,Glutes,Bodyweight,Single Leg Bridge L,Glute Raise L
Single-Leg Glute Bridge Right,Legs,Glutes,Bodyweight,Single Leg Bridge R,Glute Raise R
Leg Extension,Legs,Quads,Machine,Leg Ext Machine,Quadriceps Machine
Leg Curl,Legs,Hamstrings,Machine,Leg Curl Machine,Hamstring Curl
Seated Leg Curl,Legs,Hamstrings,Machine,Seated Hamstring Curl,Machine Ham Curl
Standing Calf Raise,Legs,Calves,Machine,Calf Press,Standing Calf Press
Seated Calf Raise,Legs,Calves,Machine,Seated Calf Press,Calf Raise Seated
Dumbbell Step-up Left,Legs,Quads,Dumbbell,DB Step Up L,Step Up L
Dumbbell Step-up Right,Legs,Quads,Dumbbell,DB Step Up R,Step Up R
Barbell Hip Thrust,Legs,Glutes,Barbell,BB Glute Bridge,BB Hip Press
Front Lunge Left,Legs,Quads/DL,Bodyweight,Step Forward L,Bodyweight Lunge L
Front Lunge Right,Legs,Quads/DL,Bodyweight,Step Forward R,Bodyweight Lunge R
Reverse Hack Squat,Legs,Quads,Machine,Hack Reverse Squat,Reverse Leg Press
Sumo Squat,Legs,Quads/Glutes,Barbell,Wide Stance Squat,Sumo BB Squat
Cable Pull Through,Legs,Glutes/Cables,Cable,Cable Glute Pull,Cable Pull Thru
Kettlebell Swing,Legs,Glutes/Kettlebell,Kettlebell,KB Swing,KB Hip Hinge
Side Lunge Left,Legs,Quads/Glutes,Bodyweight,Side Step L,Side Squat L
Side Lunge Right,Legs,Quads/Glutes,Bodyweight,Side Step R,Side Squat R
Curtsy Lunge Left,Legs,Glutes,Bodyweight,Curtsy Step L,Curtsy Squat L
Curtsy Lunge Right,Legs,Glutes,Bodyweight,Curtsy Step R,Curtsy Squat R
Jump Squat,Legs,Quads,Bodyweight,Plyo Squat,Explosive Squat
Pistol Squat Left,Legs,Quads,Bodyweight,Single Leg Squat L,One Leg Squat L
Pistol Squat Right,Legs,Quads,Bodyweight,Single Leg Squat R,One Leg Squat R
Weighted Step-up Left,Legs,Quads/Glutes,Plate,Plate Step Up L,Weighted Step L
Weighted Step-up Right,Legs,Quads/Glutes,Plate,Plate Step Up R,Weighted Step R
Barbell Bicep Curl,Biceps,Long Head,Barbell,BB Curl,Barbell Arm Curl
Dumbbell Bicep Curl Left,Biceps,Long Head,Dumbbell,DB Curl Left,DB Arm Curl Left
Dumbbell Bicep Curl Right,Biceps,Long Head,Dumbbell,DB Curl Right,DB Arm Curl Right
Hammer Curl Left,Biceps,Brachialis,Dumbbell,DB Hammer Left,Neutral Grip Curl Left
Hammer Curl Right,Biceps,Brachialis,Dumbbell,DB Hammer Right,Neutral Grip Curl Right
Incline Dumbbell Curl Left,Biceps,Long Head,Dumbbell,DB Incline Left,Incline Curl Left
Incline Dumbbell Curl Right,Biceps,Long Head,Dumbbell,DB Incline Right,Incline Curl Right
Concentration Curl Left,Biceps,Peak,Dumbbell,DB Concentration Left,DB Peak Curl Left
Concentration Curl Right,Biceps,Peak,Dumbbell,DB Concentration Right,DB Peak Curl Right
Preacher Curl (Barbell),Biceps,Long Head,Barbell,BB Preacher Curl,Preacher BB
Preacher Curl (Dumbbell) Left,Biceps,Long Head,Dumbbell,DB Preacher Left,Preacher Curl Left
Preacher Curl (Dumbbell) Right,Biceps,Long Head,Dumbbell,DB Preacher Right,Preacher Curl Right
Cable Bicep Curl (Straight Bar),Biceps,Long Head,Cable,Cable Curl Straight,Standing Cable Curl
Cable Bicep Curl (EZ Bar),Biceps,Long Head,Cable,Cable Curl EZ,Cable EZ Curl
Cable Hammer Curl Left,Biceps,Brachialis,Cable,Cable Hammer Left,Cable Neutral Curl Left
Cable Hammer Curl Right,Biceps,Brachialis,Cable,Cable Hammer Right,Cable Neutral Curl Right
Zottman Curl Left,Biceps,Brachialis,Dumbbell,Zottman DB Left,DB Rotation Curl Left
Zottman Curl Right,Biceps,Brachialis,Dumbbell,Zottman DB Right,DB Rotation Curl Right
Reverse Curl (Barbell),Biceps,Brachialis,Barbell,BB Reverse Curl,Reverse Grip Curl
Reverse Curl (EZ Bar),Biceps,Brachialis,EZ-Bar,EZ Reverse Curl,Reverse Grip EZ
Incline Cable Curl Left,Biceps,Long Head,Cable,Cable Incline Left,Cable Incline Curl Left
Incline Cable Curl Right,Biceps,Long Head,Cable,Cable Incline Right,Cable Incline Curl Right
Drag Curl Left,Biceps,Long Head,Dumbbell,Drag DB Curl Left,DB Drag Curl Left
Drag Curl Right,Biceps,Long Head,Dumbbell,Drag DB Curl Right,DB Drag Curl Right
Spider Curl Left,Biceps,Peak,Dumbbell,Spider DB Curl Left,DB Spider Curl Left
Spider Curl Right,Biceps,Peak,Dumbbell,Spider DB Curl Right,DB Spider Curl Right
Standing Dumbbell Curl Left,Biceps,Long Head,Dumbbell,DB Curl Left,DB Arm Curl Left
Standing Dumbbell Curl Right,Biceps,Long Head,Dumbbell,DB Curl Right,DB Arm Curl Right
Barbell 21s,Biceps,Long Head,Barbell,BB 21s,21 Curl
Cable Rope Curl,Biceps,Long Head,Cable,Cable Rope Curl,Rope Curl
Incline Inner Biceps Curl Left,Biceps,Inner Head,Dumbbell,Incline Inner DB Left,Inner Curl Left
Incline Inner Biceps Curl Right,Biceps,Inner Head,Dumbbell,Incline Inner DB Right,Inner Curl Right
Preacher Hammer Curl Left,Biceps,Brachialis,Dumbbell,Preacher Hammer DB Left,DB Hammer Preacher Left
Preacher Hammer Curl Right,Biceps,Brachialis,Dumbbell,Preacher Hammer DB Right,DB Hammer Preacher Right
Overhead Cable Curl,Cable,Long Head,Cable,Cable OH Curl,Overhead Curl Cable
Preacher Curl (machine),Biceps,Long Head,Machine,Machine preacher curl,Preacher Curl Machine.`;

export async function initializeDefaultExercises() {
  try {
    // Check if we already have exercises
    const existingCount = await db.exercises.count();
    if (existingCount > 0) {
      console.log('✅ Exercises already initialized');
      return;
    }

    console.log('🚀 Initializing default exercises...');

    // Parse CSV and create exercises
    const lines = EXERCISES_CSV.trim().split('\n');
    const headers = lines[0].split(',');

    const exercises = lines.slice(1).map(line => {
      const values = line.split(',');
      const exercise: Omit<import('./db').Exercise, 'id'> = {
        name: values[0],
        muscleGroup: values[1],
        subMuscleGroup: values[2] || undefined,
        equipment: values[3] || undefined,
        aliases: [values[4], values[5]].filter(Boolean),
        isCustom: false
      };
      return exercise;
    });

    // Bulk insert exercises
    await db.exercises.bulkAdd(exercises);

    console.log(`✅ Initialized ${exercises.length} default exercises`);
  } catch (error) {
    console.error('❌ Failed to initialize default exercises:', error);
  }
}
