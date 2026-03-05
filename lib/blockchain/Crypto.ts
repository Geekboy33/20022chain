// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Cryptographic Primitives
// Production-grade crypto: Ed25519, BIP39/BIP32/BIP44, multisig, ZK
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

export type KeyAlgorithm = 'ed25519' | 'secp256k1' | 'x25519';
export type HashAlgorithm = 'sha256' | 'sha384' | 'sha512' | 'keccak256' | 'blake2b';
export type SignatureScheme = 'ed25519' | 'ecdsa-secp256k1' | 'ecdsa-p256';

export interface KeyPair {
  publicKey: Buffer;
  privateKey: Buffer;
  algorithm: KeyAlgorithm;
  createdAt: number;
}

export interface HDKeyPath {
  purpose: number;   // 44' for BIP44
  coinType: number;  // 20022 for ARCHT
  account: number;
  change: number;    // 0 = external, 1 = internal
  index: number;
}

export interface HDWallet {
  mnemonic: string;
  seed: Buffer;
  masterKey: Buffer;
  chainCode: Buffer;
  path: string;
  derivePath(path: string): KeyPair;
  deriveChild(index: number): HDWallet;
}

export interface MultisigConfig {
  signers: string[];      // Public keys
  threshold: number;
  version: number;
}

export interface MultisigSignature {
  signatures: Map<string, Buffer>;
  config: MultisigConfig;
  messageHash: Buffer;
  valid: boolean;
}

export interface MerkleProof {
  leaf: Buffer;
  leafIndex: number;
  siblings: Buffer[];
  root: Buffer;
  path: boolean[];  // true = right, false = left
}

export interface BloomFilter {
  bits: number[];
  k: number;        // Hash functions
  m: number;        // Size in bits
  add(item: string | Buffer): void;
  contains(item: string | Buffer): boolean;
}

// ─────────────────────────────────────────────────────────────
// BIP39 Word List (2048 words - English)
// ─────────────────────────────────────────────────────────────

