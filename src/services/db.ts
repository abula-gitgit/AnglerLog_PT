import { FishingSpot, CatchLog, StoredPhoto, TackleSet } from '../types/fishing';
import { 
  formatTideName, 
  formatTideState, 
  formatWaveCondition, 
  formatWeatherCondition, 
  formatSpotType, 
  formatBottomType, 
  formatSpeciesName, 
  formatSeason, 
  formatTimeOfDay, 
  formatSnagRisk, 
  formatSpotName 
} from '../utils/formatI18n';

const DB_NAME = 'AnglerLogDatabase_v2';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('spots')) {
        const spotStore = db.createObjectStore('spots', { keyPath: 'id' });
        spotStore.createIndex('spotType', 'spotType', { unique: false });
        spotStore.createIndex('favorite', 'favorite', { unique: false });
      }

      if (!db.objectStoreNames.contains('catches')) {
        const catchStore = db.createObjectStore('catches', { keyPath: 'id' });
        catchStore.createIndex('spotId', 'spotId', { unique: false });
        catchStore.createIndex('species', 'species', { unique: false });
        catchStore.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains('photos')) {
        const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
        photoStore.createIndex('spotId', 'spotId', { unique: false });
        photoStore.createIndex('catchLogId', 'catchLogId', { unique: false });
      }

      if (!db.objectStoreNames.contains('tackles')) {
        const tackleStore = db.createObjectStore('tackles', { keyPath: 'id' });
        tackleStore.createIndex('targetFish', 'targetFish', { unique: false });
      }
    };

    request.onsuccess = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      await seedInitialDataIfEmpty(db);
      await migrateLegacyData(db);
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

export const SAMPLE_SPOT_IDS = new Set([
  'spot-peniche-papoa',
  'spot-ria-de-aveiro',
  'spot-alqueva-alentejo',
  'spot-sardegna-orosei',
  'spot-delta-del-po',
  'spot-lago-di-bolsena',
  'spot-galicia-rias-baixas',
  'spot-delta-del-ebro',
  'spot-embalse-ourellana',
]);

export const SAMPLE_CATCH_IDS = new Set([
  'catch-001',
  'catch-002',
  'catch-003',
]);

export function isSampleSpotItem(s: FishingSpot): boolean {
  return Boolean(s.isSample || SAMPLE_SPOT_IDS.has(s.id));
}

export function isSampleCatchItem(c: CatchLog): boolean {
  return Boolean(c.isSample || SAMPLE_CATCH_IDS.has(c.id));
}

async function seedInitialDataIfEmpty(db: IDBDatabase): Promise<void> {
  const transaction = db.transaction(['spots', 'catches'], 'readonly');
  const spotsStore = transaction.objectStore('spots');
  const countReq = spotsStore.count();

  return new Promise((resolve) => {
    countReq.onsuccess = async () => {
      if (countReq.result === 0) {
        const writeTx = db.transaction(['spots', 'catches'], 'readwrite');
        const writeSpots = writeTx.objectStore('spots');
        const writeCatches = writeTx.objectStore('catches');

        const initialSpots: FishingSpot[] = getInitialSampleSpots();
        const initialCatches: CatchLog[] = getInitialSampleCatches();

        initialSpots.forEach((s) => writeSpots.put(s));
        initialCatches.forEach((c) => writeCatches.put(c));

        writeTx.oncomplete = () => {
          seedTacklesIfEmpty(db).then(resolve);
        };
        writeTx.onerror = () => {
          seedTacklesIfEmpty(db).then(resolve);
        };
      } else {
        seedTacklesIfEmpty(db).then(resolve);
      }
    };
  });
}

