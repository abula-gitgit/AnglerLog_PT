/**
 * Universal formatting & translation utilities for fishing domain data (Portuguese Edition)
 * Automatically normalizes stored strings to clean Portuguese.
 */

export function formatTideName(name?: string | null): string {
  if (!name) return '';
  const n = name.trim();
  if (n.includes('大潮') || n.toLowerCase().includes('spring') || n.includes('vives') || n.toLowerCase().includes('sizigiali') || n.toLowerCase().includes('vivas')) return 'Marés vivas (Águas vivas)';
  if (n.includes('中潮') || n.toLowerCase().includes('mid') || n.toLowerCase().includes('middle') || n.includes('moyenne') || n.toLowerCase().includes('intermed')) return 'Marés intermédias';
  if (n.includes('小潮') || n.toLowerCase().includes('neap') || n.includes('mortes') || n.toLowerCase().includes('quadratura') || n.toLowerCase().includes('muertas')) return 'Marés mortas (Águas mortas)';
  if (n.includes('長潮') || n.toLowerCase().includes('standstill') || n.includes('transition') || n.toLowerCase().includes('transição') || n.toLowerCase().includes('larga') || n.toLowerCase().includes('lunga')) return 'Maré de transição';
  if (n.includes('若潮') || n.toLowerCase().includes('young') || n.toLowerCase().includes('nova') || n.toLowerCase().includes('joven') || n.toLowerCase().includes('giovane')) return 'Maré nova';
  return n;
}

export function formatTideState(state?: string | null): string {
  if (!state) return '';
  const s = state.trim();
  if (s.includes('上げ3分') || s.includes('Rising (Early)') || s.includes('Montante (Début)') || s.includes('Auflaufend (Beginn)') || s.includes('Llenante (inicio)') || s.includes('Montante (inizio)') || s.includes('Enchente (início)')) {
    return 'Enchente (início)';
  }
  if (s.includes('上げ7分') || s.includes('Rising (Late)') || s.includes('Peak Flow') || s.includes('Montante (Plein flot)') || s.includes('Auflaufend (Hauptstrom)') || s.includes('Llenante (flujo principal)') || s.includes('Montante (flusso di punta)') || s.includes('Enchente (vaga principal)')) {
    return 'Enchente (vaga principal)';
  }
  if (s.includes('下げ3分') || s.includes('Falling (Early)') || s.includes('Descendante (Début)') || s.includes('Ablaufend (Beginn)') || s.includes('Vaciante (inicio)') || s.includes('Calante (inizio)') || s.includes('Vazante (início)')) {
    return 'Vazante (início)';
  }
  if (s.includes('下げ7分') || s.includes('Falling (Late)') || s.includes('Descendante (Plein jusant)') || s.includes('Ablaufend (Hauptstrom)') || s.includes('Vaciante (reflujo principal)') || s.includes('Calante (reflusso di punta)') || s.includes('Vazante (vazadouro principal)')) {
    return 'Vazante (vazadouro principal)';
  }
  if (s.includes('満潮前後') || s.includes('High Tide (Turn)') || s.includes('Hochwasser (Kippphase)') || s.includes('Pleamar (Repunte)') || s.includes('Alta marea (Stanca)')) return 'Preia-mar (Estofo)';
  if (s.includes('干潮前後') || s.includes('Low Tide (Turn)') || s.includes('Niedrigwasser (Kippphase)') || s.includes('Bajamar (Repunte)') || s.includes('Bassa marea (Stanca)')) return 'Baixa-mar (Estofo)';
  if (s.includes('満潮') || s === 'High Tide' || s.includes('Pleine mer') || s.includes('Hochwasser') || s.includes('Pleamar') || s.includes('Alta marea') || s.includes('Preia-mar')) return 'Preia-mar (Cheia)';
  if (s.includes('干潮') || s === 'Low Tide' || s.includes('Basse mer') || s.includes('Niedrigwasser') || s.includes('Bajamar') || s.includes('Bassa marea') || s.includes('Baixa-mar')) return 'Baixa-mar (Baixa)';
  if (s.includes('潮止まり') || s.toLowerCase().includes('slack') || s.includes('Étale') || s.includes('Stauwasser') || s.includes('Repunte') || s.includes('Stanca') || s.includes('Estofo')) return 'Estofo de maré';
  if (s.includes('上げ') || s.includes('上潮') || s.toLowerCase().includes('flood') || s.toLowerCase().includes('rising') || s.includes('Auflaufend') || s.includes('Montante') || s.includes('encher') || s.includes('Enchente')) {
    return 'Maré a encher (Enchente)';
  }
  if (s.includes('下げ') || s.includes('引潮') || s.toLowerCase().includes('ebb') || s.toLowerCase().includes('falling') || s.includes('Ablaufend') || s.includes('Calante') || s.includes('vazar') || s.includes('Vazante')) {
    return 'Maré a vazar (Vazante)';
  }
  return s;
}

