/* Common foods, for instant suggestions while typing (works offline).
   [name, kcal per 100 g, protein g per 100 g, usual portion in g, portion name]. Typical values, rounded. */
const FOODDB=[
['Chicken breast, cooked',165,31,150,'1 breast'],['Chicken breast, raw',106,24,150,'1 breast'],['Chicken thigh fillet, cooked',180,25,100,'1 fillet'],['Chicken drumstick, cooked',172,28,75,'1 drumstick'],
['Turkey mince 5% fat, cooked',160,28,125,'1 portion'],['Turkey breast slices',104,23,30,'2 slices'],['Beef mince 5% fat, cooked',172,27,125,'1 portion'],['Beef mince 20% fat, cooked',270,25,125,'1 portion'],
['Sirloin steak, cooked',205,30,200,'1 steak'],['Pork loin steak, cooked',205,28,150,'1 steak'],['Pork sausage, grilled',280,15,40,'1 sausage'],['Back bacon, grilled',287,24,25,'1 rasher'],
['Ham, sliced',107,18,30,'2 slices'],['Salmon fillet, cooked',206,22,120,'1 fillet'],['Smoked salmon',184,23,50,'1 portion'],['Tuna, tinned in spring water',109,25,112,'1 tin, drained'],
['Cod fillet, cooked',105,23,140,'1 fillet'],['Prawns, cooked',99,22,100,'1 portion'],['Mackerel, smoked',305,19,80,'1 fillet'],['Sardines, tinned in tomato',162,17,120,'1 tin'],
['Egg, boiled',147,13,50,'1 egg'],['Egg, fried',196,14,50,'1 egg'],['Scrambled eggs',166,11,120,'2 eggs'],['Egg whites',52,11,100,'3 egg whites'],
['Tofu, firm',144,17,100,'1 portion'],['Quorn mince',105,14,75,'1 portion'],['Whey protein powder',400,78,30,'1 scoop'],['Protein bar',370,33,60,'1 bar'],['Protein yoghurt',60,10,200,'1 pot'],
['Greek yoghurt, full fat',97,9,170,'1 pot'],['Greek yoghurt, 0% fat',57,10.3,170,'1 pot'],['Skyr',64,11,150,'1 pot'],['Natural yoghurt',61,3.5,125,'1 pot'],['Cottage cheese',98,11,150,'half a tub'],
['Milk, semi-skimmed',46,3.5,250,'1 glass'],['Milk, skimmed',34,3.4,250,'1 glass'],['Milk, whole',64,3.3,250,'1 glass'],['Oat milk',45,1,250,'1 glass'],['Soya milk',40,3.3,250,'1 glass'],
['Cheddar cheese',416,25,30,'1 slice'],['Mozzarella',254,18.5,125,'1 ball'],['Light mozzarella',167,19,125,'1 ball'],['Feta',265,14,30,'1 portion'],['Halloumi',320,21,80,'3 slices'],['Parmesan',392,36,10,'1 tbsp grated'],
['Cream cheese, light',147,7.4,30,'1 portion'],['Butter',744,0.6,10,'1 knob'],
['Porridge oats',375,11,40,'1 bowl (dry)'],['Overnight oats',150,6,250,'1 jar'],['Granola',450,9,45,'1 bowl'],['Weetabix',362,12,37.5,'2 biscuits'],['Cornflakes',378,7,30,'1 bowl'],['Muesli',360,10,45,'1 bowl'],
['White rice, cooked',130,2.7,180,'1 portion'],['Brown rice, cooked',123,2.7,180,'1 portion'],['Basmati rice, dry',350,8,75,'1 portion (dry)'],['Microwave rice pouch',150,3,250,'1 pouch'],
['Pasta, cooked',158,5.8,180,'1 portion'],['Pasta, dry',355,12.5,80,'1 portion (dry)'],['Wholewheat pasta, cooked',149,6,180,'1 portion'],['Egg noodles, cooked',138,4.5,185,'1 nest, cooked'],
['Couscous, cooked',112,3.8,150,'1 portion'],['Quinoa, cooked',120,4.4,150,'1 portion'],
['Potato, boiled',80,2,175,'1 medium'],['Jacket potato',93,2.5,220,'1 medium'],['Sweet potato, baked',90,2,150,'1 medium'],['Mashed potato',104,1.8,180,'1 portion'],['Oven chips',180,2.9,150,'1 portion'],['Roast potatoes',150,2.9,150,'1 portion'],
['White bread',235,8.4,40,'1 slice'],['Wholemeal bread',217,9.4,40,'1 slice'],['Seeded bread',260,11,44,'1 slice'],['Sourdough bread',260,9,50,'1 slice'],['Bagel, plain',257,10,85,'1 bagel'],
['Wrap, white',300,8.5,62,'1 wrap'],['Wrap, wholemeal',280,9,62,'1 wrap'],['Pitta bread',263,9,60,'1 pitta'],['English muffin',227,9,63,'1 muffin'],['Crumpet',182,6.4,55,'1 crumpet'],['Croissant',406,8.2,60,'1 croissant'],
['Rice cakes',387,8,8,'1 cake'],['Crackers',440,10,8,'1 cracker'],
['Banana',89,1.1,120,'1 medium'],['Apple',52,0.3,150,'1 medium'],['Orange',47,0.9,140,'1 medium'],['Pear',57,0.4,170,'1 medium'],['Kiwi',61,1.1,75,'1 kiwi'],['Satsuma',47,0.8,70,'1 satsuma'],
['Blueberries',57,0.7,80,'1 handful'],['Strawberries',32,0.7,80,'1 handful'],['Raspberries',52,1.2,80,'1 handful'],['Mixed berries, frozen',45,1,80,'1 handful'],['Grapes',69,0.7,80,'1 handful'],
['Pineapple',50,0.5,80,'1 portion'],['Mango',60,0.8,80,'1 portion'],['Melon',34,0.8,150,'1 slice'],['Raisins',299,3.1,30,'1 small box'],['Medjool dates',277,1.8,24,'1 date'],['Avocado',160,2,75,'half an avocado'],
['Broccoli',35,2.4,80,'1 portion'],['Spinach',23,2.9,80,'1 handful'],['Carrots',41,0.9,80,'1 medium'],['Peas',79,5.4,80,'1 portion'],['Sweetcorn',81,2.9,80,'1 portion'],['Green beans',31,1.8,80,'1 portion'],
['Mixed salad leaves',17,1.2,40,'1 bowl'],['Tomato',18,0.9,85,'1 medium'],['Cherry tomatoes',18,0.9,80,'6 tomatoes'],['Cucumber',15,0.7,80,'1 portion'],['Mushrooms',22,3.1,80,'1 portion'],
['Onion',40,1.1,150,'1 medium'],['Pepper',31,1,160,'1 pepper'],['Courgette',17,1.2,80,'1 portion'],['Cauliflower',25,1.9,80,'1 portion'],['Mixed frozen vegetables',50,3,80,'1 portion'],['Stir-fry vegetables',40,2,150,'half a bag'],
['Baked beans',78,4.7,207,'half a tin'],['Chickpeas, tinned',115,7.2,120,'half a tin'],['Kidney beans, tinned',100,7,120,'half a tin'],['Lentils, cooked',116,9,150,'1 portion'],['Edamame beans',121,12,80,'1 portion'],['Hummus',290,7,30,'2 tbsp'],
['Peanut butter',600,25,15,'1 tbsp'],['Almonds',579,21,30,'1 handful'],['Mixed nuts',607,20,30,'1 handful'],['Cashews',553,18,30,'1 handful'],['Walnuts',654,15,30,'1 handful'],['Chia seeds',486,17,15,'1 tbsp'],
['Olive oil',884,0,14,'1 tbsp'],['Honey',304,0.3,21,'1 tbsp'],['Jam',250,0.4,15,'1 tbsp'],['Chocolate spread',539,6.3,15,'1 tbsp'],['Mayonnaise',680,1,15,'1 tbsp'],['Ketchup',112,1.2,15,'1 tbsp'],
['Dark chocolate (70%)',598,7.8,20,'2 squares'],['Milk chocolate',535,7.6,45,'1 bar'],['Crisps',536,6,25,'1 bag'],['Digestive biscuit',486,7.1,15,'1 biscuit'],['Flapjack',450,5,60,'1 flapjack'],['Popcorn, salted',480,8,25,'1 bag'],
['Pizza, cheese and tomato',266,11,100,'1 slice'],['Chicken curry',140,12,350,'1 portion'],['Spaghetti bolognese',120,7,400,'1 portion'],['Chilli con carne',110,9,350,'1 portion'],['Sushi, salmon',150,6,200,'1 pack'],
['Orange juice',45,0.7,200,'1 glass'],['Latte',55,3.4,350,'1 medium'],['Cappuccino',40,2.5,350,'1 medium'],['Cola',42,0,330,'1 can'],['Lager',43,0.5,568,'1 pint'],['Red wine',85,0.1,175,'1 medium glass']
].map(r=>({n:r[0],k100:r[1],p100:r[2],sq:r[3],sl:r[4]+' ('+r[3]+' g)',src:'common'}));
/* words in a name, lower case, without punctuation */
const fwords=s=>String(s).toLowerCase().replace(/[^a-z0-9%\s]/g,' ').split(/\s+/).filter(Boolean);
/* how well a name matches what's typed: lower is better, null for no match. Every typed word must start a word
   in the name. Plurals match either way: eggs/egg, potatoes/potato, blueberry/blueberries. */
function fscore(name,q){const N=fwords(name),Q=fwords(q);if(!Q.length)return null;let sc=0,whole=true;
for(const t of Q){const V=[t,t.replace(/s$/,''),t.replace(/es$/,''),t.replace(/ies$/,'y'),t.replace(/y$/,'i')].filter((v,j)=>j===0||(v!==t&&v.length>2));
const i=N.findIndex(w=>V.some(v=>w.startsWith(v)));if(i<0)return null;sc+=i;
if(!N.some(w=>V.some(v=>w===v||w===v+'s'||w===v+'es'||w===v.replace(/i$/,'ies'))))whole=false}
/* starts with what was typed, then whole-word matches (pea: peas before pear), then earlier words; ties keep list order */
return (String(name).toLowerCase().startsWith(String(q).toLowerCase().trim())?0:1000)+(whole?0:100)+sc*10}
function fmatch(list,q,n){return list.map(f=>({f:f,s:fscore(f.n,q)})).filter(x=>x.s!=null).sort((a,b)=>a.s-b.s).slice(0,n).map(x=>x.f)}
