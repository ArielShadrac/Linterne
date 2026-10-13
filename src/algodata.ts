/* ====== Données de la section « Prise en charge » : dengue ======
 * Source : « Algorithme de PEC des cas de dengue » (document fourni) – définitions SIMR mai 2021.
 * Tout le contenu clinique vient de ce document ; les points à vérifier sont signalés par ⚠.
 *
 * Ajouter un algorithme : ajouter un objet dans FLOWS (nœuds `n`, liens `e`), il apparaît tout seul
 * dans la liste, dans le graphe interactif et dans le parcours guidé.
 * Types de nœuds : s = départ · q = question/décision · a = action/traitement · A/B/C = groupe clinique
 *                  r = évacuation/référence · go = renvoi vers un autre algorithme (champ `to`) */
 export type Kind='s'|'q'|'a'|'A'|'B'|'C'|'r'|'go'
 export interface FNode{id:string;k:Kind;t:string;l?:string[];to?:string}
 export type FEdge=[from:string,to:string,label?:string]
 export interface Flow{key:string;cat:string;name:string;sub:string;lvl:string;n:FNode[];e:FEdge[]}
 
 const FEVER='Fièvre aiguë (TDR paludisme négatif, ou positif ne répondant pas au traitement antipaludique)'
 const SIGNS='≥ 2 signes parmi : céphalées sévères, douleurs rétro-orbitaires, arthralgies, myalgies, nausées, vomissements, éruption cutanée, manifestations hémorragiques, état de choc · Test du lacet positif'
 const GA:string[]=['Repos au lit','Boire suffisamment : adulte ≥ 2 L/j · enfant 70–100 mL/kg/j','Paracétamol : adulte 500 mg–1 g toutes les 4–6 h (max 4 g/j) · enfant 15–20 mg/kg/prise toutes les 4–6 h (max 60 mg/kg/j) · enveloppement humide','Alimentation hyperprotidique, hypercalorique + vitamine C','Revenir immédiatement si saignement, vomissements persistants, troubles de la conscience','Revoir à H48 / J2 : T°, pouls, FR, diurèse, signes d’alerte (les ASBC assurent le suivi quotidien à domicile)']
 const GB:string[]=['Léthargie et/ou agitation','Vomissements persistants','Douleur / sensibilité abdominale','Hépatomégalie','Accumulation clinique de liquide','Saignement léger ou modéré','Labo : ↑ hématocrite avec chute rapide des plaquettes','Terrains : grossesse, nourrisson, enfant, personne âgée, diabète, personne vivant seule']
 const GC:string[]=['État de choc','Accumulation de liquide (pleurésie…)','Détresse respiratoire','Hémorragies sévères','Défaillance organique sévère : ASAT/ALAT ≥ 1000, SNC (conscience altérée), IRA sévère, cœur…']
 const PERF:string[]=['Encourager à boire','Si intolérance orale : perfusion de NaCl 0,9 % ou RL à débit d’entretien','Bilan : NFS, GSRH, urémie, créatininémie, transaminases','Hématocrite de référence avant la perfusion','5–7 mL/kg/h pendant 1–2 h → 3–5 mL/kg/h pendant 2–4 h → 2–3 mL/kg/h ou moins selon la réponse','Réévaluer + refaire l’hématocrite : stable → 2–3 mL/kg/h pendant 4–6 h · aggravation des signes vitaux et ↑ rapide de l’Ht → 5–10 mL/kg/h pendant 1–2 h','Réduire progressivement le remplissage quand la fuite plasmatique régresse (fin de phase critique)']
 
 const head=(id='s0'):FNode[]=>[{id,k:'s',t:'Suspicion de dengue',l:[FEVER,SIGNS]}]
 
 export const FLOWS:Flow[]=[
 {key:'csps',cat:'Adulte & enfant',name:'CSPS · cabinet · dispensaire',sub:'Diagnostic clinique et orientation',lvl:'CSPS, cabinets de soins, infirmeries, dispensaires, cliniques d’accouchement',
  n:[...head(),{id:'A',k:'A',t:'Groupe A · sans signe d’alerte',l:['Traitement ambulatoire à domicile',...GA]},
   {id:'B',k:'B',t:'Groupe B · signes d’alerte',l:GB},{id:'C',k:'C',t:'Groupe C · décompensation',l:GC},
   {id:'rb',k:'r',t:'Évacuer à l’échelon supérieur',l:['Après conditionnement : voie veineuse, perfusion']},
   {id:'rc',k:'r',t:'Évacuer au niveau supérieur',l:['Après conditionnement : voie veineuse, perfusion']}],
  e:[['s0','A','Pas de signe d’alerte'],['s0','B','Signes d’alerte / terrain'],['s0','C','Choc, détresse, hémorragie…'],['B','rb'],['C','rc']]},
 
 {key:'cm',cat:'Adulte & enfant',name:'CM · CMA',sub:'Avec prise en charge du groupe B',lvl:'CM, CMA et structures privées correspondantes (cliniques, centre médico-chirurgical)',
  n:[...head(),{id:'A',k:'A',t:'Groupe A · sans signe d’alerte',l:['Traitement ambulatoire à domicile',...GA]},
   {id:'B',k:'B',t:'Groupe B · signes d’alerte',l:GB},{id:'pb',k:'a',t:'Prise en charge du groupe B',l:PERF},
   {id:'C',k:'C',t:'Groupe C · décompensation',l:GC},{id:'rc',k:'r',t:'Évacuer au niveau supérieur',l:['Après conditionnement du patient']}],
  e:[['s0','A','Pas de signe d’alerte'],['s0','B','Signes d’alerte / terrain'],['s0','C','Choc, détresse, hémorragie…'],['B','pb'],['C','rc']]},
 
 {key:'chr',cat:'Adulte & enfant',name:'CHR · CHU',sub:'Prise en charge complète, soins intensifs',lvl:'CHR, CHU et structures privées correspondantes (polycliniques, hôpitaux privés)',
  n:[...head(),{id:'A',k:'A',t:'Groupe A · sans signe d’alerte',l:['Traitement ambulatoire à domicile',...GA]},
   {id:'B',k:'B',t:'Groupe B · signes d’alerte',l:GB},{id:'pb',k:'a',t:'Prise en charge du groupe B',l:PERF},
   {id:'C',k:'C',t:'Groupe C · décompensation',l:GC},
   {id:'uc',k:'a',t:'Traitement d’urgence en soins intensifs',l:['NFS (hématocrite, plaquettes, Hb) + tests de fonctions organiques','IRA sévère : dialyse','Selon le tableau : voir les algorithmes ci-dessous']},
   {id:'g1',k:'go',t:'Dengue sévère sans choc',to:'severe'},{id:'g2',k:'go',t:'Choc hypotensif',to:'shock'},{id:'g3',k:'go',t:'Complications hémorragiques',to:'hemo'}],
  e:[['s0','A','Pas de signe d’alerte'],['s0','B','Signes d’alerte / terrain'],['s0','C','Choc, détresse, hémorragie…'],['B','pb'],['C','uc'],['uc','g1','Sans choc'],['uc','g2','Choc'],['uc','g3','Hémorragie']]},
 
 {key:'severe',cat:'Traitement',name:'Dengue sévère sans choc',sub:'Remplissage guidé par l’hématocrite',lvl:'CHR ou CHU',
  n:[{id:'s0',k:'s',t:'Dengue sévère sans état de choc',l:['Réanimation en CHR / CHU']},
   {id:'a1',k:'a',t:'Cristalloïdes isotoniques IV',l:['5–10 mL/kg/h pendant 3 h','Rechercher et traiter les défaillances d’organes']},
   {id:'q1',k:'q',t:'Hématocrite après 3 h',l:['Contrôle si possible']},
   {id:'a2',k:'a',t:'2ᵉ bolus de cristalloïdes',l:['10–20 mL/kg/h pendant 1 h']},
   {id:'q2',k:'q',t:'État amélioré ?'},
   {id:'a3',k:'a',t:'Ramener le débit',l:['7–10 mL/kg/h pendant 1–2 h','Puis poursuivre la baisse progressive du débit']},
   {id:'h1',k:'a',t:'Hémorragie suspectée',l:['Tests de compatibilité','Transfuser dès que possible']},
   {id:'h2',k:'a',t:'Poursuivre la transfusion',l:['Si l’hématocrite continue de baisser']}],
  e:[['s0','a1'],['a1','q1'],['q1','a2','Ht ↑ / reste élevé (> 50 %)'],['q1','h1','Ht ↓'],['a2','q2'],['q2','a3','Oui'],['q2','a2','Non : nouveau bolus possible'],['h1','h2']]},
 
 {key:'shock',cat:'Traitement',name:'Choc hypotensif',sub:'Bolus, transfusion, vasopresseurs',lvl:'CHU',
  n:[{id:'s0',k:'s',t:'Choc hypotensif',l:['Tachycardie, pouls filant, ↓ TA, extrémités froides']},
   {id:'a1',k:'a',t:'Conditionner et réanimer',l:['Voie veineuse de bon calibre, oxygénothérapie','Bolus IV : cristalloïdes (NaCl 0,9 % / RL) ou colloïdes : 20 mL/kg en 15 min','Choc hémorragique : ajouter produits sanguins labiles (culot globulaire +++)']},
   {id:'q1',k:'q',t:'État amélioré ?'},
   {id:'a2',k:'a',t:'Poursuivre',l:['Cristalloïdes/colloïdes 10 mL/kg/h sur 1 h, puis réduire progressivement','CGR si Hb < 7 g/dL','Puis 7–10 mL/kg/h pendant 1–2 h, retour aux cristalloïdes, réduction progressive']},
   {id:'a3',k:'a',t:'2ᵉ bolus',l:['Cristalloïdes ou colloïdes : 20 mL/kg en 15 min','Réévaluer le patient']},
   {id:'q2',k:'q',t:'État amélioré ?'},
   {id:'a4',k:'a',t:'Vasopresseur en continu',l:['Noradrénaline 0,1–3 µg/kg/min, à défaut adrénaline','Alerter le réanimateur']}],
  e:[['s0','a1'],['a1','q1'],['q1','a2','Oui'],['q1','a3','Reste instable'],['a3','q2'],['q2','a2','Oui'],['q2','a4','Reste instable']]},
 
 {key:'hemo',cat:'Traitement',name:'Complications hémorragiques',sub:'Quel produit sanguin ?',lvl:'CHR · CHU',
  n:[{id:'s0',k:'s',t:'Complication hémorragique',l:['La transfusion prophylactique de plaquettes n’est pas systématique, quel que soit le taux']},
   {id:'q1',k:'q',t:'Quelle situation ?'},
   {id:'p',k:'a',t:'Concentré plaquettaire',l:['5–10 mL/kg','Thrombopénie sévère + geste invasif ou saignement sévère']},
   {id:'e',k:'a',t:'Concentré érythrocytaire',l:['5–10 mL/kg','Intolérance clinique']},
   {id:'t',k:'a',t:'Sang total frais',l:['10–20 mL/kg','Si concentré plaquettaire / érythrocytaire indisponible']}],
  e:[['s0','q1'],['q1','p','Thrombopénie sévère'],['q1','e','Anémie mal tolérée'],['q1','t','Produits indisponibles']]},
 
 {key:'preg',cat:'Populations',name:'Femme enceinte',sub:'Accouchement, tocolyse, nouveau-né',lvl:'CMA ou hôpital',
  n:[{id:'s0',k:'s',t:'Femme enceinte fébrile',l:['Penser à faire un TDR dengue devant toute fièvre']},
   {id:'a1',k:'a',t:'Hospitalisation précoce',l:['PEC en CMA ou à l’hôpital, identique à l’adulte','Surveillance étroite, surtout près du terme / en travail','Surveiller signes hémorragiques et vitalité fœtale','Éviter le remplissage excessif : FC ↑ et TA ↓ sont physiologiques en fin de grossesse (risque de surcharge et de détresse respiratoire)']},
   {id:'q1',k:'q',t:'Accouchement inévitable ?'},
   {id:'a2',k:'a',t:'Conduite conservatrice',l:['PEC clinique et obstétricale conservatrice','Phase critique : tocolytiques, différer le travail','Accoucher dans un hôpital disposant de sang / dérivés']},
   {id:'a3',k:'a',t:'Accouchement : précautions',l:['GATPA, éviter traumatismes et lésions, vérifier l’expulsion complète du placenta','Perfusion d’ocytocine et/ou « ergotamine » selon la pratique standard (⚠ la source écrit ergotamine : à vérifier)','Concentré plaquettaire débuté pendant ou à la fin de l’accouchement, pas trop tôt','Saignement important : sang total / CGR frais sans attendre 500 mL ni la chute de l’Ht']},
   {id:'a4',k:'a',t:'Après l’accouchement',l:['Surveiller les suites de couches (hématome pariétal post-césarienne rapporté)','Nouveau-né : surveillance hospitalière étroite (risque de transmission verticale)','Hémogramme, recherche d’hémorragie, sérologie dengue systématique']}],
  e:[['s0','a1'],['a1','q1'],['q1','a2','Non'],['q1','a3','Oui'],['a2','a3','Si le travail s’engage'],['a3','a4']]},
 
 {key:'nn1',cat:'Populations',name:'Nouveau-né · CSPS',sub:'Penser à la dengue et évacuer',lvl:'CSPS, cabinets, infirmeries, dispensaires',
  n:[{id:'s0',k:'s',t:'Suspicion chez le nouveau-né / nourrisson',l:['Fièvre biphasique (TDR paludisme négatif ou non répondeur)','Signes respiratoires, diarrhée, vomissements, convulsions fébriles, éruption maculaire, pétéchies']},
   {id:'r',k:'r',t:'Penser à la dengue',l:['Évacuer vers l’échelon supérieur']}],e:[['s0','r']]},
 
 {key:'nn2',cat:'Populations',name:'Nouveau-né · CM · CMA',sub:'Avec ou sans signe d’alerte',lvl:'CM, CMA et structures privées correspondantes',
  n:[{id:'s0',k:'s',t:'Suspicion chez le nouveau-né / nourrisson',l:['Fièvre (TDR paludisme négatif ou non répondeur), signes respiratoires, diarrhée, vomissements, convulsions fébriles, éruption maculaire, pétéchies']},
   {id:'A',k:'A',t:'Sans signe d’alerte',l:['Traitement et hospitalisation en CMA','Boire par voie orale · maintenir l’allaitement au sein','Voie veineuse 70–100 mL/kg/24 h (NaCl 0,9 %, RL ou SGI)','Enveloppement humide · paracétamol 15–20 mg/kg toutes les 4–6 h (max 60 mg/kg/24 h)','Adapter au poids ; dès 14 ans : algorithme adulte']},
   {id:'B',k:'B',t:'Avec signes d’alerte',l:['Traitement en CMA',...PERF]}],
  e:[['s0','A','Sans signe d’alerte'],['s0','B','Avec signes d’alerte']]},
 
 {key:'nn3',cat:'Populations',name:'Nouveau-né · sévère sans choc',sub:'Remplissage par paliers',lvl:'CHR ou CHU',
  n:[{id:'s0',k:'s',t:'Dengue sévère sans choc',l:['TA systolique maintenue + signes de baisse de l’irrigation']},
   {id:'a1',k:'a',t:'Cristalloïdes isotoniques',l:['10–20 mL/kg/h pendant 1 h']},
   {id:'q1',k:'q',t:'Amélioration ?'},
   {id:'a2',k:'a',t:'Réduction progressive',l:['10 mL/kg/h sur 1–2 h → 7 mL/kg/h sur 2 h → 5 mL/kg/h sur 4 h → 3 mL/kg/h','Réduire l’apport selon l’amélioration clinique']},
   {id:'a3',k:'a',t:'Arrêter la perfusion',l:['Au bout de 48 h']},
   {id:'a4',k:'a',t:'Contrôler l’hématocrite'},
   {id:'q2',k:'q',t:'Hématocrite ?'},
   {id:'a5',k:'a',t:'2ᵉ bolus de cristalloïdes',l:['10 mL/kg/h sur 1 h']},
   {id:'q3',k:'q',t:'Amélioration ?'},
   {id:'a6',k:'a',t:'Ramener le débit',l:['7–10 mL/kg/h pendant 1–2 h','D’autres bolus peuvent être nécessaires pendant 24–48 h']},
   {id:'q4',k:'q',t:'Hémorragie patente sévère ?'},
   {id:'a7',k:'a',t:'Transfusion sanguine'},
   {id:'a8',k:'a',t:'Colloïdes',l:['10–20 mL/kg/h','Sans amélioration : envisager une transfusion']}],
  e:[['s0','a1'],['a1','q1'],['q1','a2','Oui'],['a2','a3'],['q1','a4','Non'],['a4','q2'],['q2','a5','Élevé'],['a5','q3'],['q3','a6','Oui'],['q3','a5','Non : nouveau bolus'],['q2','q4','Faible'],['q4','a7','Oui'],['q4','a8','Non']]},
 
 {key:'nn4',cat:'Populations',name:'Nouveau-né · choc',sub:'Bolus 20 mL/kg puis vasopresseur',lvl:'CHU',
  n:[{id:'s0',k:'s',t:'Choc hypotensif du nouveau-né / nourrisson'},
   {id:'a1',k:'a',t:'Bolus IV',l:['Cristalloïdes ou colloïdes : 20 mL/kg en 15 min']},
   {id:'q1',k:'q',t:'État amélioré ?'},
   {id:'a2',k:'a',t:'Poursuivre',l:['10 mL/kg/h sur 1 h puis réduire progressivement','Puis 7–10 mL/kg/h pendant 1–2 h, retour aux cristalloïdes']},
   {id:'a3',k:'a',t:'2ᵉ bolus',l:['20 mL/kg en 15 min (NaCl 0,9 %, RL ou colloïdes)','Réévaluer']},
   {id:'q2',k:'q',t:'État amélioré ?'},
   {id:'a4',k:'a',t:'Vasopresseur en continu',l:['Noradrénaline 0,1–3 µg/kg/min, à défaut adrénaline','Alerter le réanimateur']}],
  e:[['s0','a1'],['a1','q1'],['q1','a2','Oui'],['q1','a3','Reste instable'],['a3','q2'],['q2','a2','Oui'],['q2','a4','Reste instable']]}]
 
 /* ====== Cours ====== */
 export interface Sec{k:string;t:string;sub:string;code:string;blocks:Block[]}
 export type Block={h:string;p?:string;ul?:string[];nb?:string;tone?:'A'|'B'|'C'}
 export const COURSE:Sec[]=[
 {k:'def',t:'Définitions de cas',sub:'Suspect, probable, confirmé',code:'DEF',blocks:[
  {h:'Cas suspect',p:'Maladie fébrile aiguë (> 39 °C) de 2 à 7 jours, avec au moins 2 des signes suivants :',ul:['Céphalées','Douleur rétro-orbitaire','Myalgie','Arthralgie','Éruption cutanée','Manifestations hémorragiques (saignement au point de piqûre, épistaxis, gingivorragie, hématémèse, purpura…)','Syndrome de choc'],nb:'En période de flambée, faire en même temps les TDR paludisme et dengue si le malade répond à la définition de cas.'},
  {h:'Cas probable',p:'Signes ci-dessus + TDR dengue positif (validé par le standard national) : IgM et/ou IgG et/ou antigène NS1 positif.',nb:'Les IgM persistent 2 à 3 mois.'},
  {h:'Cas confirmé',p:'Cas suspect ou probable confirmé par le laboratoire :',ul:['Sérologie ELISA : IgM positives ou ↑ des titres d’IgG','RT-PCR (détection du virus)','Isolement par culture']}]},
 {k:'cls',t:'Classification A · B · C',sub:'Groupes selon la gravité',code:'ABC',blocks:[
  {h:'Groupe A · ambulatoire',tone:'A',p:'Dengue suspecte, probable ou confirmée sans signe d’alerte et sans terrain particulier.',ul:['Boit des volumes suffisants','Mictions ≥ 50 mL/kg/6 h']},
  {h:'Groupe B · surveillance étroite',tone:'B',p:'Prise en charge dans une structure avec laboratoire (CM, CMA, CHR). Un seul critère suffit :',ul:['Signes d’alerte : douleur abdominale, vomissements persistants, épanchement (pleurésie, ascite), saignement muqueux, léthargie / agitation, hépatomégalie','Affection associée : diabète, HTA, insuffisance cardiaque ou rénale, drépanocytose, immunodépression, maladie auto-immune, antécédent de dengue','Terrain fragile : femme enceinte, enfant, personne âgée, obèse, personne isolée']},
  {h:'Groupe C · urgence',tone:'C',p:'Traitement d’urgence : un seul de ces critères suffit.',ul:['Choc (tachycardie, pouls filant, ↓ TA, extrémités froides)','Détresse respiratoire (battement des ailes du nez, polypnée, cyanose)','Conscience altérée (agitation, somnolence, coma)','Saignements sévères (épistaxis, hématémèse, hématurie abondante)','Atteinte organique sévère : cœur, foie, rein, SNC']}]},
 {k:'part',t:'Cas particuliers',sub:'Grossesse, enfant, drépanocytose',code:'CAS',blocks:[
  {h:'Femme enceinte',p:'Tableau clinique identique à l’adulte, pas de sur-risque de forme sévère selon l’OMS. Mais : accouchements prématurés, MFIU, petits poids de naissance, et surtout risque hémorragique à l’accouchement ou lors des actes chirurgicaux.',ul:['Transmission verticale établie : dengue sévère possible chez le nouveau-né','Passage d’anticorps maternels : 62,5 % des nouveau-nés testés (Burkina Faso)','Mortalité rapportée au Burkina Faso (étude descriptive) : maternelle 7,5 %, fœtale 26,5 %']},
  {h:'Enfant',p:'Le transfert d’anticorps maternels est un facteur de risque de dengue sévère : surveillance particulière. Incidence de la forme sévère ≈ 5 % chez le nourrisson, > 10 % en zone d’endémie.'},
  {h:'Drépanocytaire',p:'Plus exposé à la dengue sévère, avec défaillance multiviscérale et mortalité très élevée.'}]},
 {k:'niv',t:'Qui traite quoi ?',sub:'CSPS, CM/CMA, CHR/CHU',code:'NIV',blocks:[
  {h:'CSPS · cabinets · dispensaires',p:'Groupe A traité à domicile (suivi H48, ASBC). Groupes B et C : conditionnement (voie veineuse) puis évacuation.'},
  {h:'CM · CMA',p:'Groupe A à domicile ; groupe B pris en charge sur place (perfusion guidée par l’hématocrite) ; groupe C évacué. Nouveau-né, nourrisson et femme enceinte : CM/CMA ou hôpital.'},
  {h:'CHR · CHU',p:'Soins intensifs du groupe C : dengue sévère sans choc (CHR ou CHU), choc hypotensif (CHU), complications hémorragiques, dialyse si IRA sévère.'}]},
 {k:'key',t:'À retenir',sub:'Les réflexes essentiels',code:'CLÉ',blocks:[
  {h:'Les réflexes',ul:['Fièvre + TDR paludisme négatif (ou sans réponse au traitement) → penser dengue','Un seul signe d’alerte ou un terrain à risque → groupe B','Hématocrite de référence AVANT la perfusion, puis refaire à chaque réévaluation','Ht ↑ → plus de liquide ; Ht ↓ → penser hémorragie et transfuser','Pas de transfusion prophylactique systématique de plaquettes','Femme enceinte : éviter la surcharge liquidienne','Paracétamol seul : pas d’AINS ni d’aspirine (⚠ non écrit dans la source : à confirmer avec ton cours)']}]}]
 
 /* ====== Triage ====== */
 export interface Sign{k:string;l:string}
 export const SIGNS_C:Sign[]=[{k:'c1',l:'État de choc (pouls filant, ↓ TA, extrémités froides)'},{k:'c2',l:'Détresse respiratoire'},{k:'c3',l:'Altération de la conscience'},{k:'c4',l:'Saignement sévère'},{k:'c5',l:'Atteinte organique sévère (ASAT/ALAT ≥ 1000, IRA, cœur, SNC)'}]
 export const SIGNS_B:Sign[]=[{k:'b1',l:'Douleur / sensibilité abdominale'},{k:'b2',l:'Vomissements persistants'},{k:'b3',l:'Accumulation liquidienne clinique'},{k:'b4',l:'Saignement muqueux'},{k:'b5',l:'Léthargie ou agitation'},{k:'b6',l:'Hépatomégalie'},{k:'b7',l:'↑ Ht avec chute rapide des plaquettes'}]
 export const TERRAIN:Sign[]=[{k:'t1',l:'Grossesse'},{k:'t2',l:'Nourrisson / enfant'},{k:'t3',l:'Personne âgée'},{k:'t4',l:'Obésité'},{k:'t5',l:'Personne vivant seule / isolée'},{k:'t6',l:'Diabète, HTA, insuffisance cardiaque ou rénale'},{k:'t7',l:'Drépanocytose'},{k:'t8',l:'Immunodépression / maladie auto-immune'},{k:'t9',l:'Antécédent de dengue'}]
 export const ENTRY:Sign[]=[{k:'e1',l:'Fièvre aiguë (2–7 jours)'},{k:'e2',l:'TDR paludisme négatif ou sans réponse au traitement'},{k:'e3',l:'≥ 2 signes : céphalées, rétro-orbitaire, arthralgies, myalgies, nausées, éruption…'}]
 
 /* ====== Quiz ====== */
 export interface Q{q:string;o:string[];a:number;x:string}
 export const QUIZ:Q[]=[
 {q:'Un adulte fébrile depuis 3 jours, TDR paludisme négatif, céphalées + myalgies, sans signe d’alerte ni terrain particulier. Quel groupe ?',o:['Groupe A','Groupe B','Groupe C'],a:0,x:'Sans signe d’alerte ni terrain : groupe A, traitement ambulatoire avec revue à H48/J2.'},
 {q:'Quel est le seul élément suffisant pour classer un patient en groupe B ?',o:['Au moins 3 signes d’alerte','Un signe d’alerte OU un terrain à risque','Un TDR NS1 positif'],a:1,x:'Signe d’alerte, affection associée ou terrain fragile : un seul critère suffit.'},
 {q:'Laquelle de ces situations est un signe de groupe C ?',o:['Vomissements persistants','Hépatomégalie','Pouls filant et extrémités froides'],a:2,x:'Le choc (tachycardie, pouls filant, ↓ TA, extrémités froides) classe en groupe C.'},
 {q:'Dose de paracétamol chez l’enfant (groupe A) ?',o:['15–20 mg/kg/prise, max 60 mg/kg/j','50 mg/kg/prise, max 100 mg/kg/j','5 mg/kg/prise, max 20 mg/kg/j'],a:0,x:'15–20 mg/kg toutes les 4–6 h sans dépasser 60 mg/kg/j (adulte : 500 mg–1 g, max 4 g/j).'},
 {q:'Débit initial de perfusion d’un groupe B qui ne boit pas, après l’hématocrite de référence ?',o:['2–3 mL/kg/h','5–7 mL/kg/h pendant 1–2 h','20 mL/kg en 15 min'],a:1,x:'5–7 mL/kg/h 1–2 h, puis 3–5 mL/kg/h 2–4 h, puis 2–3 mL/kg/h ou moins selon la réponse.'},
 {q:'Sous perfusion, l’hématocrite monte vite et les signes vitaux s’aggravent. Que faire ?',o:['Arrêter la perfusion','Augmenter à 5–10 mL/kg/h pendant 1–2 h','Passer au paracétamol IV'],a:1,x:'Aggravation + hausse rapide de l’Ht : 5–10 mL/kg/h pendant 1–2 h, puis réévaluer.'},
 {q:'Dengue sévère sans choc : après 3 h de cristalloïdes, l’hématocrite BAISSE. Conduite ?',o:['2ᵉ bolus de cristalloïdes','Penser hémorragie : compatibilité et transfusion dès que possible','Arrêter toute perfusion'],a:1,x:'Une baisse de l’hématocrite évoque une hémorragie : tests de compatibilité et transfusion.'},
 {q:'Bolus initial dans le choc hypotensif ?',o:['5–10 mL/kg/h pendant 3 h','10–20 mL/kg/h pendant 1 h','20 mL/kg en 15 minutes'],a:2,x:'Cristalloïdes (NaCl 0,9 %, RL) ou colloïdes : 20 mL/kg sur 15 min.'},
 {q:'Choc qui reste instable après deux bolus : prochaine étape ?',o:['Vasopresseur (noradrénaline 0,1–3 µg/kg/min) et alerte du réanimateur','3ᵉ bolus de 40 mL/kg','Évacuation en CSPS'],a:0,x:'Noradrénaline en continu, à défaut adrénaline, et alerte du réanimateur.'},
 {q:'Dans le choc, à partir de quel taux d’hémoglobine transfuse-t-on un CGR ?',o:['< 7 g/dL','< 10 g/dL','< 12 g/dL'],a:0,x:'CGR si Hb < 7 g/dL (en plus des cristalloïdes/colloïdes si l’état s’améliore).'},
 {q:'Transfusion de plaquettes dans la dengue :',o:['Systématique si plaquettes < 50 000','Systématique si fièvre > 5 jours','Pas systématique, quel que soit le taux ; indiquée si thrombopénie sévère + geste invasif ou saignement sévère'],a:2,x:'La transfusion prophylactique de plaquettes n’est pas systématique ; dose 5–10 mL/kg dans les indications.'},
 {q:'Femme enceinte dengue : à propos du remplissage vasculaire',o:['Cibler FC et TA initiales comme chez tout adulte','Éviter l’excès : FC ↑ et TA ↓ sont physiologiques en fin de grossesse','Interdit pendant la grossesse'],a:1,x:'Cibler ces constantes expose à la surcharge liquidienne et à la détresse respiratoire.'},
 {q:'Femme enceinte, saignement important à l’accouchement :',o:['Attendre 500 mL de perte avant de transfuser','Attendre une chute importante de l’hématocrite','Transfuser sang total / CGR frais sans attendre 500 mL ni la chute de l’Ht'],a:2,x:'Contrairement à l’HPP classique, on compense immédiatement la perte quantifiée.'},
 {q:'Quel nouveau-né est à risque de dengue sévère ?',o:['Celui dont la mère a eu la dengue juste avant ou pendant l’accouchement','Tout nouveau-né allaité','Seulement le prématuré'],a:0,x:'Risque de transmission verticale et de dengue néonatale sévère faute d’anticorps protecteurs : surveillance hospitalière + sérologie.'},
 {q:'Les IgM de la dengue persistent :',o:['2 à 3 jours','2 à 3 semaines','2 à 3 mois'],a:2,x:'Les IgM persistent 2 à 3 mois : un TDR IgM+ peut refléter une infection ancienne.'},
 {q:'Nourrisson, dengue sévère sans choc, amélioration après 10–20 mL/kg/h pendant 1 h. Suite ?',o:['Réduction par paliers jusqu’à 3 mL/kg/h, arrêt à 48 h','Arrêt immédiat','Maintien du débit pendant 7 jours'],a:0,x:'10 mL/kg/h (1–2 h) → 7 (2 h) → 5 (4 h) → 3 mL/kg/h ; arrêt de la perfusion au bout de 48 h.'}]
 
 /* ====== Fiches pour le mode « Résumés » (cartes à glisser) ====== */
 export const DENGUE_RAW=`Définition du cas suspect de dengue::Fièvre aiguë > 39 °C de 2 à 7 jours|≥ 2 signes : céphalées, douleur rétro-orbitaire, myalgie, arthralgie, éruption|Manifestations hémorragiques|Syndrome de choc
 Cas probable vs cas confirmé de dengue::Probable : signes + TDR positif (IgM et/ou IgG et/ou NS1)|Confirmé : ELISA IgM+ ou ↑ IgG, RT-PCR ou culture|IgM persistantes 2–3 mois
 Groupe A de la dengue::Sans signe d’alerte ni terrain particulier|Ambulatoire|Boit suffisamment, mictions ≥ 50 mL/kg/6 h
 Signes d’alerte de la dengue (groupe B)::Douleur abdominale|Vomissements persistants|Accumulation liquidienne|Saignement muqueux|Léthargie / agitation|Hépatomégalie
 Terrains à risque dans la dengue::Diabète, HTA|Insuffisance cardiaque ou rénale|Drépanocytose|Immunodépression, maladie auto-immune|Antécédent de dengue|Grossesse, enfant, personne âgée, obèse, personne isolée
 Groupe C de la dengue::Choc|Détresse respiratoire|Conscience altérée|Saignements sévères|Atteinte organique sévère (cœur, foie, rein, SNC)
 Traitement du groupe A de la dengue::Repos, boire (adulte ≥ 2 L/j, enfant 70–100 mL/kg/j)|Paracétamol : adulte 500 mg–1 g/4–6 h (max 4 g/j) ; enfant 15–20 mg/kg/prise (max 60 mg/kg/j)|Revoir à H48 : T°, pouls, FR, diurèse, signes d’alerte
 Perfusion du groupe B de la dengue::Ht de référence avant la perfusion|5–7 mL/kg/h (1–2 h) → 3–5 (2–4 h) → 2–3 mL/kg/h|Réévaluer + Ht : stable → 2–3 mL/kg/h ; aggravation et Ht ↑ → 5–10 mL/kg/h (1–2 h)|Réduire quand la fuite plasmatique régresse
 Dengue sévère sans choc::Cristalloïdes 5–10 mL/kg/h pendant 3 h|Ht > 50 % : 2ᵉ bolus 10–20 mL/kg/h (1 h)|Ht ↓ : hémorragie, transfusion|Amélioration : 7–10 mL/kg/h (1–2 h) puis baisse progressive
 Choc hypotensif de la dengue::Voie veineuse + O₂|Bolus 20 mL/kg en 15 min (cristalloïdes ou colloïdes)|Choc hémorragique : + culot globulaire|2ᵉ bolus si instable|Vasopresseur (noradrénaline 0,1–3 µg/kg/min) + réanimateur
 Transfusion dans la dengue::Plaquettes 5–10 mL/kg : thrombopénie sévère + geste invasif ou saignement sévère|CE 5–10 mL/kg : intolérance clinique|Sang total frais 10–20 mL/kg si produits indisponibles|Pas de transfusion prophylactique systématique
 Dengue et grossesse::Même tableau que l’adulte|Complications : prématurité, MFIU, petit poids|Risque hémorragique à l’accouchement|Transmission verticale|Hospitalisation précoce, tocolyse, éviter la surcharge, GATPA
 Dengue chez le nouveau-né et le nourrisson::PEC en CM/CMA ou hôpital|Complications = adulte + hyponatrémie, acidose métabolique|Mêmes molécules, posologies adaptées|Dès 14 ans : algorithme adulte`