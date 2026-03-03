-- Seed minimal model (PI_2026_V1)
WITH mv AS (
  INSERT INTO model_version(code,label,is_active)
  VALUES ('PI_2026_V1','Modèle Scoring Promotion Immobilière — 2026', true)
  ON CONFLICT (code) DO UPDATE SET is_active=EXCLUDED.is_active
  RETURNING id
)
INSERT INTO domain(model_version_id, code, label, weight)
SELECT mv.id, x.code, x.label, x.weight
FROM mv
JOIN (VALUES
  ('D1','Sponsor & Gouvernance',0.22),
  ('D2','Qualité intrinsèque du projet',0.18),
  ('D3','Commercial & Cash-Flow',0.28),
  ('D4','Structuration & LGD',0.22)
) AS x(code,label,weight) ON TRUE
ON CONFLICT (model_version_id, code) DO UPDATE SET weight=EXCLUDED.weight, label=EXCLUDED.label;

-- Segments α (typologie promoteur)
WITH mv AS (SELECT id FROM model_version WHERE code='PI_2026_V1')
INSERT INTO segment(model_version_id, code, label, alpha)
SELECT mv.id, x.code, x.label, x.alpha
FROM mv
JOIN (VALUES
  ('STRUCT_NAT','Promoteur structuré national',0.02),
  ('REGIONAL','Promoteur régional',0.0),
  ('OPPORTUNISTE','Opportuniste / mono-projet',-0.05)
) x(code,label,alpha) ON TRUE
ON CONFLICT (model_version_id, code) DO UPDATE SET alpha=EXCLUDED.alpha, label=EXCLUDED.label;

-- Zones β (exemples)
WITH mv AS (SELECT id FROM model_version WHERE code='PI_2026_V1')
INSERT INTO zone(model_version_id, code, label, beta)
SELECT mv.id, x.code, x.label, x.beta
FROM mv
JOIN (VALUES
  ('CASA_CORE','Casablanca - cœur',0.01),
  ('CASA_PERIPH','Casablanca - périphérie',-0.01),
  ('MARRAKECH','Marrakech',0.0),
  ('AUTRES','Autres villes',0.0)
) x(code,label,beta) ON TRUE
ON CONFLICT (model_version_id, code) DO UPDATE SET beta=EXCLUDED.beta, label=EXCLUDED.label;

-- KPI starter set
WITH mv AS (SELECT id FROM model_version WHERE code='PI_2026_V1'),
d AS (
  SELECT id, code FROM domain WHERE model_version_id=(SELECT id FROM mv)
)
INSERT INTO kpi(model_version_id, domain_id, code, label, unit, weight, direction, source_hint)
SELECT (SELECT id FROM mv),
       (SELECT id FROM d WHERE code = x.domain_code),
       x.code, x.label, x.unit, x.weight, x.direction, x.source_hint
FROM (VALUES
  ('D1','D1_FP_POS','Fonds propres positifs', NULL, 1, 'boolean','Bilans certifiés'),
  ('D1','D1_GEARING','Gearing global (Dettes nettes / FP)','%', 1, 'lower_is_better','Bilans certifiés'),
  ('D1','D1_LIQ_GEN','Liquidité générale (Actif CT / Passif CT)','x', 1, 'higher_is_better','Bilans certifiés'),

  ('D3','D3_PREV_SEC','Préventes sécurisées (Ventes fermes encaissées / CA total)','%', 1.5, 'higher_is_better','Etat ventes + relevés'),
  ('D3','D3_DSO','DSO (Créances/CA×360)','jours', 1.2, 'lower_is_better','Balance âgée'),
  ('D3','D3_ROT_STOCK','Rotation stock (Stock/CA×360)','jours', 1.0, 'lower_is_better','Inventaire'),
  ('D3','D3_CASH_COV','Cash coverage (Cash dispo / échéances)','x', 1.2, 'higher_is_better','Echéancier'),

  ('D4','D4_MB','Marge brute ((CA - coûts directs)/CA)','%', 1.2, 'higher_is_better','BP + réalisés'),
  ('D4','D4_LTC','LTC (Dette / coût total)','%', 1.0, 'lower_is_better','Term sheet'),
  ('D4','D4_GAR_COV','Couverture garanties (Valeur réalisable / exposition)','%', 1.0, 'higher_is_better','Garanties'),
  ('D4','D4_RANG_1','Rang bancaire 1er rang', NULL, 1.0, 'boolean','Actes')
) AS x(domain_code, code, label, unit, weight, direction, source_hint)
ON CONFLICT (model_version_id, code) DO UPDATE SET label=EXCLUDED.label, weight=EXCLUDED.weight, direction=EXCLUDED.direction;