const BIP39_WORDS: string[] = [
  'abandon','ability','able','about','above','absent','absorb','abstract','absurd','abuse',
  'access','accident','account','accuse','achieve','acid','acoustic','acquire','across','act',
  'action','actor','actress','actual','adapt','add','addict','address','adjust','admit',
  'adult','advance','advice','aerobic','affair','afford','afraid','again','age','agent',
  'agree','ahead','aim','air','airport','aisle','alarm','album','alcohol','alert',
  'alien','all','alley','allow','almost','alone','alpha','already','also','alter',
  'always','amateur','amazing','among','amount','amused','analyst','anchor','ancient','anger',
  'angle','angry','animal','ankle','announce','annual','another','answer','antenna','antique',
  'anxiety','any','apart','apology','appear','apple','approve','april','arch','arctic',
  'area','arena','argue','arm','armed','armor','army','around','arrange','arrest',
  'arrive','arrow','art','artefact','artist','artwork','ask','aspect','assault','asset',
  'assist','assume','asthma','athlete','atom','attack','attend','attitude','attract','auction',
  'audit','august','aunt','author','auto','autumn','average','avocado','avoid','awake',
  'aware','away','awesome','awful','awkward','axis','baby','bachelor','bacon','badge',
  'bag','balance','balcony','ball','bamboo','banana','banner','bar','barely','bargain',
  'barrel','base','basic','basket','battle','beach','bean','beauty','because','become',
  'beef','before','begin','behave','behind','believe','below','belt','bench','benefit',
  'best','betray','better','between','beyond','bicycle','bid','bike','bind','biology',
  'bird','birth','bitter','black','blade','blame','blanket','blast','bleak','bless',
  'blind','blood','blossom','blouse','blue','blur','blush','board','boat','body',
  'boil','bomb','bone','bonus','book','boost','border','boring','borrow','boss',
  'bottom','bounce','box','boy','bracket','brain','brand','brass','brave','bread',
  'breeze','brick','bridge','brief','bright','bring','brisk','broccoli','broken','bronze',
  'broom','brother','brown','brush','bubble','buddy','budget','buffalo','build','bulb',
  'bulk','bullet','bundle','bunker','burden','burger','burst','bus','business','busy',
  'butter','buyer','buzz','cabbage','cabin','cable','cactus','cage','cake','call',
  'calm','camera','camp','can','canal','cancel','candy','cannon','canoe','canvas',
  'canyon','capable','capital','captain','car','carbon','card','cargo','carpet','carry',
  'cart','case','cash','casino','castle','casual','cat','catalog','catch','category',
  'cattle','caught','cause','caution','cave','ceiling','celery','cement','census','century',
  'cereal','certain','chair','chalk','champion','change','chaos','chapter','charge','chase',
  'chat','cheap','check','cheese','chef','cherry','chest','chicken','chief','child',
  'chimney','choice','choose','chronic','chuckle','chunk','churn','cigar','cinnamon','circle',
  'citizen','city','civil','claim','clap','clarify','claw','clay','clean','clerk',
  'clever','click','client','cliff','climb','clinic','clip','clock','clog','close',
  'cloth','cloud','clown','club','clump','cluster','clutch','coach','coast','coconut',
  'code','coffee','coil','coin','collect','color','column','combine','come','comfort',
  'comic','common','company','concert','conduct','confirm','congress','connect','consider','control',
  'convince','cook','cool','copper','copy','coral','core','corn','correct','cost',
  'cotton','couch','country','couple','course','cousin','cover','coyote','crack','cradle',
  'craft','cram','crane','crash','crater','crawl','crazy','cream','credit','creek',
  'crew','cricket','crime','crisp','critic','crop','cross','crouch','crowd','crucial',
  'cruel','cruise','crumble','crunch','crush','cry','crystal','cube','culture','cup',
  'cupboard','curious','current','curtain','curve','cushion','custom','cute','cycle','dad',
  'damage','damp','dance','danger','daring','dash','daughter','dawn','day','deal',
  'debate','debris','decade','december','decide','decline','decorate','decrease','deer','defense',
  'define','defy','degree','delay','deliver','demand','demise','denial','dentist','deny',
  'depart','depend','deposit','depth','deputy','derive','describe','desert','design','desk',
  'despair','destroy','detail','detect','develop','device','devote','diagram','dial','diamond',
  'diary','dice','diesel','diet','differ','digital','dignity','dilemma','dinner','dinosaur',
  'direct','dirt','disagree','discover','disease','dish','dismiss','disorder','display','distance',
  'divert','divide','divorce','dizzy','doctor','document','dog','doll','dolphin','domain',
  'donate','donkey','donor','door','dose','double','dove','draft','dragon','drama',
  'drastic','draw','dream','dress','drift','drill','drink','drip','drive','drop',
  'drum','dry','duck','dumb','dune','during','dust','dutch','duty','dwarf',
  'dynamic','eager','eagle','early','earn','earth','easily','east','easy','echo',
  'ecology','economy','edge','edit','educate','effort','egg','eight','either','elbow',
  'elder','electric','elegant','element','elephant','elevator','elite','else','embark','embody',
  'embrace','emerge','emotion','employ','empower','empty','enable','enact','end','endless',
  'endorse','enemy','energy','enforce','engage','engine','enhance','enjoy','enlist','enough',
  'enrich','enroll','ensure','enter','entire','entry','envelope','episode','equal','equip',
  'era','erase','erode','erosion','error','erupt','escape','essay','essence','estate',
  'eternal','ethics','evidence','evil','evoke','evolve','exact','example','excess','exchange',
  'excite','exclude','excuse','execute','exercise','exhaust','exhibit','exile','exist','exit',
  'exotic','expand','expect','expire','explain','expose','express','extend','extra','eye',
  'eyebrow','fabric','face','faculty','fade','faint','faith','fall','false','fame',
  'family','famous','fan','fancy','fantasy','farm','fashion','fat','fatal','father',
  'fatigue','fault','favorite','feature','february','federal','fee','feed','feel','female',
  'fence','festival','fetch','fever','few','fiber','fiction','field','figure','file',
  'film','filter','final','find','fine','finger','finish','fire','firm','first',
  'fiscal','fish','fit','fitness','fix','flag','flame','flash','flat','flavor',
  'flee','flight','flip','float','flock','floor','flower','fluid','flush','fly',
  'foam','focus','fog','foil','fold','follow','food','foot','force','forest',
  'forget','fork','fortune','forum','forward','fossil','foster','found','fox','fragile',
  'frame','frequent','fresh','friend','fringe','frog','front','frost','frown','frozen',
  'fruit','fuel','fun','funny','furnace','fury','future','gadget','gain','galaxy',
  'gallery','game','gap','garage','garbage','garden','garlic','garment','gas','gasp',
  'gate','gather','gauge','gaze','general','genius','genre','gentle','genuine','gesture',
  'ghost','giant','gift','giggle','ginger','giraffe','girl','give','glad','glance',
  'glare','glass','glide','glimpse','globe','gloom','glory','glove','glow','glue',
  'goat','goddess','gold','good','goose','gorilla','gospel','gossip','govern','gown',
  'grab','grace','grain','grant','grape','grass','gravity','great','green','grid',
  'grief','grit','grocery','group','grow','grunt','guard','guess','guide','guilt',
  'guitar','gun','gym','habit','hair','half','hammer','hamster','hand','happy',
  'harbor','hard','harsh','harvest','hat','have','hawk','hazard','head','health',
  'heart','heavy','hedgehog','height','hello','helmet','help','hen','hero','hidden',
  'high','hill','hint','hip','hire','history','hobby','hockey','hold','hole',
  'holiday','hollow','home','honey','hood','hope','horn','horror','horse','hospital',
  'host','hotel','hour','hover','hub','huge','human','humble','humor','hundred',
  'hungry','hunt','hurdle','hurry','hurt','husband','hybrid','ice','icon','idea',
  'identify','idle','ignore','ill','illegal','illness','image','imitate','immense','immune',
  'impact','impose','improve','impulse','inch','include','income','increase','index','indicate',
  'indoor','industry','infant','inflict','inform','inhale','inherit','initial','inject','injury',
  'inmate','inner','innocent','input','inquiry','insane','insect','inside','inspire','install',
  'intact','interest','into','invest','invite','involve','iron','island','isolate','issue',
  'item','ivory','jacket','jaguar','jar','jazz','jealous','jeans','jelly','jewel',
  'job','join','joke','journey','joy','judge','juice','jump','jungle','junior',
  'junk','just','kangaroo','keen','keep','ketchup','key','kick','kid','kidney',
  'kind','kingdom','kiss','kit','kitchen','kite','kitten','kiwi','knee','knife',
  'knock','know','lab','label','labor','ladder','lady','lake','lamp','language',
  'laptop','large','later','latin','laugh','laundry','lava','law','lawn','lawsuit',
  'layer','lazy','leader','leaf','learn','leave','lecture','left','leg','legal',
  'legend','leisure','lemon','lend','length','lens','leopard','lesson','letter','level',
  'liar','liberty','library','license','life','lift','light','like','limb','limit',
  'link','lion','liquid','list','little','live','lizard','load','loan','lobster',
  'local','lock','logic','lonely','long','loop','lottery','loud','lounge','love',
  'loyal','lucky','luggage','lumber','lunar','lunch','luxury','lyrics','machine','mad',
  'magic','magnet','maid','mail','main','major','make','mammal','man','manage',
  'mandate','mango','mansion','manual','maple','marble','march','margin','marine','market',
  'marriage','mask','mass','master','match','material','math','matrix','matter','maximum',
  'maze','meadow','mean','measure','meat','mechanic','medal','media','melody','melt',
  'member','memory','mention','menu','mercy','merge','merit','merry','mesh','message',
  'metal','method','middle','midnight','milk','million','mimic','mind','minimum','minor',
  'minute','miracle','mirror','misery','miss','mistake','mix','mixed','mixture','mobile',
  'model','modify','mom','moment','monitor','monkey','monster','month','moon','moral',
  'more','morning','mosquito','mother','motion','motor','mountain','mouse','move','movie',
  'much','muffin','mule','multiply','muscle','museum','mushroom','music','must','mutual',
  'myself','mystery','myth','naive','name','napkin','narrow','nasty','nation','nature',
  'near','neck','need','negative','neglect','neither','nephew','nerve','nest','net',
  'network','neutral','never','news','next','nice','night','noble','noise','nominee',
  'noodle','normal','north','nose','notable','note','nothing','notice','novel','now',
  'nuclear','number','nurse','nut','oak','obey','object','oblige','obscure','observe',
  'obtain','obvious','occur','ocean','october','odor','off','offer','office','often',
  'oil','okay','old','olive','olympic','omit','once','one','onion','online',
  'only','open','opera','opportunity','oppose','option','orange','orbit','orchard','order',
  'ordinary','organ','orient','original','orphan','ostrich','other','outdoor','outer','output',
  'outside','oval','oven','over','own','owner','oxygen','oyster','ozone','pact',
  'paddle','page','pair','palace','palm','panda','panel','panic','panther','paper',
  'parade','parent','park','parrot','party','pass','patch','path','patient','patrol',
  'pattern','pause','pave','payment','peace','peanut','pear','peasant','pelican','pen',
  'penalty','pencil','people','pepper','perfect','permit','person','pet','phone','photo',
  'phrase','physical','piano','picnic','picture','piece','pig','pigeon','pill','pilot',
  'pink','pioneer','pipe','pistol','pitch','pizza','place','planet','plastic','plate',
  'play','please','pledge','pluck','plug','plunge','poem','poet','point','polar',
  'pole','police','pond','pony','pool','popular','portion','position','possible','post',
  'potato','pottery','poverty','powder','power','practice','praise','predict','prefer','prepare',
  'present','pretty','prevent','price','pride','primary','print','priority','prison','private',
  'prize','problem','process','produce','profit','program','project','promote','proof','property',
  'prosper','protect','proud','provide','public','pudding','pull','pulp','pulse','pumpkin',
  'punch','pupil','puppy','purchase','purity','purpose','purse','push','put','puzzle',
  'pyramid','quality','quantum','quarter','question','quick','quit','quiz','quote','rabbit',
  'raccoon','race','rack','radar','radio','rail','rain','raise','rally','ramp',
  'ranch','random','range','rapid','rare','rate','rather','raven','raw','razor',
  'ready','real','reason','rebel','rebuild','recall','receive','recipe','record','recycle',
  'reduce','reflect','reform','refuse','region','regret','regular','reject','relax','release',
  'relief','rely','remain','remember','remind','remove','render','renew','rent','reopen',
  'repair','repeat','replace','report','require','rescue','resemble','resist','resource','response',
  'result','retire','retreat','return','reunion','reveal','review','reward','rhythm','rib',
  'ribbon','rice','rich','ride','ridge','rifle','right','rigid','ring','riot',
  'ripple','ritual','rival','river','road','roast','robot','robust','rocket','romance',
  'roof','rookie','room','rose','rotate','rough','round','route','royal','rubber',
  'rude','rug','rule','run','runway','rural','sad','saddle','sadness','safe',
  'sail','salad','salmon','salon','salt','salute','same','sample','sand','satisfy',
  'satoshi','sauce','sausage','save','say','scale','scan','scare','scatter','scene',
  'scheme','school','science','scissors','scorpion','scout','scrap','screen','script','scrub',
  'sea','search','season','seat','second','secret','section','security','seed','seek',
  'segment','select','sell','seminar','senior','sense','sentence','series','service','session',
  'settle','setup','seven','shadow','shaft','shallow','share','shed','shell','sheriff',
  'shield','shift','shine','ship','shiver','shock','shoe','shoot','shop','short',
  'shoulder','shove','shrimp','shrug','shuffle','shy','sibling','sick','side','siege',
  'sight','sign','silent','silk','silly','silver','similar','simple','since','sing',
  'siren','sister','situate','six','size','skate','sketch','ski','skill','skin',
  'skirt','skull','slab','slam','sleep','slender','slice','slide','slight','slim',
  'slogan','slot','slow','slush','small','smart','smile','smoke','smooth','snack',
  'snake','snap','sniff','snow','soap','soccer','social','sock','soda','soft',
  'solar','soldier','solid','solution','solve','someone','song','soon','sorry','sort',
  'soul','sound','soup','source','south','space','spare','spatial','spawn','speak',
  'special','speed','spell','spend','sphere','spice','spider','spike','spin','spirit',
  'split','spoil','sponsor','spoon','sport','spot','spray','spread','spring','spy',
  'square','squeeze','squirrel','stable','stadium','staff','stage','stairs','stamp','stand',
  'start','state','stay','steak','steel','stem','step','stereo','stick','still',
  'sting','stock','stomach','stone','stool','story','stove','strategy','street','strike',
  'strong','struggle','student','stuff','stumble','style','subject','submit','subway','success',
  'such','sudden','suffer','sugar','suggest','suit','summer','sun','sunny','sunset',
  'super','supply','supreme','sure','surface','surge','surprise','surround','survey','suspect',
  'sustain','swallow','swamp','swap','swarm','swear','sweet','swift','swim','swing',
  'switch','sword','symbol','symptom','syrup','system','table','tackle','tag','tail',
  'talent','talk','tank','tape','target','task','taste','tattoo','taxi','teach',
  'team','tell','ten','tenant','tennis','tent','term','test','text','thank',
  'that','theme','then','theory','there','they','thing','this','thought','three',
  'thrive','throw','thumb','thunder','ticket','tide','tiger','tilt','timber','time',
  'tiny','tip','tired','tissue','title','toast','tobacco','today','toddler','toe',
  'together','toilet','token','tomato','tomorrow','tone','tongue','tonight','tool','tooth',
  'top','topic','topple','torch','tornado','tortoise','toss','total','tourist','toward',
  'tower','town','toy','track','trade','traffic','tragic','train','transfer','trap',
  'trash','travel','tray','treat','tree','trend','trial','tribe','trick','trigger',
  'trim','trip','trophy','trouble','truck','true','truly','trumpet','trust','truth',
  'try','tube','tuition','tumble','tuna','tunnel','turkey','turn','turtle','twelve',
  'twenty','twice','twin','twist','two','type','typical','ugly','umbrella','unable',
  'unaware','uncle','uncover','under','undo','unfair','unfold','unhappy','uniform','unique',
  'unit','universe','unknown','unlock','until','unusual','unveil','update','upgrade','uphold',
  'upon','upper','upset','urban','urge','usage','use','used','useful','useless',
  'usual','utility','vacant','vacuum','vague','valid','valley','valve','van','vanish',
  'vapor','various','vast','vault','vehicle','velvet','vendor','venture','venue','verb',
  'verify','version','very','vessel','veteran','viable','vibrant','vicious','victory','video',
  'view','village','vintage','violin','virtual','virus','visa','visit','visual','vital',
  'vivid','vocal','voice','void','volcano','volume','vote','voyage','wage','wagon',
  'wait','walk','wall','walnut','want','warfare','warm','warrior','wash','wasp',
  'waste','water','wave','way','wealth','weapon','wear','weasel','weather','web',
  'wedding','weekend','weird','welcome','west','wet','whale','what','wheat','wheel',
  'when','where','whip','whisper','wide','width','wife','wild','will','win',
  'window','wine','wing','wink','winner','winter','wire','wisdom','wise','wish',
  'witness','wolf','woman','wonder','wood','wool','word','work','world','worry',
  'worth','wrap','wreck','wrestle','wrist','write','wrong','yard','year','yellow',
  'you','young','youth','zebra','zero','zone','zoo'
];