export function formatWaveCondition(wave?: string | null): string {
  if (!wave) return '';
  const w = wave.trim();
  if (w.includes('ベタ凪') || w.toLowerCase() === 'calm' || w.includes('calme') || w.includes('Ruhige') || w.includes('calma') || w.includes('calmo') || w.includes('Chão')) return 'Mar calmo / Chão';
  if (w.includes('凪') || w.toLowerCase().includes('light chop') || w.includes('Légèrement') || w.includes('Leichte') || w.includes('Marejadilla') || w.includes('Poco mosso') || w.includes('pouco agitado')) return 'Mar chão a pouco agitado';
  if (w.includes('やや波あり') || w.toLowerCase().includes('moderate') || w.includes('agitée') || w.includes('Mäßige') || w.includes('Marejada') || w.includes('Mosso') || w.includes('cavado')) return 'Mar cavado / Ondulação moderada';
  if (w.includes('波高') || w.includes('荒れ') || w.toLowerCase().includes('rough') || w.includes('forte') || w.includes('Raue') || w.includes('Oleaje') || w.includes('Mareggiata') || w.includes('bravo')) return 'Mar bravo / Vaga forte';
  return w;
}

export function formatWeatherCondition(condition?: string | null): string {
  if (!condition) return '';
  const c = condition.trim().toLowerCase();
  if (c.includes('晴') || c === 'sunny' || c === 'clear' || c.includes('ensoleillé') || c.includes('sonnig') || c.includes('soleado') || c.includes('sereno') || c.includes('limpo') || c.includes('ensolarado')) return 'Limpo / Ensolarado';
  if (c.includes('曇') || c === 'cloudy' || c.includes('nuageux') || c.includes('bewölkt') || c.includes('nublado') || c.includes('nuvoloso')) return 'Nublado';
  if (c.includes('大雨') || c.includes('豪雨') || c === 'heavy_rain' || c.includes('orage') || c.includes('starkregen') || c.includes('torrencial') || c.includes('temporale') || c.includes('mau tempo')) return 'Chuva forte / Mau tempo';
  if (c.includes('雨') || c === 'rain' || c.includes('pluie') || c.includes('regen') || c.includes('lluvia') || c.includes('pioggia') || c.includes('chuva')) return 'Chuva';
  if (c.includes('霧') || c.includes('fog') || c.includes('brouillard') || c.includes('nebel') || c.includes('niebla') || c.includes('nebbia') || c.includes('nevoeiro') || c.includes('neblina')) return 'Nevoeiro / Neblina';
  if (c.includes('強風') || c === 'windy' || c.includes('vent') || c.includes('windig') || c.includes('viento') || c.includes('vento')) return 'Vento forte / Temporal';
  return condition;
}