export function getInitialSampleSpots(): FishingSpot[] {
  return [
    {
      id: 'spot-peniche-papoa',
      name: 'Peniche - Península da Papôa & Cabo Carvoeiro',
      spotType: 'rocky',
      lat: 39.3750,
      lng: -9.3800,
      description: 'Pesqueiro lendário da Costa de Prata com falésias imponentes batidas pelo Atlântico aberto. Meca para o spinning e pesca aos sargos à chumbadinha ou boia, com robalos recorde e douradas nas coroas de pedra.',
      waterDepth: 'De 4 m junto às falésias até 25 m nas parcelas e cabeços exteriores',
      bottomType: ['Restinga / Cabeços de pedra', 'Areia', 'Pradarias marinhas / Algodão'],
      snagRisk: 'medium',
      currentNotes: 'Máxima atividade com ondulação de noroeste entre 1.5m e 2.5m e início de enchente.',
      parkingInfo: 'Parque de estacionamento do Farol do Cabo Carvoeiro e acesso pedestre à Papôa',
      hazardAndAccessNotes: 'Cuidado extremo com as vagas traiçoeiras e rochas escorregadias. Uso obrigatório de botas de bicos ou feltro e colete salva-vidas insuflável.',
      bestSeasons: ['Outono', 'Inverno', 'Primavera'],
      bestTimeOfDay: ['Alvorada / Amanhecer', 'Entardecer / Pôr do sol'],
      targetSpecies: ['Robalo', 'Sargo', 'Dourada', 'Choco', 'Polvo'],
      favorite: true,
      rating: 5,
      isSample: true,
      photoIds: [],
      subPoints: [
        { id: 'sub-pt-1', name: 'Ponta da Papôa - Esporão Norte', lat: 39.3770, lng: -9.3780, note: 'Cabeço de pedra com declive acentuado, excelente para vinis no romper do dia' },
        { id: 'sub-pt-2', name: 'Cabo Carvoeiro - Nau dos Corvos', lat: 39.3600, lng: -9.4050, note: 'Águas profundas batidas por correntes ricas em sargos grandes à boia' }
      ],
      createdAt: '2026-03-10T06:00:00.000Z',
      updatedAt: '2026-03-10T06:00:00.000Z'
    },
    {
      id: 'spot-ria-de-aveiro',
      name: 'Centro / Ria de Aveiro & Barra de São Jacinto',
      spotType: 'estuary',
      lat: 40.6450,
      lng: -8.7450,
      description: 'O maior complexo lagunar do litoral português. Canais de maré protegidos, sapais e bancos de areia e lodo ricos em caranguejo e casulo. Ponto de referência para douradas de bom porte, robalos à amostra e chocos.',
      waterDepth: '2-4 m nos esteiros lagunares, 8-15 m no canal de navegação da Barra',
      bottomType: ['Vaso / Lodo', 'Areia', 'Desnível / Declive acentuado'],
      snagRisk: 'low',
      currentNotes: 'Corrente forte de vazante e enchente nos canais principais; pico de atividade nas duas últimas horas de enchente.',
      parkingInfo: 'Porto de pesca da Costa Nova e cais dos ferries de São Jacinto com lugares para viaturas',
      hazardAndAccessNotes: 'Atenção ao lodo mole nos esteiros durante a baixa-mar. Respeitar as rotas de navegação dos barcos moliceiros e batéis.',
      bestSeasons: ['Primavera', 'Verão', 'Outono'],
      bestTimeOfDay: ['Alvorada / Amanhecer', 'Entardecer / Pôr do sol', 'Durante o dia'],
      targetSpecies: ['Robalo', 'Dourada', 'Choco', 'Linguado', 'Carapau'],
      favorite: true,
      rating: 5,
      isSample: true,
      photoIds: [],
      createdAt: '2026-04-18T18:30:00.000Z',
      updatedAt: '2026-04-18T18:30:00.000Z'
    },
    {
      id: 'spot-alqueva-alentejo',
      name: 'Alentejo - Grande Lago de Alqueva & Reguengos de Monsaraz',
      spotType: 'lake_pond',
      lat: 38.3850,
      lng: -7.3450,
      description: 'A maior albufeira artificial da Europa Ocidental no rio Guadiana. Águas calmas entre olivais e montados submersos, reconhecido mundialmente pela pesca desportiva ao Achigã (Black Bass) troféu, lúcio e lucioperca.',
      waterDepth: '3-8 m nas margens suaves e pontas de terra, até mais de 30 m nos antigos leitos fluviais',
      bottomType: ['Árvores submersas / Galhadas', 'Areia', 'Restinga / Cabeços de pedra'],
      snagRisk: 'medium',
      currentNotes: 'Pesca técnica de estrutura: os predadores emboscam nos troncos das azinheiras e sobreiros submersos.',
      parkingInfo: 'Centro Náutico de Monsaraz e ancoradouros públicos de Mourão',
      hazardAndAccessNotes: 'Licença nacional de pesca desportiva em águas doces (ICNF). Navegação regulamentada pela EDIA. Cuidado com galhos submersos à tona de água.',
      bestSeasons: ['Primavera', 'Outono', 'Verão'],
      bestTimeOfDay: ['Alvorada / Amanhecer', 'Entardecer / Pôr do sol', 'Durante o dia'],
      targetSpecies: ['Achigã (Black Bass)', 'Lúcio', 'Lucioperca', 'Carpa-comum', 'Barbo'],
      favorite: false,
      rating: 4,
      isSample: true,
      photoIds: [],
      createdAt: '2026-05-02T05:30:00.000Z',
      updatedAt: '2026-05-02T05:30:00.000Z'
    }
  ];
}