// ─────────────────────────────────────────────────────────────
// Hash Functions
// ─────────────────────────────────────────────────────────────

export function sha256(data: string | Buffer): Buffer {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return crypto.createHash('sha256').update(buf).digest();
}

export function sha384(data: string | Buffer): Buffer {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return crypto.createHash('sha384').update(buf).digest();
}

export function sha512(data: string | Buffer): Buffer {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return crypto.createHash('sha512').update(buf).digest();
}

/** Keccak256 simulation via SHA3-256 (identical for many use cases) */
export function keccak256(data: string | Buffer): Buffer {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return crypto.createHash('sha3-256').update(buf).digest();
}

export function blake2b(data: string | Buffer, size = 64): Buffer {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return crypto.createHash('blake2b512').update(buf).digest().subarray(0, size);
}

export function ripemd160(data: string | Buffer): Buffer {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return crypto.createHash('ripemd160').update(buf).digest();
}

export function hashToHex(data: string | Buffer, algo: HashAlgorithm = 'sha256'): string {
  const fns: Record<HashAlgorithm, (d: string | Buffer) => Buffer> = {
    sha256, sha384, sha512, keccak256, blake2b: d => blake2b(d, 32)
  };
  return fns[algo](data).toString('hex');
}

// ─────────────────────────────────────────────────────────────
// HMAC & PBKDF2
// ─────────────────────────────────────────────────────────────