export function formatSpotType(type?: string | null): string {
  if (!type) return 'Desconhecido';
  const t = type.trim();
  if (t === 'breakwater' || t.includes('堤防') || t.includes('Digue') || t.includes('Jetée') || t.includes('Mole') || t.includes('Espigón') || t.includes('Molo') || t.includes('Molhe') || t.includes('Pontão')) return 'Molhe / Pontão / Quebra-mar';
  if (t === 'rocky' || t.includes('磯') || t.includes('rocheuse') || t.includes('Felsküste') || t.includes('Pedrero') || t.includes('Scogliera') || t.includes('Falésia') || t.includes('Sargos')) return 'Pesca aos sargos / Falésia / Cabeços';
  if (t === 'surf' || t.includes('サーフ') || t.includes('Plage') || t.includes('Brandungsstrand') || t.includes('Playa') || t.includes('Spiaggia') || t.includes('Surfcasting') || t.includes('Praia')) return 'Surfcasting / Praia de areia';
  if (t === 'estuary' || t.includes('河口') || t.includes('Estuaire') || t.includes('Flussmündung') || t.includes('Ría') || t.includes('Foce') || t.includes('Laguna') || t.includes('Estuário') || t.includes('Ria')) return 'Estuário / Ria / Marisma';
  if (t === 'lake_pond' || t.includes('湖') || t.includes('Lac') || t.includes('See') || t.includes('Embalse') || t.includes('Lago') || t.includes('Barragem') || t.includes('Albufeira')) return 'Barragem / Lago / Albufeira';
  if (t === 'port' || t.includes('漁港') || t.includes('Port') || t.includes('Hafen') || t.includes('Puerto') || t.includes('Porto') || t.includes('Marina') || t.includes('Doca')) return 'Porto de pesca / Marina / Doca';
  if (t === 'boat' || t.includes('ボート') || t.includes('Bateau') || t.includes('Boot') || t.includes('Embarcación') || t.includes('Barca') || t.includes('Embarcada') || t.includes('Caiaque')) return 'Embarcada / Alto mar / Caiaque';
  if (t === 'stream' || t.includes('渓流') || t.includes('Ruisseau') || t.includes('Bach') || t.includes('Río') || t.includes('Torrente') || t.includes('Ribeira') || t.includes('Trutas')) return 'Rio de trutas / Ribeira de montanha';
  return type;
}

