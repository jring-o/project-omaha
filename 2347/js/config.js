/**
 * TOWER DEFENDER 2347 - Configuration
 * Game constants, weapons, enemy types, services, powerups, upgrades, and settings
 */

// Tower block data from the original game
export const BLOCK_DATA = [
    { width: 14.104908565928778, height: 0.9095283926852743, depth: 11.283926852743022, x: -3.4143407122232916, y: 1.8118383060635226, z: 0 },
    { width: 11.650625601539941, height: 1.2271414821944175, depth: 9.320500481231953, x: -3.717516843118383, y: 2.9523580365736284, z: 0 },
    { width: 3.3638113570741095, height: 0.603, depth: 2.6910490856592877, x: -6.879210779595764, y: 3.8979788257940324, z: 0 },
    { width: 0.7, height: 1.4, depth: 0.7, x: 0.14436958614051973, y: 4.453801732435034, z: 0 },
    { width: 2.512030798845043, height: 0.797, depth: 2.009624639076035, x: -6.756496631376323, y: 4.793070259865255, z: 0 },
    { width: 9.254090471607315, height: 0.548604427333975, depth: 7.403272377285852, x: -3.688642925890279, y: 5.615976900866217, z: 0 },
    { width: 10.365736284889316, height: 3.190567853705486, depth: 8.292589027911452, x: -3.8113570741097207, y: 7.42781520692974, z: 0 },
    { width: 5.384985563041385, height: 1.9489894128970162, depth: 4.3079884504331085, x: -0.9600577478344562, y: 10.127526467757459, z: 0 },
    { width: 5.26948989412897, height: 6.799807507218479, depth: 4.215591915303176, x: -6.792589027911453, y: 12.610683349374398, z: 0 },
    { width: 5.760346487006737, height: 2.078922040423484, depth: 4.60827718960539, x: -0.8301251203079884, y: 12.343599615014437, z: 0 },
    { width: 1.4003849855630413, height: 4.2877767083734355, depth: 1.120307988450433, x: 0.2959576515880654, y: 15.77237728585178, z: 0 },
    { width: 1.1549566891241578, height: 3.2483156881616937, depth: 0.9239653512993263, x: -1.7901828681424445, y: 15.252646775745909, z: 0 },
    { width: 0.6641000962463908, height: 0.9817131857555341, depth: 0.5312800769971127, x: 1.8334937439846004, y: 14.11934552454283, z: 0 },
    { width: 0.6785370548604427, height: 0.3609239653512993, depth: 0.5428296438883542, x: -3.197786333012512, y: 13.866698748796919, z: 0 },
    { width: 0.4764196342637151, height: 0.18768046198267563, depth: 0.3811357074109721, x: -3.168912415784408, y: 15.743503368623676, z: 0 },
    { width: 0.7362848893166506, height: 0.3609239653512993, depth: 0.5890279114533205, x: 1.7396535129932627, y: 16.017805582290663, z: 0 },
    { width: 4.403272377285852, height: 0.7795957651588065, depth: 3.5226179018286814, x: -6.9080846968238685, y: 16.60250240615977, z: 0 },
    { width: 0.23099133782483156, height: 1.3426371511068333, depth: 0.18479307025986524, x: -1.8768046198267563, y: 17.735803657362847, z: 0 },
    { width: 0.4186717998075072, height: 0.49085659287776706, depth: 0.33493743984600577, x: -1.1766121270452357, y: 17.309913378248314, z: 0 },
    { width: 1.4725697786333012, height: 1.09720885466795, depth: 1.178055822906641, x: -5.500481231953802, y: 17.743022136669875, z: 0 },
    { width: 0.6063522617901829, height: 0.9672762271414821, depth: 0.4850818094321463, x: -8.50336862367661, y: 17.735803657362847, z: 0 },
    { width: 0.4764196342637151, height: 0.548604427333975, depth: 0.3811357074109721, x: -7.095765158806544, y: 17.584215591915303, z: 0 },
    { width: 0.6641000962463908, height: 0.7362848893166506, depth: 0.5312800769971127, x: 0.17324350336862365, y: 18.472088546679498, z: 0 },
    { width: 1.530317613089509, height: 0.23099133782483156, depth: 1.2242540904716073, x: -8.286814244465832, y: 18.59480269489894, z: 0 },
    { width: 1.2127045235803657, height: 2.512030798845043, depth: 0.9701636188642926, x: -5.558229066410009, y: 19.793070259865253, z: 0 },
    { width: 0.9672762271414821, height: 0.8517805582290664, depth: 0.7738209817131857, x: -1.9417709335899902, y: 19.092877767083735, z: 0 },
    { width: 0.23099133782483156, height: 0.30317613089509143, depth: 0.18479307025986524, x: -9.181905678537055, y: 19.12175168431184, z: 0 },
    { width: 0.3609239653512993, height: 0.43310875842155916, depth: 0.28873917228103946, x: 0.26708373435996147, y: 19.302213666987488, z: 0 },
    { width: 3.681424446583253, height: 0.6063522617901829, depth: 2.9451395572666024, x: -0.9600577478344562, y: 20.009624639076034, z: 0 },
    { width: 0.3609239653512993, height: 0.43310875842155916, depth: 0.28873917228103946, x: -8.019730510105871, y: 20.529355149181903, z: 0 },
    { width: 0.548604427333975, height: 1.2127045235803657, depth: 0.43888354186718, x: 0.8517805582290664, y: 21.049085659287776, z: 0 },
    { width: 1.7757459095283925, height: 2.2666025024061596, depth: 1.420596727622714, x: -0.9311838306063522, y: 21.63378248315688, z: 0 },
    { width: 0.4186717998075072, height: 0.3609239653512993, depth: 0.33493743984600577, x: -2.7069297401347447, y: 20.73869104908566, z: 0 },
    { width: 0.28873917228103946, height: 0.30317613089509143, depth: 0.23099133782483158, x: -7.98363811357074, y: 21.142925890279113, z: 0 },
    { width: 0.24542829643888353, height: 1.4148219441770933, depth: 0.19634263715110684, x: -5.190086621751684, y: 22.001924927815207, z: 0 },
    { width: 0.6641000962463908, height: 0.4186717998075072, depth: 0.5312800769971127, x: -5.226179018286814, y: 23.16410009624639, z: 0 },
    { width: 0.6785370548604427, height: 0.43310875842155916, depth: 0.5428296438883542, x: -1.4797882579403272, y: 23.229066410009622, z: 0 },
    { width: 0.7218479307025986, height: 0.43310875842155916, depth: 0.5774783445620789, x: -0.1588065447545717, y: 23.229066410009622, z: 0 },
    { width: 1.2271414821944175, height: 0.4186717998075072, depth: 0.9817131857555341, x: -0.7723772858517806, y: 23.90038498556304, z: 0 }
];