export function getInitialSampleCatches(): CatchLog[] {
  return [
    {
      id: 'catch-001',
      spotId: 'spot-peniche-papoa',
      spotName: 'Peniche - Península da Papôa & Cabo Carvoeiro',
      date: '2026-09-18',
      time: '06:45',
      isNoCatch: false,
      items: [
        {
          id: 'item-001-1',
          species: 'Robalo',
          sizeCm: 76.5,
          weightGrams: 5200,
          quantity: 1,
          lureOrBait: 'Vinil Shad 120 mm cor Ayu com cabeçote 25g'
        }
      ],
      species: 'Robalo',
      sizeCm: 76.5,
      weightGrams: 5200,
      quantity: 1,
      tackle: {
        rod: 'Cana Spinning Costeiro 2.70 m (Ação 15-50 g Fast)',
        reel: 'Carreto Shimano Stradic FM 4000 XG',
        mainLine: 'Linha multifilamento 8 fios PE 1.2 (20 lb / 0.16 mm)',
        leader: 'Terminal em 100% Fluorocarbono 0.35 mm (16 lb, 1.8 m)'
      },
      lureOrBait: 'Vinil Shad 120 mm cor Ayu 25g',
      actionOrRange: 'Recuperação linear com ligeiros toques de ponteira entre a espuma branca junto à restinga.',
      weather: {
        condition: 'sunny',
        temperature: 19.5,
        waterTemperature: 18.2,
        windDirection: 'NW',
        windSpeedMs: 4.2,
        pressureHpa: 1018,
        tideName: 'Marés vivas (Águas vivas)',
        tideState: 'Enchente (vaga principal)',
        waveHeight: 'Mar cavado / Ondulação moderada',
        moonPhase: 'Quarto crescente'
      },
      notes: 'Ataque brutal no início da maré cheia no meio da espuma batida contra a rocha. Robalo legítimo atlântico com arranque fortíssimo.',
      photoIds: [],
      isSample: true,
      createdAt: '2026-09-18T07:15:00.000Z',
      updatedAt: '2026-09-18T07:15:00.000Z'
    },
    {
      id: 'catch-002',
      spotId: 'spot-ria-de-aveiro',
      spotName: 'Centro / Ria de Aveiro & Barra de São Jacinto',
      date: '2026-07-22',
      time: '20:30',
      isNoCatch: false,
      items: [
        {
          id: 'item-002-1',
          species: 'Dourada',
          sizeCm: 58.0,
          weightGrams: 3400,
          quantity: 1,
          lureOrBait: 'Caranguejo de dois cascos fresco em montagem de correr'
        }
      ],
      species: 'Dourada',
      sizeCm: 58.0,
      weightGrams: 3400,
      quantity: 1,
      tackle: {
        rod: 'Cana Surfcasting Leve / Chumbadinha 3.60 m (Ação 40-100 g)',
        reel: 'Carreto 5000 com bobina rasa e embraiagem precisa',
        mainLine: 'Monofilamento cónico 0.22 - 0.45 mm',
        leader: 'Fluorocarbono 0.28 mm (12 lb, 1.5 m)'
      },
      lureOrBait: 'Caranguejo de dois cascos',
      actionOrRange: 'Pesca de fundo à espera no canal mais profundo da ria durante o estofo da preia-mar.',
      weather: {
        condition: 'cloudy',
        temperature: 24.0,
        waterTemperature: 21.0,
        windDirection: 'N',
        windSpeedMs: 2.8,
        pressureHpa: 1016,
        tideName: 'Marés intermédias',
        tideState: 'Preia-mar (Cheia)',
        waveHeight: 'Mar calmo / Chão',
        moonPhase: 'Lua cheia'
      },
      notes: 'Toque seco e arranque violento típico de dourada grande. Excelente exemplar capturado na ria ao pôr do sol.',
      photoIds: [],
      isSample: true,
      createdAt: '2026-07-22T21:00:00.000Z',
      updatedAt: '2026-07-22T21:00:00.000Z'
    },
    {
      id: 'catch-003',
      spotId: 'spot-alqueva-alentejo',
      spotName: 'Alentejo - Grande Lago de Alqueva & Reguengos de Monsaraz',
      date: '2026-05-14',
      time: '10:15',
      isNoCatch: false,
      items: [
        {
          id: 'item-003-1',
          species: 'Achigã (Black Bass)',
          sizeCm: 54.5,
          weightGrams: 2750,
          quantity: 1,
          lureOrBait: 'Jig de 3/8 oz preto/azul com trailer de lagostim em vinil'
        }
      ],
      species: 'Achigã (Black Bass)',
      sizeCm: 54.5,
      weightGrams: 2750,
      quantity: 1,
      tackle: {
        rod: 'Cana Casting Heavy 7ft 1in (Ação 10-35 g)',
        reel: 'Carreto Baitcasting ratio 7.1:1',
        mainLine: 'Multifilamento 4 fios PE 2.5 (30 lb)',
        leader: 'Fluorocarbono 0.33 mm (16 lb, 2 m)'
      },
      lureOrBait: 'Jig 3/8 oz com trailer lagostim',
      actionOrRange: 'Pitching cerrado para dentro de uma copa de sobreiro submerso a 4 metros de profundidade.',
      weather: {
        condition: 'sunny',
        temperature: 23.5,
        waterTemperature: 20.5,
        windDirection: 'SW',
        windSpeedMs: 3.0,
        pressureHpa: 1019,
        tideName: 'Maré de transição',
        tideState: 'Estofo de maré',
        waveHeight: 'Mar calmo / Chão',
        moonPhase: 'Quarto minguante'
      },
      notes: 'Ferragem imediata na queda entre a ramagem submersa. Belo troféu de achigã devolvido são e salvo à água (Catch & Release).',
      photoIds: [],
      isSample: true,
      createdAt: '2026-05-14T10:45:00.000Z',
      updatedAt: '2026-05-14T10:45:00.000Z'
    }
  ];
}