export function formatBottomType(bottom?: string | null): string {
  if (!bottom) return '';
  const b = bottom.trim();
  const map: Record<string, string> = {
    '砂地': 'Areia',
    '砂': 'Areia',
    'Sand': 'Areia',
    'Sable': 'Areia',
    'Arena': 'Areia',
    'Sabbia': 'Areia',
    'Areia': 'Areia',
    '泥': 'Vaso / Lodo',
    '泥底': 'Vaso / Lodo',
    'Mud': 'Vaso / Lodo',
    'Vase / Boue': 'Vaso / Lodo',
    'Schlamm / Modder': 'Vaso / Lodo',
    'Fango / Cieno': 'Vaso / Lodo',
    'Fango / Melma': 'Vaso / Lodo',
    'Vaso / Lodo': 'Vaso / Lodo',
    '敷石': 'Enrocamento / Pedras soltas',
    'Enrochement / Pierres': 'Enrocamento / Pedras soltas',
    'Steinpackung / Schotter': 'Enrocamento / Pedras soltas',
    'Escollera / Piedra suelta': 'Enrocamento / Pedras soltas',
    'Scogliera frangiflutti / Massi': 'Enrocamento / Pedras soltas',
    'Enrocamento / Pedras soltas': 'Enrocamento / Pedras soltas',
    '沈み根': 'Restinga / Cabeços de pedra',
    'Récif submergé': 'Restinga / Cabeços de pedra',
    'Unterwasserberg / Riff': 'Restinga / Cabeços de pedra',
    'Bajos rocosos / Arrecife': 'Restinga / Cabeços de pedra',
    'Secche rocciose / Relitti': 'Restinga / Cabeços de pedra',
    'Restinga / Cabeços de pedra': 'Restinga / Cabeços de pedra',
    '海藻・ウィード': 'Pradarias marinhas / Algodão',
    'Algues / Herbier': 'Pradarias marinhas / Algodão',
    'Herbier': 'Pradarias marinhas',
    'Krautfeld / Wasserpflanzen': 'Pradarias marinhas / Algodão',
    'Krautfeld': 'Pradarias marinhas',
    'Algas / Praderas submarinas': 'Pradarias marinhas / Algodão',
    'Alghe / Praterie di Posidonia': 'Pradarias marinhas / Algodão',
    'Pradarias marinhas / Algodão': 'Pradarias marinhas / Algodão',
    'テトラポッド': 'Blocos de betão / Tetrápodes',
    'Tétrapodes': 'Blocos de betão / Tetrápodes',
    'Tetrapoden / Deckwerk': 'Blocos de betão / Tetrápodes',
    'Bloques de hormigón': 'Blocos de betão / Tetrápodes',
    'Blocchi di cemento / Tetrapodi': 'Blocos de betão / Tetrápodes',
    'Blocos de betão / Tetrápodes': 'Blocos de betão / Tetrápodes',
    'ブレイク・カケアガリ': 'Desnível / Declive acentuado',
    'Tombant / Cassure': 'Desnível / Declive acentuado',
    'Abbruchkante / Unterwasserkante': 'Desnível / Declive acentuado',
    'Cantil / Desnivel': 'Desnível / Declive acentuado',
    'Gradino di risacca / Caduta': 'Desnível / Declive acentuado',
    'Desnível / Declive acentuado': 'Desnível / Declive acentuado',
    'ゴロタ石': 'Calhaus / Seixos rolados',
    'Galets / Gros blocs': 'Calhaus / Seixos rolados',
    'Geröll / Grobe Steine': 'Calhaus / Seixos rolados',
    'Guijarros / Cantos rodados': 'Calhaus / Seixos rolados',
    'Ciottoli / Sassi': 'Calhaus / Seixos rolados',
    'Calhaus / Seixos rolados': 'Calhaus / Seixos rolados',
    'Roches / Récif': 'Rochas / Fundo misto',
    'Felsen / Riff': 'Rochas / Fundo misto',
    'Rocas / Arrecife': 'Rochas / Fundo misto',
    'Rocce / Fondali misti': 'Rochas / Fundo misto',
    'Rochas / Fundo misto': 'Rochas / Fundo misto',
    '立ち木': 'Árvores submersas / Galhadas',
    'Bois immergé': 'Árvores submersas / Galhadas',
    'Totholz / Versunkene Bäume': 'Árvores submersas / Galhadas',
    'Árboles sumergidos': 'Árvores submersas / Galhadas',
    'Alberi sommersi / Legnaie': 'Árvores submersas / Galhadas',
    'Árvores submersas / Galhadas': 'Árvores submersas / Galhadas',
  };
  return map[b] || b;
}