// Scale factor for the tower
export const SCALE = 10;

// Weapon configurations
export const WEAPONS = [
    {
        name: 'LASER',
        fireRate: 100,
        damage: 10,
        speed: 8,
        color: 0x00ffff,
        spread: 0,
        count: 1,
        size: 0.3
    },
    {
        name: 'SPREAD',
        fireRate: 200,
        damage: 8,
        speed: 6,
        color: 0x00ff00,
        spread: 0.15,
        count: 5,
        size: 0.2
    },
    {
        name: 'MISSILE',
        fireRate: 500,
        damage: 50,
        speed: 4,
        color: 0xff6600,
        spread: 0,
        count: 1,
        size: 0.5,
        homing: true
    }
];

// Enemy type configurations
export const ENEMY_TYPES = {
    // Regular enemies
    entitlement: {
        name: 'Entitlement Swarm',
        color: 0xff6666,
        speed: 1.2,
        health: 20,
        damage: 3,
        points: 50,
        size: 0.6,
        behavior: 'swarm',
        description: 'Demanding users who want everything fixed NOW'
    },
    corporate: {
        name: 'Corporate Leech',
        color: 0x666699,
        speed: 0.3,
        health: 120,
        damage: 15,
        points: 200,
        size: 1.8,
        behavior: 'tank',
        description: 'Companies using without giving back'
    },
    burnout: {
        name: 'Burnout Specter',
        color: 0x9966ff,
        speed: 0.7,
        health: 40,
        damage: 20,
        points: 150,
        size: 1.0,
        behavior: 'phase',
        description: 'The exhaustion that haunts every maintainer'
    },
    scopeCreep: {
        name: 'Scope Creeper',
        color: 0x66ff66,
        speed: 0.5,
        health: 60,
        damage: 10,
        points: 120,
        size: 0.8,
        behavior: 'grow',
        growthRate: 1.02,
        maxSize: 2.5,
        description: 'Feature requests that never stop growing'
    },
    troll: {
        name: 'Troll Cluster',
        color: 0xff9900,
        speed: 0.9,
        health: 35,
        damage: 8,
        points: 100,
        size: 0.9,
        behavior: 'erratic',
        description: 'Harassment and toxic behavior'
    },
    zeroDay: {
        name: 'Zero-Day',
        color: 0x333333,
        speed: 1.0,
        health: 25,
        damage: 30,
        points: 180,
        size: 0.7,
        behavior: 'stealth',
        stealthDistance: 100,
        description: 'Unpatched vulnerabilities lurking in the shadows'
    },

    // Bosses
    heartbleed: {
        name: 'Heartbleed',
        color: 0xff0000,
        speed: 0.2,
        health: 500,
        damage: 5,
        points: 1000,
        size: 3.0,
        behavior: 'drain',
        drainRate: 2,
        isBoss: true,
        description: 'Your passwords. Your banks. One memory bug.',
        year: 2014
    },
    leftpad: {
        name: 'The Left-Pad Void',
        color: 0x000022,
        speed: 0.4,
        health: 400,
        damage: 50,
        points: 1000,
        size: 2.5,
        behavior: 'remove',
        isBoss: true,
        description: '11 lines of code. Broke the entire internet.',
        year: 2016
    },
    log4shell: {
        name: 'Log4Shell',
        color: 0xff3300,
        speed: 0.3,
        health: 800,
        damage: 15,
        points: 1500,
        size: 4.0,
        behavior: 'spawn',
        spawnType: 'zeroDay',
        spawnRate: 5000,
        isBoss: true,
        description: 'One library. Every Java app. Billions of devices.',
        year: 2021
    },
    colors: {
        name: 'Colors Chaos',
        color: 0xff00ff,
        speed: 0.6,
        health: 450,
        damage: 25,
        points: 1200,
        size: 2.8,
        behavior: 'corrupt',
        isBoss: true,
        description: 'What happens when a burnt-out maintainer snaps?',
        year: 2022
    },
    xz: {
        name: 'The XZ Infiltrator',
        color: 0x00ff00,
        speed: 0.5,
        health: 1000,
        damage: 40,
        points: 2000,
        size: 3.5,
        behavior: 'infiltrate',
        isBoss: true,
        description: 'A "helpful contributor" spent 2 years gaining trust...',
        year: 2024
    }
};