export async function clearSampleData(): Promise<{ spotCount: number; catchCount: number }> {
  const db = await getDB();
  const spots = await getAllSpots();
  const catches = await getAllCatches();
  const sampleSpots = spots.filter(isSampleSpotItem);
  const sampleCatches = catches.filter(isSampleCatchItem);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['spots', 'catches'], 'readwrite');
    const spotStore = tx.objectStore('spots');
    const catchStore = tx.objectStore('catches');

    sampleSpots.forEach((s) => spotStore.delete(s.id));
    sampleCatches.forEach((c) => catchStore.delete(c.id));

    tx.oncomplete = () => resolve({ spotCount: sampleSpots.length, catchCount: sampleCatches.length });
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadSampleData(force = false): Promise<{ spotCount: number; catchCount: number }> {
  const db = await getDB();
  const spots = await getAllSpots();
  if (!force && spots.some(isSampleSpotItem)) {
    return { spotCount: 0, catchCount: 0 };
  }

  const sampleSpots = getInitialSampleSpots();
  const sampleCatches = getInitialSampleCatches();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['spots', 'catches'], 'readwrite');
    const spotStore = tx.objectStore('spots');
    const catchStore = tx.objectStore('catches');

    sampleSpots.forEach((s) => spotStore.put(s));
    sampleCatches.forEach((c) => catchStore.put(c));

    tx.oncomplete = () => resolve({ spotCount: sampleSpots.length, catchCount: sampleCatches.length });
    tx.onerror = () => reject(tx.error);
  });
}