const SPECIES_TRANSLATION_MAP: Record<string, string> = {
  // Multilingual mapping to Portuguese
  'Hecht': 'Lúcio',
  'Pike': 'Lúcio',
  'Northern Pike': 'Lúcio',
  'Brochet': 'Lúcio',
  'Lucio': 'Lúcio',
  'Luccio': 'Lúcio',
  'Lúcio': 'Lúcio',

  'Zander': 'Lucioperca',
  'Sandre': 'Lucioperca',
  'Walleye': 'Lucioperca',
  'Lucioperca': 'Lucioperca',
  'Lucioperca / Sandra': 'Lucioperca',

  'Flussbarsch': 'Perca-europeia',
  'Barsch': 'Perca-europeia',
  'Perch': 'Perca-europeia',
  'European Perch': 'Perca-europeia',
  'Perche': 'Perca-europeia',
  'Perche commune': 'Perca-europeia',
  'Perca': 'Perca-europeia',
  'Persico reale': 'Perca-europeia',
  'Perca-europeia': 'Perca-europeia',

  'Forelle': 'Truta',
  'Bachforelle': 'Truta fário',
  'Brown Trout': 'Truta fário',
  'Truite fario': 'Truta fário',
  'Trucha común / Fario': 'Truta fário',
  'Trota fario': 'Truta fário',
  'Truta fário': 'Truta fário',
  'Truta': 'Truta',

  'Regenbogenforelle': 'Truta arco-íris',
  'Rainbow Trout': 'Truta arco-íris',
  'Truite arc-en-ciel': 'Truta arco-íris',
  'Trucha arcoíris': 'Truta arco-íris',
  'Trota iridea': 'Truta arco-íris',
  'Truta arco-íris': 'Truta arco-íris',

  'Seeforelle': 'Truta de lago',
  'Lake Trout': 'Truta de lago',
  'Truite de lac': 'Truta de lago',
  'Trota lacustre': 'Truta de lago',

  'Meerforelle': 'Truta de mar',
  'Sea Trout': 'Truta de mar',
  'Truite de mer': 'Truta de mar',

  'Dorsch': 'Bacalhau',
  'Kabeljau': 'Bacalhau',
  'Cod': 'Bacalhau',
  'Bacalao': 'Bacalhau',
  'Merluzzo': 'Bacalhau',
  'Bacalhau': 'Bacalhau',

  'Wolfsbarsch': 'Robalo',
  'Sea Bass': 'Robalo',
  'Bar commun (Loup)': 'Robalo',
  'Bar commun': 'Robalo',
  'シーバス': 'Robalo',
  'スズキ': 'Robalo',
  'Lubina': 'Robalo',
  'Róbalo': 'Robalo',
  'Spigola': 'Robalo',
  'Branzino': 'Robalo',
  'Spigola / Branzino': 'Robalo',
  'Robalo': 'Robalo',

  'Karpfen': 'Carpa',
  'Carp': 'Carpa',
  'Common Carp': 'Carpa-comum',
  'Carpe': 'Carpa',
  'Carpa': 'Carpa',
  'Carpa común': 'Carpa-comum',
  'Carpa comune': 'Carpa-comum',
  'Carpa-comum': 'Carpa-comum',

  'Wels': 'Siluro',
  'Waller': 'Siluro',
  'Catfish': 'Siluro / Peixe-gato',
  'Silure': 'Siluro',
  'Siluro': 'Siluro',

  'Aal': 'Enguia',
  'Eel': 'Enguia',
  'Anguille': 'Enguia',
  'Anguila': 'Enguia',
  'Anguilla': 'Enguia',
  'Enguia': 'Enguia',

  'Tenca': 'Tenca',
  'Tench': 'Tenca',
  'Tanche': 'Tenca',
  'Tinca': 'Tenca',

  'Barbe': 'Barbo',
  'Barbel': 'Barbo',
  'Barbeau': 'Barbo',
  'Barbo': 'Barbo',

  'Brasse': 'Brema',
  'Bream': 'Brema',
  'Brème': 'Brema',
  'Brema': 'Brema',
  'Breme': 'Brema',

  'Makrele': 'Cavala',
  'Mackerel': 'Cavala',
  'Maquereau': 'Cavala',
  'Caballa': 'Cavala',
  'Sgombro': 'Cavala',
  'Cavala': 'Cavala',

  'Daurade royale': 'Dourada',
  'Goldbrasse / Dorade': 'Dourada',
  'Dorade': 'Dourada',
  'Dorada': 'Dourada',
  'Orata': 'Dourada',
  'Dourada': 'Dourada',

  'Daurade / Pagre': 'Pargo',
  'Meerbrasse': 'Sargo / Pargo',
  'Sargo': 'Sargo',
  'Sar commun': 'Sargo',
  'Sarago': 'Sargo',
  'Pargo': 'Pargo',

  'Dentex': 'Dentuço',
  'Dentón': 'Dentuço',
  'Dentice': 'Dentuço',
  'Dentuço': 'Dentuço',

  'Mero': 'Mero / Garoupa',
  'Mérou': 'Mero / Garoupa',
  'Grouper': 'Mero / Garoupa',
  'Cernia': 'Mero / Garoupa',
  'Garoupa': 'Garoupa',

  'Bonito': 'Bonito',
  'Palamita': 'Bonito',
  'Atún': 'Atum',
  'Tonno': 'Atum',
  'Tonno rosso': 'Atum-rabilho',
  'Atum': 'Atum',
  'Jurel': 'Carapau',
  'Chinchard': 'Carapau',
  'Sugarello': 'Carapau',
  'Carapau': 'Carapau',

  'Ricciola': 'Charuteiro / Lírio',
  'Amberjack': 'Charuteiro / Lírio',
  'Lírio': 'Lírio',

  'Seiche': 'Choco',
  'Sepia / Choco': 'Choco',
  'Sepia': 'Choco',
  'Seppia': 'Choco',
  'Choco': 'Choco',

  'Calmar / Seiche': 'Lula',
  'Calamar': 'Lula',
  'Calamaro': 'Lula',
  'Lula': 'Lula',

  'Pulpo': 'Polvo',
  'Octopus': 'Polvo',
  'Poulpe': 'Polvo',
  'Polpo': 'Polvo',
  'Polvo': 'Polvo',

  'Black Bass': 'Achigã (Black Bass)',
  'Bass': 'Achigã (Black Bass)',
  'Persico trota': 'Achigã (Black Bass)',
  'Achigã': 'Achigã (Black Bass)',

  'Corvina': 'Corvina',
  'Corvina-legítima': 'Corvina-legítima',
  'Safio': 'Safio / Congro',
  'Congro': 'Safio / Congro',
  'Linguado': 'Linguado',
  'Besugo': 'Besugo',
  'Bica': 'Bica',
};