-- Thresholds (extraits du modèle)
-- Helper: get kpi id
WITH mv AS (SELECT id FROM model_version WHERE code='PI_2026_V1'),
k AS (SELECT id, code FROM kpi WHERE model_version_id=(SELECT id FROM mv))
INSERT INTO kpi_threshold(kpi_id, status, min_value, max_value, segment_code, zone_code)
SELECT (SELECT id FROM k WHERE code='D1_GEARING'), 'OK', NULL, 100, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D1_GEARING'), 'VIG', 100, 150, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D1_GEARING'), 'CRIT', 150, NULL, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D1_LIQ_GEN'), 'OK', 1.2, NULL, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D1_LIQ_GEN'), 'VIG', 1.0, 1.2, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D1_LIQ_GEN'), 'CRIT', NULL, 1.0, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D3_PREV_SEC'), 'OK', 40, NULL, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D3_PREV_SEC'), 'VIG', 25, 40, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D3_PREV_SEC'), 'CRIT', NULL, 25, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D3_DSO'), 'OK', NULL, 120, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D3_DSO'), 'VIG', 120, 240, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D3_DSO'), 'CRIT', 240, NULL, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D3_ROT_STOCK'), 'OK', NULL, 540, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D3_ROT_STOCK'), 'VIG', 540, 900, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D3_ROT_STOCK'), 'CRIT', 900, NULL, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D3_CASH_COV'), 'OK', 1.2, NULL, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D3_CASH_COV'), 'VIG', 1.0, 1.2, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D3_CASH_COV'), 'CRIT', NULL, 1.0, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D4_MB'), 'OK', 25, NULL, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D4_MB'), 'VIG', 15, 25, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D4_MB'), 'CRIT', NULL, 15, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D4_LTC'), 'OK', NULL, 60, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D4_LTC'), 'VIG', 60, 80, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D4_LTC'), 'CRIT', 80, NULL, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D4_GAR_COV'), 'OK', 120, NULL, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D4_GAR_COV'), 'VIG', 90, 120, NULL, NULL
UNION ALL SELECT (SELECT id FROM k WHERE code='D4_GAR_COV'), 'CRIT', NULL, 90, NULL, NULL;

-- Triggers D5
WITH mv AS (SELECT id FROM model_version WHERE code='PI_2026_V1')
INSERT INTO trigger_rule(model_version_id, code, label, malus, is_hard_trigger)
SELECT mv.id, x.code, x.label, x.malus, x.is_hard
FROM mv
JOIN (VALUES
  ('D5_VIG_3','≥3 KPI en vigilance',10,false),
  ('D5_CRIT_3','≥3 KPI critiques',25,false),
  ('TRIG_RETARD_6M','Retard ≥6 mois',15,false),
  ('TRIG_CASH_LT_2T','Cash < échéances 2 trimestres',25,false),
  ('TRIG_IMPASSE_PERSIST','Impasse persistante',20,false),
  ('TRIG_RESTRUCT_1','1ère restructuration',25,false),
  ('TRIG_FP_NEG','FP négatifs',25,false),
  ('TRIG_RANG_NOT_1','Garantie non 1er rang',25,false),
  ('HARD_IMPAYE_90D','Impayé ≥90 jours',0,true),
  ('HARD_ARRET_12M','Projet arrêté ≥12 mois',0,true),
  ('HARD_NRP','Non-remboursement probable',0,true),
  ('HARD_RESTRUCT_PERTE','Restructuration avec perte',0,true)
) x(code,label,malus,is_hard) ON TRUE
ON CONFLICT (model_version_id, code) DO UPDATE SET malus=EXCLUDED.malus, label=EXCLUDED.label, is_hard_trigger=EXCLUDED.is_hard_trigger;