// Services that depend on the tower
export const SERVICES = [
    // Commercial/Apps
    { id: 'netflix', name: 'Netflix', icon: '📺', failMessage: 'Streaming unavailable', type: 'commercial' },
    { id: 'instagram', name: 'Instagram', icon: '📷', failMessage: "Can't load feed", type: 'commercial' },
    { id: 'banking', name: 'Banking', icon: '🏦', failMessage: 'TRANSACTIONS FAILING', type: 'commercial' },
    { id: 'gmail', name: 'Gmail', icon: '📧', failMessage: 'Emails not sending', type: 'commercial' },
    { id: 'amazon', name: 'Amazon', icon: '📦', failMessage: 'Orders not processing', type: 'commercial' },
    { id: 'uber', name: 'Uber', icon: '🚗', failMessage: 'No drivers available', type: 'commercial' },
    // Human Connection/Critical Needs
    { id: 'grandkids', name: 'Grandkid Photos', icon: '👶', failMessage: "CAN'T SEE GRANDKIDS", type: 'human' },
    { id: 'familyCalls', name: 'Family Calls', icon: '📱', failMessage: 'Call failed', type: 'human' },
    { id: 'hospital', name: 'Hospital Directions', icon: '🏥', failMessage: 'NAVIGATION OFFLINE', type: 'human' },
    { id: 'prescriptions', name: 'Prescriptions', icon: '💊', failMessage: 'PHARMACY SYSTEM DOWN', type: 'human' },
    { id: 'bankBalance', name: 'Bank Balance', icon: '💰', failMessage: 'Balance unavailable', type: 'human' },
    { id: 'talkToKids', name: 'Talk to Children', icon: '💬', failMessage: 'Connection lost', type: 'human' }
];

// Powerup configurations (MegaBonk style)
export const POWERUPS = {
    coffee: {
        name: 'Coffee',
        icon: '☕',
        color: 0x8B4513,
        effect: 'fireRate',
        multiplier: 1.5,
        duration: 10,
        description: '+50% fire rate'
    },
    energyDrink: {
        name: 'Energy Drink',
        icon: '⚡',
        color: 0xffff00,
        effect: 'speed',
        multiplier: 1.5,
        duration: 10,
        description: '+50% move speed'
    },
    rubberDuck: {
        name: 'Rubber Duck',
        icon: '🦆',
        color: 0xffcc00,
        effect: 'autoTarget',
        duration: 15,
        description: 'Auto-targeting helper'
    },
    stackOverflow: {
        name: 'Stack Overflow',
        icon: '📚',
        color: 0xff8800,
        effect: 'megaShot',
        damage: 200,
        description: 'One massive shot'
    },
    gitRevert: {
        name: 'Git Revert',
        icon: '↩️',
        color: 0x00ff88,
        effect: 'restoreBlock',
        description: 'Restore last block'
    },
    backupRestore: {
        name: 'Backup Restore',
        icon: '💾',
        color: 0x0088ff,
        effect: 'healTower',
        amount: 20,
        description: '+20% tower health'
    },
    firewall: {
        name: 'Firewall',
        icon: '🛡️',
        color: 0x00ffff,
        effect: 'shield',
        duration: 8,
        description: 'Tower invincible'
    },
    viralTweet: {
        name: 'Viral Tweet',
        icon: '🐦',
        color: 0x1da1f2,
        effect: 'invincible',
        duration: 5,
        scoreMultiplier: 3,
        description: 'Invincible + 3x score'
    },
    sponsorCheck: {
        name: 'Sponsor Check',
        icon: '💵',
        color: 0x00ff00,
        effect: 'money',
        amount: 500,
        description: '+$500 funding'
    },
    githubStar: {
        name: 'GitHub Star',
        icon: '⭐',
        color: 0xffdd00,
        effect: 'scoreMultiplier',
        multiplier: 2,
        duration: 20,
        description: '2x score'
    }
};