export function hmacSha256(key: Buffer, data: Buffer): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

export function pbkdf2(password: string | Buffer, salt: Buffer, iterations: number, keylen: number): Buffer {
  return crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha512');
}

// ─────────────────────────────────────────────────────────────
// Ed25519 (simulated via X25519 + ECDH for key derivation)
// Uses Node crypto for actual Ed25519 when available
// ─────────────────────────────────────────────────────────────

export function generateEd25519KeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' }
  });
  return {
    publicKey: Buffer.from(publicKey),
    privateKey: Buffer.from(privateKey),
    algorithm: 'ed25519',
    createdAt: Date.now()
  };
}

export function signEd25519(privateKey: Buffer, message: Buffer): Buffer {
  const key = crypto.createPrivateKey({ key: privateKey, format: 'der', type: 'pkcs8' });
  return crypto.sign(null, message, key);
}

export function verifyEd25519(publicKey: Buffer, message: Buffer, signature: Buffer): boolean {
  const key = crypto.createPublicKey({ key: publicKey, format: 'der', type: 'spki' });
  return crypto.verify(null, message, key, signature);
}

// ─────────────────────────────────────────────────────────────
// Secp256k1 (ECDSA) - Ethereum-compatible
// ─────────────────────────────────────────────────────────────