export function formatSpeciesName(species?: string | null): string {
  if (!species) return '';
  const s = species.trim();
  return SPECIES_TRANSLATION_MAP[s] || s;
}

export function formatSpotName(name?: string | null): string {
  if (!name) return 'Pesqueiro sem nome';
  return name.trim();
}

export function formatSeason(season?: string | null): string {
  if (!season) return '';
  const s = season.toLowerCase().trim();
  if (s.includes('primavera') || s.includes('spring') || s.includes('printemps') || s.includes('frühling') || s.includes('春')) return 'Primavera';
  if (s.includes('verão') || s.includes('estate') || s.includes('summer') || s.includes('été') || s.includes('sommer') || s.includes('verano') || s.includes('夏')) return 'Verão';
  if (s.includes('outono') || s.includes('autunno') || s.includes('autumn') || s.includes('fall') || s.includes('automne') || s.includes('herbst') || s.includes('otoño') || s.includes('秋')) return 'Outono';
  if (s.includes('inverno') || s.includes('winter') || s.includes('hiver') || s.includes('invierno') || s.includes('冬')) return 'Inverno';
  return season;
}

export function formatTimeOfDay(tod?: string | null): string {
  if (!tod) return '';
  const t = tod.toLowerCase().trim();
  if (t.includes('alvorada') || t.includes('amanhecer') || t.includes('alba') || t.includes('dawn') || t.includes('aube') || t.includes('morgen') || t.includes('朝')) return 'Alvorada / Amanhecer';
  if (t.includes('entardecer') || t.includes('pôr do sol') || t.includes('tramonto') || t.includes('atardecer') || t.includes('dusk') || t.includes('crépuscule') || t.includes('abend') || t.includes('夕')) return 'Entardecer / Pôr do sol';
  if (t.includes('dia') || t.includes('giorno') || t.includes('day') || t.includes('jour') || t.includes('tag') || t.includes('昼')) return 'Durante o dia';
  if (t.includes('noite') || t.includes('notte') || t.includes('noche') || t.includes('night') || t.includes('nuit') || t.includes('nacht') || t.includes('夜')) return 'Noite';
  return tod;
}

export function formatSnagRisk(risk?: string | null): string {
  if (!risk) return 'Baixo';
  const r = risk.trim().toLowerCase();
  if (r === 'low' || r === 'faible' || r === 'gering' || r === 'bajo' || r === 'basso' || r === 'baixo' || r === '低' || r === 'none') return 'Baixo';
  if (r === 'medium' || r === 'modéré' || r === 'mäßig' || r === 'mittel' || r === 'moderado' || r === 'medio' || r === 'moderato' || r === '中') return 'Moderado';
  if (r === 'high' || r === 'élevé' || r === 'hoch' || r === 'alto' || r === 'elevato' || r === 'elevado' || r === '高') return 'Elevado';
  return risk;
}
