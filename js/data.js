/* Built-in plan, meals, recipes and calorie goals */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const clone = o => JSON.parse(JSON.stringify(o));
const DEF_PLAN = [
  {
    n: 'Push',
    f: 'Heavy bench, shoulders, triceps',
    e: [
      ['Bench press (heavy)', '5×5'],
      ['Incline DB press', '3×10'],
      ['Cable fly / pec deck', '3×12–15'],
      ['Seated shoulder press', '3×8–10'],
      ['Lateral raises', '4×15'],
      ['Triceps pushdown', '3×12'],
      ['Overhead triceps extension', '2×12']
    ]
  },
  {
    n: 'Pull',
    f: 'Back, biceps, rear delts',
    e: [
      ['Rack pull', '3×6'],
      ['Pull-ups / lat pulldown', '4×8'],
      ['Barbell row', '3×8'],
      ['Seated cable row', '3×10'],
      ['Face pulls', '3×15'],
      ['Incline DB curl', '3×12']
    ]
  },
  {
    n: 'Legs',
    f: 'Quads, hamstrings, calves',
    e: [
      ['Squat', '4×6–8'],
      ['Romanian deadlift', '3×8–10'],
      ['Leg press', '3×12'],
      ['Seated leg curl', '3×12'],
      ['Calf raises', '4×15'],
      ['Cable crunch', '3×15']
    ]
  },
  { n: 'Rest day', f: 'Recovery: walk 20–30 min', e: [['Walk, eat well, sleep 8h', '—']] },
  {
    n: 'Upper',
    f: 'Bench volume, back, arms',
    e: [
      ['Bench press (volume)', '4×8'],
      ['Chest-supported row', '4×10'],
      ['DB shoulder press', '3×10'],
      ['Lat pulldown', '3×10'],
      ['Preacher or cable curl', '3×12'],
      ['Triceps pushdown', '3×12']
    ]
  },
  {
    n: 'Lower',
    f: 'Glutes, quads, core',
    e: [
      ['Hip thrust', '4×8'],
      ['Bulgarian split squat', '3×10 each'],
      ['Hack squat / leg press', '3×12'],
      ['Leg extension', '3×15'],
      ['Calf raises', '4×15'],
      ['Hanging leg raise', '3×12']
    ]
  },
  { n: 'Rest day', f: 'Full rest', e: [['Walk, eat well, sleep 8h', '—']] }
];
let PLAN = clone(DEF_PLAN);
const MEALS = [
  { n: 'Breakfast', i: 'Porridge with banana, whey scoop, peanut butter', k: 550, p: 28 },
  { n: 'Lunch', i: 'Chicken, rice and veg, olive oil', k: 700, p: 42 },
  { n: 'Snack', i: 'Greek yoghurt, berries, handful of nuts', k: 350, p: 18 },
  { n: 'Dinner', i: 'Chicken thighs, sweet potato, broccoli', k: 750, p: 38 },
  { n: 'Evening', i: 'Cottage cheese on toast', k: 300, p: 16 }
];
const RECIPES = [
  {
    n: 'Protein overnight oats',
    w: 'Breakfast',
    t: '5 min + overnight',
    k: 560,
    p: 36,
    ing: ['60g oats', '200ml milk', '1 scoop whey', '100g Greek yoghurt', '1 banana', '1 tbsp peanut butter'],
    st: [
      'Mix oats, milk, whey and yoghurt in a jar.',
      'Chill overnight.',
      'Top with sliced banana and peanut butter.'
    ]
  },
  {
    n: 'Egg and cheese scramble wraps',
    w: 'Breakfast',
    t: '10 min',
    k: 540,
    p: 34,
    ing: ['3 eggs', '30g cheddar', '2 wholemeal wraps', 'Handful of spinach', 'Salt, pepper'],
    st: [
      'Scramble the eggs in a non-stick pan on low heat.',
      'Stir in spinach and cheese until melted.',
      'Spoon into the wraps and roll up.'
    ]
  },
  {
    n: 'Chicken, rice and veg bowl',
    w: 'Lunch',
    t: '20 min',
    k: 700,
    p: 45,
    ing: [
      '150g chicken breast',
      '80g dry rice',
      '150g frozen veg',
      '1 tbsp olive oil',
      'Paprika, garlic powder'
    ],
    st: [
      'Cook the rice as per the packet.',
      'Slice the chicken, season and fry in oil for 6–8 min until cooked through.',
      'Steam or microwave the veg.',
      'Combine in a bowl.'
    ]
  },
  {
    n: 'Tuna pasta',
    w: 'Lunch',
    t: '15 min',
    k: 690,
    p: 50,
    ing: [
      '90g dry pasta',
      '1 tin tuna in spring water',
      '3 tbsp sweetcorn',
      '4 tbsp passata',
      '30g grated cheese'
    ],
    st: [
      'Boil the pasta for 10 min and drain.',
      'Warm the passata in the pan with the tuna and sweetcorn.',
      'Stir through the pasta and top with cheese.'
    ]
  },
  {
    n: 'Beef chilli',
    w: 'Dinner',
    t: '30 min',
    k: 750,
    p: 48,
    ing: [
      '150g 5% beef mince',
      '½ tin kidney beans',
      '½ tin chopped tomatoes',
      '1 onion',
      '1 pepper',
      '1 tsp chilli powder',
      '1 tsp cumin',
      '80g dry rice'
    ],
    st: [
      'Fry the onion and pepper for 5 min, add the mince and brown it.',
      'Add spices, tomatoes and beans.',
      'Simmer for 15–20 min.',
      'Serve over the cooked rice.'
    ]
  },
  {
    n: 'Chicken tray bake',
    w: 'Dinner',
    t: '35 min',
    k: 750,
    p: 45,
    ing: [
      '200g skinless chicken thigh fillets',
      '250g sweet potato',
      '100g broccoli',
      '1 tbsp olive oil',
      'Lemon, salt, pepper'
    ],
    st: [
      'Heat the oven to 200°C (180°C fan).',
      'Cube the sweet potato, toss in oil and roast for 15 min.',
      'Add the chicken and broccoli and roast for 20 min more until the chicken is cooked through.',
      'Squeeze lemon over.'
    ]
  },
  {
    n: 'Turkey noodle stir-fry',
    w: 'Dinner',
    t: '15 min',
    k: 650,
    p: 48,
    ing: [
      '150g turkey mince',
      '1 nest egg noodles',
      '150g stir-fry veg',
      '1 tbsp soy sauce',
      '1 tsp sesame oil',
      'Garlic, ginger'
    ],
    st: [
      'Cook the noodles and drain.',
      'Fry the turkey with garlic and ginger until browned.',
      'Add the veg and cook for 3–4 min.',
      'Add noodles, soy and sesame oil and toss.'
    ]
  },
  {
    n: 'Peanut butter protein smoothie',
    w: 'Snacks and shakes',
    t: '3 min',
    k: 480,
    p: 40,
    ing: ['300ml milk', '1 scoop whey', '1 banana', '1 tbsp peanut butter', '40g oats'],
    st: ['Blend everything until smooth.', 'Add ice if you like it thicker.']
  }
];
const GOALS = { cut: ['Lose fat', 0.8], maintain: ['Maintain', 0.95], bulk: ['Lean bulk', 1.057] };