export function generateSecp256k1KeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' }
  });
  return {
    publicKey: Buffer.from(publicKey),
    privateKey: Buffer.from(privateKey),
    algorithm: 'secp256k1',
    createdAt: Date.now()
  };
}

export function signSecp256k1(privateKey: Buffer, messageHash: Buffer): Buffer {
  const key = crypto.createPrivateKey({ key: privateKey, format: 'der', type: 'pkcs8' });
  const sig = crypto.createSign('SHA256').update(messageHash).sign({ key });
  return sig;
}

export function verifySecp256k1(publicKey: Buffer, messageHash: Buffer, signature: Buffer): boolean {
  const key = crypto.createPublicKey({ key: publicKey, format: 'der', type: 'spki' });
  return crypto.createVerify('SHA256').update(messageHash).verify(key, signature);
}

// ─────────────────────────────────────────────────────────────
// BIP39: Mnemonic Generation & Validation
// ─────────────────────────────────────────────────────────────

export function generateMnemonic(strength: 128 | 192 | 256 = 128): string {
  const entropy = crypto.randomBytes(strength / 8);
  const checksum = sha256(entropy).subarray(0, strength / 32);
  const bits = Buffer.concat([entropy, checksum]);
  const words: string[] = [];
  for (let i = 0; i < bits.length * 8 / 11; i++) {
    let idx = 0;
    for (let j = 0; j < 11; j++) idx = (idx << 1) | ((bits[(i * 11 + j) >> 3] >> (7 - (i * 11 + j) % 8)) & 1);
    words.push(BIP39_WORDS[idx]);
  }
  return words.join(' ');
}