async function seedTacklesIfEmpty(db: IDBDatabase): Promise<void> {
  if (!db.objectStoreNames.contains('tackles')) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('tackles', 'readonly');
      const store = tx.objectStore('tackles');
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result === 0) {
          const writeTx = db.transaction('tackles', 'readwrite');
          const writeStore = writeTx.objectStore('tackles');

                    const initialTackles: TackleSet[] = [
            {
              id: 'tackle-robalo-spinning',
              name: 'Combo Spinning Costeiro / Robalo & Sargo',
              targetFish: 'Robalo',
              rod: 'Cana Spinning Costeiro 2.70 m (Ação 15-50 g Fast)',
              reel: 'Carreto Shimano Stradic FM 4000 XG (Ratio 6.2:1)',
              mainLine: 'Multifilamento 8 fios PE 1.2 (20 lb / 0.16 mm)',
              leader: 'Terminal Fluorocarbono 0.35 mm (16 lb, 1.8 m)',
              favoriteLures: ['Duo Tide Minnow 140/175', 'Patchinko 125', 'Black Minnow 120/140', 'Vinil Cabeçote 20-30g'],
              notes: 'Configuração perfeita para falésias, pontões e praias com mar cavado.',
              isDefault: true,
              createdAt: '2026-03-01T00:00:00.000Z',
              updatedAt: '2026-03-01T00:00:00.000Z'
            },
            {
              id: 'tackle-surfcasting-dourada',
              name: 'Combo Surfcasting Pesado (Dourada & Corvina)',
              targetFish: 'Dourada / Corvina',
              rod: 'Cana Surfcasting 4.50 m Tubular (Ação 100-250 g)',
              reel: 'Carreto Surfcasting 10000 com bobina cónica de longo alcance',
              mainLine: 'Monofilamento cónico 0.18 - 0.57 mm',
              leader: 'Terminal Fluorocarbono 0.30 - 0.40 mm (2 m)',
              favoriteLures: ['Casulo fresco', 'Caranguejo de dois cascos', 'Ganso coreano', 'Sardinha fresca'],
              notes: 'Grande capacidade de lançamento para passar a rebentação nas praias oceânicas.',
              isDefault: false,
              createdAt: '2026-03-01T00:00:00.000Z',
              updatedAt: '2026-03-01T00:00:00.000Z'
            },
            {
              id: 'tackle-bass-alqueva',
              name: 'Combo Bass Fishing Alqueva (Casting & Texas Rig)',
              targetFish: 'Achigã (Black Bass)',
              rod: 'Cana Casting Heavy 7ft 1in (Ação 10-35 g Fast)',
              reel: 'Carreto Baitcasting ratio 7.1:1',
              mainLine: 'Multifilamento 4 fios PE 2.5 (30 lb)',
              leader: 'Fluorocarbono 0.33 mm (16 lb, 2 m)',
              favoriteLures: ['Rubber Jig 3/8 oz com lagostim', 'Texas Rig com Senko 5"', 'Deep Crankbait 4m'],
              notes: 'Potência garantida para arrancar os grandes achigãs de dentro das galhadas de sobreiro.',
              isDefault: false,
              createdAt: '2026-03-01T00:00:00.000Z',
              updatedAt: '2026-03-01T00:00:00.000Z'
            }
          ];

          initialTackles.forEach((t) => writeStore.put(t));
          writeTx.oncomplete = () => resolve();
          writeTx.onerror = () => resolve();
        } else {
          resolve();
        }
      };
      countReq.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// Spot API
