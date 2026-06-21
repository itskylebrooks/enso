import type { Grade, Localized } from '@shared/types';

export type BeltRequirement = {
  termSlugs: string[];
  basics: Localized<string[]>;
  examDescription: Localized<string>;
  examFocus: Localized<string[]>;
};

export const beltRequirements: Record<Grade, BeltRequirement> = {
  kyu5: {
    termSlugs: ['rei', 'seiza', 'hanmi', 'katate-tori', 'ukemi', 'onegai-shimasu'],
    basics: {
      en: [
        'Enter and leave the mat with correct bowing etiquette.',
        'Keep posture stable in basic hanmi and move with controlled steps.',
        'Practice safe receiving with clear ukemi signals and partner awareness.',
      ],
      de: [
        'Die Matte mit korrekter Verbeugung betreten und verlassen.',
        'Stabile Haltung im grundlegenden hanmi halten und kontrolliert gehen.',
        'Sicheres Nehmen mit klaren ukemi-Signalen und Partnerwahrnehmung ueben.',
      ],
    },
    examDescription: {
      en: 'The 5th kyu exam checks fundamentals: etiquette, base posture, and first control/throw principles.',
      de: 'Die Pruefung zum 5. Kyu prueft Grundlagen: Etikette, Basishaltung und erste Kontroll-/Wurfprinzipien.',
    },
    examFocus: {
      en: [
        'Clean stance transitions without rushing.',
        'Basic kuzushi before applying technique.',
        'Safe, cooperative rhythm with uke.',
      ],
      de: [
        'Saubere Standwechsel ohne Hektik.',
        'Grundlegendes kuzushi vor der Technik.',
        'Sicherer, kooperativer Rhythmus mit uke.',
      ],
    },
  },
  kyu4: {
    termSlugs: ['irimi', 'tenkan', 'tai-sabaki', 'shomen-uchi', 'yokomen-uchi', 'mokuso'],
    basics: {
      en: [
        'Show cleaner irimi entries with center alignment.',
        'Maintain distance (ma-ai) before and during contact.',
        'Demonstrate control in both omote and ura style movement patterns.',
      ],
      de: [
        'Sauberere irimi-Eintritte mit Zentrenausrichtung zeigen.',
        'Abstand (ma-ai) vor und waehrend des Kontakts halten.',
        'Kontrolle in omote- und ura-aehnlichen Bewegungsmustern demonstrieren.',
      ],
    },
    examDescription: {
      en: 'The 4th kyu exam builds on the base and expects clearer movement connection and directional control.',
      de: 'Die Pruefung zum 4. Kyu baut auf der Basis auf und erwartet klarere Bewegungsverbindung und Richtungskontrolle.',
    },
    examFocus: {
      en: [
        'Entry timing and turn timing must stay consistent.',
        'Technique should be center-led, not arm-driven.',
        'Ukemi safety and mutual control remain mandatory.',
      ],
      de: [
        'Timing von Eintritt und Drehung muss konstant bleiben.',
        'Technik sollte aus dem Zentrum kommen, nicht aus den Armen.',
        'Ukemi-Sicherheit und gegenseitige Kontrolle bleiben Pflicht.',
      ],
    },
  },
  kyu3: {
    termSlugs: ['nikyo', 'sankyo', 'kokyu', 'ma-ai', 'kuzushi', 'mune-tori'],
    basics: {
      en: [
        'Control line and angle during turning throws.',
        'Keep transitions smooth between entering and turning phases.',
        'Use coordinated hips and shoulders instead of isolated arm force.',
      ],
      de: [
        'Linie und Winkel bei Drehwuerfen kontrollieren.',
        'Uebergaenge zwischen Eintreten und Drehen weich halten.',
        'Huefte und Schultern koordiniert statt isolierter Armkraft einsetzen.',
      ],
    },
    examDescription: {
      en: 'The 3rd kyu exam emphasizes intermediate control quality, especially timing, direction, and structure.',
      de: 'Die Pruefung zum 3. Kyu betont mittlere Kontrollqualitaet, besonders Timing, Richtung und Struktur.',
    },
    examFocus: {
      en: [
        'Consistent posture under directional pressure.',
        'Clear intent in kuzushi and finishing control.',
        'Reliable, safe receiving mechanics from uke.',
      ],
      de: [
        'Konstante Haltung unter Richtungsdruck.',
        'Klare Intention in kuzushi und Endkontrolle.',
        'Zuverlaessige, sichere Nehmechanik von uke.',
      ],
    },
  },
  kyu2: {
    termSlugs: [
      'koshi-nage',
      'ushiro-ryote-tori',
      'zanshin',
      'awase',
      'kata-tori',
      'hito-emi',
    ],
    basics: {
      en: [
        'Demonstrate stronger center control during larger projections.',
        'Protect uke space during turning and lowering actions.',
        'Manage tempo under pressure without sacrificing posture.',
      ],
      de: [
        'Staerkere Zentrenkontrolle bei groesseren Wuerfen demonstrieren.',
        'Uke-Raum bei Dreh- und Absenkbewegungen schuetzen.',
        'Tempo unter Druck steuern, ohne die Haltung zu verlieren.',
      ],
    },
    examDescription: {
      en: 'The 2nd kyu exam expects more complete body integration, stronger control, and safer projection management.',
      de: 'Die Pruefung zum 2. Kyu erwartet vollstaendigere Koerperintegration, staerkere Kontrolle und sichereres Wurfmanagement.',
    },
    examFocus: {
      en: [
        'Power should come from coordinated legs and center.',
        'Kuzushi must be clear before projection.',
        'Finish each technique with stable awareness (zanshin).',
      ],
      de: [
        'Kraft sollte aus koordinierten Beinen und Zentrum kommen.',
        'Kuzushi muss vor dem Wurf klar sein.',
        'Jede Technik mit stabiler Aufmerksamkeit (zanshin) abschliessen.',
      ],
    },
  },
  kyu1: {
    termSlugs: ['yonkyo', 'gokyo', 'katame-waza', 'nage-waza', 'ki-musubi', 'shu-ha-ri'],
    basics: {
      en: [
        'Show exam-level consistency across control and throw families.',
        'Adapt to changing attack angles without losing center.',
        'Demonstrate polished etiquette, safety, and technical composure.',
      ],
      de: [
        'Pruefungsreife Konstanz ueber Kontroll- und Wurffamilien zeigen.',
        'An wechselnde Angriffswinkel anpassen, ohne das Zentrum zu verlieren.',
        'Ausgereifte Etikette, Sicherheit und technische Ruhe demonstrieren.',
      ],
    },
    examDescription: {
      en: 'The 1st kyu exam is the final kyu benchmark before dan testing and demands robust technical reliability.',
      de: 'Die Pruefung zum 1. Kyu ist der letzte Kyu-Massstab vor der Dan-Pruefung und fordert hohe technische Zuverlaessigkeit.',
    },
    examFocus: {
      en: [
        'Maintain control quality with less prompting.',
        'Integrate timing, distance, and structure in every technique.',
        'Keep safe, disciplined exam presence throughout.',
      ],
      de: [
        'Kontrollqualitaet mit weniger Anleitung halten.',
        'Timing, Distanz und Struktur in jeder Technik integrieren.',
        'Durchgehend sichere, disziplinierte Pruefungspraesenz bewahren.',
      ],
    },
  },
  dan1: {
    termSlugs: ['seika-tanden', 'kokyu-ryoku', 'shin-gi-tai', 'reishiki', 'te-sabaki', 'zanshin'],
    basics: {
      en: [
        'Demonstrate mature control under variable attacks.',
        'Preserve structure and calm under exam pressure.',
        'Lead partner interaction with clear intent and safety.',
      ],
      de: [
        'Reife Kontrolle unter variablen Angriffen demonstrieren.',
        'Struktur und Ruhe unter Pruefungsdruck bewahren.',
        'Partnerinteraktion mit klarer Intention und Sicherheit fuehren.',
      ],
    },
    examDescription: {
      en: 'The 1st dan exam validates black-belt fundamentals: technical maturity, responsibility, and consistent aiki principles.',
      de: 'Die Pruefung zum 1. Dan bestaetigt Schwarzgurt-Grundlagen: technische Reife, Verantwortung und konstante Aiki-Prinzipien.',
    },
    examFocus: {
      en: [
        'Demonstrate command of baseline curriculum and transitions.',
        'Keep body organization stable at higher intensity.',
        'Show disciplined etiquette and exam readiness throughout.',
      ],
      de: [
        'Sichere Beherrschung von Basiscurriculum und Uebergaengen zeigen.',
        'Koerperorientierung auch bei hoeherer Intensitaet stabil halten.',
        'Disziplinierte Etikette und Pruefungsreife durchgehend zeigen.',
      ],
    },
  },
  dan2: {
    termSlugs: ['kumijo', 'kumitachi', 'suburi', 'buki-waza', 'ma-ai', 'awase'],
    basics: {
      en: [
        'Integrate weapon principles with empty-hand movement quality.',
        'Sustain composure and precision over longer exam sequences.',
        'Demonstrate adaptable timing and strategic positioning.',
      ],
      de: [
        'Waffenprinzipien mit der Qualitaet unbewaffneter Bewegung integrieren.',
        'Ruhe und Praezision ueber laengere Pruefungssequenzen halten.',
        'Anpassbares Timing und strategische Positionierung demonstrieren.',
      ],
    },
    examDescription: {
      en: 'The 2nd dan exam extends dan fundamentals with deeper control, integration, and broader technical context.',
      de: 'Die Pruefung zum 2. Dan erweitert Dan-Grundlagen durch tiefere Kontrolle, Integration und breiteren technischen Kontext.',
    },
    examFocus: {
      en: [
        'Show coherent links between weapon and body mechanics.',
        'Keep technical quality stable through complex sequences.',
        'Demonstrate leadership-level safety and control.',
      ],
      de: [
        'Stimmige Verbindungen zwischen Waffen- und Koerpermechanik zeigen.',
        'Technische Qualitaet durch komplexe Sequenzen stabil halten.',
        'Sicherheits- und Kontrollniveau auf Fuehrungsebene demonstrieren.',
      ],
    },
  },
  dan3: {
    termSlugs: ['heijoshin', 'mu', 'ku', 'ai', 'do', 'ki'],
    basics: {
      en: [
        'Demonstrate composure, clarity, and advanced control under varied conditions.',
        'Show efficient movement with minimal unnecessary action.',
        'Model high safety standards and refined partner handling.',
      ],
      de: [
        'Gelassenheit, Klarheit und fortgeschrittene Kontrolle unter variablen Bedingungen demonstrieren.',
        'Effiziente Bewegung mit minimalen unnoetigen Aktionen zeigen.',
        'Hohe Sicherheitsstandards und verfeinerten Partnerumgang vorleben.',
      ],
    },
    examDescription: {
      en: 'The 3rd dan exam emphasizes depth of understanding, consistency, and practical expression of core aikido principles.',
      de: 'Die Pruefung zum 3. Dan betont Tiefenverstaendnis, Konstanz und praktische Umsetzung zentraler Aikido-Prinzipien.',
    },
    examFocus: {
      en: [
        'Technical decisions should look intentional and efficient.',
        'Adaptability should remain calm and structured.',
        'Demonstrate clear command of exam etiquette and pacing.',
      ],
      de: [
        'Technische Entscheidungen sollten bewusst und effizient wirken.',
        'Anpassungsfaehigkeit sollte ruhig und strukturiert bleiben.',
        'Klare Beherrschung von Pruefungsetikette und Tempo zeigen.',
      ],
    },
  },
  dan4: {
    termSlugs: ['hito-emi', 'seika-tanden', 'ki-musubi', 'kokyu-ryoku', 'zanshin', 'shu-ha-ri'],
    basics: {
      en: [
        'Exhibit high-level integration of timing, distance, and structure.',
        'Maintain technical authority without excessive force.',
        'Represent dojo safety culture and exam composure at instructor level.',
      ],
      de: [
        'Hochstufige Integration von Timing, Distanz und Struktur zeigen.',
        'Technische Autoritaet ohne uebermaessige Kraft bewahren.',
        'Dojo-Sicherheitskultur und Pruefungsruhe auf Instruktor-Niveau repraesentieren.',
      ],
    },
    examDescription: {
      en: 'The 4th dan exam is expected to reflect senior-level refinement, adaptability, and transmission quality.',
      de: 'Die Pruefung zum 4. Dan soll Senior-Level-Verfeinerung, Anpassungsfaehigkeit und Vermittlungsqualitaet zeigen.',
    },
    examFocus: {
      en: [
        'Movement quality should remain precise at all times.',
        'Technique selection should reflect advanced understanding.',
        'Safety and partner care must remain exemplary.',
      ],
      de: [
        'Bewegungsqualitaet sollte jederzeit praezise bleiben.',
        'Technikauswahl sollte fortgeschrittenes Verstaendnis zeigen.',
        'Sicherheit und Partnerfuersorge muessen vorbildlich bleiben.',
      ],
    },
  },
  dan5: {
    termSlugs: ['aikido', 'aikijutsu', 'triangle-circle-square', 'shin-gi-tai', 'heijoshin', 'mu'],
    basics: {
      en: [
        'Demonstrate comprehensive technical command with calm authority.',
        'Maintain the highest level of safety, etiquette, and partner care.',
        'Express aikido principles clearly through efficient and harmonious movement.',
      ],
      de: [
        'Umfassende technische Beherrschung mit ruhiger Autoritaet demonstrieren.',
        'Hoechstes Niveau bei Sicherheit, Etikette und Partnerfuersorge halten.',
        'Aikido-Prinzipien klar durch effiziente und harmonische Bewegung ausdruecken.',
      ],
    },
    examDescription: {
      en: 'The 5th dan exam represents senior mastery: coherence, refinement, and principle-driven execution across the curriculum.',
      de: 'Die Pruefung zum 5. Dan repraesentiert seniorale Meisterschaft: Kohaerenz, Verfeinerung und prinzipiengeleitete Ausfuehrung im gesamten Curriculum.',
    },
    examFocus: {
      en: [
        'Consistency and clarity should remain unmistakable.',
        'Technique should reflect deep principles, not performance effects.',
        'Exam presence should embody maturity and responsibility.',
      ],
      de: [
        'Konstanz und Klarheit sollten unverwechselbar bleiben.',
        'Technik sollte tiefe Prinzipien zeigen, nicht Show-Effekte.',
        'Pruefungspraesenz sollte Reife und Verantwortung verkoerpern.',
      ],
    },
  },
};

export const pickLocalized = <T>(value: Localized<T>, locale: 'en' | 'de'): T =>
  value[locale] ?? value.en;