// Upgrade paths for the shop
// requires format: [] = no deps, [['a','b']] = a AND b, [['a'],['b']] = a OR b
export const UPGRADE_PATHS = {
    financial: {
        name: 'Financial Support',
        icon: '💰',
        color: '#00ff88',
        description: 'Tower health and regeneration',
        upgrades: [
            {
                id: 'smallGrant',
                name: 'Small Grant',
                cost: 200,
                effect: { maxHealthMult: 1.05 },
                flavor: '$50/month. It\'s a start.',
                requires: [],
                education: 'Right now, maintainers work for FREE while billion-dollar companies profit from their code. Without any compensation, they feel invisible - like nobody values their work. Even $50/month says "you matter." It\'s not about the money. It\'s about being seen.'
            },
            {
                id: 'majorGrant',
                name: 'Major Grant',
                cost: 400,
                effect: { maxHealthMult: 1.10 },
                flavor: '$500/month. They noticed.',
                requires: [['smallGrant']],
                education: 'Most maintainers have day jobs - they work on critical software in stolen hours, late at night, on weekends. $500/month isn\'t life-changing money, but it\'s enough to cut back a few hours at work. Enough to say "this isn\'t just a hobby anymore." It\'s the difference between squeezing in bug fixes and actually having time to do the work properly.'
            },
            {
                id: 'companyTime',
                name: 'Company Allocates 10% Time',
                cost: 600,
                effect: { regenRate: 0.1 },
                flavor: 'Boss said it\'s okay to work on this Fridays.',
                requires: [['publicCredit']],
                education: 'Most maintainers have a secret: they\'re working on open source during lunch breaks, pretending it doesn\'t exist at work. When a company officially says "spend Friday on that project" - it\'s not just 8 hours. It\'s permission. It\'s legitimacy. It\'s being able to fix a critical bug at 2pm instead of 2am.'
            },
            {
                id: 'kidsFirstSteps',
                name: "See Kid's First Steps",
                cost: 800,
                effect: { maxHealthMult: 1.15 },
                flavor: 'They were there this time.',
                requires: [['secondMaintainer', 'boundaries', 'mentalHealth']],
                education: 'Too many maintainers miss their children\'s milestones - first steps, school plays, birthdays - because they couldn\'t step away. Being present for these moments requires everything working together: someone else who can cover, the boundaries to actually disconnect, and the inner peace to not feel guilty about it. This is what "having a life" actually looks like.'
            },
            {
                id: 'familyVacation',
                name: 'Family Vacation',
                cost: 1000,
                effect: { maxHealthMult: 1.20 },
                flavor: 'First trip in 3 years.',
                requires: [['secondMaintainer', 'boundaries']],
                education: 'When did these maintainers last take a real vacation? Most can\'t remember. Not checking their phone by the pool. Not sneaking to the hotel lobby to fix something. Actually relaxing, with their kids having their full attention. Real rest requires knowing someone else can handle emergencies - that it\'s okay to disappear for a week.'
            },
            {
                id: 'fullTimeOSS',
                name: 'Full-Time OSS Employment',
                cost: 1500,
                effect: { regenRate: 0.2 },
                flavor: 'This is my job now. A real job.',
                requires: [['majorGrant'], ['corporateSponsor']],
                education: 'Most maintainers squeeze in open source after their real jobs - late nights, weekends, stolen lunch breaks. Full-time open source employment means finally doing this work as an actual job. No more choosing between paying rent and fixing critical software. But it requires real funding - rent money, healthcare money. The dream is possible, but only when support is there.'
            },
            {
                id: 'retirementPlan',
                name: 'Retirement Plan',
                cost: 2000,
                effect: { maxHealthMult: 1.30 },
                flavor: 'A future beyond unpaid infrastructure.',
                requires: [['fullTimeOSS', 'institutionalSupport']],
                education: 'What happens to maintainers when they\'re 65? 70? Most have no retirement plan because there\'s nothing to plan with. No steady income means no savings. A retirement plan means they can finally imagine a future beyond unpaid work - growing old with dignity instead of working until they collapse.'
            }
        ]
    },
    recognition: {
        name: 'Recognition & Respect',
        icon: '❤️',
        color: '#ff6688',
        description: 'Score multipliers',
        upgrades: [
            {
                id: 'thankYou',
                name: 'A Thank You Email',
                cost: 150,
                effect: { scoreMult: 1.10 },
                flavor: 'Someone said thanks. Genuinely.',
                requires: [],
                education: 'Many of the messages maintainers receive are demands, complaints, or harassment. Almost nobody says thank you. Without gratitude, they feel like unpaid help desks. One genuine thank-you email costs nothing but can sustain someone through months of difficult work.'
            },
            {
                id: 'publicCredit',
                name: 'Public Credit',
                cost: 300,
                effect: { scoreMult: 1.15 },
                flavor: 'Release notes mentioned my name.',
                requires: [['thankYou']],
                education: 'These maintainers build software used by millions, but their names appear nowhere. Their families think they\'re wasting time on a weird hobby. Their resumes show a gap. Public credit - a name in an article, a mention in release notes - turns invisible work visible. Finally, they can point to something and say "I helped build that."'
            },
            {
                id: 'conferenceInvite',
                name: 'Conference Speaking Invite',
                cost: 500,
                effect: { scoreMult: 1.20 },
                flavor: 'They want me to talk about my work.',
                requires: [['publicCredit']],
                education: 'For years, a maintainer works alone - late nights, weekends, nobody watching. Then one day, someone invites them to speak at a conference. People take notes. They ask questions. They care. It\'s not about fame - it\'s the first time anyone treated their work like it mattered.'
            },
            {
                id: 'awardNomination',
                name: 'Award Nomination',
                cost: 700,
                effect: { scoreMult: 1.25 },
                flavor: "I'm nominated for something.",
                requires: [['conferenceInvite']],
                education: 'Most maintainers have never won anything for their work. No trophies, no certificates, nothing to show for years of effort. Then an email arrives: someone nominated them for an award. It doesn\'t pay bills, but it\'s proof the world noticed. Sometimes that recognition is enough to keep someone going.'
            },
            {
                id: 'familyUnderstands',
                name: 'Family Finally Understands',
                cost: 900,
                effect: { scoreMult: 1.30 },
                flavor: '"So you make the internet work?" "Sort of, Mom."',
                requires: [['publicCredit']],
                education: 'Picture someone in your family spending every night on their computer. You ask what they\'re doing but it sounds like nonsense. You wonder if they\'re wasting their life. Then one day they show you an article with their name, proof their work matters. Suddenly you understand: they\'ve been building something important all along.'
            },
            {
                id: 'industryRecognition',
                name: 'Industry Recognition',
                cost: 1200,
                effect: { scoreMult: 1.40 },
                flavor: 'People know my name now.',
                requires: [['awardNomination']],
                education: 'When industry leaders know a maintainer\'s name, everything changes. Job interviews go differently. Important people return their emails. Their opinions carry weight. Recognition isn\'t vanity - it\'s leverage. After years of invisible work, they finally have a voice that gets heard.'
            },
            {
                id: 'legacy',
                name: 'Legacy',
                cost: 1800,
                effect: { scoreMult: 1.50 },
                flavor: 'My work will outlive me.',
                requires: [['industryRecognition', 'foundationStatus']],
                education: 'What happens to critical software when its creator is gone? Not burned out - gone. Most open source projects die with the person who built them, and the world never knew they existed. Legacy means the work continues, maintained by others, helping people they\'ll never meet. Something that mattered beyond one lifetime.'
            }
        ]
    },
    wellbeing: {
        name: 'Wellbeing',
        icon: '🏥',
        color: '#88ffff',
        description: 'Damage reduction',
        upgrades: [
            {
                id: 'healthInsurance',
                name: 'Health Insurance',
                cost: 250,
                effect: { damageReduction: 0.05 },
                flavor: 'Can see a doctor without bankruptcy.',
                requires: [['smallGrant']],
                education: 'Most maintainers have no employer - they\'re volunteers. That means no health insurance. A toothache becomes a crisis they can\'t afford. Checkups get skipped. Small problems become emergencies because seeing a doctor costs money they don\'t have. The people keeping your apps running can\'t afford to see a doctor.'
            },
            {
                id: 'mentalHealth',
                name: 'Mental Health Support',
                cost: 400,
                effect: { damageReduction: 0.10, trollDamageReduction: 0.25 },
                flavor: 'People who get it.',
                requires: [['secondMaintainer']],
                education: 'Maintaining software used by millions is stressful in ways most jobs aren\'t. There\'s no boss to absorb complaints, no coworkers to vent with, no HR to step in when things get ugly. Mental health support means having people who understand - other maintainers who\'ve been there, communities that get it, professionals when needed. Nobody should carry this weight alone.'
            },
            {
                id: 'sayNo',
                name: 'Learning to Say No',
                cost: 550,
                effect: { damageReduction: 0.15, scopeCreepDamageReduction: 0.25 },
                flavor: 'Not every feature request is urgent.',
                requires: [['secondMaintainer'], ['mentalHealth']],
                education: 'When millions depend on their work, every request feels urgent. Maintainers say yes to everything because they\'re afraid - afraid people will leave, afraid of letting everyone down. Learning to say "not right now" isn\'t selfish. It\'s survival. It\'s the only way to keep going without breaking down.'
            },
            {
                id: 'boundaries',
                name: 'Work-Life Boundaries',
                cost: 700,
                effect: { damageReduction: 0.20 },
                flavor: 'Notifications off after 6pm.',
                requires: [['sayNo', 'secondMaintainer']],
                education: 'Dinner gets cold while a maintainer answers "just one more" request. Date night gets canceled for an "emergency" that wasn\'t. Their kids learn the laptop always wins. Boundaries mean the work stops at 6pm and stays stopped. It means being fully present with family, not half-there mentally checking on the project.'
            },
            {
                id: 'didntDelete',
                name: 'Didn\'t Mass-Delete Today',
                cost: 900,
                effect: { damageReduction: 0.25 },
                flavor: 'The temptation is real. Resisted today.',
                requires: [['boundaries', 'mentalHealth']],
                education: 'Every maintainer has thought about it. One click and it\'s all gone - the project, the issues, the endless demands, the people who\'ve never said thank you. It\'s not a joke. Maintainers have actually done it. The difference between "thought about it" and "did it" is having support, having space to breathe, having something left in the tank.'
            },
            {
                id: 'sustainablePace',
                name: 'Sustainable Pace',
                cost: 1100,
                effect: { damageReduction: 0.30 },
                flavor: '8 hours. Not 16. Not 20.',
                requires: [['boundaries', 'secondMaintainer']],
                education: 'Burning the candle at both ends isn\'t dedication - it\'s a countdown. Maintainers flame out after years of 60-hour weeks squeezed around day jobs and families. Sustainable pace means working at a rhythm someone can keep for decades, not months. The project survives because the maintainer is still healthy in ten years - not because they destroyed themselves this year.'
            },
            {
                id: 'retirementSavings',
                name: 'Retirement Savings',
                cost: 1500,
                effect: { damageReduction: 0.40 },
                flavor: "An exit strategy that isn't burnout.",
                requires: [['fullTimeOSS'], ['majorGrant', 'sustainablePace']],
                education: 'Regular workers have 401(k)s and pension plans. Volunteer maintainers have nothing - no employer contributions, no retirement accounts, no plan for when they\'re too old to keep going. Retirement savings means these essential workers can finally imagine a future that isn\'t just "work until you collapse."'
            }
        ]
    },
    community: {
        name: 'Community',
        icon: '👥',
        color: '#ffaa00',
        description: 'Additional firepower (drones)',
        upgrades: [
            {
                id: 'codeOfConduct',
                name: 'Code of Conduct',
                cost: 150,
                effect: { trollDamageReduction: 0.25 },
                flavor: 'Rules before people arrive.',
                requires: [],
                education: 'Online communities can turn toxic fast. Without clear rules, trolls harass contributors, arguments spiral out of control, and good people leave. A Code of Conduct is like posting house rules before guests arrive - it says "harassment won\'t be tolerated here." It protects the people doing the work from abuse, and tells newcomers this is a safe place to contribute.'
            },
            {
                id: 'secondMaintainer',
                name: 'Second Maintainer',
                cost: 300,
                effect: { drones: 1 },
                flavor: 'Not alone anymore.',
                requires: [['codeOfConduct']],
                education: 'When someone is the only maintainer, they can never fully rest. Vacation? They\'re checking their phone. Sick? The work piles up. Family emergency? Nobody else can cover. A second maintainer means someone can finally take a day off without everything falling apart. It\'s not about splitting work - it\'s about being able to have a life.'
            },
            {
                id: 'thirdMaintainer',
                name: 'Third Maintainer',
                cost: 600,
                effect: { drones: 2 },
                flavor: 'An actual team forming.',
                requires: [['secondMaintainer', 'codeOfConduct']],
                education: 'Two people is a partnership. Three is a community. With three maintainers, decisions can happen when one person is unavailable. Disagreements can be resolved by majority. Knowledge lives in multiple heads. If one person burns out or moves on, the project survives. Three is the number where a project stops being fragile.'
            },
            {
                id: 'governance',
                name: 'Actual Governance',
                cost: 800,
                effect: { droneFireRateMult: 1.50 },
                flavor: 'We have meetings now. Good ones.',
                requires: [['thirdMaintainer']],
                education: 'Without governance, one person makes all the decisions - and takes all the blame. What happens when they\'re wrong? What happens when they leave? Governance means decisions are shared, documented, and survive any single person. It\'s not bureaucracy - it\'s making sure the project doesn\'t live or die based on one human\'s mood or health.'
            },
            {
                id: 'foundationStatus',
                name: 'Foundation Status',
                cost: 1000,
                effect: { drones: 3 },
                flavor: 'Linux Foundation accepted us.',
                requires: [['governance', 'majorGrant']],
                education: 'Even a team of maintainers can only do so much - they\'re writing code, answering questions, managing servers, handling money, all at once. Foundations provide the support structure projects need to grow: infrastructure, event organizing, mentorship programs, help finding contributors. It\'s the difference between a small group struggling alone and a project with real resources behind it.'
            },
            {
                id: 'corporateSponsor',
                name: 'Corporate Sponsor',
                cost: 1300,
                effect: { droneDamageMult: 1.50 },
                flavor: 'A Fortune 500 company pays us.',
                requires: [['publicCredit', 'foundationStatus']],
                education: 'Fortune 500 companies use open source code to make billions. The maintainers get nothing. Corporate sponsorship changes that - companies pay because they realize their business depends on this work. It\'s not charity. It\'s acknowledging reality: if maintainers stop, products break. Money follows when companies finally understand the risk.'
            },
            {
                id: 'institutionalSupport',
                name: 'Institutional Support',
                cost: 1800,
                effect: { drones: 4, droneDamageMult: 1.25 },
                flavor: "We're infrastructure now. Official.",
                requires: [['foundationStatus', 'corporateSponsor', 'industryRecognition']],
                education: 'Governments fund roads and bridges. Universities study important things. Big companies invest in critical infrastructure. When institutions support open source, it\'s finally being treated like what it is: the foundation everything runs on. Not a hobby. Not a side project. Infrastructure - as essential as power lines and water pipes, and finally funded like it.'
            }
        ]
    }
};

