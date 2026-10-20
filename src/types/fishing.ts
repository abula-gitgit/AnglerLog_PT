export type SpotType = 
  | 'breakwater'   // Breakwater / Jetty
  | 'rocky'        // Rocky Shore / Reef
  | 'surf'         // Surf / Sandy Beach
  | 'estuary'      // Estuary / Tidal River
  | 'lake_pond'    // Lake / Pond / Reservoir
  | 'port'         // Harbor / Marina / Port
  | 'boat'         // Offshore / Boat / Kayak
  | 'stream'       // Stream / Mountain Creek
  | 'unknown';     // Unknown

export type SnagRisk = 'low' | 'medium' | 'high' | 'unknown';

export interface SubPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  note?: string;
}

export interface FishingSpot {
  id: string;
  name: string;
  spotType: SpotType;
  lat: number;
  lng: number;
  description: string;
  waterDepth: string;          // Water depth (e.g. 10ft drop-off, flats 2-4ft)
  bottomType: string[];        // Bottom structure (Sand, Rock/Reef, Weed Beds, Mud, Riprap)
  snagRisk: SnagRisk;          // Snag risk level
  currentNotes: string;        // Tidal current notes
  parkingInfo: string;         // Parking & boat ramp access
  hazardAndAccessNotes: string;// Hazards, regulations, life vest requirements
  bestSeasons: string[];       // Best seasons (Spring, Summer, Fall, Winter)
  bestTimeOfDay: string[];     // Dawn Twilight, Dusk Twilight, Daytime, Night
  targetSpecies: string[];     // Primary target species
  favorite: boolean;
  rating: number;              // 1 to 5
  avoidSpot?: boolean;         // Avoid / Red-flagged spot flag
  avoidReason?: string;        // Notes on why to avoid (e.g., restricted access, excessive snags)
  avoidTags?: string[];        // Avoid tag badges (No Access, Heavy Snags, Shallow, Poor Action)
  wishlistSpot?: boolean;      // Wishlist / Bucket list spot flag
  planDate?: string;           // Planned trip date (YYYY-MM-DD)
  planNotes?: string;          // Trip plan notes (tides, target species, tackle prep)
  wishlistTags?: string[];     // Wishlist tags (Tournament, Exploration, Expedition)
  isSample?: boolean;          // Demo sample data flag
  photoIds: string[];
  subPoints?: SubPoint[];
  createdAt: string;
  updatedAt: string;
}

export type WeatherCondition = 'sunny' | 'cloudy' | 'rain' | 'heavy_rain' | 'fog' | 'windy';
export type TideName = 
  | 'Marés vivas' | 'Marés intermédias' | 'Marés mortas' | 'Maré de transição' | 'Maré nova'
  | 'Maree sizigiali' | 'Maree intermedie' | 'Maree di quadratura' | 'Marea lunga' | 'Marea giovane'
  | 'Mareas vivas' | 'Mareas intermedias' | 'Mareas muertas' | 'Marea larga' | 'Marea joven'
  | 'Springtide' | 'Mittlere Tide' | 'Nipptide' | 'Übergangstide' | 'Jungtide' 
  | 'Spring Tide' | 'Mid Tide' | 'Neap Tide' | 'Transition Tide' 
  | 'Vives-eaux' | 'Marée moyenne' | 'Mortes-eaux' | 'Transition' | 'Petite marée'
  | '大潮' | '中潮' | '小潮' | '長潮' | '若潮'
  | string;

export type TideState = 
  | 'Preia-mar (Cheia)' | 'Baixa-mar (Baixa)' | 'Enchente (início)' | 'Enchente (vaga principal)' | 'Vazante (início)' | 'Vazante (vazadouro principal)' | 'Estofo de maré' | 'Outro'
  | 'Alta marea' | 'Bassa marea' | 'Montante (inizio)' | 'Montante (flusso di punta)' | 'Calante (inizio)' | 'Calante (reflusso di punta)' | 'Stanca di marea' | 'Altra'
  | 'Pleamar (Alta)' | 'Bajamar (Baja)' | 'Llenante (inicio)' | 'Llenante (flujo principal)' | 'Vaciante (inicio)' | 'Vaciante (reflujo principal)' | 'Repunte de marea' | 'Otras'
  | 'Hochwasser (HW)' | 'Niedrigwasser (NW)' | 'Auflaufend (Beginn)' | 'Auflaufend (Hauptstrom)' | 'Ablaufend (Beginn)' | 'Ablaufend (Hauptstrom)' | 'Stauwasser' 
  | 'High Tide' | 'Low Tide' | 'Rising (Early)' | 'Rising (Late)' | 'Falling (Early)' | 'Falling (Late)' | 'Slack Water' | 'Other'
  | 'Pleine Mer (PM)' | 'Basse Mer (BM)' | 'Montante (Début)' | 'Montante (Plein flot)' | 'Descendante (Début)' | 'Descendante (Plein jusant)' | 'Étale' | 'Autre'
  | '上げ3分' | '上げ7分' | '満潮' | '潮止まり' | '下げ3分' | '下げ7分' | '干潮' | 'その他'
  | string;

