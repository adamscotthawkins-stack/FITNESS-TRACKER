/* Exercise how-to cards. Guides are written per movement and matched to exercise names
   (first match wins), so swaps and variations get the right guide. */
const HOW = [
  {
    m: /close-?grip bench/i,
    st: [
      'Lie on a flat bench, eyes under the bar. Grip about shoulder-width, a little narrower than your normal bench.',
      'Squeeze your shoulder blades together and plant your feet.',
      'Lower the bar to your lower chest, keeping your elbows tucked close to your sides.',
      'Press up and slightly back until your arms are straight.'
    ],
    feel: 'The backs of your arms (triceps), plus your chest.',
    avoid: 'Gripping so narrow that your wrists bend. Hands just inside shoulder-width is enough.'
  },
  {
    m: /incline.*(press|bench)|bench.*incline/i,
    st: [
      'Set the bench to about 30°: steeper turns it into a shoulder press.',
      'Sit back with your feet flat and shoulder blades squeezed together.',
      'Lower the weight to your upper chest, just below the collarbone, elbows at about 45° to your body.',
      'Press up and slightly back until your arms are straight, without locking out hard.'
    ],
    feel: 'Your upper chest and the front of your shoulders.',
    avoid: 'Arching so much that your hips lift off the seat.'
  },
  {
    m: /^bench press|bench press \(smith\)/i,
    st: [
      'Lie with your eyes under the bar. Grip a little wider than shoulder-width.',
      'Squeeze your shoulder blades together and down, keep a small arch in your lower back, and plant your feet.',
      'Unrack and lower the bar under control to your lower chest, elbows at about 45°.',
      'Touch, then press up and back towards your face until your arms are straight.'
    ],
    feel: 'Your chest, the front of your shoulders and your triceps.',
    avoid: 'Bouncing the bar off your chest or flaring your elbows straight out to the sides.'
  },
  {
    m: /db bench|db floor press/i,
    st: [
      'Sit with the dumbbells on your thighs, lie back and kick them up to your chest one at a time.',
      'Squeeze your shoulder blades together. Palms face your feet, or slightly in.',
      'Lower until the dumbbells are level with your chest, elbows at about 45°.',
      'Press up and slightly together, without clanking the dumbbells at the top.'
    ],
    feel: 'Your chest, with a deeper stretch than a barbell gives.',
    avoid: 'Letting the dumbbells drift too far out to the sides at the bottom.'
  },
  {
    m: /machine chest press/i,
    st: [
      'Set the seat so the handles line up with your mid-chest.',
      'Sit back with your shoulder blades pinned to the pad.',
      'Press forward until your arms are almost straight.',
      'Let the handles come back slowly until you feel a stretch across your chest.'
    ],
    feel: 'Your chest and the front of your shoulders.',
    avoid: 'Shrugging your shoulders up towards your ears as you press.'
  },
  {
    m: /reverse pec|rear delt|face pull|pull-apart/i,
    st: [
      'Set a cable at face height with a rope (face pulls), or sit facing the pad (reverse pec deck).',
      'Pull with your hands leading, as if pulling the rope apart, with elbows high and out.',
      'Squeeze your shoulder blades together and hold for a second.',
      'Return slowly, letting your shoulders move forward a little.'
    ],
    feel: 'The backs of your shoulders and your upper back.',
    avoid: 'Going too heavy and turning it into a row with your back. This one works best light and strict.'
  },
  {
    m: /\bfly\b|pec deck|crossover/i,
    st: [
      'Set handles or cables at chest height, or sit tall in the pec deck.',
      'Keep a slight, fixed bend in your elbows the whole time.',
      'Open your arms wide until you feel a stretch across your chest.',
      'Bring your hands together in a hugging motion and squeeze for a second.'
    ],
    feel: 'Across your chest, especially the inner part when you squeeze.',
    avoid: 'Bending and straightening your elbows, which turns it into a press.'
  },
  {
    m: /\bdips?\b|dip machine/i,
    st: [
      'Grip the bars (or handles) with your arms straight and shoulders down.',
      'Keep your body upright to focus on the triceps.',
      'Lower until your upper arms are about level with the floor.',
      'Push back up until your arms are straight.'
    ],
    feel: 'The backs of your arms, plus the lower chest.',
    avoid: 'Dropping so low that your shoulders roll forward and ache.'
  },
  {
    m: /shoulder press|overhead press|military|arnold/i,
    st: [
      'Sit tall with your back against the pad (or stand with glutes and stomach tight).',
      'Start with the weight at shoulder height, wrists stacked over elbows.',
      'Press straight up until your arms are straight, bringing your head slightly through at the top.',
      'Lower under control back to shoulder height.'
    ],
    feel: 'The front and sides of your shoulders, and your triceps.',
    avoid: 'Leaning back a lot to push the weight up. Lower the weight instead.'
  },
  {
    m: /lateral raise/i,
    st: [
      'Stand tall with a dumbbell (or cable handle) at your side, a slight bend in your elbow.',
      'Lead with your elbows and raise your arms out to the sides.',
      'Stop at shoulder height, with your little finger level with or slightly above your thumb.',
      'Lower slowly, taking 2–3 seconds.'
    ],
    feel: 'The sides of your shoulders.',
    avoid: 'Swinging your body or shrugging. Use a weight you can lift strictly.'
  },
  {
    m: /pull-?up|chin-?up/i,
    st: [
      'Grip the bar slightly wider than your shoulders, palms facing away.',
      'Start from a dead hang, then pull your shoulder blades down first.',
      'Pull your chest towards the bar until your chin clears it.',
      'Lower all the way down under control.'
    ],
    feel: 'Your lats (the sides of your back) and your biceps.',
    avoid: 'Kicking or swinging to get up. Use the assisted machine or a band if needed.'
  },
  {
    m: /pulldown/i,
    st: [
      'Set the thigh pad so your legs are locked in. Grip slightly wider than your shoulders.',
      'Lean back very slightly and lift your chest.',
      'Pull the bar to your upper chest, driving your elbows down and back.',
      'Let the bar rise slowly until your arms are straight and you feel a stretch.'
    ],
    feel: 'Your lats, down the sides of your back.',
    avoid: 'Leaning way back and yanking with your body.'
  },
  {
    m: /chest-supported row|machine row|t-bar row/i,
    st: [
      'Lie chest-down on the pad (or sit with your chest against it) and grip the handles.',
      'Let your arms hang long with your shoulders stretched forward.',
      'Row by driving your elbows back past your body.',
      'Squeeze your shoulder blades together for a second, then lower slowly.'
    ],
    feel: 'Your mid-back and lats.',
    avoid: 'Lifting your chest off the pad to heave the weight.'
  },
  {
    m: /barbell row|row \(smith\)/i,
    st: [
      'Hinge at the hips until your torso is at about 45°, knees slightly bent, back flat.',
      'Grip just outside your knees and let the bar hang at arm’s length.',
      'Pull the bar to your lower ribs, driving your elbows back.',
      'Lower under control without letting your back round.'
    ],
    feel: 'Your mid-back, lats and the backs of your shoulders.',
    avoid: 'Standing more upright on each rep to swing the weight up.'
  },
  {
    m: /db row/i,
    st: [
      'Put one hand and knee on a bench, back flat and parallel to the floor.',
      'Hold the dumbbell with your arm hanging straight down.',
      'Row it towards your hip, keeping your elbow close to your side.',
      'Lower slowly until you feel a stretch in your lat.'
    ],
    feel: 'Your lat and mid-back on the working side.',
    avoid: 'Twisting your body open to lift the weight.'
  },
  {
    m: /cable row/i,
    st: [
      'Sit with your knees slightly bent and feet on the platform. Grab the handle.',
      'Sit tall with your chest up and let your arms stretch forward.',
      'Pull the handle to your stomach, driving your elbows back.',
      'Squeeze your shoulder blades, then let the weight forward slowly.'
    ],
    feel: 'Your mid-back and lats.',
    avoid: 'Rocking backwards and forwards to move the weight.'
  },
  {
    m: /rack pull/i,
    st: [
      'Set the pins or blocks so the bar sits just below your knees.',
      'Stand with feet hip-width, grip just outside your legs, back flat and chest up.',
      'Push the floor away and drive your hips forward to stand tall.',
      'Lower by hinging at the hips back to the pins.'
    ],
    feel: 'Your upper back, glutes and the muscles along your spine.',
    avoid: 'Leaning back at the top. Just stand tall.'
  },
  {
    m: /trap bar deadlift|^deadlift/i,
    st: [
      'Stand with your mid-foot under the bar (or in the centre of the trap bar).',
      'Hinge down and grip, then bend your knees until your shins touch the bar.',
      'Brace your stomach, flatten your back and pull the slack out of the bar.',
      'Push the floor away and stand up, keeping the bar close to your legs.'
    ],
    feel: 'Your glutes, hamstrings and back.',
    avoid: 'Letting your back round, or jerking the bar off the floor.'
  },
  {
    m: /romanian|\brdl\b|good morning|stiff/i,
    st: [
      'Stand tall holding the weight, with a soft bend in your knees.',
      'Push your hips back as if closing a door with your bum, keeping your back flat.',
      'Lower until you feel a strong stretch in your hamstrings, usually just below the knees.',
      'Drive your hips forward to stand back up.'
    ],
    feel: 'The backs of your thighs (hamstrings) and your glutes.',
    avoid: 'Rounding your back to reach lower, or bending your knees too much.'
  },
  {
    m: /calf/i,
    st: [
      'Stand (or sit) with the balls of your feet on the edge of the step or platform.',
      'Lower your heels as far as you can and pause for a second in the stretch.',
      'Push up onto your toes as high as you can.',
      'Squeeze for a second at the top, then lower slowly.'
    ],
    feel: 'Your calves.',
    avoid: 'Bouncing out of the bottom. The pause in the stretch is what makes it work.'
  },
  {
    m: /goblet squat/i,
    st: [
      'Hold a dumbbell or kettlebell at your chest, elbows pointing down.',
      'Stand with your feet a little wider than your hips, toes slightly out.',
      'Sit down between your heels, keeping your chest up.',
      'Push through your whole foot to stand.'
    ],
    feel: 'Your quads and glutes.',
    avoid: 'Your heels lifting. Put a small plate under them if your ankles are tight.'
  },
  {
    m: /bulgarian split squat/i,
    st: [
      'Stand about a stride in front of a bench and rest the top of your back foot on it.',
      'Hold dumbbells at your sides (or use the Smith machine), chest up.',
      'Lower straight down until your back knee nearly touches the floor.',
      'Push through your front foot to stand back up.'
    ],
    feel: 'The quads and glutes of your front leg.',
    avoid: 'Standing too close to the bench, which pushes your front knee far forward and your heel up.'
  },
  {
    m: /lunge/i,
    st: [
      'Stand tall holding dumbbells at your sides.',
      'Step (forwards, or backwards for a reverse lunge) a long stride.',
      'Lower until both knees are bent to about 90°.',
      'Push through your front foot to step back (or forwards) and repeat.'
    ],
    feel: 'Your quads and glutes.',
    avoid: 'Your front knee caving inwards.'
  },
  {
    m: /sissy squat/i,
    st: [
      'Hold onto something for balance and rise onto the balls of your feet.',
      'Lean back and bend your knees forward, keeping a straight line from knees to shoulders.',
      'Lower only as far as you can control.',
      'Push back up by straightening your knees.'
    ],
    feel: 'Your quads, especially just above the knee.',
    avoid: 'Bending at the hips. Your body should stay in one straight line.'
  },
  {
    m: /hack squat/i,
    st: [
      'Stand with your back flat on the pad, shoulders under the pads, feet hip-width in the middle of the platform.',
      'Release the safeties.',
      'Lower until your thighs are at least parallel to the platform.',
      'Push through your whole foot to stand, without locking your knees hard.'
    ],
    feel: 'Your quads.',
    avoid: 'Your heels lifting or your lower back peeling off the pad.'
  },
  {
    m: /squat/i,
    st: [
      'Set the bar on your upper back, just below the bony bit at the base of your neck. Grip it firmly.',
      'Walk out, feet shoulder-width, toes turned out slightly.',
      'Brace your stomach, then sit down between your heels until your hips are at or below your knees.',
      'Push the floor away and stand up, keeping your chest up.'
    ],
    feel: 'Your quads, glutes and inner thighs.',
    avoid: 'Your knees caving in, or your heels lifting.'
  },
  {
    m: /leg press/i,
    st: [
      'Sit with your back and hips flat on the seat. Feet shoulder-width in the middle of the platform.',
      'Release the safeties.',
      'Lower until your knees are at about 90°, or as deep as you can without your lower back lifting.',
      'Push through your whole foot, stopping just short of locking your knees.'
    ],
    feel: 'Your quads and glutes.',
    avoid: 'Your lower back curling off the pad at the bottom.'
  },
  {
    m: /leg extension/i,
    st: [
      'Set the back pad so your knees line up with the machine’s pivot, and the roller sits just above your ankles.',
      'Hold the handles and sit tall.',
      'Straighten your legs fully and squeeze for a second.',
      'Lower slowly, taking 2–3 seconds.'
    ],
    feel: 'The fronts of your thighs (quads).',
    avoid: 'Kicking the weight up with momentum.'
  },
  {
    m: /nordic/i,
    st: [
      'Kneel with your ankles anchored under a pad or held by a partner.',
      'Keep a straight line from knees to shoulders.',
      'Lower your body forward as slowly as you can.',
      'Catch yourself with your hands, then push back up and pull with your hamstrings.'
    ],
    feel: 'The backs of your thighs. Very intense.',
    avoid: 'Bending at the hips. Keep your hips pushed forward.'
  },
  {
    m: /leg curl/i,
    st: [
      'Line your knees up with the machine’s pivot. Set the roller just above your heels.',
      'Hold the handles and keep your hips pressed down.',
      'Curl your heels towards your bum as far as you can.',
      'Lower slowly until your legs are almost straight.'
    ],
    feel: 'The backs of your thighs (hamstrings).',
    avoid: 'Lifting your hips off the pad to finish the rep.'
  },
  {
    m: /hip thrust|glute bridge/i,
    st: [
      'Sit with your upper back against a bench, bar or pad across your hips, feet flat about hip-width.',
      'Tuck your chin and ribs down.',
      'Drive through your heels and lift your hips until your body is flat from knees to shoulders.',
      'Squeeze your glutes hard for a second at the top, then lower.'
    ],
    feel: 'Your glutes.',
    avoid: 'Arching your lower back at the top instead of squeezing your glutes.'
  },
  {
    m: /incline db curl/i,
    st: [
      'Set a bench to about 45° and lie back with a dumbbell in each hand, arms hanging straight.',
      'Keep your elbows pointing at the floor and still.',
      'Curl the weights up, turning your palms to face up.',
      'Lower slowly all the way down until your arms are straight.'
    ],
    feel: 'Your biceps, with a big stretch at the bottom.',
    avoid: 'Bringing your elbows forward as you curl.'
  },
  {
    m: /curl/i,
    st: [
      'Stand (or sit at the preacher bench) with your elbows by your sides or on the pad.',
      'Curl the weight up by bending only at the elbow.',
      'Squeeze at the top for a second.',
      'Lower slowly until your arms are straight.'
    ],
    feel: 'Your biceps.',
    avoid: 'Swinging your body to get the weight moving.'
  },
  {
    m: /pushdown/i,
    st: [
      'Stand facing the cable with a bar or rope set high. Elbows tucked at your sides.',
      'Lean forward very slightly.',
      'Push down until your arms are straight (spread the rope apart at the bottom).',
      'Let your hands come back up to chest height without your elbows moving.'
    ],
    feel: 'The backs of your arms (triceps).',
    avoid: 'Your elbows drifting forward as the weight goes up.'
  },
  {
    m: /overhead.*extension|skull/i,
    st: [
      'Hold the weight (cable, dumbbell or EZ bar) with your elbows pointing forward or up.',
      'Keep your upper arms still.',
      'Lower the weight behind your head (or towards your forehead for skull crushers) until you feel a stretch.',
      'Straighten your arms to lift it back up.'
    ],
    feel: 'The backs of your arms, especially the long inner part.',
    avoid: 'Flaring your elbows wide.'
  },
  {
    m: /crunch|sit-?up/i,
    st: [
      'Kneel facing the cable with the rope beside your head (or sit in the machine).',
      'Keep your hips still.',
      'Curl your ribs down towards your hips, rounding your back.',
      'Return slowly until your stomach is stretched.'
    ],
    feel: 'Your abs.',
    avoid: 'Pulling with your arms or sitting back on your heels.'
  },
  {
    m: /leg raise|captain/i,
    st: [
      'Hang from a bar (or rest on the captain’s chair pads, or lie flat).',
      'Brace your stomach and stop yourself swinging.',
      'Raise your legs by curling your pelvis up, not just lifting your legs.',
      'Lower slowly without swinging.'
    ],
    feel: 'Your lower abs.',
    avoid: 'Swinging. Pause at the bottom of each rep.'
  }
];
function howOf(n) {
  return HOW.find(h => h.m.test(n)) || null;
}
function howTo(i) {
  const n = NAMES[i],
    h = howOf(n),
    mu = Object.entries(musclesOf(n)).sort((a, b) => b[1] - a[1]),
    su = (S.setup || {})[n];
  SHEET = { how: 1 };
  const el = document.getElementById('sheet');
  el.innerHTML = `<div class="sheet-bg" onclick="closeSheet()"></div><div class="sheet-card tall" role="dialog" aria-modal="true" aria-labelledby="shT"><div class="eyebrow">How to do it</div><h2 id="shT" style="margin:4px 0 8px">${esc(n)}</h2>
<div class="qrow">${mu.map(([k, v]) => `<span class="mtag${v < 1 ? ' sec' : ''}">${MNAME[k]}</span>`).join('')}</div>
${h ? `<ol class="how-st">${h.st.map(s => `<li>${esc(s)}</li>`).join('')}</ol><div class="how-b"><span class="ci" style="--c:var(--green)">${ICO.check}</span><div><b>Feel it in</b><br>${esc(h.feel)}</div></div><div class="how-b"><span class="ci" style="--c:var(--rose)">${ICO.x}</span><div><b>Avoid</b><br>${esc(h.avoid)}</div></div>` : '<div class="mu">No guide for this exercise yet. Move slowly and under control, use a full range you can manage without pain, and keep 1–2 reps in reserve.</div>'}
${su ? `<div class="note su" style="margin-top:12px"><span class="ni">${ICO.pin}</span><span class="nb"><b>Your setup:</b> ${esc(su)}</span></div>` : ''}
<button class="btn" style="width:100%;margin-top:16px" onclick="closeSheet()">Got it</button></div>`;
  el.hidden = false;
}
