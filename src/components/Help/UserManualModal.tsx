import React, { useState } from 'react';
import {
  BookOpen,
  MapPin,
  Fish,
  Calendar,
  Waves,
  HardDrive,
  X,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BarChart3,
  Compass,
  Layers,
  ArrowRight,
  Camera,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface UserManualModalProps {
  onClose: () => void;
  onOpenTideGraph?: () => void;
  onOpenCompass?: () => void;
  onOpenTackleBox?: () => void;
  onOpenPatternPrediction?: () => void;
  onOpenBackup?: () => void;
  onOpenPrivacyPolicy?: () => void;
}

type ManualSectionId = 
  | 'start' 
  | 'map-spots' 
  | 'catches' 
  | 'tactical' 
  | 'photos-analytics' 
  | 'offline-backup' 
  | 'faq';

interface SectionNav {
  id: ManualSectionId;
  title: string;
  shortTitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS: SectionNav[] = [
  { id: 'start', title: 'Guia de Início Rápido', shortTitle: 'Início', icon: Sparkles },
  { id: 'map-spots', title: 'Mapa & Pesqueiros GPS', shortTitle: 'Mapa', icon: MapPin },
  { id: 'catches', title: 'Diário de Capturas & Calendário', shortTitle: 'Capturas', icon: Fish },
  { id: 'tactical', title: 'Marés, Bússola & Tática', shortTitle: 'Tática', icon: Waves },
  { id: 'photos-analytics', title: 'Fotos & Galeria de Troféus', shortTitle: 'Estatísticas', icon: BarChart3 },
  { id: 'offline-backup', title: 'Modo Offline & Cópia de Segurança', shortTitle: 'Backup', icon: HardDrive },
  { id: 'faq', title: 'Perguntas Frequentes (FAQ)', shortTitle: 'FAQ', icon: HelpCircle },
];

export const UserManualModal: React.FC<UserManualModalProps> = ({
  onClose,
  onOpenTideGraph,
  onOpenCompass,
  onOpenTackleBox,
  onOpenPatternPrediction,
  onOpenBackup,
  onOpenPrivacyPolicy,
}) => {
  const [activeSection, setActiveSection] = useState<ManualSectionId>('start');

  return (
    <div
      className="fixed inset-0 z-[1300] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-modal-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[94vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 id="manual-modal-title" className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight truncate">
                  {'Guia do Utilizador & Manual Prático de AnglerLog'}
                </h2>
                <span className="text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold shrink-0">
                  {'Guia Prático'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                {'Tudo sobre pesqueiros GPS, tabelas de marés, gestão de material e diário de pesca offline'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors shrink-0"
            aria-label="Fechar manual"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Navigation Sidebar */}
          <nav 
            className="w-full md:w-60 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/60 p-2 md:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none"
            aria-label="Secções do manual"
          >
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 md:shrink md:w-full text-left ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span className="hidden md:inline truncate">{sec.title}</span>
                  <span className="md:hidden whitespace-nowrap">{sec.shortTitle}</span>
                </button>
              );
            })}
          </nav>

          {/* Main Manual Body */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
            
            {/* Section 1: Início Rápido */}
            {activeSection === 'start' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 rounded-xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent border border-sky-500/20">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-sky-400" />
                    Bem-vindo ao AnglerLog
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    O AnglerLog foi concebido especificamente para pescadores de mar, rios e albufeiras. Funciona a 100% offline, diretamente no seu dispositivo, garantindo que as coordenadas dos seus pesqueiros mais secretos nunca saem para servidores de terceiros.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-sky-400 uppercase tracking-wider mb-3">
                    3 Passos para Começar a Usar
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">1</div>
                      <h5 className="font-semibold text-white text-xs sm:text-sm">Marcar Pesqueiro</h5>
                      <p className="text-[11px] sm:text-xs text-slate-400">
                        No mapa, prima o botão GPS ou clique em qualquer ponto da costa para registar o pesqueiro com profundidade e tipo de fundo.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">2</div>
                      <h5 className="font-semibold text-white text-xs sm:text-sm">Registar Captura</h5>
                      <p className="text-[11px] sm:text-xs text-slate-400">
                        Prima Registar Captura. A meteorologia, fase da lua e a maré são associadas automaticamente à sua foto e ao material utilizado.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">3</div>
                      <h5 className="font-semibold text-white text-xs sm:text-sm">Analisar Marés & Padrões</h5>
                      <p className="text-[11px] sm:text-xs text-slate-400">
                        Consulte o gráfico de marés, o estofo e a bússola tática para descobrir os melhores momentos de atividade dos peixes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                  <h4 className="font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-emerald-400" />
                    Instalar como Aplicação Nativa (PWA)
                  </h4>
                  <p className="text-xs text-slate-400">
                    No Safari (iOS), toque em Partilhar e selecione Adicionar ao ecrã principal. No Chrome / Android, toque no menu de três pontos e escolha Instalar aplicação. Poderá abrir o AnglerLog mesmo em modo de voo em alto mar.
                  </p>
                </div>
              </div>
            )}

            {/* Section 2: Mapa & Pesqueiros GPS */}
            {activeSection === 'map-spots' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-sky-400" />
                    Gestão de Pesqueiros & Localização GPS
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    O mapa permite alternar entre imagem de satélite de alta resolução (Esri World Imagery), relevo topográfico (OpenTopoMap) e mapa padrão rodoviário (OpenStreetMap).
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white text-xs sm:text-sm text-sky-300">
                      📍 Como marcar um novo pesqueiro
                    </h4>
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                      <li>Botão GPS: obtém imediatamente as coordenadas atuais a bordo de embarcação ou a caminhar pelas rochas.</li>
                      <li>Clique longo ou modo marcador: clique em qualquer enseada, pontão ou parcelas do mapa para posicionar o alfinete.</li>
                      <li>Sub-pesqueiros: pode adicionar cabeços de pedra específicos, declives ou pontos de ancoragem a um mesmo pesqueiro.</li>
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white text-xs sm:text-sm text-amber-300">
                      ⚠️ Risco de Prisões & Tipo de Fundo
                    </h4>
                    <p className="text-xs text-slate-400">
                      Classifique o fundo em areia, vaso/lodo, enrocamento, restinga rochosa, pradarias marinhas ou blocos de betão. O indicador de risco de prisão (Baixo, Moderado, Elevado) ajuda a escolher a montagem correta antes de lançar.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white text-xs sm:text-sm text-purple-300">
                      🚫 Pesqueiros a Evitar & Lista de Desejos
                    </h4>
                    <p className="text-xs text-slate-400">
                      Marque pesqueiros interditos ou perigosos com a etiqueta A Evitar. Use a etiqueta Lista de Desejos para planear expedições a pesqueiros que ainda pretende explorar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Diário de Capturas & Calendário */}
            {activeSection === 'catches' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Fish className="w-5 h-5 text-sky-400" />
                    Registo Detalhado de Capturas
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Registe as suas capturas com precisão cirúrgica para identificar padrões sazonais de comportamento e horários de alimentação.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white text-xs sm:text-sm">Associação Automática de Condições</h4>
                    <p className="text-xs text-slate-400">
                      Ao selecionar o dia e a hora, o AnglerLog calcula a fase da maré (vazante, enchente, preia-mar), o coeficiente e a fase lunar de forma totalmente automática.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white text-xs sm:text-sm">Registo de Jornada sem Capturas</h4>
                    <p className="text-xs text-slate-400">
                      Pode ativar a opção Jornada sem capturas (grade). Analisar as condições em que o peixe não comeu é fundamental para aperfeiçoar a estratégia futura.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white text-xs sm:text-sm">Partilha Segura nas Redes Sociais</h4>
                    <p className="text-xs text-slate-400">
                      Gere cartões de captura com foto e peso para partilhar. O sistema oculta automaticamente as coordenadas GPS exatas, mantendo os seus pesqueiros em segredo.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white text-xs sm:text-sm">Calendário Lunar & Histórico</h4>
                    <p className="text-xs text-slate-400">
                      No separador Calendário, veja rapidamente os dias com capturas sobrepostos com as fases da lua nova e lua cheia.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Marés, Bússola & Tática */}
            {activeSection === 'tactical' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Waves className="w-5 h-5 text-sky-400" />
                    Ferramentas Táticas de Pesca
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Ferramentas profissionais para planear o momento exato de entrada do peixe com base nas condições marítimas e meteorológicas.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-white text-xs sm:text-sm flex items-center gap-1.5">
                        <Waves className="w-4 h-4 text-sky-400" />
                        Gráfico de Marés & Estofo
                      </h4>
                      <p className="text-xs text-slate-400">
                        Consulte a curva sinusoidal de maré em tempo real com horas de preia-mar, baixa-mar e períodos de estofo de maré.
                      </p>
                    </div>
                    {onOpenTideGraph && (
                      <button
                        onClick={() => { onClose(); onOpenTideGraph(); }}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-semibold hover:bg-sky-500/30 transition-colors shrink-0"
                      >
                        Abrir Marés
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-white text-xs sm:text-sm flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-emerald-400" />
                        Bússola de Pesca & Derivação do Vento
                      </h4>
                      <p className="text-xs text-slate-400">
                        Bússola tática com orientação magnética, direção do vento e cálculo de derivação da embarcação em relação ao pesqueiro.
                      </p>
                    </div>
                    {onOpenCompass && (
                      <button
                        onClick={() => { onClose(); onOpenCompass(); }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition-colors shrink-0"
                      >
                        Abrir Bússola
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-white text-xs sm:text-sm flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-400" />
                        Caixa de Pesca & Gestão de Material
                      </h4>
                      <p className="text-xs text-slate-400">
                        Registe canas, carretos, linhas e montagens favoritas. Associe cada conjunto de pesca diretamente às capturas para saber que material tem melhor rendimento.
                      </p>
                    </div>
                    {onOpenTackleBox && (
                      <button
                        onClick={() => { onClose(); onOpenTackleBox(); }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-colors shrink-0"
                      >
                        Abrir Material
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section 5: Fotos & Estatísticas Troféus */}
            {activeSection === 'photos-analytics' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-sky-400" />
                    Galeria de Fotos & Recordes Pessoais
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Acompanhe o seu progresso como pescador com estatísticas claras sobre as suas melhores capturas.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white text-xs sm:text-sm flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-sky-400" />
                      Galeria Fotográfica Local
                    </h4>
                    <p className="text-xs text-slate-400">
                      As fotografias das suas capturas são comprimidas de forma inteligente e guardadas na base de dados local do seu dispositivo, prontas para visualização a qualquer momento.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white text-xs sm:text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Painel de Recordes Pessoais (PB)
                    </h4>
                    <p className="text-xs text-slate-400">
                      O sistema destaca automaticamente o seu maior exemplar (comprimento em cm e peso em kg) para cada espécie registada (robalo, dourada, sargo, achigã, etc.).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section 6: Modo Offline & Cópia de Segurança */}
            {activeSection === 'offline-backup' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-sky-400" />
                    Privacidade Total & Cópia de Segurança
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    O AnglerLog baseia-se numa filosofia rigorosa de privacidade e funcionamento local.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white text-xs sm:text-sm text-emerald-300">
                      🛡️ Onde são guardados os meus dados?
                    </h4>
                    <p className="text-xs text-slate-400">
                      Todos os pesqueiros, coordenadas GPS, notas e capturas ficam armazenados na base de dados IndexedDB do seu navegador. Não existe nenhum servidor externo a recolher os seus dados.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-white text-xs sm:text-sm text-sky-300">
                        💾 Como fazer cópia de segurança (Backup)
                      </h4>
                      <p className="text-xs text-slate-400">
                        Exporte um ficheiro JSON completo com todos os seus dados para guardar no computador ou na sua cloud pessoal. Pode restaurar esse ficheiro num novo telemóvel a qualquer momento.
                      </p>
                    </div>
                    {onOpenBackup && (
                      <button
                        onClick={() => { onClose(); onOpenBackup(); }}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-semibold hover:bg-sky-500/30 transition-colors shrink-0"
                      >
                        Abrir Backup
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section 7: FAQ */}
            {activeSection === 'faq' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-sky-400" />
                    Perguntas Frequentes (FAQ)
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <h4 className="font-semibold text-white text-xs sm:text-sm">
                      A aplicação funciona sem ligação à Internet em alto mar?
                    </h4>
                    <p className="text-xs text-slate-400">
                      Sim. Graças à tecnologia PWA e à base de dados local IndexedDB, pode registar pesqueiros por GPS, consultar capturas anteriores e usar a bússola sem qualquer rede móvel.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <h4 className="font-semibold text-white text-xs sm:text-sm">
                      Outros pescadores podem ver os meus pesqueiros secretos?
                    </h4>
                    <p className="text-xs text-slate-400">
                      Não. Os seus pesqueiros nunca saem do seu próprio dispositivo. Não existe um mapa partilhado na nuvem onde outros utilizadores possam espreitar as suas marcações.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <h4 className="font-semibold text-white text-xs sm:text-sm">
                      Como posso transferir os meus dados para um novo telemóvel?
                    </h4>
                    <p className="text-xs text-slate-400">
                      Aceda ao menu Cópia de Segurança, clique em Exportar Dados para descarregar o ficheiro JSON. No novo dispositivo, abra o AnglerLog e escolha Importar Dados para restaurar tudo instantaneamente.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            AnglerLog v2.0 • Edição Portuguesa
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Fechar Manual
          </button>
        </div>

      </div>
    </div>
  );
};