export type WaveCondition = 
  | 'Mar calmo / Chão' | 'Mar chão a pouco agitado' | 'Mar cavado / Ondulação moderada' | 'Mar bravo / Vaga forte'
  | 'Mare calmo' | 'Quasi calmo / Poco mosso' | 'Mosso' | 'Molto mosso / Mareggiata'
  | 'Mar en calma' | 'Marejadilla' | 'Marejada' | 'Fuerte marejada / Oleaje'
  | 'Ruhige See / Ententeich' | 'Leichte Kabbelwelle' | 'Mäßige Welle' | 'Raue See / Hohe Wellen' 
  | 'Calm' | 'Light Chop' | 'Moderate Waves' | 'Rough'
  | 'Mer calme' | 'Légèrement agitée' | 'Mer agitée' | 'Mer forte / Houle'
  | 'ベタ凪' | '凪' | 'やや波あり' | '波高・ウネリあり'
  | string;

export interface WeatherData {
  condition: WeatherCondition;
  temperature?: number;         // Air temperature (°C / °F depending on unitSystem)
  waterTemperature?: number;    // Sea / water surface temperature
  windDirection?: string;       // Compass direction (N, NE, SW, etc.)
  windSpeedMs?: number;         // Wind speed (m/s or kt)
  pressureHpa?: number;         // Atmospheric pressure (hPa / inHg)
  tideName?: TideName;          // Tide classification (Spring Tide, Neap Tide, etc.)
  tideState?: TideState;        // Tide curve state (High Tide, Low Tide, Flood, Ebb, Slack)
  waveHeight?: WaveCondition;   // Sea state (Calm, Light Chop, Moderate Waves, Rough)
  moonPhase?: string;           // Lunar phase description
}

export interface TackleInfo {
  rod?: string;
  reel?: string;
  mainLine?: string;
  leader?: string;
  tackleSetId?: string;
  tackleSetName?: string;
}

export interface TackleSet {
  id: string;
  name: string;             // Tackle rig name (e.g., 'Flats Sight-Casting Setup', 'Inshore Jigging Rig')
  targetFish?: string;      // Target species (Tarpon, Redfish, Bass, Snook, etc.)
  rod: string;              // Rod model & spec
  reel: string;             // Reel model & size
  mainLine: string;         // Main line (e.g., PE 20lb braid)
  leader: string;           // Leader line (e.g., Fluorocarbon 15lb 6ft)
  favoriteLures: string[];  // Trusted lures & rigs list
  notes?: string;           // Setup notes & rigging tips
  isDefault?: boolean;      // Default active selection
  createdAt: string;
  updatedAt: string;
}

export interface CatchFishItem {
  id: string;
  species: string;             // Species name
  sizeCm?: number;             // Length (cm / in)
  weightGrams?: number;        // Weight (g / lb oz)
  quantity: number;            // Number of fish
  lureOrBait?: string;         // Lure, fly, or bait used
  notes?: string;              // Item notes
}

export interface CatchLog {
  id: string;
  spotId: string;
  spotName: string;
  date: string;                // YYYY-MM-DD
  time: string;                // HH:mm
  isNoCatch?: boolean;         // No catch (skunked) log flag
  items?: CatchFishItem[];     // Multi-species items list
  species: string;             // Species name or 'No Catch Logged'
  sizeCm?: number;             // Length (cm / in)
  weightGrams?: number;        // Weight (g / lb)
  quantity: number;            // Total fish count
  tackle: TackleInfo;
  lureOrBait: string;          // Lure, fly, or bait used
  actionOrRange: string;       // Hit depth range / retrieval action
  weather: WeatherData;
  notes: string;               // Notes, stomach content, fight details
  photoIds: string[];          // Photo IDs
  isSample?: boolean;          // Demo sample data flag
  createdAt: string;
  updatedAt: string;
}

export interface StoredPhoto {
  id: string;
  dataUrl: string;             // Base64またはBlob URL
  fileName: string;
  fileSize: number;
  mimeType: string;
  capturedAt: string;
  spotId?: string;
  catchLogId?: string;
  caption?: string;
}

export interface AppFilterState {
  searchQuery: string;
  spotType: SpotType | 'all';
  targetSpecies: string;
  onlyFavorites: boolean;
  sortBy: 'date' | 'rating' | 'name' | 'catches';
}