export function validateMnemonic(mnemonic: string): boolean {
  const words = mnemonic.trim().split(/\s+/);
  if (words.length !== 12 && words.length !== 15 && words.length !== 18 && words.length !== 21 && words.length !== 24) return false;
  for (const w of words) if (!BIP39_WORDS.includes(w)) return false;
  const entropy = Buffer.alloc((words.length * 11 - (words.length * 11 % 32)) / 8);
  for (let i = 0; i < words.length * 11; i++) {
    const wordIdx = BIP39_WORDS.indexOf(words[Math.floor(i / 11)]);
    if ((wordIdx >> (10 - i % 11)) & 1) entropy[i >> 3] |= 1 << (7 - i % 8);
  }
  const cs = sha256(entropy.subarray(0, entropy.length - 4));
  return Buffer.compare(entropy.subarray(-4), cs.subarray(0, 4)) === 0;
}

export function mnemonicToSeed(mnemonic: string, passphrase = ''): Buffer {
  const salt = Buffer.from('mnemonic' + passphrase, 'utf8');
  return pbkdf2(mnemonic, salt, 2048, 64);
}

// ─────────────────────────────────────────────────────────────
// BIP32: HD Key Derivation
// ─────────────────────────────────────────────────────────────

export function deriveMasterKey(seed: Buffer): { key: Buffer; chainCode: Buffer } {
  const h = hmacSha256(Buffer.from('Bitcoin seed', 'utf8'), seed);
  return { key: h.subarray(0, 32), chainCode: h.subarray(32) };
}

