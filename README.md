# AnglerLog (Edição Portuguesa) 🎣
### Diário de Pesca Pessoal Offline & Localizador GPS de Pesqueiros

AnglerLog é uma aplicação web progressiva (PWA) moderna concebida para pescadores de mar, rios e barragens. Graças à sua arquitetura de funcionamento local (Offline-First), funciona na perfeição em alto mar ou em locais remotos sem cobertura de rede móvel.

---

## 🌟 Funcionalidades Principais

- 🗺️ Mapa de Pesqueiros & Localizador GPS:
  - Localização GPS precisa a bordo de embarcação ou a partir da costa, gravando pesqueiros com um único toque
  - Diversas camadas de mapa: Satélite (Esri World Imagery), Topográfico (OpenTopoMap) e Padrão (OpenStreetMap)
  - Suporte para sub-pesqueiros (parcelas, baixios, cabeços de pedra, naufrágios e declives de profundidade)
  - Registo de risco de prisões no fundo, tipo de fundo, parques de estacionamento e áreas marinhas protegidas

- 🐟 Diário Pormenorizado de Capturas:
  - Registo de capturas com comprimento (cm), peso (kg) e quantidade
  - Associação automática com meteorologia, pressão atmosférica, fases da lua e marés
  - Registo de jornadas sem capturas para analisar e aprender com as condições ambientais
  - Cartão de partilha para redes sociais com ocultação automática de coordenadas GPS secretas

- 🌊 Previsão de Marés & Atividade dos Peixes:
  - Gráfico de marés em tempo real, preia-mar e baixa-mar
  - Coeficientes de maré e períodos de estofo
  - Tabelas solunares e índice de atividade de predadores

- 🧭 Ferramentas Táticas:
  - Bússola de pesca com direção do vento e derivação da embarcação
  - Caixa de pesca digital para canas, carretos, linhas e amostras
  - Registo de recordes pessoais e galeria de troféus
  - Calendário mensal com fases lunares e histórico de jornadas

- 🔒 Máxima Privacidade:
  - Os seus pesqueiros secretos nunca são enviados para servidores externos
  - Todos os dados ficam guardados exclusivamente no seu navegador (IndexedDB)
  - Cópia de segurança e restauro rápidos em formato JSON

---

## 🚀 Instalação & Execução

### Pré-requisitos
- Node.js (v18+)
- npm ou pnpm

### Desenvolvimento Local
```bash
npm install
npm run dev
```

### Compilação para Produção
```bash
npm run build
```

---

## 📄 Licença

MIT License