// Wave configuration with educational content
export const WAVE_CONFIG = {
    maxWaves: 10,
    waves: [
        {
            wave: 1,
            enemies: { entitlement: 8 },
            boss: null,
            educational: {
                text: "curl is used by billions of devices daily. It's maintained primarily by one person. He's been doing it for 25 years. Unpaid for most of them.",
                source: 'Daniel Stenberg, curl maintainer'
            }
        },
        {
            wave: 2,
            enemies: { entitlement: 10, corporate: 2 },
            boss: null,
            educational: {
                text: '96% of commercial software contains open source components. Most maintainers are volunteers.',
                source: 'Synopsys Open Source Report'
            }
        },
        {
            wave: 3,
            enemies: { entitlement: 6, corporate: 2, troll: 4 },
            boss: 'heartbleed',
            educational: {
                text: 'In 2014, Heartbleed exposed a critical flaw in OpenSSL. Two-thirds of the internet was vulnerable. The project had ONE full-time developer.',
                source: 'OpenSSL Foundation'
            }
        },
        {
            wave: 4,
            enemies: { entitlement: 12, burnout: 4, troll: 6 },
            boss: null,
            educational: {
                text: 'Maintainers receive death threats for not responding fast enough to issues. This is not a metaphor.',
                source: 'Open Source Maintainer Survey'
            }
        },
        {
            wave: 5,
            enemies: { scopeCreep: 6, zeroDay: 4, corporate: 3 },
            boss: 'leftpad',
            educational: {
                text: 'In 2016, an 11-line package called left-pad was removed from npm. Thousands of projects broke instantly. Including Facebook and Netflix.',
                source: 'npm incident report'
            }
        },
        {
            wave: 6,
            enemies: { entitlement: 15, corporate: 4, burnout: 5 },
            boss: null,
            educational: {
                text: 'The average open source maintainer makes $0 from their work. The companies using it make billions.',
                source: 'Tidelift Maintainer Survey'
            }
        },
        {
            wave: 7,
            enemies: { zeroDay: 8, scopeCreep: 6, troll: 8 },
            boss: 'log4shell',
            educational: {
                text: 'Log4j is in everything. When Log4Shell hit in 2021, volunteers worked through holidays to patch it. Unpaid. Under pressure. Harassed.',
                source: 'Apache Foundation'
            }
        },
        {
            wave: 8,
            enemies: { burnout: 10, troll: 10, corporate: 4 },
            boss: 'colors',
            educational: {
                text: 'In 2022, the maintainer of colors.js deliberately corrupted his package. Millions of projects affected. His crime? Burnout after years of unpaid work.',
                source: 'Marak Squires incident'
            }
        },
        {
            wave: 9,
            enemies: { entitlement: 20, corporate: 5, zeroDay: 6, burnout: 6 },
            boss: null,
            educational: {
                text: 'Open source maintainers have higher rates of burnout, anxiety, and depression than the general population. 46% are completely unpaid.',
                source: 'GitHub Open Source Survey'
            }
        },
        {
            wave: 10,
            enemies: { entitlement: 15, corporate: 6, burnout: 8, troll: 10, zeroDay: 8, scopeCreep: 8 },
            boss: 'xz',
            educational: {
                text: 'In 2024, a "helpful contributor" spent 2 years gaining trust in the xz project. They inserted a backdoor. The burnt-out maintainer was just grateful for the help.',
                source: 'xz Utils backdoor (CVE-2024-3094)'
            }
        }
    ],
    getWaveConfig: (wave) => {
        return WAVE_CONFIG.waves[wave - 1] || WAVE_CONFIG.waves[WAVE_CONFIG.waves.length - 1];
    }
};