export async function getAllSpots(): Promise<FishingSpot[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('spots', 'readonly');
    const store = tx.objectStore('spots');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getSpotById(id: string): Promise<FishingSpot | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('spots', 'readonly');
    const store = tx.objectStore('spots');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSpot(spot: FishingSpot): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('spots', 'readwrite');
    const store = tx.objectStore('spots');
    const req = store.put(spot);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteSpot(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('spots', 'readwrite');
    const store = tx.objectStore('spots');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Catch API
export async function getAllCatches(): Promise<CatchLog[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('catches', 'readonly');
    const store = tx.objectStore('catches');
    const req = store.getAll();
    req.onsuccess = () => {
      const results = (req.result || []) as CatchLog[];
      results.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getCatchesBySpot(spotId: string): Promise<CatchLog[]> {
  const all = await getAllCatches();
  return all.filter((c) => c.spotId === spotId);
}

export async function saveCatch(catchLog: CatchLog): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('catches', 'readwrite');
    const store = tx.objectStore('catches');
    const req = store.put(catchLog);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCatch(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('catches', 'readwrite');
    const store = tx.objectStore('catches');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Photo API
export async function getAllPhotos(): Promise<StoredPhoto[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readonly');
    const store = tx.objectStore('photos');
    const req = store.getAll();
    req.onsuccess = () => {
      const results = (req.result || []) as StoredPhoto[];
      results.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getPhotosByIds(ids: string[]): Promise<StoredPhoto[]> {
  if (!ids || ids.length === 0) return [];
  const db = await getDB();
  const photos: StoredPhoto[] = [];
  return new Promise((resolve) => {
    const tx = db.transaction('photos', 'readonly');
    const store = tx.objectStore('photos');
    let completed = 0;
    
    ids.forEach((id) => {
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) photos.push(req.result);
        completed++;
        if (completed === ids.length) resolve(photos);
      };
      req.onerror = () => {
        completed++;
        if (completed === ids.length) resolve(photos);
      };
    });
  });
}

export async function savePhoto(photo: StoredPhoto): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    const store = tx.objectStore('photos');
    const req = store.put(photo);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    const store = tx.objectStore('photos');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Tackle API
export async function getAllTackles(): Promise<TackleSet[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('tackles')) {
      resolve([]);
      return;
    }
    const tx = db.transaction('tackles', 'readonly');
    const store = tx.objectStore('tackles');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getTackleById(id: string): Promise<TackleSet | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('tackles')) {
      resolve(null);
      return;
    }
    const tx = db.transaction('tackles', 'readonly');
    const store = tx.objectStore('tackles');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTackle(tackle: TackleSet): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('tackles')) {
      reject(new Error('Tackles store not initialized'));
      return;
    }
    const tx = db.transaction('tackles', 'readwrite');
    const store = tx.objectStore('tackles');
    store.put(tackle);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteTackle(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('tackles')) {
      resolve();
      return;
    }
    const tx = db.transaction('tackles', 'readwrite');
    const store = tx.objectStore('tackles');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Backup & Restore
export interface BackupData {
  version: number;
  exportedAt: string;
  spots: FishingSpot[];
  catches: CatchLog[];
  photos: StoredPhoto[];
  tackles?: TackleSet[];
}

export async function exportBackup(includePhotos = true): Promise<BackupData> {
  const spots = await getAllSpots();
  const catches = await getAllCatches();
  const photos = includePhotos ? await getAllPhotos() : [];
  const tackles = await getAllTackles();

  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    spots,
    catches,
    photos,
    tackles,
  };
}

export async function importBackup(data: BackupData, mode: 'merge' | 'replace' = 'merge'): Promise<{ spotCount: number; catchCount: number; photoCount: number; tackleCount: number }> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const stores = ['spots', 'catches', 'photos'];
    if (db.objectStoreNames.contains('tackles')) {
      stores.push('tackles');
    }

    const tx = db.transaction(stores, 'readwrite');
    const spotStore = tx.objectStore('spots');
    const catchStore = tx.objectStore('catches');
    const photoStore = tx.objectStore('photos');
    const tackleStore = db.objectStoreNames.contains('tackles') ? tx.objectStore('tackles') : null;

    if (mode === 'replace') {
      spotStore.clear();
      catchStore.clear();
      photoStore.clear();
      tackleStore?.clear();
    }

    let spotCount = 0;
    let catchCount = 0;
    let photoCount = 0;
    let tackleCount = 0;

    if (data.spots && Array.isArray(data.spots)) {
      data.spots.forEach((s) => {
        spotStore.put(s);
        spotCount++;
      });
    }

    if (data.catches && Array.isArray(data.catches)) {
      data.catches.forEach((c) => {
        catchStore.put(c);
        catchCount++;
      });
    }

    if (data.photos && Array.isArray(data.photos)) {
      data.photos.forEach((p) => {
        photoStore.put(p);
        photoCount++;
      });
    }

    if (tackleStore && data.tackles && Array.isArray(data.tackles)) {
      data.tackles.forEach((t) => {
        tackleStore.put(t);
        tackleCount++;
      });
    }

    tx.oncomplete = () => resolve({ spotCount, catchCount, photoCount, tackleCount });
    tx.onerror = () => reject(tx.error);
  });
}