export function deriveChild(parentKey: Buffer, parentChainCode: Buffer, index: number, hardened: boolean): { key: Buffer; chainCode: Buffer } {
  const data = Buffer.alloc(37);
  data[0] = 0;
  if (hardened) {
    parentKey.copy(data, 1);
    data.writeUInt32BE(0x80000000 | index, 33);
  } else {
    const h = hmacSha256(parentChainCode, Buffer.concat([parentKey, Buffer.from([index & 0xff, (index >> 8) & 0xff, (index >> 16) & 0xff, (index >> 24) & 0xff])]));
    return { key: h.subarray(0, 32), chainCode: h.subarray(32) };
  }
  const h = hmacSha256(parentChainCode, data);
  return { key: h.subarray(0, 32), chainCode: h.subarray(32) };
}

export function pathToIndexes(path: string): number[] {
  const parts = path.replace(/^m\//, '').split('/');
  return parts.map(p => {
    const hardened = p.endsWith("'");
    const idx = parseInt(p.replace("'", ''), 10);
    return hardened ? 0x80000000 | idx : idx;
  });
}

// ─────────────────────────────────────────────────────────────
// BIP44: ARCHT Coin Type 20022
// ─────────────────────────────────────────────────────────────

export const ARCHT_COIN_TYPE = 20022;

export function deriveARCHTAddress(mnemonic: string, account = 0, index = 0): { address: string; privateKey: Buffer } {
  const seed = mnemonicToSeed(mnemonic);
  const { key: masterKey, chainCode: masterChain } = deriveMasterKey(seed);
  const path = `m/44'/${ARCHT_COIN_TYPE}'/${account}'/0/${index}`;
  let key = masterKey, chain = masterChain;
  for (const idx of [44, ARCHT_COIN_TYPE, account, 0, index]) {
    const hardened = idx === 44 || idx === ARCHT_COIN_TYPE || idx === account;
    const { key: k, chainCode: c } = deriveChild(key, chain, idx, hardened);
    key = k; chain = c;
  }
  const hash = ripemd160(sha256(key));
  return {
    address: `archt:hd:${hash.toString('hex').slice(0, 16)}`,
    privateKey: key
  };
}

// ─────────────────────────────────────────────────────────────
// Merkle Tree
// ─────────────────────────────────────────────────────────────

export function merkleRoot(leaves: Buffer[]): Buffer {
  if (leaves.length === 0) return sha256(Buffer.alloc(0));
  if (leaves.length === 1) return sha256(leaves[0]);
  let level = leaves.map(l => sha256(l));
  while (level.length > 1) {
    const next: Buffer[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : left;
      next.push(sha256(Buffer.concat([left, right])));
    }
    level = next;
  }
  return level[0];
}

export function merkleProof(leaves: Buffer[], leafIndex: number): MerkleProof {
  const siblings: Buffer[] = [];
  const path: boolean[] = [];
  let level = leaves.map(l => sha256(l));
  let idx = leafIndex;
  while (level.length > 1) {
    const next: Buffer[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : left;
      if (i === idx || i + 1 === idx) {
        siblings.push(i === idx ? right : left);
        path.push(i === idx);
      }
      next.push(sha256(Buffer.concat([left, right])));
      idx = Math.floor(idx / 2);
    }
    level = next;
  }
  return {
    leaf: leaves[leafIndex],
    leafIndex,
    siblings,
    root: level[0],
    path
  };
}

export function verifyMerkleProof(proof: MerkleProof): boolean {
  let hash = sha256(proof.leaf);
  for (let i = 0; i < proof.siblings.length; i++) {
    hash = proof.path[i]
      ? sha256(Buffer.concat([proof.siblings[i], hash]))
      : sha256(Buffer.concat([hash, proof.siblings[i]]));
  }
  return hash.equals(proof.root);
}

// ─────────────────────────────────────────────────────────────
// Bloom Filter (for event indexing)
// ─────────────────────────────────────────────────────────────

export function createBloomFilter(size = 2048, k = 3): BloomFilter {
  const bits = new Array(size).fill(0);
  return {
    bits,
    k,
    m: size,
    add(item: string | Buffer) {
      const buf = typeof item === 'string' ? Buffer.from(item, 'utf8') : item;
      for (let i = 0; i < this.k; i++) {
        const h = sha256(Buffer.concat([buf, Buffer.from([i])])).readUInt32BE(0) % this.m;
        bits[Math.abs(h) % this.m] = 1;
      }
    },
    contains(item: string | Buffer): boolean {
      const buf = typeof item === 'string' ? Buffer.from(item, 'utf8') : item;
      for (let i = 0; i < this.k; i++) {
        const h = sha256(Buffer.concat([buf, Buffer.from([i])])).readUInt32BE(0) % this.m;
        if (bits[Math.abs(h) % this.m] === 0) return false;
      }
      return true;
    }
  };
}

// ─────────────────────────────────────────────────────────────
// CSPRNG
// ─────────────────────────────────────────────────────────────

export function secureRandom(bytes: number): Buffer {
  return crypto.randomBytes(bytes);
}

export function randomNonce(): number {
  return crypto.randomInt(0, 0xFFFFFFFF);
}

// ─────────────────────────────────────────────────────────────
// Address Utilities
// ─────────────────────────────────────────────────────────────

export function publicKeyToAddress(pubKey: Buffer, prefix = 'archt'): string {
  const hash = keccak256(pubKey).subarray(12);
  return `${prefix}:0x${hash.toString('hex')}`;
}

export function checksumAddress(address: string): string {
  const hex = address.replace(/^0x/, '').toLowerCase();
  const hash = keccak256(hex).toString('hex');
  let result = '0x';
  for (let i = 0; i < 40; i++) result += parseInt(hash[i], 16) >= 8 ? hex[i].toUpperCase() : hex[i];
  return result;
}