// Cinematic configuration
export const CINEMATIC_CONFIG = {
    duration: 45000,
    skipAfterFirst: true,
    scenes: [
        { time: 0, text: 'We live in a lush digital landscape of tools and services that make our lives better.', phase: 'garden_pan' },
        { time: 4000, text: 'Every photo of your grandkids...', phase: 'garden_tour' },
        { time: 7000, text: 'Every phone call to family...', phase: 'garden_tour' },
        { time: 10000, text: 'Every online order...', phase: 'garden_tour' },
        { time: 13000, text: 'Every show you stream...', phase: 'garden_tour' },
        { time: 16000, text: 'Every dollar in your bank account...', phase: 'garden_tour' },
        { time: 19000, text: 'All of it depends on something hidden.', phase: 'descending' },
        { time: 23000, text: 'Deep beneath the surface...', phase: 'descending' },
        { time: 27000, text: 'Open source software.', phase: 'underground' },
        { time: 31000, text: 'Built by volunteers. Maintained by the exhausted.', phase: 'underground' },
        { time: 35000, text: 'Often just one person. One bad day from collapse.', phase: 'underground' },
        { time: 40000, text: 'It takes all of us to maintain the foundation of the technology on which we depend.', phase: 'tower' }
    ]
};

// Victory and game over messages
export const END_MESSAGES = {
    victory: {
        title: 'FOUNDATION SECURED',
        subtitle: 'You held the line.',
        message: "But this isn't a one-time battle. Open source needs sustained support.",
        cta: 'Learn how to help at opensourcefriday.com'
    },
    gameOver: {
        title: 'INFRASTRUCTURE COLLAPSED',
        subtitle: 'The digital world went dark.',
        message: "The software that powers your daily life fell apart. All because we didn't support the people who built it.",
        cta: 'Consider supporting open source.'
    }
};