async function migrateLegacyData(db: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(['spots', 'catches'], 'readwrite');
      const spotStore = tx.objectStore('spots');
      const catchStore = tx.objectStore('catches');

      const allSpotsReq = spotStore.getAll();
      allSpotsReq.onsuccess = () => {
        const spots: FishingSpot[] = allSpotsReq.result || [];
        spots.forEach((s) => {
          let updated = false;
          const newName = formatSpotName(s.name);
          if (newName !== s.name) {
            s.name = newName;
            updated = true;
          }
          if (s.spotType) {
            const newType = formatSpotType(s.spotType);
            const typeKeyMap: Record<string, string> = {
              'Molo / Scogliera frangiflutti': 'breakwater',
              'Scogliera naturale / Costa rocciosa': 'rocky',
              'Spiaggia / Surfcasting': 'surf',
              'Foce / Estuario / Laguna': 'estuary',
              'Lago / Bacino / Cava': 'lake_pond',
              'Porto / Darsena / Marina': 'port',
              'Barca / Mare aperto': 'boat',
              'Torrente / Fiume montano': 'stream'
            };
            const mappedKey = typeKeyMap[newType];
            if (mappedKey && mappedKey !== s.spotType) {
              s.spotType = mappedKey as any;
              updated = true;
            }
          }
          if (s.bottomType && Array.isArray(s.bottomType)) {
            const newBottom = s.bottomType.map(formatBottomType);
            if (JSON.stringify(newBottom) !== JSON.stringify(s.bottomType)) {
              s.bottomType = newBottom;
              updated = true;
            }
          }
          if (s.targetSpecies && Array.isArray(s.targetSpecies)) {
            const newTargets = s.targetSpecies.map(formatSpeciesName);
            if (JSON.stringify(newTargets) !== JSON.stringify(s.targetSpecies)) {
              s.targetSpecies = newTargets;
              updated = true;
            }
          }
          if (s.bestSeasons && Array.isArray(s.bestSeasons)) {
            const newSeasons = s.bestSeasons.map(formatSeason);
            if (JSON.stringify(newSeasons) !== JSON.stringify(s.bestSeasons)) {
              s.bestSeasons = newSeasons;
              updated = true;
            }
          }
          if (s.bestTimeOfDay && Array.isArray(s.bestTimeOfDay)) {
            const newTimes = s.bestTimeOfDay.map(formatTimeOfDay);
            if (JSON.stringify(newTimes) !== JSON.stringify(s.bestTimeOfDay)) {
              s.bestTimeOfDay = newTimes;
              updated = true;
            }
          }
          if (s.snagRisk) {
            const newRisk = formatSnagRisk(s.snagRisk).toLowerCase();
            if (newRisk !== s.snagRisk) {
              s.snagRisk = newRisk as any;
              updated = true;
            }
          }
          if ((s as any).recommendedTide) {
            const newTide = formatTideName((s as any).recommendedTide);
            if (newTide !== (s as any).recommendedTide) {
              (s as any).recommendedTide = newTide;
              updated = true;
            }
          }
          if ((s as any).recommendedTideState) {
            const newState = formatTideState((s as any).recommendedTideState);
            if (newState !== (s as any).recommendedTideState) {
              (s as any).recommendedTideState = newState;
              updated = true;
            }
          }
          if (updated) {
            spotStore.put(s);
          }
        });
      };

      const allCatchesReq = catchStore.getAll();
      allCatchesReq.onsuccess = () => {
        const catches: CatchLog[] = allCatchesReq.result || [];
        catches.forEach((c) => {
          let updated = false;
          if (c.species) {
            const newSpecies = formatSpeciesName(c.species);
            if (newSpecies !== c.species) {
              c.species = newSpecies;
              updated = true;
            }
          }
          if (c.spotName) {
            const newSpotName = formatSpotName(c.spotName);
            if (newSpotName !== c.spotName) {
              c.spotName = newSpotName;
              updated = true;
            }
          }
          if (c.items && Array.isArray(c.items)) {
            c.items.forEach((item) => {
              if (item.species) {
                const newSp = formatSpeciesName(item.species);
                if (newSp !== item.species) {
                  item.species = newSp;
                  updated = true;
                }
              }
            });
          }
          if (c.weather) {
            if (c.weather.tideName) {
              const newTide = formatTideName(c.weather.tideName);
              if (newTide !== c.weather.tideName) {
                c.weather.tideName = newTide as any;
                updated = true;
              }
            }
            if (c.weather.tideState) {
              const newState = formatTideState(c.weather.tideState);
              if (newState !== c.weather.tideState) {
                c.weather.tideState = newState as any;
                updated = true;
              }
            }
            if (c.weather.waveHeight) {
              const newWave = formatWaveCondition(c.weather.waveHeight);
              if (newWave !== c.weather.waveHeight) {
                c.weather.waveHeight = newWave as any;
                updated = true;
              }
            }
            if (c.weather.condition) {
              const newCond = formatWeatherCondition(c.weather.condition);
              if (newCond !== c.weather.condition) {
                c.weather.condition = newCond as any;
                updated = true;
              }
            }
          }
          if (updated) {
            catchStore.put(c);
          }
        });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