// Physics settings
export const PHYSICS_SETTINGS = {
    gravity: -30,
    friction: 0.7,
    restitution: 0.2,
    debrisCount: 15,
    debrisLifetime: 4,
    collapseVelocity: 20,
    linearDamping: 0.3,
    angularDamping: 0.4
};

// Game boundaries
export const GAME_BOUNDS = {
    minX: -600,
    maxX: 600,
    minY: 20,
    maxY: 400,
    minZ: -600,
    maxZ: 600
};

// Movement speeds
export const PLAYER_SPEED = {
    normal: 60,
    boost: 120
};

// Default control bindings
export const DEFAULT_CONTROLS = {
    forward: { type: 'key', key: 'w' },
    backward: { type: 'key', key: 's' },
    left: { type: 'key', key: 'a' },
    right: { type: 'key', key: 'd' },
    up: { type: 'key', key: 'e' },
    down: { type: 'key', key: 'q' },
    boost: { type: 'key', key: ' ' },
    reverse: { type: 'key', key: 'shift' },
    fire: { type: 'mouse', button: 0 },
    altfire: { type: 'mouse', button: 2 },
    weapon1: { type: 'key', key: '1' },
    weapon2: { type: 'key', key: '2' },
    weapon3: { type: 'key', key: '3' },
    repair: { type: 'key', key: 'r' }
};

// Default mouse settings
export const DEFAULT_MOUSE_SETTINGS = {
    invertX: false,
    invertY: false,
    invertPitch: false,
    sensitivity: 1.0,
    smoothing: 8
};

// Particle system settings
export const PARTICLE_SETTINGS = {
    maxParticles: 100,
    particlesPerExplosion: 8
};

// LocalStorage keys
export const STORAGE_KEYS = {
    controls: 'towerDefender_controls',
    mouseSettings: 'towerDefender_mouseSettings',
    controlScheme: 'towerDefender_controlScheme',
    hasSeenCinematic: 'towerDefender_hasSeenCinematic'
};
